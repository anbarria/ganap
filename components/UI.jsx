"use client";

import { useState } from "react";
import { X, Tag, Eye, EyeOff, Check } from "lucide-react";

export function EarTag({ children, tone = "amber" }) {
  const tones = {
    amber: "bg-amber-50 border-amber-400 text-amber-900",
    slate: "bg-slate-50 border-slate-400 text-slate-700",
  };
  return (
    <span className={`relative inline-flex items-center gap-1 rounded-md border-2 px-2 py-0.5 text-xs font-mono font-bold ${tones[tone]}`}>
      <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white border-2 border-current" />
      <Tag size={11} className="ml-0.5" />
      {children}
    </span>
  );
}

export function Badge({ children, color = "emerald" }) {
  const colors = {
    emerald: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-800",
    slate: "bg-slate-100 text-slate-700",
    sky: "bg-sky-100 text-sky-700",
  };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors[color]}`}>{children}</span>;
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400";

export function PasswordInput({ value, onChange, placeholder, required, minLength }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={`${inputClass} pr-10`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        tabIndex={-1}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function MultiSelect({ options, selected, onChange, disabled }) {
  function toggle(opt) {
    if (disabled) return;
    if (selected.includes(opt)) onChange(selected.filter((o) => o !== opt));
    else onChange([...selected, opt]);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            disabled={disabled}
            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border transition ${
              active
                ? "bg-amber-500 border-amber-500 text-slate-950"
                : "bg-white border-stone-300 text-slate-600 hover:border-amber-400"
            } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {active && <Check size={12} />}
            {opt}
          </button>
        );
      })}
      {options.length === 0 && <p className="text-xs text-slate-400">Selecciona una especie primero.</p>}
    </div>
  );
}

