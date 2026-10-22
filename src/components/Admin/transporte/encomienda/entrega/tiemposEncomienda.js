// Aritmetica de calendario sobre el texto SQL: no interpretar los timestamp
// con Date.parse/new Date, ni agregar Z, offsets o convertir zonas horarias.
const fechaNatural = (value) => {
  const partes = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/);
  if (!partes) return null;
  const [, anio, mes, dia, hora, minuto, segundo = "0", fraccion = "0"] = partes;
  const [y, m, d, h, min, s] = [anio, mes, dia, hora, minuto, segundo].map(Number);
  const bisiesto = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const diasMes = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > diasMes[m - 1] || h > 23 || min > 59 || s > 59) return null;
  const anterior = y - 1;
  const dias = 365 * anterior + Math.floor(anterior / 4) - Math.floor(anterior / 100)
    + Math.floor(anterior / 400) + diasMes.slice(0, m - 1).reduce((total, n) => total + n, 0) + d - 1;
  return ((dias * 24 + h) * 60 + min) * 60000 + s * 1000 + Number(`0.${fraccion}`) * 1000;
};

// El ancla viene del servidor en hora de Lima. Solo avanza con performance.now(),
// un contador monotono independiente de la fecha, hora y zona del equipo.
export const tiempoServidor = (horaServidor, transcurrido = 0) => {
  const base = fechaNatural(horaServidor);
  return base === null || !Number.isFinite(transcurrido) ? null : base + Math.max(0, transcurrido);
};

// Comparar las horas visibles (HH:mm) literalmente, sin interpretar zonas.
const minutosHoraNatural = (value) => {
  const partes = String(value || "").trim().match(/^(?:\d{4}-\d{2}-\d{2}[ T])?(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/);
  if (!partes || Number(partes[1]) > 23 || Number(partes[2]) > 59) return null;
  return Number(partes[1]) * 60 + Number(partes[2]);
};

export const esLlegadaDiaSiguiente = (row) => {
  const registro = minutosHoraNatural(row.ctrl_crea);
  const prevista = minutosHoraNatural(row.llegada_aprox);
  return registro !== null && prevista !== null && prevista < registro;
};

export const llegadaPrevista = (row) => {
  const fecha = String(row.r_fecemi || "").slice(0, 10);
  const hora = String(row.llegada_aprox || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(hora)) return "";
  if (fechaNatural(`${fecha} ${hora}`) === null) return "";
  if (!esLlegadaDiaSiguiente(row)) return `${fecha} ${hora}`;
  // Sumar un dia de calendario a r_fecemi, incluso al cambiar de mes o año.
  let [anio, mes, dia] = fecha.split("-").map(Number);
  const bisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
  const ultimoDia = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1];
  dia += 1;
  if (dia > ultimoDia) {
    dia = 1;
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }
  return `${String(anio).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")} ${hora}`;
};

export const formatoHoraNatural = (value) => {
  // Extraer literalmente la hora de TIME o ctrl_crea serializado, sin Date
  // ni ajustes de zona aunque el texto recibido incluya Z u offset.
  const partes = String(value || "").trim().match(/^(?:\d{4}-\d{2}-\d{2}[ T])?(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/);
  if (!partes || Number(partes[1]) > 23 || Number(partes[2]) > 59) return "—";
  const hora = Number(partes[1]);
  return `${String(hora % 12 || 12).padStart(2, "0")}:${partes[2]} ${hora < 12 ? "am" : "pm"}`;
};

const duracion = (ms) => {
  const minutos = Math.floor(Math.max(0, ms) / 60000);
  const dias = Math.floor(minutos / 1440);
  const horas = Math.floor((minutos % 1440) / 60);
  return `${dias ? `${dias} d ` : ""}${horas ? `${horas} h ` : ""}${minutos % 60} min`;
};

export const estadoTiempoEncomienda = (row, actual = null) => {
  const llegada = fechaNatural(row.llegada_real);
  if (row.entrega_fecha) {
    const entrega = fechaNatural(row.entrega_fecha);
    if (llegada !== null && entrega !== null && entrega >= llegada) {
      return { texto: `Recojo en ${duracion(entrega - llegada)}`, tipo: "success" };
    }
    return { texto: "Entregada", tipo: "success" };
  }
  if (!Number.isFinite(actual)) return { texto: "Hora del servidor no disponible", tipo: "muted" };
  if (llegada !== null && llegada <= actual) {
    return { texto: `Espera recojo: ${duracion(actual - llegada)}`, tipo: "success" };
  }
  if (row.llegada_real) return { texto: "Verificar fecha de llegada", tipo: "warning" };
  const prevista = fechaNatural(llegadaPrevista(row));
  if (prevista === null) return { texto: "Sin llegada registrada · sin hora prevista", tipo: "muted" };
  if (actual > prevista) {
    return { texto: `Sin llegada · retraso ${duracion(actual - prevista)}`, tipo: "warning" };
  }
  return { texto: "Aún no llega · en plazo previsto", tipo: "muted" };
};
