"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Beef } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Los enlaces de invitación/restablecer contraseña de Supabase a veces traen la
    // información después del "#" y a veces como parámetro "?code=" o "?type=" en la
    // URL. Revisamos ambas formas y preservamos todo tal cual antes de redirigir,
    // para no perder esa información.
    const hash = window.location.hash;
    const search = window.location.search;
    const esEnlaceEspecial =
      hash.includes("type=invite") ||
      hash.includes("type=recovery") ||
      search.includes("type=invite") ||
      search.includes("type=recovery") ||
      search.includes("code=");

    if (esEnlaceEspecial) {
      router.replace(`/actualizar-contrasena${search}${hash}`);
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
