// GANAP — Edge Function: invite-user
// Invita a una persona por correo (veterinario, administrador, etc.), la vincula
// a una finca y le asigna un rol — usando la llave de servicio de forma segura
// (nunca se expone al navegador; solo vive dentro de esta función).
//
// Despliegue: ver instrucciones en supabase/functions/invite-user/README.md

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const callerToken = authHeader.replace("Bearer ", "");

    // Cliente "anon" para verificar quién está llamando (usa el token del que invita)
    const supabaseAsCaller = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await supabaseAsCaller.auth.getUser(callerToken);
    if (callerError || !caller) {
      return json({ error: "No autorizado." }, 401);
    }

    const { data: callerProfile } = await supabaseAsCaller.from("usuarios").select("rol").eq("id", caller.id).maybeSingle();
    const puedeInvitar = callerProfile && ["superadmin", "propietario", "administrador"].includes(callerProfile.rol);
    if (!puedeInvitar) {
      return json({ error: "No tienes permiso para invitar usuarios." }, 403);
    }

    const { email, nombre, telefono, rol, fincaId } = await req.json();
    if (!email || !rol || !fincaId) {
      return json({ error: "Faltan datos: email, rol y fincaId son obligatorios." }, 400);
    }
    if (!["propietario", "administrador", "veterinario", "capataz"].includes(rol)) {
      return json({ error: "Rol inválido." }, 400);
    }

    // Si quien invita NO es superadmin, confirmar que esa finca es suya
    if (callerProfile.rol !== "superadmin") {
      const { data: acceso } = await supabaseAsCaller
        .from("usuario_finca")
        .select("finca_id")
        .eq("usuario_id", caller.id)
        .eq("finca_id", fincaId)
        .maybeSingle();
      if (!acceso) return json({ error: "No tienes acceso a esa finca." }, 403);
    }

    // Cliente con llave de servicio: puede crear usuarios de autenticación
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.get("origin") || ""}/actualizar-contrasena`,
    });

    let userId = invited?.user?.id;
    let metodoUsado = "invite";

    // Si el correo ya existía como usuario de auth (ej. de un enlace anterior que
    // expiró), Supabase no permite reenviar una invitación — en su lugar, le mandamos
    // un correo de "restablecer contraseña", que sí funciona para reactivar el acceso.
    if (inviteError) {
      if (inviteError.message?.toLowerCase().includes("already") || inviteError.code === "email_exists") {
        const { data: existentes } = await supabaseAdmin.auth.admin.listUsers();
        const existente = existentes.users.find((u) => u.email === email);
        if (!existente) return json({ error: inviteError.message }, 400);
        userId = existente.id;
        metodoUsado = "recovery";

        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${req.headers.get("origin") || ""}/actualizar-contrasena`,
        });
        if (resetError) return json({ error: resetError.message }, 400);
      } else {
        return json({ error: inviteError.message }, 400);
      }
    }

    // Crear o actualizar su fila en "usuarios"
    const { error: upsertError } = await supabaseAdmin.from("usuarios").upsert(
      { id: userId, nombre: nombre || email.split("@")[0], email, rol, telefono: telefono || null },
      { onConflict: "id" }
    );
    if (upsertError) return json({ error: upsertError.message }, 400);

    // Vincularlo a la finca (si ya estaba vinculado, no pasa nada)
    await supabaseAdmin.from("usuario_finca").upsert(
      { usuario_id: userId, finca_id: fincaId },
      { onConflict: "usuario_id,finca_id" }
    );

    return json({ ok: true, userId, metodo: metodoUsado });
  } catch (err) {
    return json({ error: err.message || "Error inesperado." }, 500);
  }
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
