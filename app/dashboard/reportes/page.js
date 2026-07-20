"use client";

import { useEffect, useState } from "react";
import { BarChart3, Beef, Syringe, LogOut as ExitIcon, DollarSign } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { useProfile } from "../../../lib/useProfile";
import { EarTag, Badge } from "../../../components/UI";
import { fmtDate, daysBetween, todayISO, ESPECIES, esActivo } from "../../../lib/helpers";

export default function ReportesPage() {
  const { misFincas, loading: perfilLoading } = useProfile();
  const [animales, setAnimales] = useState([]);
  const [vacunas, setVacunas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (perfilLoading) return;
    load();
  }, [perfilLoading]);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const fincaIds = misFincas.map((f) => f.id);
    if (fincaIds.length === 0) {
      setAnimales([]);
      setVacunas([]);
      setLoading(false);
      return;
    }
    const [{ data: a }, { data: v }] = await Promise.all([
      supabase.from("animales").select("*").in("finca_id", fincaIds),
      supabase.from("vacunas").select("*, animales(nombre, arete, finca_id)"),
    ]);
    setAnimales(a || []);
    setVacunas(v || []);
    setLoading(false);
  }

  if (perfilLoading || loading) return <p className="text-sm text-slate-400 p-6">Cargando…</p>;

  function fincaNombre(id) {
    return misFincas.find((f) => f.id === id)?.nombre || "";
  }

  const activos = animales.filter((a) => esActivo(a.estado));
  const salidas = animales.filter((a) => !esActivo(a.estado));

  const porEspecie = ESPECIES.map((esp) => ({
    especie: esp,
    total: activos.filter((a) => a.especie === esp).length,
  })).filter((r) => r.total > 0);

  const porFinca = misFincas.map((f) => ({
    finca: f.nombre,
    total: activos.filter((a) => a.finca_id === f.id).length,
  }));

  const maxEspecie = Math.max(1, ...porEspecie.map((r) => r.total));
  const maxFinca = Math.max(1, ...porFinca.map((r) => r.total));

  const vacunasVencidas = vacunas.filter((v) => v.proxima_fecha && daysBetween(todayISO(), v.proxima_fecha) < 0);
  const vacunasProximas = vacunas.filter((v) => v.proxima_fecha && daysBetween(todayISO(), v.proxima_fecha) >= 0 && daysBetween(todayISO(), v.proxima_fecha) <= 14);

  const ventas = salidas.filter((a) => a.motivo_salida === "Venta");
  const prestamos = salidas.filter((a) => a.motivo_salida === "Préstamo");

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
        <BarChart3 size={22} className="text-amber-600" /> Reportes
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Beef} label="Animales activos" value={activos.length} />
        <StatCard icon={ExitIcon} label="Salidas registradas" value={salidas.length} />
        <StatCard icon={Syringe} label="Vacunas vencidas" value={vacunasVencidas.length} color="red" />
        <StatCard icon={DollarSign} label="Ventas registradas" value={ventas.length} color="emerald" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Inventario por especie</h2>
          <div className="space-y-2.5">
            {porEspecie.length === 0 && <p className="text-sm text-slate-400">Sin animales activos.</p>}
            {porEspecie.map((r) => (
              <div key={r.especie}>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{r.especie}</span><span>{r.total}</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(r.total / maxEspecie) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Inventario por finca</h2>
          <div className="space-y-2.5">
            {porFinca.length === 0 && <p className="text-sm text-slate-400">Sin fincas registradas.</p>}
            {porFinca.map((r) => (
              <div key={r.finca}>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{r.finca}</span><span>{r.total}</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full" style={{ width: `${(r.total / maxFinca) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 pb-3">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Syringe size={16} className="text-amber-600" /> Cumplimiento de vacunación</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {[...vacunasVencidas, ...vacunasProximas].length === 0 && <p className="px-5 pb-5 text-sm text-slate-400">Sin alertas — todo al día.</p>}
          {[...vacunasVencidas, ...vacunasProximas].map((v) => {
            const dias = daysBetween(todayISO(), v.proxima_fecha);
            return (
              <div key={v.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <EarTag tone="slate">{v.animales?.arete}</EarTag>
                  <span className="text-sm text-slate-700">{v.animales?.nombre} · {v.nombre}</span>
                </div>
                <Badge color={dias < 0 ? "red" : "amber"}>{dias < 0 ? `Vencida hace ${Math.abs(dias)}d` : `En ${dias}d`}</Badge>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 pb-3">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2"><ExitIcon size={16} className="text-amber-600" /> Historial de salidas (ventas, préstamos, bajas)</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {salidas.length === 0 && <p className="px-5 pb-5 text-sm text-slate-400">Sin salidas registradas.</p>}
          {salidas.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <EarTag tone="slate">{a.arete}</EarTag>
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.nombre}</p>
                  <p className="text-xs text-slate-400">{fincaNombre(a.finca_id)} · {a.destino_salida || "Sin destino registrado"}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge color={a.motivo_salida === "Fallecimiento" ? "red" : "slate"}>{a.motivo_salida}</Badge>
                <p className="text-xs text-slate-400 mt-1">{fmtDate(a.fecha_salida)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
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
