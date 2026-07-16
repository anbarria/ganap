export const todayISO = () => new Date().toISOString().slice(0, 10);

export const addDays = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export const fmtDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const ESPECIES = ["Bovino", "Porcino", "Equino", "Ovino", "Caprino"];

export const ROL_LABEL = {
  superadmin: "Administrador GANAP",
  propietario: "Propietario",
  veterinario: "Veterinario",
  capataz: "Capataz",
};
