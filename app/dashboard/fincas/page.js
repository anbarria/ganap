"use client";

import { useEffect, useState, useCallback } from "react";
import { MapPin, Plus } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { useProfile } from "../../../lib/useProfile";
import { Modal, Field, inputClass } from "../../../components/UI";

export default function FincasPage() {
  const { profile, misFincas, loading: perfilLoading, reload } = useProfile();
  const [hatos, setHatos] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNuevaFinca, setShowNuevaFinca] = useState(false);
  const [addingHatoTo, setAddingHatoTo] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: h }, { data: a }] = await Promise.all([
      supabase.from("hatos").select("*"),
      supabase.from("animales").select("id,finca_id,hato_id"),
    ]);
    setHatos(h || []);
    setAnimales(a || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (!perfilLoading) load(); }, [perfilLoading, load]);

  async function crearFinca(datos) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: finca, error } = await supabase
      .from("fincas")
      .insert({ ...datos, propietario_id: user.id })
      .select()
      .single();
    if (error) return alert(error.message);

    await supabase.from("usuario_finca").insert({ usuario_id: user.id, finca_id: finca.id });
    setShowNuevaFinca(false);
    reload();
    load();
  }

  async function crearHato(fincaId, datos) {
    const supabase = createClient();
    await supabase.from("hatos").insert({ ...datos, finca_id: fincaId });
    setAddingHatoTo(null);
    load();
  }

  if (perfilLoading || loading) return <p className="text-sm text-slate-400 p-6">Cargando…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-2xl font-bold text-slate-900">Fincas y Hatos</h1>
        <button
          onClick={() => setShowNuevaFinca(true)}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-3.5 py-2 rounded-lg"
        >
          <Plus size={16} /> Nueva finca
        </button>
      </div>

      {misFincas.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <MapPin size={28} className="mx-auto text-amber-500 mb-2" />
          <p className="font-semibold text-slate-800">Crea tu primera finca</p>
          <p className="text-sm text-slate-500">Es el primer paso para poder registrar hatos y animales.</p>
        </div>
      )}

      {misFincas.map((f) => {
        const hatosDeFinca = hatos.filter((h) => h.finca_id === f.id);
        const animalesDeFinca = animales.filter((a) => a.finca_id === f.id);
        return (
          <div key={f.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-semibold text-lg text-slate-900">{f.nombre}</h2>
                <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin size={13} /> {f.ubicacion}</p>
                <p className="text-xs text-slate-400 mt-1">{animalesDeFinca.length} animales</p>
              </div>
              <button onClick={() => setAddingHatoTo(f.id)} className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                <Plus size={13} /> Nuevo hato
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {hatosDeFinca.map((h) => (
                <div key={h.id} className="bg-stone-50 rounded-lg p-3.5">
                  <p className="text-sm font-semibold text-slate-800">{h.nombre}</p>
                  <p className="text-xs text-slate-400">
                    {h.proposito} · {animales.filter((a) => a.hato_id === h.id).length} animales
                  </p>
                </div>
              ))}
              {hatosDeFinca.length === 0 && <p className="text-sm text-slate-400">Sin hatos registrados aún.</p>}
            </div>
          </div>
        );
      })}

      {showNuevaFinca && <NuevaFincaForm onClose={() => setShowNuevaFinca(false)} onSave={crearFinca} />}
      {addingHatoTo && <NuevoHatoForm onClose={() => setAddingHatoTo(null)} onSave={(datos) => crearHato(addingHatoTo, datos)} />}
    </div>
  );
}

function NuevaFincaForm({ onClose, onSave }) {
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [telefono, setTelefono] = useState("");
  return (
    <Modal title="Crear finca" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nombre de la finca"><input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Finca El Roble" /></Field>
        <Field label="Ubicación"><input className={inputClass} value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej. Chiriquí, Panamá" /></Field>
        <Field label="Teléfono de contacto"><input className={inputClass} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+507 6000-0000" /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-stone-100">Cancelar</button>
        <button
          onClick={() => nombre && onSave({ nombre, ubicacion, telefono })}
          className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
        >
          Crear
        </button>
      </div>
    </Modal>
  );
}

function NuevoHatoForm({ onClose, onSave }) {
  const [nombre, setNombre] = useState("");
  const [proposito, setProposito] = useState("Cría");
  return (
    <Modal title="Crear hato" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nombre del hato"><input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Hato Norte" /></Field>
        <Field label="Propósito">
          <select className={inputClass} value={proposito} onChange={(e) => setProposito(e.target.value)}>
            <option>Cría</option><option>Engorde</option><option>Lechería</option><option>Trabajo / Mixto</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-stone-100">Cancelar</button>
        <button onClick={() => nombre && onSave({ nombre, proposito })} className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">Crear</button>
      </div>
    </Modal>
  );
}
