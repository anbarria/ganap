"use client";

import { useEffect, useState } from "react";
import { Store, Beef, DollarSign, MapPin, Mail } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { EarTag } from "../../../components/UI";
import { ESPECIES } from "../../../lib/helpers";

export default function MercadoPage() {
  const [listados, setListados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEspecie, setFiltroEspecie] = useState("Todas");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    // La política de RLS permite leer animales con en_venta = true de cualquier finca.
    const { data } = await supabase
      .from("animales")
      .select("*, fincas(nombre, telefono, propietario_id, usuarios(nombre,email))")
      .eq("en_venta", true)
      .order("created_at", { ascending: false });
    setListados(data || []);
    setLoading(false);
  }

  const filtered = listados.filter((a) => filtroEspecie === "Todas" || a.especie === filtroEspecie);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Store size={22} className="text-amber-600" /> Mercado
        </h1>
        <p className="text-sm text-slate-500">Animales publicados por propietarios de todas las fincas de la red GANAP.</p>
      </div>

      <select value={filtroEspecie} onChange={(e) => setFiltroEspecie(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white">
        <option>Todas</option>
        {ESPECIES.map((e) => <option key={e}>{e}</option>)}
      </select>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && <p className="text-sm text-slate-400 col-span-full text-center py-8">No hay animales publicados con este filtro.</p>}
          {filtered.map((a) => {
            const finca = a.fincas;
            const owner = finca?.usuarios;
            return (
              <div key={a.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="h-28 bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
                  <Beef size={36} className="text-amber-400" />
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{a.nombre}</h3>
                    <EarTag>{a.arete}</EarTag>
                  </div>
                  <p className="text-xs text-slate-400">{a.especie} · {a.raza} · {a.sexo}</p>
                  <p className="text-sm text-slate-600 flex-1">{a.descripcion_venta}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <p className="text-lg font-bold text-emerald-700 flex items-center"><DollarSign size={16} />{a.precio_venta}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={11} />{finca?.nombre}</p>
                  </div>
                  {owner?.email && (
                    <a
                      href={`mailto:${owner.email}`}
                      className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-slate-900 text-amber-400 rounded-lg py-2 hover:bg-slate-800"
                    >
                      <Mail size={13} /> Contactar a {owner.nombre?.split(" ")[0]}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
