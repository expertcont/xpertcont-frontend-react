export const focusableRefs = [];

export const toTimePlusHours = (hours = 2) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join(":");
};

export const documentoTipoDesdeNumero = (documento) => {
  const limpio = String(documento || "").replace(/\D/g, "");
  if (limpio.length === 11) {
    return "6";
  }
  return "1";
};

export const comprobanteDesdeDocumento = (documento) => {
  const limpio = String(documento || "").replace(/\D/g, "");
  if (limpio.length === 11) {
    return { r_cod: "01", label: "GRABAR FACTURA" };
  }

  return { r_cod: "03", label: "GRABAR BOLETA" };
};

export const normalizarCondicionPago = (value) => {
  if (value === "CANCELADO") {
    return "PAGADO";
  }
  if (value === "POR_PAGAR") {
    return "POR_COBRAR";
  }
  return value || "PAGADO";
};

export const destinoDesdeRuta = (ruta = {}) => {
  const nombreDestino = ruta.punto_venta_dest_nombre || ruta.punto_venta_destino_nombre || ruta.destino_nombre || "";
  if (nombreDestino) {
    return nombreDestino;
  }

  const nombreRuta = String(ruta.nombre || "");
  if (nombreRuta.includes(".")) {
    return nombreRuta.split(".").pop();
  }

  return ruta.id_punto_venta_dest || "";
};

export const crearDraft = (operacion, periodoTrabajo, fechaOperacion) => ({
  tipo_operacion: "E",
  r_fecemi: String(operacion?.r_fecemi || fechaOperacion || `${periodoTrabajo}-01`).slice(0, 10),
  r_cod: operacion?.r_cod || comprobanteDesdeDocumento(operacion?.cliente_documento || operacion?.cliente_documento_id).r_cod,
  r_serie: operacion?.r_serie || "B001",
  r_numero: operacion?.r_numero || "",
  id_documento: operacion?.id_documento || operacion?.cliente_id_doc || documentoTipoDesdeNumero(operacion?.cliente_documento || operacion?.cliente_documento_id),
  cliente: operacion?.cliente || "",
  cliente_documento: operacion?.cliente_documento || operacion?.cliente_documento_id || "",
  cliente_telefono: operacion?.cliente_telefono || "",
  remitente_entrega: operacion?.remitente_entrega || "OFICINA",
  remitente_zona: operacion?.remitente_zona || operacion?.cliente_zona || "",
  remitente_direccion: operacion?.remitente_direccion || operacion?.cliente_direccion || "",
  destinatario: operacion?.destinatario || "",
  destinatario_documento: operacion?.destinatario_documento || operacion?.destinatario_documento_id || "",
  destinatario_telefono: operacion?.destinatario_telefono || "",
  destinatario_entrega: operacion?.destinatario_entrega || "OFICINA",
  destinatario_zona: operacion?.destinatario_zona || "",
  destinatario_direccion: operacion?.destinatario_direccion || "",
  id_ruta: operacion?.id_ruta || "",
  id_punto_venta: operacion?.id_punto_venta || "",
  id_punto_venta_dest: operacion?.id_punto_venta_dest || "",
  placa: operacion?.placa || "",
  licencia: operacion?.licencia || "",
  descripcion: operacion?.descripcion || "",
  r_monto_total: operacion?.r_monto_total || operacion?.precio_neto || "",
  condicion_pago: normalizarCondicionPago(operacion?.condicion_pago || operacion?.numero_rdi),
  celulares: false,
  clave: "",
  llegada_aprox: operacion?.llegada_aprox || operacion?.estado_sunat || toTimePlusHours(2),
});

export const textoBusquedaClone = (item) => [
  item.r_fecemi,
  item.r_cod,
  item.r_serie,
  item.r_numero,
  item.cliente,
  item.cliente_documento,
  item.cliente_documento_id,
  item.destinatario,
  item.destinatario_documento,
  item.destinatario_documento_id,
  item.descripcion,
  item.placa,
  item.licencia,
  item.id_ruta,
].map((value) => String(value || "").toLowerCase()).join(" ");

export const numeroOperacionClone = (item) => [
  item.r_cod,
  item.r_serie,
  item.r_numero,
].filter(Boolean).join("-");

export const fechaClone = (value) => {
  const text = String(value || "").slice(0, 10);
  return text ? text.split("-").reverse().join("/") : "";
};

export const montoClone = (value) => `S/ ${Number(value || 0).toLocaleString("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;
