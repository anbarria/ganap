"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ChevronRight, Beef } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { useProfile } from "../../../lib/useProfile";
import { EarTag, Badge, Modal, Field, inputClass } from "../../../components/UI";
import { ESPECIES, todayISO } from "../../../lib/helpers";

export default function GanadoPage() {
  const router = useRouter();
  const { misFincas, loading: perfilLoading } = useProfile();
  const [animales, setAnimales] = useState([]);
  const [hatos, setHatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtroEspecie, setFiltroEspecie] = useState("Todas");
  const [filtroFinca, setFiltroFinca] = useState("Todas");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (perfilLoading) return;
    load();
  }, [perfilLoading]);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: a }, { data: h }] = await Promise.all([
      supabase.from("animales").select("*").order("created_at", { ascending: false }),
      supabase.from("hatos").select("*"),
    ]);
    setAnimales(a || []);
    setHatos(h || []);
    setLoading(false);
  }

  function fincaNombre(fincaId) {
    return misFincas.find((f) => f.id === fincaId)?.nombre || "";
  }

  const filtered = animales.filter((a) => {
    if (filtroEspecie !== "Todas" && a.especie !== filtroEspecie) return false;
    if (filtroFinca !== "Todas" && a.finca_id !== filtroFinca) return false;
    if (q && !(a.nombre?.toLowerCase().includes(q.toLowerCase()) || a.arete.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  if (perfilLoading || loading) return <p className="text-sm text-slate-400 p-6">Cargando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-2xl font-bold text-slate-900">Ganado</h1>
        {misFincas.length > 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-3.5 py-2 rounded-lg"
          >
            <Plus size={16} /> Registrar animal
          </button>
        )}
      </div>

      {misFincas.length === 0 ? (
        <p className="bg-white rounded-xl shadow-sm p-6 text-sm text-slate-500 text-center">
          Primero crea una finca en la pestaña "Fincas y Hatos" para poder registrar animales.
        </p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o arete…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <select value={filtroEspecie} onChange={(e) => setFiltroEspecie(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white">
              <option>Todas</option>
              {ESPECIES.map((e) => <option key={e}>{e}</option>)}
            </select>
            {misFincas.length > 1 && (
              <select value={filtroFinca} onChange={(e) => setFiltroFinca(e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white">
                <option value="Todas">Todas las fincas</option>
                {misFincas.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm divide-y divide-stone-100">
            {filtered.length === 0 && <p className="p-6 text-sm text-slate-400 text-center">No hay animales que coincidan con el filtro.</p>}
            {filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => router.push(`/dashboard/ganado/${a.id}`)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-stone-50 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0 text-slate-500">
                    <Beef size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{a.nombre}</p>
                      <EarTag>{a.arete}</EarTag>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {a.especie} · {a.raza} · {a.sexo} · {fincaNombre(a.finca_id)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.en_venta && <Badge color="emerald">En venta</Badge>}
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {showAdd && (
        <AddAnimalModal
          misFincas={misFincas}
          hatos={hatos}
          animales={animales}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}

function AddAnimalModal({ misFincas, hatos, animales, onClose, onSaved }) {
  const [form, setForm] = useState({
    arete: "", nombre: "", especie: "Bovino", raza: "", sexo: "Hembra",
    fecha_nacimiento: todayISO(), peso_kg: "", finca_id: misFincas[0]?.id || "", hato_id: "",
    padre_id: "", madre_id: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const hatosDeFinca = hatos.filter((h) => h.finca_id === form.finca_id);
  const candidatosPadre = animales.filter((a) => a.especie === form.especie && a.sexo === "Macho");
  const candidatosMadre = animales.filter((a) => a.especie === form.especie && a.sexo === "Hembra");

  async function submit() {
    if (!form.arete || !form.nombre || !form.finca_id) {
      setError("Completa al menos el arete, nombre y finca.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: insertError } = await supabase.from("animales").insert({
      ...form,
      peso_kg: Number(form.peso_kg) || null,
      hato_id: form.hato_id || null,
      padre_id: form.padre_id || null,
      madre_id: form.madre_id || null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSaved();
  }

  return (
    <Modal title="Registrar animal" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="N° de arete"><input className={inputClass} value={form.arete} onChange={(e) => setForm({ ...form, arete: e.target.value })} placeholder="ELR-050" /></Field>
        <Field label="Nombre"><input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
        <Field label="Especie">
          <select className={inputClass} value={form.especie} onChange={(e) => setForm({ ...form, especie: e.target.value, padre_id: "", madre_id: "" })}>
            {ESPECIES.map((e) => <option key={e}>{e}</option>)}
          </select>
        </Field>
        <Field label="Raza"><input className={inputClass} value={form.raza} onChange={(e) => setForm({ ...form, raza: e.target.value })} /></Field>
        <Field label="Sexo">
          <select className={inputClass} value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
            <option>Hembra</option><option>Macho</option>
          </select>
        </Field>
        <Field label="Peso (kg)"><input type="number" className={inputClass} value={form.peso_kg} onChange={(e) => setForm({ ...form, peso_kg: e.target.value })} /></Field>
        <Field label="Fecha de nacimiento"><input type="date" className={inputClass} value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} /></Field>
        <Field label="Finca">
          <select className={inputClass} value={form.finca_id} onChange={(e) => setForm({ ...form, finca_id: e.target.value, hato_id: "" })}>
            {misFincas.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </Field>
        <Field label="Hato">
          <select className={inputClass} value={form.hato_id} onChange={(e) => setForm({ ...form, hato_id: e.target.value })}>
            <option value="">— Sin hato —</option>
            {hatosDeFinca.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
          </select>
        </Field>
        <Field label="Padre (opcional)">
          <select className={inputClass} value={form.padre_id} onChange={(e) => setForm({ ...form, padre_id: e.target.value })}>
            <option value="">— Desconocido / externo —</option>
            {candidatosPadre.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.arete})</option>)}
          </select>
        </Field>
        <Field label="Madre (opcional)">
          <select className={inputClass} value={form.madre_id} onChange={(e) => setForm({ ...form, madre_id: e.target.value })}>
            <option value="">— Desconocida / externa —</option>
            {candidatosMadre.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.arete})</option>)}
          </select>
        </Field>
      </div>
      {error && <p className="text-red-600 text-xs mt-3">{error}</p>}
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-stone-100">Cancelar</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold">
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}
