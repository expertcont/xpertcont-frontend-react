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
].map(normalizarTextoBusqueda).join(" ");

export const normalizarOperacion = (item) => ({
  ...item,
  numero: numeroOperacion(item),
  fecha: formatFecha(item.r_fecemi),
  tipoLabel: tipoOperacion(item),
  condicionPagoLabel: condicionPagoLabel(item),
  clienteLabel: item.cliente || "Sin cliente",
  rutaLabel: item.nombre_ruta || item.id_ruta || "Sin ruta",
  servicioLabel: item.descripcion || item.id_ruta || "Servicio de transporte",
  autor: item.ctrl_crea_us || "Sin autor",
  total: Number(item.r_monto_total || item.precio_neto || 0),
  entregada: Boolean(item.entrega_fecha),
});
