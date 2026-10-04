import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getStoredThemeId, getThemeValues } from "../../../../theme/palette";

const A4_PORTRAIT = [595.28, 841.89];
const A4 = [A4_PORTRAIT[1], A4_PORTRAIT[0]];
const MARGIN = 34;
const PAGE_WIDTH = A4[0];
const PAGE_HEIGHT = A4[1];
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

// Medidas principales del reporte.
// Cambia estos valores si quieres personalizar separaciones sin tocar cada bloque:
// - "Height" controla el alto real que se dibuja.
// - "Gap" controla separaciones entre cajas.
// - "Advance" es cuanto baja la coordenada y despues de dibujar un bloque.
// En pdf-lib, y crece hacia arriba; por eso avanzar hacia abajo siempre es y -= valor.
const LAYOUT = {
  summaryHeight: 46,        // Alto de cada chip superior: ingresos, salidas, resumen bancario y saldo.
  summaryGap: 8,            // Separacion horizontal entre chips superiores.
  summaryBottomGap: 12,     // Aire debajo de los chips antes de la cabecera de tabla.
  tableHeaderHeight: 20,    // Alto del chip/cabecera de tabla.
  tableHeaderBottomGap: 3,  // Aire debajo de la cabecera antes de iniciar las filas.
  subtotalHeight: 30,       // Alto de la fila final de subtotales referenciales.
  rowMinHeight: 18,         // Alto minimo de una fila del detalle.
  rowBaseHeight: 8,         // Alto base de fila antes de sumar lineas de detalle.
  rowLineHeight: 6.8,       // Alto que suma cada linea de detalle envuelta.
  bottomReserved: 42,       // Espacio reservado para firmas antes de saltar pagina.
  beforeSignatureGap: 14,   // Separacion entre la ultima fila y las lineas de firma.
  signatureWidth: 150,      // Largo de cada linea de firma.
  signatureInset: 52,       // Separacion lateral de las lineas de firma.
  summaryAccentWidth: 3,    // Barra lateral del total; evita bordes redondeados que se cortan al hacer zoom.
};

// Posiciones horizontales de la tabla.
// Si una columna queda apretada, cambia estos valores y todo se alinea junto:
// - detailX mueve el inicio del detalle.
// - ingresoRight/salidaRight son los bordes derechos de cada monto.
const COLUMNS = {
  fechaX: MARGIN + 6,
  // Sin columna de iconos: el detalle arranca donde estaba el icono.
  detailX: MARGIN + 90,
  // Montos: bordes derechos separados para el cierre horizontal.
  ingresoOrigenRight: PAGE_WIDTH - MARGIN - 280,
  ingresoDestinoRight: PAGE_WIDTH - MARGIN - 210,
  ingresoOtrosRight: PAGE_WIDTH - MARGIN - 140,
  salidaDirectaRight: PAGE_WIDTH - MARGIN - 70,
  salidaChoferRight: PAGE_WIDTH - MARGIN,
};

const DETAIL_WIDTH = COLUMNS.ingresoOrigenRight - COLUMNS.detailX - 34;

// Monto de referencia de las encomiendas por cobrar. Va debajo del texto
// "Por cobrar", no en las columnas de importes reales: asi se lee como ayuda
// visual sin alterar el cuadre.
const REFERENCIA_SIZE = 6.8;
const DETAIL_AMOUNT_SIZE = 8.2;
const ROW_TEXT_OFFSET = 6.5;

// Cajita de encomienda, misma ruta que usa el ticket. Solo se dibuja en filas que
// son encomiendas: los ingresos manuales y las salidas de dinero no llevan icono.
const ICONO_SIZE = 6;
const ICONO_GAP = 3;
// pdf-lib dibuja el path con scale(escala, -escala): el eje Y del SVG queda
// invertido, asi que el punto de anclaje NO es el centro visual de la cajita.
// Este path ocupa y de 3.5 a 23.19 dentro de su caja de 24. Con el anclaje en
// yLinea - 1 la cajita caia 6.8 pt mas abajo que las letras, casi una linea del
// reporte. El desfase de abajo la deja centrada con las mayusculas del texto.
const ICONO_PATH_Y_MIN = 3.5;
const ICONO_PATH_Y_MAX = 23.19;
const ICONO_OFFSET_Y = (ICONO_SIZE / 24) * ((ICONO_PATH_Y_MIN + ICONO_PATH_Y_MAX) / 2)
  + (0.717 * REFERENCIA_SIZE) / 2;
const ICONO_ENCOMIENDA = "M20 8.69V18c0 .72-.38 1.38-1 1.73l-6 3.46c-.62.36-1.38.36-2 0l-6-3.46A2 2 0 0 1 4 18V8.69c0-.72.38-1.38 1-1.73l6-3.46c.62-.36 1.38-.36 2 0l6 3.46c.62.35 1 1.01 1 1.73zM12 5.23 6.74 8.26 12 11.29l5.26-3.03L12 5.23zm-6 4.76V18l5 2.88v-7.86L6 9.99zm12 0-5 3.03v7.86L18 18V9.99z";

// Recorta con puntos suspensivos para que el texto entre en el ancho dado.
const truncar = (text, font, size, maxWidth) => {
  const original = cleanText(text);
  if (!original || maxWidth <= 0) return "";
  if (font.widthOfTextAtSize(original, size) <= maxWidth) return original;

  let salida = original;
  while (salida.length > 2 && font.widthOfTextAtSize(`${salida}...`, size) > maxWidth) {
    salida = salida.slice(0, -1);
  }
  return salida.length > 2 ? `${salida}...` : "";
};

const hexToPdfRgb = (hex, fallback) => {
  const normalized = String(hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return fallback;
  return rgb(
    parseInt(normalized.slice(0, 2), 16) / 255,
    parseInt(normalized.slice(2, 4), 16) / 255,
    parseInt(normalized.slice(4, 6), 16) / 255,
  );
};

const getPdfPalette = () => {
  const theme = getThemeValues(getStoredThemeId());
  return {
    ink: rgb(0.1, 0.12, 0.14),
    muted: hexToPdfRgb(theme.muted, rgb(0.38, 0.42, 0.48)),
    accent: hexToPdfRgb(theme.accent, rgb(0.56, 0.85, 1)),
    danger: hexToPdfRgb(theme.danger, rgb(1, 0.54, 0.44)),
    warning: hexToPdfRgb(theme.warning, rgb(0.91, 0.78, 0.36)),
    yape: rgb(0.49, 0.20, 0.68),
    border: hexToPdfRgb(theme.border, rgb(0.23, 0.27, 0.31)),
    line: hexToPdfRgb(theme.borderSoft || theme.border, rgb(0.18, 0.22, 0.25)),
    soft: rgb(0.96, 0.98, 0.99),
  };
};

const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const money = (value) => Number(value || 0).toLocaleString("es-PE", {
  style: "currency",
  currency: "PEN",
});

const fechaTexto = (value) => String(value || "").slice(0, 16).replace("T", " ");

const esBancario = (value) => (
  ["1", "true", "t", "yes"].includes(String(value ?? "").trim().toLowerCase())
);

const wrapText = (text, font, size, maxWidth) => {
  const words = cleanText(text).split(" ").filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
      return;
    }
    if (line) lines.push(line);
    line = word;
  });

  if (line) lines.push(line);
  return lines.length ? lines : [""];
};

const drawRight = (page, text, xRight, y, size, font, color = rgb(0.1, 0.12, 0.14)) => {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: xRight - width, y, size, font, color });
};

const drawHeaderTwoLines = (page, topText, bottomText, xRight, y, font, color) => {
  drawRight(page, topText, xRight, y - 7, 6.7, font, color);
  drawRight(page, bottomText, xRight, y - 15, 6.7, font, color);
};

const drawArrowSeparator = (page, x, y, color) => {
  page.drawLine({ start: { x, y: y + 2.1 }, end: { x: x + 11, y: y + 2.1 }, thickness: 0.65, color });
  page.drawLine({ start: { x: x + 11, y: y + 2.1 }, end: { x: x + 7.6, y: y + 4.5 }, thickness: 0.65, color });
  page.drawLine({ start: { x: x + 11, y: y + 2.1 }, end: { x: x + 7.6, y: y - 0.3 }, thickness: 0.65, color });
};

const splitAgencyLabel = (value) => {
  const words = cleanText(value).split(" ").filter(Boolean);
  if (words.length <= 2) return words;
  if (words.length === 3) return [words[0], words.slice(1).join(" ")];
  return [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
};

const moneyOrBlank = (value) => Number(value || 0) ? money(value) : "";
const moneyOutOrBlank = (value) => Number(value || 0) ? money(-Math.abs(Number(value || 0))) : "";
const moneyOut = (value) => money(-Math.abs(Number(value || 0)));

const getSummaryMetrics = (count = 3) => {
  const totalGap = LAYOUT.summaryGap * (count - 1);
  const width = (CONTENT_WIDTH - totalGap) / count;

  return {
    width,
    height: LAYOUT.summaryHeight,
    // Avance total del bloque superior: alto dibujado + aire inferior.
    advance: LAYOUT.summaryHeight + LAYOUT.summaryBottomGap,
  };
};

const getTableHeaderMetrics = () => ({
  width: CONTENT_WIDTH,
  height: LAYOUT.tableHeaderHeight,
  // Avance total de la cabecera: alto dibujado + aire inferior para filas.
  advance: LAYOUT.tableHeaderHeight + LAYOUT.tableHeaderBottomGap,
});

const drawSummaryBox = (page, { label, value, x, y, width, color }, fonts, pdfColors) => {
  // y recibido = linea superior del bloque; la caja se dibuja hacia abajo.
  // Si subes summaryHeight, este contenido conserva el mismo margen superior.
  // Fondo plano: evita uniones de elipses/rectangulos que se ven discontinuas al hacer zoom.
  page.drawRectangle({ x, y: y - LAYOUT.summaryHeight, width, height: LAYOUT.summaryHeight, color: pdfColors.soft });
  page.drawRectangle({ x, y: y - LAYOUT.summaryHeight, width: LAYOUT.summaryAccentWidth, height: LAYOUT.summaryHeight, color });
  page.drawText(label, { x: x + 10, y: y - 15, size: 7.4, font: fonts.bold, color: pdfColors.muted });
  drawRight(page, money(value), x + width - 10, y - 34, 13, fonts.bold, color);
};

const esTextoPorCobrar = (value) => (
  String(value || "").trim().toLowerCase() === "por cobrar"
);

const esIngresoPorCobrar = (item) => esTextoPorCobrar(item?.ingresoTexto);

const esIngresoAnulado = (item) => (
  String(item?.ingresoTexto || "").trim().toLowerCase() === "anulado"
);

const tipoIngresoTexto = (row) => {
  if (row.tipo_ingreso === "ORIGEN") return "Ingreso origen";
  if (row.tipo_ingreso === "ORIGEN_POR_COBRAR_REFERENCIA") return "Por cobrar";
  if (row.tipo_ingreso === "DESTINO_POR_COBRAR_PENDIENTE") return "Por cobrar destino";
  return "Cobrado en destino";
};

const columnaIngreso = (row) => {
  if (
    row.tipo_ingreso === "DESTINO_POR_COBRAR" ||
    row.tipo_ingreso === "DESTINO_POR_COBRAR_PENDIENTE"
  ) {
    return "ingresoDestino";
  }
  return "ingresoOrigen";
};

const ingresoReferenciaTexto = (row, contabiliza) => {
  if (contabiliza) return "";
  if (Number(row.registrado ?? 1) === 0) return "Anulado";
  if (
    row.tipo_ingreso === "ORIGEN_POR_COBRAR_REFERENCIA" ||
    row.tipo_ingreso === "DESTINO_POR_COBRAR_PENDIENTE"
  ) {
    return "Por cobrar";
  }
  return "";
};

const normalizarIngreso = (row) => {
  const contabiliza = row.contabiliza !== false && Number(row.registrado ?? 1) === 1;
  const numeroEncomienda = `${row.r_serie || ""}-${row.r_numero || ""}`.replace(/^-|-$/g, "");
  const destino = row.punto_venta_dest_nombre || row.id_punto_venta_dest;
  const origen = row.punto_venta_origen_nombre || row.id_punto_venta_origen;
  const remitente = cleanText(row.cliente);
  const destinatario = cleanText(row.destinatario);
  const ingresoTexto = ingresoReferenciaTexto(row, contabiliza);
  const esPorCobrar = esTextoPorCobrar(ingresoTexto);
  const ingresoColumna = columnaIngreso(row);
  // En pagos de agencia y POR_COBRAR, la agencia se informa apilada sobre el
  // monto en su columna; junto al comprobante dejamos solo el numero.
  const primeraLinea = esPorCobrar || contabiliza
    ? [numeroEncomienda, esPorCobrar ? "Por cobrar" : ""].filter(Boolean).join(" ")
    : [numeroEncomienda, destino].filter(Boolean).join(" ");
  const segundaLinea = [remitente, destinatario].filter(Boolean).join(" | ");

  return {
    fecha: row.fecha_caja,
    tipo: tipoIngresoTexto(row),
    // Detalle de ingresos:
    // linea 1 = numero de encomienda + destino.
    // linea 2 = remitente + destinatario. Se separa aqui para que no dependa del wrap automatico.
    detalleLineas: [primeraLinea, segundaLinea].filter(Boolean),
    detalle: primeraLinea,
    ingreso: contabiliza ? Number(row.r_monto_total || 0) : 0,
    salida: 0,
    ingresoOrigen: contabiliza && ingresoColumna === "ingresoOrigen" ? Number(row.r_monto_total || 0) : 0,
    ingresoDestino: contabiliza && ingresoColumna === "ingresoDestino" ? Number(row.r_monto_total || 0) : 0,
    ingresoOtros: 0,
    salidaDirecta: 0,
    salidaChofer: 0,
    ingresoTextoColumna: ingresoColumna,
    informativo: !contabiliza,
    ingresoTexto,
    // Monto de la encomienda por cobrar, solo como referencia visual bajo la
    // agencia destino. A proposito NO se guarda en 'ingreso': ese campo es el
    // unico que alimenta totalIngresos y el saldo de la fila, y aqui debe quedar
    // en cero para que el cuadre no cambie.
    montoReferencia: esTextoPorCobrar(ingresoTexto) ? Number(row.r_monto_total || 0) : 0,
    destinoReferencia: esPorCobrar ? cleanText(destino) : "",
    destinoIngresoOrigenReferencia: contabiliza && ingresoColumna === "ingresoOrigen" ? cleanText(destino) : "",
    origenReferencia: contabiliza && ingresoColumna === "ingresoDestino" ? cleanText(origen) : "",
    // Las filas de este bloque SI son encomiendas (traen serie, numero y
    // descripcion del envio). Los ingresos manuales y las salidas no pasan por
    // aqui, asi que no llevan icono de cajita.
    esEncomienda: true,
    descripcionEncomienda: cleanText(row.descripcion),
  };
};

const normalizarPagoChofer = (row) => {
  const contabiliza = row.contabiliza !== false && Number(row.registrado ?? 1) === 1;
  const precioChofer = Number(row.precio_chofer || 0);
  if (precioChofer <= 0 || !contabiliza) return null;

  const numeroEncomienda = `${row.r_serie || ""}-${row.r_numero || ""}`.replace(/^-|-$/g, "");
  const destino = row.punto_venta_dest_nombre || row.id_punto_venta_dest;
  const detalle = [
    "Pago chofer",
    [numeroEncomienda, destino].filter(Boolean).join(" "),
    row.descripcion,
  ].filter(Boolean).join(" | ");

  return {
    fecha: row.fecha_caja,
    tipo: "Pago chofer",
    detalle,
    ingreso: 0,
    salida: precioChofer,
    ingresoOrigen: 0,
    ingresoDestino: 0,
    ingresoOtros: 0,
    salidaDirecta: 0,
    salidaChofer: precioChofer,
    informativo: false,
  };
};

const normalizarSalida = (row) => {
  const contabiliza = Number(row.registrado ?? 1) === 1;
  return {
    fecha: fechaTexto(row.fecha),
    tipo: "Salida de dinero",
    detalle: [
      row.motivo_nombre || row.id_motivo,
      esBancario(row.bancario) ? "Bancario" : "",
      contabiliza ? "" : "Obs: Anulado - no contabiliza",
      row.descripcion,
      row.beneficiario ? `Benef: ${row.beneficiario}` : "",
      row.forma_pago_nombre || row.id_forma_pago,
      row.nro_operacion ? `Op: ${row.nro_operacion}` : "",
    ].filter(Boolean).join(" | "),
    ingreso: 0,
    salida: contabiliza ? Number(row.importe || 0) : 0,
    ingresoOrigen: 0,
    ingresoDestino: 0,
    ingresoOtros: 0,
    salidaDirecta: contabiliza ? Number(row.importe || 0) : 0,
    salidaChofer: 0,
    bancario: esBancario(row.bancario),
    informativo: !contabiliza,
  };
};

const normalizarIngresoManual = (row) => {
  const contabiliza = Number(row.registrado ?? 1) === 1;
  return {
    fecha: fechaTexto(row.fecha),
    tipo: "Ingreso manual",
    detalle: [
      row.motivo_nombre || row.id_motivo,
      contabiliza ? "" : "Obs: Anulado - no contabiliza",
      row.descripcion,
      row.nro_operacion ? `Op: ${row.nro_operacion}` : "",
    ].filter(Boolean).join(" | "),
    ingreso: contabiliza ? Number(row.importe || 0) : 0,
    salida: 0,
    ingresoOrigen: 0,
    ingresoDestino: 0,
    ingresoOtros: contabiliza ? Number(row.importe || 0) : 0,
    salidaDirecta: 0,
    salidaChofer: 0,
    informativo: !contabiliza,
  };
};

export default async function crearCierreCajaMovimientoPdf({
  ingresos = [],
  ingresosManuales = [],
  salidas = [],
  filtros = {},
  generadoPor = "",
  usuario = "",
  muestraFiltroUsuario = false,
}) {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular, bold };
  const pdfColors = getPdfPalette();
  const { ink: INK, muted: MUTED, accent: ACCENT, danger: DANGER, warning: WARNING, yape: YAPE, line: LINE, soft: SOFT } = pdfColors;

  const movimientos = [
    ...ingresos.map(normalizarIngreso),
    ...ingresos.map(normalizarPagoChofer).filter(Boolean),
    ...ingresosManuales.map(normalizarIngresoManual),
    ...salidas.map(normalizarSalida),
  ].sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));

  const totalIngresos = movimientos.reduce((sum, item) => sum + item.ingreso, 0);
  const totalSalidas = movimientos.reduce((sum, item) => sum + item.salida, 0);
  const totalSalidasBancarias = salidas.reduce((sum, row) => {
    const salida = normalizarSalida(row);
    return salida.salida > 0 && esBancario(row.bancario) ? sum + salida.salida : sum;
  }, 0);
  const totalSalidasNoBancarias = Math.max(0, totalSalidas - totalSalidasBancarias);
  const saldoFinal = totalIngresos - totalSalidas;
  const subtotales = movimientos.reduce((acc, item) => ({
    ingresoOrigen: acc.ingresoOrigen + Number(item.ingresoOrigen || 0),
    ingresoDestino: acc.ingresoDestino + Number(item.ingresoDestino || 0),
    ingresoOtros: acc.ingresoOtros + Number(item.ingresoOtros || 0),
    salidaDirecta: acc.salidaDirecta + Number(item.salidaDirecta || 0),
    salidaChofer: acc.salidaChofer + Number(item.salidaChofer || 0),
    porCobrarOrigen: acc.porCobrarOrigen + (
      item.ingresoTextoColumna === "ingresoOrigen"
        ? Number(item.montoReferencia || 0)
        : 0
    ),
  }), {
    ingresoOrigen: 0,
    ingresoDestino: 0,
    ingresoOtros: 0,
    salidaDirecta: 0,
    salidaChofer: 0,
    porCobrarOrigen: 0,
  });

  // Encabezado del filtro Usuario. Si no hay filtro disponible (el usuario solo
  // ve su propia caja) se cae al correo de sesion, como antes.
  const usuarioFiltro = cleanText(usuario);
  const usuarioTexto = usuarioFiltro
    || (muestraFiltroUsuario ? "Todos los usuarios (toda la agencia)" : "");
  const lineaUsuario = `Usuario: ${usuarioTexto || cleanText(generadoPor) || "-"}`;
  const lineaGenerador = usuarioTexto ? `Generado por: ${cleanText(generadoPor) || "-"}` : "";
  let page;
  let y;
  let pagina = 0;

  const addPage = () => {
    page = pdfDoc.addPage(A4);
    pagina += 1;
    y = PAGE_HEIGHT - MARGIN;

    page.drawText("CIERRE DE CAJA - ENCOMIENDAS", { x: MARGIN, y, size: 14, font: bold, color: INK });
    drawRight(page, `Pagina ${pagina}`, PAGE_WIDTH - MARGIN, y, 8, regular, MUTED);
    y -= 18;

    page.drawText(`Periodo: ${cleanText(filtros.periodo) || "-"}`, { x: MARGIN, y, size: 8.2, font: regular, color: MUTED });
    page.drawText(`Fecha: ${cleanText(filtros.fecha) || "Todos"}`, { x: MARGIN + 110, y, size: 8.2, font: regular, color: MUTED });
    page.drawText(`Agencia: ${cleanText(filtros.agencia) || "Todas"}`, { x: MARGIN + 220, y, size: 8.2, font: regular, color: MUTED });
    y -= 13;
    page.drawText(lineaUsuario, { x: MARGIN, y, size: 8.2, font: regular, color: MUTED });
    if (lineaGenerador) {
      page.drawText(lineaGenerador, { x: MARGIN + 220, y, size: 8.2, font: regular, color: MUTED });
    }
    y -= 18;

    if (pagina === 1) {
      const summary = getSummaryMetrics(4);
      const summaryItems = [
        { label: "INGRESOS", value: totalIngresos, color: ACCENT },
        { label: "SALIDAS", value: totalSalidasNoBancarias, color: DANGER },
        { label: "SALIDAS YAPE/PLIN/ETC", value: totalSalidasBancarias, color: YAPE },
        { label: "SALDO FINAL", value: saldoFinal, color: saldoFinal >= 0 ? ACCENT : DANGER },
      ];

      summaryItems.forEach((item, index) => {
        // Cada chip usa el ancho automatico de getSummaryMetrics().
        // Para cambiar separacion horizontal, modifica summaryGap en LAYOUT.
        const x = MARGIN + ((summary.width + LAYOUT.summaryGap) * index);
        drawSummaryBox(page, { ...item, x, y, width: summary.width }, fonts, pdfColors);
      });
      y -= summary.advance;
    }

    const tableHeader = getTableHeaderMetrics();
    // Cabecera simple: solo una franja de fondo, sin borde ni redondeo.
    // Si quieres mas/menos alto, cambia tableHeaderHeight en LAYOUT.
    page.drawRectangle({ x: MARGIN, y: y - tableHeader.height + 2, width: tableHeader.width, height: tableHeader.height, color: SOFT });
    page.drawText("Fecha hora", { x: COLUMNS.fechaX, y: y - 11, size: 7.2, font: bold, color: MUTED });
    page.drawText("Detalle", { x: COLUMNS.detailX, y: y - 11, size: 7.2, font: bold, color: MUTED });
    drawRight(page, "Destino", COLUMNS.detailX + DETAIL_WIDTH - 8, y - 11, 7.2, bold, MUTED);
    drawHeaderTwoLines(page, "Ingresos", "Agencia", COLUMNS.ingresoOrigenRight, y, bold, MUTED);
    drawHeaderTwoLines(page, "Ingresos Otras", "Agencias", COLUMNS.ingresoDestinoRight, y, bold, MUTED);
    drawHeaderTwoLines(page, "Ingresos", "Libres", COLUMNS.ingresoOtrosRight, y, bold, MUTED);
    drawRight(page, "SA directa", COLUMNS.salidaDirectaRight, y - 11, 7.2, bold, MUTED);
    drawRight(page, "SA chofer", COLUMNS.salidaChoferRight, y - 11, 7.2, bold, MUTED);
    y -= tableHeader.advance;
  };

  addPage();

  movimientos.forEach((item) => {
    const detailLines = item.detalleLineas?.length
      ? item.detalleLineas.flatMap((line) => wrapText(line, regular, 7.1, DETAIL_WIDTH)).slice(0, 2)
      : wrapText(item.detalle || "-", regular, 7.1, DETAIL_WIDTH).slice(0, 2);
    const origenIngresoDestinoLines = item.origenReferencia && Number(item.ingresoDestino || 0) > 0
      ? splitAgencyLabel(item.origenReferencia).slice(0, 2)
      : [];
    // Alto automatico de fila:
    // rowBaseHeight + (cantidad de lineas * rowLineHeight), respetando rowMinHeight.
    // Si aumentas rowLineHeight, el detalle respirara mas y el salto de pagina se ajusta solo.
    // La descripcion de la encomienda ocupa una 3ra linea propia, solo en las
    // filas que la tienen: el resto no crece y el reporte sigue compacto.
    const tieneLineaEncomienda = Boolean(item.esEncomienda && item.descripcionEncomienda);
    const lineasFila = Math.max(
      detailLines.length + (tieneLineaEncomienda ? 1 : 0),
      origenIngresoDestinoLines.length + (origenIngresoDestinoLines.length ? 1 : 0),
    );
    const rowHeight = Math.max(
      LAYOUT.rowMinHeight,
      LAYOUT.rowBaseHeight + (lineasFila * LAYOUT.rowLineHeight),
    );

    if (y - rowHeight < LAYOUT.bottomReserved) addPage();

    const ingresoPorCobrar = esIngresoPorCobrar(item);
    const ingresoAnulado = esIngresoAnulado(item);
    const ingresoTexto = item.ingresoTexto || "";
    const salidaFont = item.bancario && item.salida ? bold : regular;
    // Fila por cobrar: se pinta TODO el renglon del mismo rojo, no solo el monto.
    // Es el mismo rojo que ya usaba la columna Ingreso, para que el reporte no
    // tenga dos rojos distintos. Solo cambia el color: se conserva la fuente de
    // cada celda, asi que no se altera el ancho ni el corte de las lineas.
    const colorFila = ingresoPorCobrar ? DANGER : null;
    const colorTexto = colorFila || INK;
    const colorApunte = colorFila || MUTED;
    const salidaColor = colorFila || (item.bancario && item.salida ? YAPE : item.salida ? INK : MUTED);

    // La linea divisoria se queda en su color normal: el rojo es solo para el
    // texto de la fila, las guias del reporte se mantienen discretas.
    page.drawLine({ start: { x: MARGIN, y: y + 5 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 5 }, thickness: 0.4, color: LINE });
    page.drawText(fechaTexto(item.fecha), { x: COLUMNS.fechaX, y: y - ROW_TEXT_OFFSET, size: 7.1, font: regular, color: colorTexto });
    detailLines.forEach((line, index) => {
      const lineY = y - ROW_TEXT_OFFSET - (index * LAYOUT.rowLineHeight);
      const safeLine = index === 1 ? truncar(line, regular, 7.1, DETAIL_WIDTH - 14) : line;
      if (ingresoPorCobrar && index === 0 && line.includes("Por cobrar")) {
        const comprobanteTexto = line.replace(/\s*Por cobrar\s*$/, "");
        page.drawText(comprobanteTexto, { x: COLUMNS.detailX, y: lineY, size: 7.1, font: regular, color: colorTexto });
        const labelX = COLUMNS.detailX + regular.widthOfTextAtSize(`${comprobanteTexto} `, 7.1);
        page.drawText("Por cobrar", { x: labelX, y: lineY, size: 7.1, font: bold, color: colorTexto });
        return;
      }
      if (index === 1 && line.includes(" | ")) {
        const [remitenteTexto, destinatarioTexto] = line.split(" | ");
        const arrowWidth = 16;
        const gap = 4;
        const availableTextWidth = DETAIL_WIDTH - 14 - arrowWidth - (gap * 2);
        const senderWidth = Math.max(42, Math.min(availableTextWidth * 0.45, regular.widthOfTextAtSize(remitenteTexto, 7.1)));
        const receiverWidth = Math.max(42, availableTextWidth - senderWidth);
        const senderSafe = truncar(remitenteTexto, regular, 7.1, senderWidth);
        const senderDrawnWidth = regular.widthOfTextAtSize(senderSafe, 7.1);
        const arrowX = COLUMNS.detailX + senderDrawnWidth + gap;
        const receiverSafe = truncar(destinatarioTexto, regular, 7.1, receiverWidth);
        page.drawText(senderSafe, { x: COLUMNS.detailX, y: lineY, size: 7.1, font: regular, color: colorTexto });
        drawArrowSeparator(page, arrowX, lineY, colorApunte);
        page.drawText(receiverSafe, { x: arrowX + arrowWidth + gap, y: lineY, size: 7.1, font: regular, color: colorTexto });
        return;
      }
      page.drawText(safeLine, { x: COLUMNS.detailX, y: lineY, size: 7.1, font: regular, color: colorTexto });
    });

    if (item.destinoIngresoOrigenReferencia && Number(item.ingresoOrigen || 0) > 0) {
      const destinoTexto = truncar(
        item.destinoIngresoOrigenReferencia,
        regular,
        REFERENCIA_SIZE,
        DETAIL_WIDTH - 52,
      );
      drawRight(
        page,
        destinoTexto,
        COLUMNS.detailX + DETAIL_WIDTH - 8,
        y - ROW_TEXT_OFFSET,
        REFERENCIA_SIZE,
        regular,
        colorApunte,
      );
    }

    if (item.destinoReferencia && Number(item.montoReferencia || 0) > 0) {
      const destinoTexto = truncar(
        item.destinoReferencia,
        regular,
        REFERENCIA_SIZE,
        DETAIL_WIDTH - 52,
      );
      drawRight(
        page,
        destinoTexto,
        COLUMNS.detailX + DETAIL_WIDTH - 8,
        y - ROW_TEXT_OFFSET,
        REFERENCIA_SIZE,
        regular,
        colorApunte,
      );
    }

    // Monto de referencia del por cobrar. Se dibuja en su columna, sin sumarse
    // al cuadre; la agencia destino vive como referencia en el detalle.
    const esReferencia = Number(item.montoReferencia || 0) > 0;

    // Cajita + descripcion de la encomienda, en una 3ra linea propia debajo del
    // detalle. Solo en encomiendas: las salidas y los ingresos manuales no llevan.
    if (tieneLineaEncomienda) {
      const yDescripcion = y - ROW_TEXT_OFFSET - (detailLines.length * LAYOUT.rowLineHeight);
      page.drawSvgPath(ICONO_ENCOMIENDA, {
        x: COLUMNS.detailX,
        y: yDescripcion + ICONO_OFFSET_Y,
        scale: ICONO_SIZE / 24,
        color: colorApunte,
      });
      const descripcion = truncar(
        item.descripcionEncomienda,
        regular,
        REFERENCIA_SIZE,
        DETAIL_WIDTH - ICONO_SIZE - ICONO_GAP,
      );
      if (descripcion) {
        page.drawText(descripcion, {
          x: COLUMNS.detailX + ICONO_SIZE + ICONO_GAP,
          y: yDescripcion,
          size: REFERENCIA_SIZE,
          font: regular,
          color: colorApunte,
        });
      }
    }
    const ingresoEstadoColor = ingresoPorCobrar ? DANGER : ingresoAnulado ? WARNING : MUTED;
    const ingresoEstadoFont = ingresoPorCobrar || ingresoAnulado ? bold : regular;
    const ingresoOrigenTexto = ingresoTexto && item.ingresoTextoColumna === "ingresoOrigen" && !esReferencia
      ? ingresoTexto
      : moneyOrBlank(item.ingresoOrigen);
    const ingresoDestinoTexto = ingresoTexto && item.ingresoTextoColumna === "ingresoDestino" && !esReferencia
      ? ingresoTexto
      : moneyOrBlank(item.ingresoDestino);
    drawRight(page, ingresoOrigenTexto, COLUMNS.ingresoOrigenRight, y - ROW_TEXT_OFFSET, DETAIL_AMOUNT_SIZE, ingresoOrigenTexto === ingresoTexto ? ingresoEstadoFont : bold, colorFila || (ingresoOrigenTexto === ingresoTexto ? ingresoEstadoColor : item.ingresoOrigen ? INK : MUTED));
    if (origenIngresoDestinoLines.length) {
      origenIngresoDestinoLines.forEach((line, index) => {
        drawRight(
          page,
          truncar(line, regular, 6.5, 62),
          COLUMNS.ingresoDestinoRight,
          y - ROW_TEXT_OFFSET - (index * 6.8),
          6.5,
          regular,
          colorFila || MUTED,
        );
      });
      drawRight(
        page,
        money(item.ingresoDestino),
        COLUMNS.ingresoDestinoRight,
        y - ROW_TEXT_OFFSET - (origenIngresoDestinoLines.length * 6.8),
        DETAIL_AMOUNT_SIZE,
        bold,
        colorFila || INK,
      );
    } else {
      drawRight(page, ingresoDestinoTexto, COLUMNS.ingresoDestinoRight, y - ROW_TEXT_OFFSET, DETAIL_AMOUNT_SIZE, ingresoDestinoTexto === ingresoTexto ? ingresoEstadoFont : bold, colorFila || (ingresoDestinoTexto === ingresoTexto ? ingresoEstadoColor : item.ingresoDestino ? INK : MUTED));
    }
    if (esReferencia) {
      const referenciaRight = item.ingresoTextoColumna === "ingresoDestino"
        ? COLUMNS.ingresoDestinoRight
        : COLUMNS.ingresoOrigenRight;
      drawRight(
        page,
        money(item.montoReferencia),
        referenciaRight,
        y - ROW_TEXT_OFFSET,
        DETAIL_AMOUNT_SIZE,
        bold,
        colorApunte,
      );
    }
    drawRight(page, moneyOrBlank(item.ingresoOtros), COLUMNS.ingresoOtrosRight, y - ROW_TEXT_OFFSET, DETAIL_AMOUNT_SIZE, bold, colorFila || (item.ingresoOtros ? INK : MUTED));
    drawRight(page, moneyOutOrBlank(item.salidaDirecta), COLUMNS.salidaDirectaRight, y - ROW_TEXT_OFFSET, DETAIL_AMOUNT_SIZE, item.salidaDirecta ? bold : salidaFont, colorFila || (item.salidaDirecta ? salidaColor : MUTED));
    drawRight(page, moneyOutOrBlank(item.salidaChofer), COLUMNS.salidaChoferRight, y - ROW_TEXT_OFFSET, DETAIL_AMOUNT_SIZE, bold, colorFila || (item.salidaChofer ? INK : MUTED));
    y -= rowHeight;
  });

  if (y - LAYOUT.subtotalHeight < LAYOUT.bottomReserved) addPage();

  page.drawLine({ start: { x: MARGIN, y: y + 5 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 5 }, thickness: 0.7, color: LINE });
  page.drawRectangle({ x: MARGIN, y: y - LAYOUT.subtotalHeight + 2, width: CONTENT_WIDTH, height: LAYOUT.subtotalHeight, color: SOFT });
  page.drawText("Subtotales referenciales", { x: COLUMNS.detailX, y: y - 17, size: 8.4, font: bold, color: MUTED });
  drawRight(page, "Por cobrar", COLUMNS.detailX + DETAIL_WIDTH - 8, y - 8, 8, bold, DANGER);
  drawRight(page, money(subtotales.porCobrarOrigen), COLUMNS.ingresoOrigenRight, y - 8, 8.4, bold, DANGER);
  drawRight(page, money(subtotales.ingresoOrigen), COLUMNS.ingresoOrigenRight, y - 26, 8.4, bold, INK);
  drawRight(page, money(subtotales.ingresoDestino), COLUMNS.ingresoDestinoRight, y - 26, 8.4, bold, INK);
  drawRight(page, money(subtotales.ingresoOtros), COLUMNS.ingresoOtrosRight, y - 26, 8.4, bold, INK);
  drawRight(page, moneyOut(subtotales.salidaDirecta), COLUMNS.salidaDirectaRight, y - 26, 8.4, bold, DANGER);
  drawRight(page, moneyOut(subtotales.salidaChofer), COLUMNS.salidaChoferRight, y - 26, 8.4, bold, DANGER);
  y -= LAYOUT.subtotalHeight;

  if (y < LAYOUT.bottomReserved) addPage();

  // Firmas finales:
  // beforeSignatureGap controla cuanto baja desde la ultima fila hasta las lineas.
  // signatureInset y signatureWidth controlan posicion y largo de cada firma.
  y -= LAYOUT.beforeSignatureGap;
  page.drawLine({ start: { x: MARGIN + LAYOUT.signatureInset, y }, end: { x: MARGIN + LAYOUT.signatureInset + LAYOUT.signatureWidth, y }, thickness: 0.7, color: LINE });
  page.drawLine({ start: { x: PAGE_WIDTH - MARGIN - LAYOUT.signatureInset - LAYOUT.signatureWidth, y }, end: { x: PAGE_WIDTH - MARGIN - LAYOUT.signatureInset, y }, thickness: 0.7, color: LINE });
  page.drawText("Encargado de caja", { x: MARGIN + LAYOUT.signatureInset + 39, y: y - 10, size: 7.2, font: regular, color: MUTED });
  page.drawText("Recibido por", { x: A4[0] - MARGIN - LAYOUT.signatureInset - 100, y: y - 10, size: 7.2, font: regular, color: MUTED });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
