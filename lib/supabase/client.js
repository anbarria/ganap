"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        // "implicit" hace que los enlaces de correo (invitación, restablecer
        // contraseña) funcionen sin importar en qué dispositivo o navegador se
        // abran. El modo "pkce" (el que usa este paquete por defecto) exige que
        // se abran en el mismo navegador donde se pidió el enlace, lo cual falla
        // muy seguido en la práctica (ej. abrir el correo desde el teléfono).
        flowType: "implicit",
      },
    }
  );
}
