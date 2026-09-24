export const focusableRefs = [];

export const toTimePlusHours = (hours = 2) => {
  const date = new Date();
  const currentMinutes = date.getMinutes();

  date.setHours(date.getHours() + hours);
  date.setSeconds(0, 0);

  if (currentMinutes === 0) {
    date.setMinutes(0);
  } else if (currentMinutes <= 15) {
    date.setMinutes(30);
  } else {
    date.setHours(date.getHours() + 1);
    date.setMinutes(0);
  }

  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    "00",
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
  const normalized = String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
  if (normalized === "CANCELADO") {
    return "PAGADO";
  }
  if (normalized === "POR_PAGAR" || normalized === "POR_COBRAR") {
    return "POR_COBRAR";
  }
  return normalized || "PAGADO";
};

export const destinoDesdeRuta = (ruta = {}) => {
  const nombreRuta = String(ruta.nombre || ruta.nombre_ruta || ruta.rutaLabel || ruta.id_ruta || "").trim();
  const partes = nombreRuta.split(/\s*(?:->|=>|—|–|-|\/)\s*/).filter(Boolean);
  if (partes.length > 1) {
    return partes[partes.length - 1].trim();
  }

  return ruta.punto_venta_dest_nombre || ruta.punto_venta_destino_nombre || ruta.destino_nombre || ruta.id_punto_venta_dest || "";
};

export const crearDraft = (operacion, periodoTrabajo, fechaOperacion) => {
  const remitenteZona = operacion?.remitente_zona || operacion?.cliente_zona || "";
  const remitenteDireccion = operacion?.remitente_direccion || operacion?.cliente_direccion || "";
  const destinatarioZona = operacion?.destinatario_zona || "";
  const destinatarioDireccion = operacion?.destinatario_direccion || "";

  return {
    tipo_operacion: "E",
    r_fecemi: String(operacion?.r_fecemi || fechaOperacion || `${periodoTrabajo}-01`).slice(0, 10),
    r_cod: operacion?.r_cod || comprobanteDesdeDocumento(operacion?.cliente_documento || operacion?.cliente_documento_id).r_cod,
    r_serie: operacion?.r_serie || "B001",
    r_numero: operacion?.r_numero || "",
    id_documento: operacion?.id_documento || operacion?.cliente_id_doc || documentoTipoDesdeNumero(operacion?.cliente_documento || operacion?.cliente_documento_id),
    cliente: operacion?.cliente || "",
    cliente_documento: operacion?.cliente_documento || operacion?.cliente_documento_id || "",
    cliente_telefono: operacion?.cliente_telefono || "",
    cliente_direccion_fact: operacion?.cliente_direccion_fact || "",
    remitente_entrega: operacion?.remitente_entrega || (remitenteZona || remitenteDireccion ? "CLIENTE" : "OFICINA"),
    remitente_zona: remitenteZona,
    remitente_direccion: remitenteDireccion,
    destinatario: operacion?.destinatario || "",
    destinatario_documento: operacion?.destinatario_documento || operacion?.destinatario_documento_id || "",
    destinatario_telefono: operacion?.destinatario_telefono || "",
    destinatario_entrega: operacion?.destinatario_entrega || (destinatarioZona || destinatarioDireccion ? "CLIENTE" : "OFICINA"),
    destinatario_zona: destinatarioZona,
    destinatario_direccion: destinatarioDireccion,
    id_ruta: operacion?.id_ruta || "",
    nombre_ruta: operacion?.nombre_ruta || operacion?.rutaLabel || "",
    id_punto_venta: operacion?.id_punto_venta || "",
    id_punto_venta_dest: operacion?.id_punto_venta_dest || "",
    punto_venta_dest_nombre: operacion?.punto_venta_dest_nombre || operacion?.punto_venta_destino_nombre || operacion?.destino_nombre || "",
    placa: operacion?.placa || "",
    descripcion: operacion?.descripcion || "",
    r_monto_total: operacion?.r_monto_total || operacion?.precio_neto || "",
    precio_chofer: operacion?.precio_chofer || "",
    condicion_pago: normalizarCondicionPago(operacion?.condicion_pago || operacion?.numero_rdi),
    celulares: false,
    clave: "",
    llegada_aprox: operacion?.llegada_aprox || operacion?.estado_sunat || toTimePlusHours(2),
  };
};

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
