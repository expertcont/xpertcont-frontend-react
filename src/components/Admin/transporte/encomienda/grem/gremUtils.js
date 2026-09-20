export const fechaHoyLima = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
};

export const encomiendaKey = (row = {}) => (
  [row.r_cod, row.r_serie, row.r_numero, row.elemento || 1].filter(Boolean).join("|")
);

export const destinoDesdeRuta = (row = {}) => {
  const ruta = String(row.nombre_ruta || row.rutaLabel || "").trim();
  if (!ruta) return "Sin destino";

  const partes = ruta.split(/\s*[-–—]\s*/).filter(Boolean);
  return partes.length > 1 ? partes[partes.length - 1].trim() : ruta;
};

export const normalizarFiltro = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

export const extraerCodigoEscaneado = (value) => {
  const match = String(value || "").toUpperCase().match(/\b([A-Z]\d{3})[-\s]?(\d{1,10})\b/);
  if (!match) return null;

  return {
    serie: match[1],
    numero: match[2].padStart(10, "0"),
  };
};

export const coincideCodigoEscaneado = (item, codigo) => (
  Boolean(codigo) &&
  String(item.r_serie_ref || item.r_serie || "").toUpperCase() === codigo.serie &&
  String(item.r_numero_ref || item.r_numero || "").padStart(10, "0") === codigo.numero
);

export const tieneGrem = (row = {}) => Boolean(row.grem_numero || row.grem_vfirmado);

export const encomiendaDocumento = (row = {}) => (
  [row.r_cod_ref || row.r_cod, row.r_serie_ref || row.r_serie, row.r_numero_ref || row.r_numero]
    .filter(Boolean)
    .join("-")
);
