"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Beef } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { PasswordInput } from "../../components/UI";

export default function ActualizarContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sesionValida, setSesionValida] = useState(null); // null = verificando

  useEffect(() => {
    (async () => {
      const supabase = createClient();

      // El paquete @supabase/ssr no procesa automáticamente los enlaces con
      // "#access_token=..." (eso es cosa del flujo clásico). Los leemos nosotros
      // mismos de la URL y activamos la sesión explícitamente.
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sessionError) {
          setSesionValida(false);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      setSesionValida(!!data.session);
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (password !== confirmar) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(`No se pudo actualizar la contraseña: ${updateError.message}`);
      return;
    }
    setOk(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-lg bg-amber-500 flex items-center justify-center">
          <Beef size={26} className="text-slate-950" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-amber-400">GANAP</h1>
      </div>

      <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <h2 className="text-stone-100 font-semibold text-sm mb-4">Crea tu nueva contraseña</h2>
        {ok ? (
          <p className="text-emerald-400 text-sm">Contraseña actualizada. Entrando…</p>
        ) : sesionValida === null ? (
          <p className="text-slate-400 text-sm">Verificando tu enlace…</p>
        ) : sesionValida === false ? (
          <div className="space-y-3">
            <p className="text-red-400 text-sm">
              Este enlace ya expiró o ya fue usado. Pide que te envíen una invitación nueva (o solicita "Olvidé mi contraseña" de nuevo si es tu propia cuenta).
            </p>
            <button onClick={() => router.push("/login")} className="text-xs text-slate-400 hover:text-amber-400">
              ← Volver a iniciar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña" required minLength={6} />
            <PasswordInput value={confirmar} onChange={(e) => setConfirmar(e.target.value)} placeholder="Confirmar contraseña" required minLength={6} />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-sm py-2.5 rounded-lg"
            >
              {loading ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
