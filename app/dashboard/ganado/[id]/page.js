"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Dna, Syringe, Stethoscope, Store, Beef, Plus, LogOut as ExitIcon } from "lucide-react";
import { createClient } from "../../../../lib/supabase/client";
import { useProfile } from "../../../../lib/useProfile";
import { EarTag, Badge, Modal, Field, inputClass } from "../../../../components/UI";
import { fmtDate, daysBetween, todayISO, addDays, esActivo } from "../../../../lib/helpers";
import { MOTIVOS_SALIDA } from "../../../../lib/ganadoConfig";

export default function AnimalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile, misFincas } = useProfile();
  const [animal, setAnimal] = useState(null);
  const [padre, setPadre] = useState(null);
  const [madre, setMadre] = useState(null);
  const [hijos, setHijos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVac, setShowVac] = useState(false);
  const [showVisita, setShowVisita] = useState(false);
  const [showVenta, setShowVenta] = useState(false);
  const [showSalida, setShowSalida] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: a } = await supabase
      .from("animales")
      .select("*, vacunas(*), visitas_veterinarias(*)")
      .eq("id", id)
      .maybeSingle();

    if (!a) {
      setAnimal(null);
      setLoading(false);
      return;
    }
    setAnimal(a);

    const [padreRes, madreRes, hijosRes] = await Promise.all([
      a.padre_id ? supabase.from("animales").select("id,nombre,arete").eq("id", a.padre_id).maybeSingle() : Promise.resolve({ data: null }),
      a.madre_id ? supabase.from("animales").select("id,nombre,arete").eq("id", a.madre_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("animales").select("id,nombre,arete").or(`padre_id.eq.${a.id},madre_id.eq.${a.id}`),
    ]);
    setPadre(padreRes.data);
    setMadre(madreRes.data);
    setHijos(hijosRes.data || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function fincaNombre(fincaId) {
    return misFincas.find((f) => f.id === fincaId)?.nombre || "";
  }

  async function addVacuna(v) {
    const supabase = createClient();
    await supabase.from("vacunas").insert({ ...v, animal_id: id });
    setShowVac(false);
    load();
  }
  async function addVisita(v) {
    const supabase = createClient();
    await supabase.from("visitas_veterinarias").insert({ ...v, animal_id: id });
    setShowVisita(false);
    load();
  }
  async function guardarVenta(payload) {
    const supabase = createClient();
    await supabase.from("animales").update(payload).eq("id", id);
    setShowVenta(false);
    load();
  }
  async function guardarSalida(payload) {
    const supabase = createClient();
    await supabase.from("animales").update(payload).eq("id", id);
    setShowSalida(false);
    load();
  }
  async function reingresarAFinca() {
    const supabase = createClient();
    await supabase.from("animales").update({ estado: "Activo", fecha_salida: null, motivo_salida: null, destino_salida: null }).eq("id", id);
    load();
  }

  if (loading) return <p className="text-sm text-slate-400 p-6">Cargando…</p>;
  if (!animal) return <p className="text-sm text-slate-400 p-6">No se encontró este animal (o no tienes acceso a él).</p>;

  const puedePublicar = profile?.rol === "propietario" || profile?.rol === "superadmin";

  return (
    <div className="space-y-5">
      <button onClick={() => router.push("/dashboard/ganado")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ChevronLeft size={16} /> Volver a Ganado
      </button>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-stone-100 flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
              {animal.foto_url ? <img src={animal.foto_url} alt="" className="h-full w-full object-cover" /> : <Beef size={26} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-xl font-bold text-slate-900">{animal.nombre}</h1>
                <EarTag>{animal.arete}</EarTag>
                {animal.en_venta && <Badge color="emerald">En venta · ${animal.precio_venta}</Badge>}
                {!esActivo(animal.estado) && <Badge color={animal.motivo_salida === "Fallecimiento" ? "red" : "slate"}>{animal.estado}</Badge>}
              </div>
              <p className="text-sm text-slate-500">
                {animal.especie} · {animal.raza} · {animal.sexo} · {fincaNombre(animal.finca_id)}
              </p>
              {(animal.propositos || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {animal.propositos.map((p) => <Badge key={p} color="slate">{p}</Badge>)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {puedePublicar && esActivo(animal.estado) && (
              <button
                onClick={() => setShowVenta(true)}
                className={`text-sm font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 ${animal.en_venta ? "bg-stone-100 text-slate-600" : "bg-amber-500 text-slate-950"}`}
              >
                <Store size={15} /> {animal.en_venta ? "Editar publicación" : "Publicar en Mercado"}
              </button>
            )}
            {puedePublicar && esActivo(animal.estado) && (
              <button onClick={() => setShowSalida(true)} className="text-sm font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 bg-stone-100 text-slate-600">
                <ExitIcon size={15} /> Registrar salida
              </button>
            )}
            {puedePublicar && !esActivo(animal.estado) && (
              <button onClick={reingresarAFinca} className="text-sm font-semibold px-3.5 py-2 rounded-lg text-emerald-700 bg-emerald-50">
                Reingresar a la finca
              </button>
            )}
          </div>
        </div>
        {!esActivo(animal.estado) && (
          <div className="mt-4 bg-stone-50 rounded-lg p-3 text-sm">
            <p className="font-semibold text-slate-700">Salida registrada: {animal.motivo_salida}</p>
            <p className="text-slate-500 text-xs mt-0.5">Fecha: {fmtDate(animal.fecha_salida)}{animal.destino_salida ? ` · Destino: ${animal.destino_salida}` : ""}</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 text-sm">
          <MiniStat label="Nacimiento" value={fmtDate(animal.fecha_nacimiento)} />
          <MiniStat label="Peso" value={animal.peso_kg ? `${animal.peso_kg} kg` : "—"} />
          <MiniStat label="Estado" value={animal.estado} />
          <MiniStat
            label="Edad"
            value={animal.fecha_nacimiento ? `${Math.floor(daysBetween(animal.fecha_nacimiento, todayISO()) / 365)} años` : "—"}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-3"><Dna size={16} className="text-amber-600" /> Pedigree</h2>
        <div className="flex flex-wrap items-center gap-3">
          <PedigreeCard label="Padre" animal={padre} />
          <PedigreeCard label="Madre" animal={madre} />
          {hijos.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 font-medium">Crías registradas</span>
              <div className="flex flex-wrap gap-2">
                {hijos.map((h) => <EarTag key={h.id} tone="slate">{h.arete} · {h.nombre}</EarTag>)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Syringe size={16} className="text-amber-600" /> Historial de vacunación</h2>
          <button onClick={() => setShowVac(true)} className="text-xs font-semibold text-amber-700 flex items-center gap-1"><Plus size={13} /> Añadir</button>
        </div>
        <div className="divide-y divide-stone-100">
          {(animal.vacunas || []).length === 0 && <p className="px-5 pb-5 text-sm text-slate-400">Sin registros.</p>}
          {(animal.vacunas || []).map((v) => {
            const dias = v.proxima_fecha ? daysBetween(todayISO(), v.proxima_fecha) : null;
            return (
              <div key={v.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{v.nombre}</p>
                  <p className="text-xs text-slate-400">Aplicada: {fmtDate(v.fecha_aplicada)} · Por: {v.aplicado_por || "—"}</p>
                </div>
                {v.proxima_fecha && (
                  <Badge color={dias < 0 ? "red" : dias <= 14 ? "amber" : "slate"}>Próxima: {fmtDate(v.proxima_fecha)}</Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Stethoscope size={16} className="text-amber-600" /> Visitas veterinarias</h2>
          <button onClick={() => setShowVisita(true)} className="text-xs font-semibold text-amber-700 flex items-center gap-1"><Plus size={13} /> Añadir</button>
        </div>
        <div className="divide-y divide-stone-100">
          {(animal.visitas_veterinarias || []).length === 0 && <p className="px-5 pb-5 text-sm text-slate-400">Sin registros.</p>}
          {(animal.visitas_veterinarias || []).map((v) => (
            <div key={v.id} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">{v.motivo}</p>
                <span className="text-xs text-slate-400">{fmtDate(v.fecha)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{v.diagnostico}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Atendido por {v.veterinario || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {showVac && <AddVacunaModal onClose={() => setShowVac(false)} onSave={addVacuna} defaultVet={profile?.rol === "veterinario" ? profile.nombre : ""} />}
      {showVisita && <AddVisitaModal onClose={() => setShowVisita(false)} onSave={addVisita} defaultVet={profile?.rol === "veterinario" ? profile.nombre : ""} />}
      {showVenta && <VentaModal animal={animal} onClose={() => setShowVenta(false)} onSave={guardarVenta} />}
      {showSalida && <SalidaModal onClose={() => setShowSalida(false)} onSave={guardarSalida} />}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-stone-50 rounded-lg px-3 py-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
function PedigreeCard({ label, animal }) {
  return (
    <div className="bg-stone-50 rounded-lg px-3.5 py-2.5 min-w-[150px]">
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      {animal ? (
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-slate-800">{animal.nombre}</p>
          <EarTag tone="slate">{animal.arete}</EarTag>
        </div>
      ) : (
        <p className="text-sm text-slate-400">No registrado</p>
      )}
    </div>
  );
}

function AddVacunaModal({ onClose, onSave, defaultVet }) {
  const [form, setForm] = useState({ nombre: "", fecha_aplicada: todayISO(), proxima_fecha: addDays(todayISO(), 180), aplicado_por: defaultVet || "" });
  return (
    <Modal title="Registrar vacuna" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Vacuna"><input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Fiebre Aftosa" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha aplicada"><input type="date" className={inputClass} value={form.fecha_aplicada} onChange={(e) => setForm({ ...form, fecha_aplicada: e.target.value })} /></Field>
          <Field label="Próxima dosis"><input type="date" className={inputClass} value={form.proxima_fecha} onChange={(e) => setForm({ ...form, proxima_fecha: e.target.value })} /></Field>
        </div>
        <Field label="Aplicado por"><input className={inputClass} value={form.aplicado_por} onChange={(e) => setForm({ ...form, aplicado_por: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-stone-100">Cancelar</button>
        <button onClick={() => form.nombre && onSave(form)} className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">Guardar</button>
      </div>
    </Modal>
  );
}
function AddVisitaModal({ onClose, onSave, defaultVet }) {
  const [form, setForm] = useState({ fecha: todayISO(), motivo: "", diagnostico: "", veterinario: defaultVet || "" });
  return (
    <Modal title="Registrar visita veterinaria" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Fecha"><input type="date" className={inputClass} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
        <Field label="Motivo"><input className={inputClass} value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ej. Chequeo reproductivo" /></Field>
        <Field label="Diagnóstico / notas"><textarea className={inputClass} rows={3} value={form.diagnostico} onChange={(e) => setForm({ ...form, diagnostico: e.target.value })} /></Field>
        <Field label="Veterinario"><input className={inputClass} value={form.veterinario} onChange={(e) => setForm({ ...form, veterinario: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-stone-100">Cancelar</button>
        <button onClick={() => form.motivo && onSave(form)} className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold">Guardar</button>
      </div>
    </Modal>
  );
}
function VentaModal({ animal, onClose, onSave }) {
  const [precio, setPrecio] = useState(animal.precio_venta || "");
  const [desc, setDesc] = useState(animal.descripcion_venta || "");
  return (
    <Modal title="Publicar en el Mercado" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Precio de venta (US$)"><input type="number" className={inputClass} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="1200" /></Field>
        <Field label="Descripción para compradores"><textarea className={inputClass} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Genética, estado de salud, propósito, etc." /></Field>
      </div>
      <div className="flex justify-between gap-2 mt-5">
        {animal.en_venta && (
          <button onClick={() => onSave({ en_venta: false, precio_venta: null, descripcion_venta: "" })} className="px-4 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50">
            Retirar del Mercado
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-stone-100">Cancelar</button>
          <button
            onClick={() => precio && onSave({ en_venta: true, precio_venta: Number(precio), descripcion_venta: desc })}
            className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
          >
            Publicar
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SalidaModal({ onClose, onSave }) {
  const [form, setForm] = useState({ fecha_salida: todayISO(), motivo_salida: "Venta", destino_salida: "" });
  return (
    <Modal title="Registrar salida del animal" onClose={onClose}>
      <p className="text-xs text-slate-500 mb-3">
        Esto marca al animal como fuera de la finca (vendido, prestado, etc.) sin borrar su historial — podrás consultarlo luego en "Salidas".
      </p>
      <div className="space-y-3">
        <Field label="Motivo">
          <select className={inputClass} value={form.motivo_salida} onChange={(e) => setForm({ ...form, motivo_salida: e.target.value })}>
            {MOTIVOS_SALIDA.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Fecha"><input type="date" className={inputClass} value={form.fecha_salida} onChange={(e) => setForm({ ...form, fecha_salida: e.target.value })} /></Field>
        <Field label="Destino (comprador, finca que lo recibe, etc.)">
          <input className={inputClass} value={form.destino_salida} onChange={(e) => setForm({ ...form, destino_salida: e.target.value })} placeholder="Ej. Finca Los Álamos - Juan Pérez" />
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-stone-100">Cancelar</button>
        <button
          onClick={() => onSave({ estado: form.motivo_salida, fecha_salida: form.fecha_salida, motivo_salida: form.motivo_salida, destino_salida: form.destino_salida, en_venta: false })}
          className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
        >
          Registrar salida
        </button>
      </div>
    </Modal>
  );
}
