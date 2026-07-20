"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Phone, MapPin } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { useProfile } from "../../../lib/useProfile";
import { Badge, Modal, Field, inputClass } from "../../../components/UI";
import { ROL_LABEL } from "../../../lib/helpers";

const ROLES_INVITABLES = ["propietario", "administrador", "veterinario", "capataz"];

export default function UsuariosPage() {
  const router = useRouter();
  const { profile, misFincas, loading: perfilLoading } = useProfile();
  const [asignaciones, setAsignaciones] = useState([]);
  const [usuariosPorId, setUsuariosPorId] = useState({});
  const [loading, setLoading] = useState(true);
  const [inviteFincaId, setInviteFincaId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const puedeAdministrar = profile && ["superadmin", "propietario", "administrador"].includes(profile.rol);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: uf } = await supabase.from("usuario_finca").select("*");
    setAsignaciones(uf || []);
    const ids = [...new Set((uf || []).map((a) => a.usuario_id))];
    if (ids.length) {
      const { data: usuarios } = await supabase.from("usuarios").select("*").in("id", ids);
      const map = {};
      (usuarios || []).forEach((u) => (map[u.id] = u));
      setUsuariosPorId(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (perfilLoading) return;
    if (!puedeAdministrar) { router.push("/dashboard"); return; }
    load();
  }, [perfilLoading, puedeAdministrar, load, router]);

  async function invitar(fincaId, datos) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invite-user`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ ...datos, fincaId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "No se pudo enviar la invitación.");
      const msg = body.metodo === "recovery"
        ? `Esa persona ya tenía una cuenta creada — le enviamos un correo para reactivar su acceso (${datos.email}).`
        : `Invitación enviada a ${datos.email}.`;
      setFeedback({ tipo: "ok", msg });
      setInviteFincaId(null);
      load();
    } catch (err) {
      setFeedback({ tipo: "error", msg: err.message + " (¿ya desplegaste la función invite-user? Ver supabase/functions/invite-user/README.md)" });
    }
  }

  if (perfilLoading || loading || !puedeAdministrar) {
    return <p className="text-sm text-slate-400 p-6">Cargando…</p>;
  }

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl font-bold text-slate-900">Usuarios y accesos</h1>

      {feedback && (
        <p className={`text-sm px-4 py-2.5 rounded-lg ${feedback.tipo === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {feedback.msg}
        </p>
      )}

      {misFincas.map((f) => {
        const idsDeEstaFinca = asignaciones.filter((a) => a.finca_id === f.id).map((a) => a.usuario_id);
        const personas = idsDeEstaFinca.map((id) => usuariosPorId[id]).filter(Boolean);
        return (
          <div key={f.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h2 className="font-semibold text-slate-900 flex items-center gap-1.5"><MapPin size={15} className="text-amber-600" /> {f.nombre}</h2>
              <button
                onClick={() => setInviteFincaId(f.id)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-lg"
              >
                <UserPlus size={14} /> Invitar persona
              </button>
            </div>
            <div className="divide-y divide-stone-100">
              {personas.length === 0 && <p className="text-sm text-slate-400 py-3">Aún no hay personas vinculadas a esta finca.</p>}
              {personas.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{u.nombre}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1"><Mail size={11} /> {u.email}</span>
                      {u.telefono && <span className="flex items-center gap-1"><Phone size={11} /> {u.telefono}</span>}
                    </div>
                  </div>
                  <Badge color={u.rol === "superadmin" ? "amber" : u.rol === "veterinario" ? "sky" : "slate"}>{ROL_LABEL[u.rol]}</Badge>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {inviteFincaId && (
        <InviteModal onClose={() => setInviteFincaId(null)} onSave={(datos) => invitar(inviteFincaId, datos)} />
      )}
    </div>
  );
}

function InviteModal({ onClose, onSave }) {
  const [form, setForm] = useState({ email: "", nombre: "", telefono: "", rol: "veterinario" });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.email) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <Modal title="Invitar persona a esta finca" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Correo electrónico"><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Nombre completo"><input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
        <Field label="Teléfono móvil"><input className={inputClass} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+507 6000-0000" /></Field>
        <Field label="Rol en esta finca">
          <select className={inputClass} value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
            {ROLES_INVITABLES.map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
          </select>
        </Field>
      </div>
      <p className="text-xs text-slate-400 mt-3">Le enviaremos un correo para que cree su contraseña y pueda entrar.</p>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-stone-100">Cancelar</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold">
          {saving ? "Enviando…" : "Enviar invitación"}
        </button>
      </div>
    </Modal>
  );
}
