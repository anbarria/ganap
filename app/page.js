"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Beef } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Los enlaces de invitación/restablecer contraseña de Supabase traen información
    // especial después del "#" en la URL. Si redirigimos en el servidor sin revisar
    // esto primero, esa información se pierde. Por eso este chequeo vive en el cliente.
    const hash = window.location.hash;
    if (hash.includes("type=invite") || hash.includes("type=recovery")) {
      router.replace(`/actualizar-contrasena${hash}`);
      return;
    }
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-950">
      <Beef size={32} className="text-amber-400 animate-pulse" />
    </div>
  );
}
