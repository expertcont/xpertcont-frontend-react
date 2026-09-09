export const formatMoney = (value) => `PEN ${Number(value || 0).toLocaleString("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

export const formatFecha = (fecha) => {
  const fechaTexto = String(fecha || "").slice(0, 10);
  if (!fechaTexto) {
    return "";
  }
  return fechaTexto.split("-").reverse().join("/");
};

export const formatHora = (fechaHora) => {
  const valor = String(fechaHora || "").trim();
  if (!valor) {
    return "";
  }

  const horaTexto = valor.includes("T")
    ? valor.split("T")[1]
    : valor.split(" ")[1];

  if (horaTexto) {
    const [hora = "0", minuto = "00"] = horaTexto.split(".")[0].split(":");
    const horaNumero = Number(hora);
    if (Number.isFinite(horaNumero)) {
      const periodo = horaNumero >= 12 ? "PM" : "AM";
      const hora12 = horaNumero % 12 || 12;
      return `${String(hora12).padStart(2, "0")}:${String(minuto).padStart(2, "0")} ${periodo}`;
    }
    return "";
  }

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return "";
  }

  return fecha.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const numeroOperacion = (item) => [
  item.r_cod,
  item.r_serie,
  item.r_numero,
].filter(Boolean).join("-");

export const tipoOperacion = (item) => item.tipo_operacion === "E" ? "Encomienda" : "Boleto";

export const normalizarCondicionPagoTexto = (value) => String(value || "")
  .trim()
  .toUpperCase()
  .replace(/[^A-Z]/g, "_")
  .replace(/_+/g, "_")
  .replace(/^_|_$/g, "");

export const condicionPagoLabel = (item) => {
  const condicion = normalizarCondicionPagoTexto(item.condicion_pago);

  if (condicion === "POR_COBRAR" || condicion === "POR_PAGAR") {
    return condicion;
  }

  return "";
};

export const normalizarTextoBusqueda = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

export const crearIndiceBusqueda = (item) => [
  numeroOperacion(item),
  item.cliente,
  item.cliente_documento,
  item.cliente_documento_id,
  item.destinatario,
  item.destinatario_documento,
  item.destinatario_documento_id,
  item.descripcion,
  item.condicion_pago,
  item.placa,
  item.licencia,
  item.ctrl_crea_us,
  item.autor,
].map(normalizarTextoBusqueda).join(" ");

export const normalizarOperacion = (item) => ({
  ...item,
  numero: numeroOperacion(item),
  fecha: formatFecha(item.r_fecemi),
  horaGrabacion: formatHora(item.ctrl_crea),
  tipoLabel: tipoOperacion(item),
  condicionPagoLabel: condicionPagoLabel(item),
  clienteLabel: item.cliente || "Sin cliente",
  rutaLabel: item.nombre_ruta || item.id_ruta || "Sin ruta",
  servicioLabel: item.descripcion || item.id_ruta || "Servicio de transporte",
  autor: item.ctrl_crea_us || "Sin autor",
  total: Number(item.r_monto_total || item.precio_neto || 0),
  entregada: Boolean(item.entrega_fecha),
});
