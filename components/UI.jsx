"use client";

import { X, Tag } from "lucide-react";

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
