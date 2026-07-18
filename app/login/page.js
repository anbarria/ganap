"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Beef, ShieldCheck } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { inputClass, PasswordInput } from "../../components/UI";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState("login"); // "login" | "registro" | "olvide"
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const supabase = createClient();

    try {
      if (modo === "olvide") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/actualizar-contrasena`,
        });
        if (resetError) throw resetError;
        setInfo("Si ese correo existe en el sistema, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).");
        setLoading(false);
        return;
      }

      if (modo === "registro") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setInfo("Cuenta creada. Revisa tu correo y haz clic en el enlace de confirmación antes de iniciar sesión.");
          setLoading(false);
          return;
        }

        const { error: insertError } = await supabase.from("usuarios").insert({
          id: data.user.id,
          nombre: nombre || email.split("@")[0],
          email,
          telefono: telefono || null,
          rol: "propietario",
        });
        if (insertError && insertError.code !== "23505") throw insertError;

        router.push("/dashboard/fincas");
        router.refresh();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message.toLowerCase().includes("email not confirmed")) {
            setError("Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada y haz clic en el enlace que te enviamos.");
          } else {
            setError("Correo o contraseña incorrectos.");
          }
          setLoading(false);
          return;
        }
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intenta de nuevo.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-lg bg-amber-500 flex items-center justify-center">
          <Beef size={26} className="text-slate-950" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-amber-400">GANAP</h1>
          <p className="text-slate-400 text-xs tracking-wide">Administración ganadera multi-finca</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-6 border border-slate-800">
        {modo !== "olvide" && (
          <div className="flex mb-5 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => { setModo("login"); setError(""); setInfo(""); }}
              className={`flex-1 text-sm font-semibold py-2 rounded-md ${modo === "login" ? "bg-amber-500 text-slate-950" : "text-slate-300"}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setModo("registro"); setError(""); setInfo(""); }}
              className={`flex-1 text-sm font-semibold py-2 rounded-md ${modo === "registro" ? "bg-amber-500 text-slate-950" : "text-slate-300"}`}
            >
              Crear cuenta
            </button>
          </div>
        )}
        {modo === "olvide" && (
          <h2 className="text-stone-100 font-semibold text-sm mb-4">Restablecer contraseña</h2>
        )}

        <form onSubmit={submit} className="space-y-3">
          {modo === "registro" && (
            <input className={inputClass} placeholder="Tu nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          )}
          {modo === "registro" && (
            <input className={inputClass} placeholder="Teléfono móvil (opcional)" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          )}
          <input
            type="email"
            className={inputClass}
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {modo !== "olvide" && (
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              minLength={6}
            />
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {info && <p className="text-emerald-400 text-xs">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-sm py-2.5 rounded-lg"
          >
            {loading ? "Un momento…" : modo === "login" ? "Entrar" : modo === "registro" ? "Crear cuenta" : "Enviar enlace"}
          </button>
        </form>

        {modo === "login" && (
          <button onClick={() => { setModo("olvide"); setError(""); setInfo(""); }} className="w-full text-center text-xs text-slate-400 hover:text-amber-400 mt-3">
            ¿Olvidaste tu contraseña?
          </button>
        )}
        {modo === "olvide" && (
          <button onClick={() => { setModo("login"); setError(""); setInfo(""); }} className="w-full text-center text-xs text-slate-400 hover:text-amber-400 mt-3">
            ← Volver a iniciar sesión
          </button>
        )}
      </div>

      <p className="text-slate-600 text-[11px] mt-6 max-w-sm text-center flex items-start gap-1.5 justify-center">
        <ShieldCheck size={13} className="mt-0.5 shrink-0" />
        Tus datos quedan aislados por finca. Solo tú y las personas que invites a tu finca pueden verlos.
      </p>
    </div>
  );
}
