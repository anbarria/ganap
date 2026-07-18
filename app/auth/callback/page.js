"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Beef } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Confirmando tu cuenta…");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      // El cliente de navegador detecta automáticamente el token en la URL.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setMsg("¡Correo confirmado! Entrando…");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      } else {
        setMsg("No se pudo confirmar automáticamente. Intenta iniciar sesión.");
        setTimeout(() => router.push("/login"), 2000);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <Beef size={32} className="text-amber-400 mb-4 animate-pulse" />
      <p className="text-stone-200 text-sm">{msg}</p>
    </div>
  );
}
