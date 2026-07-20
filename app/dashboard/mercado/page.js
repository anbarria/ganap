"use client";

import { useEffect, useState } from "react";
import { Store, Beef, DollarSign, MapPin, Mail, Phone } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { EarTag, ZoomableImage } from "../../../components/UI";
import { ESPECIES } from "../../../lib/helpers";

export default function MercadoPage() {
  const [listados, setListados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEspecie, setFiltroEspecie] = useState("Todas");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();

    const { data: animalesEnVenta, error: err1 } = await supabase
      .from("animales")
      .select("*")
      .eq("en_venta", true)
      .order("created_at", { ascending: false });

    if (err1) {
      console.error("Error cargando Mercado (animales):", err1.message);
      setListados([]);
      setLoading(false);
      return;
    }

    const fincaIds = [...new Set((animalesEnVenta || []).map((a) => a.finca_id))];
    const { data: fincas, error: err2 } = fincaIds.length
      ? await supabase.from("fincas").select("id, nombre, ubicacion, telefono, propietario_id").in("id", fincaIds)
      : { data: [] };
    if (err2) console.error("Error cargando Mercado (fincas):", err2.message);

    const ownerIds = [...new Set((fincas || []).map((f) => f.propietario_id).filter(Boolean))];
    const { data: usuarios, error: err3 } = ownerIds.length
      ? await supabase.from("usuarios").select("id, nombre, email, telefono").in("id", ownerIds)
      : { data: [] };
    if (err3) console.error("Error cargando Mercado (usuarios):", err3.message);

    const fincaPorId = {};
    (fincas || []).forEach((f) => (fincaPorId[f.id] = f));
    const usuarioPorId = {};
    (usuarios || []).forEach((u) => (usuarioPorId[u.id] = u));

    const enriquecidos = (animalesEnVenta || []).map((a) => {
      const finca = fincaPorId[a.finca_id];
      const owner = finca ? usuarioPorId[finca.propietario_id] : null;
      return { ...a, _finca: finca, _owner: owner };
    });

    setListados(enriquecidos);
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
            const finca = a._finca;
            const owner = a._owner;
            return (
              <div key={a.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="h-36 bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center overflow-hidden">
                  {a.foto_url ? (
                    <ZoomableImage src={a.foto_url} alt={a.nombre} className="h-36 w-full" />
                  ) : (
                    <Beef size={36} className="text-amber-400" />
                  )}
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
                  {finca?.ubicacion && <p className="text-xs text-slate-400">{finca.ubicacion}</p>}
                  <div className="flex gap-2 mt-1">
                    {owner?.email && (
                      <a
                        href={`mailto:${owner.email}`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-slate-900 text-amber-400 rounded-lg py-2 hover:bg-slate-800"
                      >
                        <Mail size={13} /> Correo
                      </a>
                    )}
                    {(finca?.telefono || owner?.telefono) && (
                      <a
                        href={`tel:${finca?.telefono || owner?.telefono}`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-700 text-emerald-50 rounded-lg py-2 hover:bg-emerald-800"
                      >
                        <Phone size={13} /> {finca?.telefono || owner?.telefono}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
