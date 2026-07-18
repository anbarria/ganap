"use client";

import { useState } from "react";
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
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado — solicita uno nuevo desde 'Olvidé mi contraseña'.");
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
