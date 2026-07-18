// Configuración de propósito y raza por especie.
// "propositos": lista de propósitos posibles para esa especie (selección múltiple).
// "razas": cada raza declara a qué propósitos suele aplicar (para filtrar el segundo selector).

export const GANADO_CONFIG = {
  Bovino: {
    propositos: ["Cría", "Engorde", "Lechería", "Doble propósito", "Trabajo"],
    razas: [
      { nombre: "Brahman", propositos: ["Cría", "Engorde", "Doble propósito"] },
      { nombre: "Angus", propositos: ["Engorde"] },
      { nombre: "Holstein", propositos: ["Lechería"] },
      { nombre: "Jersey", propositos: ["Lechería"] },
      { nombre: "Pardo Suizo", propositos: ["Lechería", "Doble propósito"] },
      { nombre: "Brangus", propositos: ["Engorde", "Cría"] },
      { nombre: "Criollo", propositos: ["Doble propósito", "Trabajo", "Cría"] },
      { nombre: "Gyr", propositos: ["Lechería", "Doble propósito"] },
    ],
  },
  Porcino: {
    propositos: ["Cría", "Engorde"],
    razas: [
      { nombre: "Yorkshire", propositos: ["Cría", "Engorde"] },
      { nombre: "Landrace", propositos: ["Cría"] },
      { nombre: "Duroc", propositos: ["Engorde"] },
      { nombre: "Hampshire", propositos: ["Engorde"] },
    ],
  },
  Equino: {
    propositos: ["Trabajo", "Paso", "Cría", "Deporte"],
    razas: [
      { nombre: "Criollo", propositos: ["Trabajo", "Cría"] },
      { nombre: "Paso Fino", propositos: ["Paso"] },
      { nombre: "Cuarto de Milla", propositos: ["Trabajo", "Deporte"] },
      { nombre: "Pura Sangre", propositos: ["Deporte", "Cría"] },
    ],
  },
  Ovino: {
    propositos: ["Cría", "Engorde", "Lana"],
    razas: [
      { nombre: "Pelibuey", propositos: ["Cría", "Engorde"] },
      { nombre: "Katahdin", propositos: ["Cría", "Engorde"] },
      { nombre: "Merino", propositos: ["Lana"] },
      { nombre: "Dorper", propositos: ["Engorde"] },
    ],
  },
  Caprino: {
    propositos: ["Cría", "Lechería", "Engorde"],
    razas: [
      { nombre: "Nubia", propositos: ["Lechería", "Cría"] },
      { nombre: "Saanen", propositos: ["Lechería"] },
      { nombre: "Boer", propositos: ["Engorde"] },
      { nombre: "Criolla", propositos: ["Cría", "Engorde"] },
    ],
  },
};

export const MOTIVOS_SALIDA = ["Venta", "Préstamo", "Fallecimiento", "Otro"];
