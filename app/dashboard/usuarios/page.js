"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import { useProfile } from "../../../lib/useProfile";
import { Badge } from "../../../components/UI";
import { ROL_LABEL } from "../../../lib/helpers";

export default function UsuariosPage() {
  const router = useRouter();
  const { profile, loading: perfilLoading } = useProfile();
  const [usuarios, setUsuarios] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [fincas, setFincas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (perfilLoading) return;
    if (profile && profile.rol !== "superadmin") {
      router.push("/dashboard");
      return;
    }
    if (profile?.rol === "superadmin") load();
  }, [perfilLoading, profile]);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: u }, { data: uf }, { data: f }] = await Promise.all([
      supabase.from("usuarios").select("*").order("nombre"),
      supabase.from("usuario_finca").select("*"),
      supabase.from("fincas").select("*"),
    ]);
    setUsuarios(u || []);
    setAsignaciones(uf || []);
    setFincas(f || []);
    setLoading(false);
  }

  if (perfilLoading || loading || profile?.rol !== "superadmin") {
    return <p className="text-sm text-slate-400 p-6">Cargando…</p>;
  }

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl font-bold text-slate-900">Usuarios y accesos</h1>
      <div className="bg-white rounded-xl shadow-sm divide-y divide-stone-100">
        {usuarios.map((u) => {
          const fincaIds = asignaciones.filter((a) => a.usuario_id === u.id).map((a) => a.finca_id);
          const fincaNames = fincaIds.map((id) => fincas.find((f) => f.id === id)?.nombre).filter(Boolean);
          return (
            <div key={u.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{u.nombre}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={u.rol === "superadmin" ? "amber" : u.rol === "veterinario" ? "sky" : "slate"}>
                  {ROL_LABEL[u.rol]}
                </Badge>
                <span className="text-xs text-slate-400">{fincaNames.length ? fincaNames.join(", ") : "Sin finca asignada"}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">
        Para asignar un veterinario o capataz a una finca de otro propietario, edita la tabla <code>usuario_finca</code> desde
        el Table Editor de Supabase (usuario_id, finca_id). Un flujo de invitación por correo es una mejora futura recomendada.
      </p>
    </div>
  );
}
