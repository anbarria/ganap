"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Beef, MapPin, AlertTriangle, Store, Syringe } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { useProfile } from "../../lib/useProfile";
import { EarTag, Badge } from "../../components/UI";
import { daysBetween, todayISO } from "../../lib/helpers";

export default function InicioPage() {
  const router = useRouter();
  const { profile, misFincas, loading: perfilLoading } = useProfile();
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (perfilLoading) return;
    load();
  }, [perfilLoading]);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("animales")
      .select("*, vacunas(*)")
      .order("created_at", { ascending: false });
    setAnimales(data || []);
    setLoading(false);
  }

  if (perfilLoading || loading) {
    return <p className="text-sm text-slate-400 p-6">Cargando…</p>;
  }

  const enVenta = animales.filter((a) => a.en_venta).length;

  const alertas = [];
  animales.forEach((a) => {
    (a.vacunas || []).forEach((v) => {
      if (!v.proxima_fecha) return;
      const dias = daysBetween(todayISO(), v.proxima_fecha);
      if (dias <= 14) alertas.push({ animal: a, vacuna: v, dias });
    });
  });
  alertas.sort((x, y) => x.dias - y.dias);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">
          Hola, {profile?.nombre?.split(" ")[0] || ""}
        </h1>
        <p className="text-slate-500 text-sm">Resumen de tu operación ganadera</p>
      </div>

      {misFincas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <MapPin size={28} className="mx-auto text-amber-500 mb-2" />
          <p className="font-semibold text-slate-800">Aún no tienes una finca registrada</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">Crea tu primera finca para empezar a registrar ganado.</p>
          <button
            onClick={() => router.push("/dashboard/fincas")}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-lg"
          >
            Crear mi primera finca
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Beef} label="Animales" value={animales.length} />
            <StatCard icon={MapPin} label="Fincas" value={misFincas.length} />
            <StatCard icon={AlertTriangle} label="Vacunas próx./vencidas" value={alertas.length} color={alertas.length ? "red" : "slate"} />
            <StatCard icon={Store} label="Publicados en Mercado" value={enVenta} color="emerald" />
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Syringe size={16} className="text-amber-600" /> Alertas de vacunación
              </h2>
              <button onClick={() => router.push("/dashboard/ganado")} className="text-xs text-amber-700 font-medium hover:underline">
                Ver ganado →
              </button>
            </div>
            {alertas.length === 0 ? (
              <p className="p-6 text-sm text-slate-400 text-center">Sin alertas pendientes. Todo al día. ✅</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {alertas.slice(0, 8).map(({ animal, vacuna, dias }) => (
                  <button
                    key={vacuna.id}
                    onClick={() => router.push(`/dashboard/ganado/${animal.id}`)}
                    className="w-full flex items-center justify-between p-4 hover:bg-stone-50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <EarTag>{animal.arete}</EarTag>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{animal.nombre} · {vacuna.nombre}</p>
                        <p className="text-xs text-slate-400">{animal.especie}</p>
                      </div>
                    </div>
                    <Badge color={dias < 0 ? "red" : "amber"}>
                      {dias < 0 ? `Vencida hace ${Math.abs(dias)}d` : dias === 0 ? "Hoy" : `En ${dias}d`}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = "slate" }) {
  const colors = {
    slate: "bg-slate-900 text-amber-400",
    emerald: "bg-emerald-700 text-emerald-50",
    red: "bg-red-700 text-red-50",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
      <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
