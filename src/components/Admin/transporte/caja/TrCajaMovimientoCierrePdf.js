import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getStoredThemeId, getThemeValues } from "../../../../theme/palette";

const A4 = [595.28, 841.89];
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
  summaryBottomGap: 18,     // Aire debajo de los chips antes de la cabecera de tabla.
  tableHeaderHeight: 20,    // Alto del chip/cabecera de tabla.
  tableHeaderBottomGap: 7,  // Aire debajo de la cabecera antes de iniciar las filas.
  rowMinHeight: 22,         // Alto minimo de una fila del detalle.
  rowBaseHeight: 12,        // Alto base de fila antes de sumar lineas de detalle.
  rowLineHeight: 8,         // Alto que suma cada linea de detalle envuelta.
  bottomReserved: 76,       // Espacio reservado para firmas antes de saltar pagina.
  beforeSignatureGap: 28,   // Separacion entre la ultima fila y las lineas de firma.
  signatureWidth: 180,      // Largo de cada linea de firma.
  signatureInset: 34,       // Separacion lateral de las lineas de firma.
  summaryAccentWidth: 3,    // Barra lateral del total; evita bordes redondeados que se cortan al hacer zoom.
};

// Posiciones horizontales de la tabla.
// Si una columna queda apretada, cambia estos valores y todo se alinea junto:
// - detailX mueve el inicio del detalle.
// - ingresoRight/salidaRight/saldoRight son los bordes derechos de cada monto.
const COLUMNS = {
  fechaX: MARGIN + 6,
  // Sin columna de iconos: el detalle arranca donde estaba el icono.
  detailX: MARGIN + 72,
  // Montos: bordes derechos separados para que no se sientan apretados.
  ingresoRight: PAGE_WIDTH - MARGIN - 146,
  salidaRight: PAGE_WIDTH - MARGIN - 72,
  saldoRight: PAGE_WIDTH - MARGIN,
};

const DETAIL_WIDTH = COLUMNS.ingresoRight - COLUMNS.detailX - 14;

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

const esIngresoPorCobrar = (item) => (
  String(item?.ingresoTexto || "").trim().toLowerCase() === "por cobrar"
);

const esIngresoAnulado = (item) => (
  String(item?.ingresoTexto || "").trim().toLowerCase() === "anulado"
);

const tipoIngresoTexto = (row) => {
  if (row.tipo_ingreso === "ORIGEN") return "Ingreso origen";
  if (row.tipo_ingreso === "ORIGEN_POR_COBRAR_REFERENCIA") return "Por cobrar";
  if (row.tipo_ingreso === "DESTINO_POR_COBRAR_PENDIENTE") return "Por cobrar destino";
  return "Cobrado en destino";
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
  const remitente = row.cliente ? `Rem.: ${row.cliente}` : "";
  const destinatario = row.destinatario ? `Dest.: ${row.destinatario}` : "";
  const primeraLinea = [
    numeroEncomienda,
    destino ? `Dst.: ${destino}` : "",
  ].filter(Boolean).join(" | ");
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
    informativo: !contabiliza,
    ingresoTexto: ingresoReferenciaTexto(row, contabiliza),
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
    numeroEncomienda,
    destino ? `Dst.: ${destino}` : "",
    row.descripcion,
  ].filter(Boolean).join(" | ");

  return {
    fecha: row.fecha_caja,
    tipo: "Pago chofer",
    detalle,
    ingreso: 0,
    salida: precioChofer,
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

  // Encabezado del filtro Usuario. Si no hay filtro disponible (el usuario solo
  // ve su propia caja) se cae al correo de sesion, como antes.
  const usuarioFiltro = cleanText(usuario);
  const usuarioTexto = usuarioFiltro
    || (muestraFiltroUsuario ? "Todos los usuarios (toda la agencia)" : "");
  const lineaUsuario = `Usuario: ${usuarioTexto || cleanText(generadoPor) || "-"}`;
  const lineaGenerador = usuarioTexto ? `Generado por: ${cleanText(generadoPor) || "-"}` : "";
  let saldo = 0;
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
    drawRight(page, "Ingreso", COLUMNS.ingresoRight, y - 11, 7.2, bold, MUTED);
    drawRight(page, "Salida", COLUMNS.salidaRight, y - 11, 7.2, bold, MUTED);
    drawRight(page, "Saldo", COLUMNS.saldoRight, y - 11, 7.2, bold, MUTED);
    y -= tableHeader.advance;
  };

  addPage();

  movimientos.forEach((item) => {
    const detailLines = item.detalleLineas?.length
      ? item.detalleLineas.flatMap((line) => wrapText(line, regular, 7.1, DETAIL_WIDTH)).slice(0, 2)
      : wrapText(item.detalle || "-", regular, 7.1, DETAIL_WIDTH).slice(0, 2);
    // Alto automatico de fila:
    // rowBaseHeight + (cantidad de lineas * rowLineHeight), respetando rowMinHeight.
    // Si aumentas rowLineHeight, el detalle respirara mas y el salto de pagina se ajusta solo.
    const rowHeight = Math.max(
      LAYOUT.rowMinHeight,
      LAYOUT.rowBaseHeight + (detailLines.length * LAYOUT.rowLineHeight),
    );

    if (y - rowHeight < LAYOUT.bottomReserved) addPage();

    saldo += item.ingreso - item.salida;
    const ingresoPorCobrar = esIngresoPorCobrar(item);
    const ingresoAnulado = esIngresoAnulado(item);
    const ingresoTexto = item.ingresoTexto || (item.ingreso ? money(item.ingreso) : "-");
    const salidaFont = item.bancario && item.salida ? bold : regular;
    const salidaColor = item.bancario && item.salida ? YAPE : item.salida ? INK : MUTED;

    page.drawLine({ start: { x: MARGIN, y: y + 5 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 5 }, thickness: 0.4, color: LINE });
    page.drawText(fechaTexto(item.fecha), { x: COLUMNS.fechaX, y: y - 8, size: 7.1, font: regular, color: INK });
    detailLines.forEach((line, index) => {
      page.drawText(line, { x: COLUMNS.detailX, y: y - 8 - (index * LAYOUT.rowLineHeight), size: 7.1, font: regular, color: INK });
    });
    drawRight(page, ingresoTexto, COLUMNS.ingresoRight, y - 8, 7.1, ingresoPorCobrar || ingresoAnulado ? bold : regular, ingresoPorCobrar ? DANGER : ingresoAnulado ? WARNING : item.ingreso ? INK : MUTED);
    drawRight(page, item.salida ? money(item.salida) : "-", COLUMNS.salidaRight, y - 8, 7.1, salidaFont, salidaColor);
    drawRight(page, money(saldo), COLUMNS.saldoRight, y - 8, 7.1, bold, saldo >= 0 ? INK : DANGER);
    y -= rowHeight;
  });

  if (y < LAYOUT.bottomReserved) addPage();

  // Firmas finales:
  // beforeSignatureGap controla cuanto baja desde la ultima fila hasta las lineas.
  // signatureInset y signatureWidth controlan posicion y largo de cada firma.
  y -= LAYOUT.beforeSignatureGap;
  page.drawLine({ start: { x: MARGIN + LAYOUT.signatureInset, y }, end: { x: MARGIN + LAYOUT.signatureInset + LAYOUT.signatureWidth, y }, thickness: 0.7, color: LINE });
  page.drawLine({ start: { x: PAGE_WIDTH - MARGIN - LAYOUT.signatureInset - LAYOUT.signatureWidth, y }, end: { x: PAGE_WIDTH - MARGIN - LAYOUT.signatureInset, y }, thickness: 0.7, color: LINE });
  page.drawText("Encargado de caja", { x: MARGIN + 76, y: y - 14, size: 8, font: regular, color: MUTED });
  page.drawText("Recibido por", { x: A4[0] - MARGIN - 150, y: y - 14, size: 8, font: regular, color: MUTED });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
