import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import barlowRegularUrl from "../../../../assets/fonts/cpe/BarlowCondensed-Regular.ttf";
import barlowSemiBoldUrl from "../../../../assets/fonts/cpe/BarlowCondensed-SemiBold.ttf";
import barlowBoldUrl from "../../../../assets/fonts/cpe/BarlowCondensed-Bold.ttf";

const logoBusContext = require.context("../../../../assets/images", false, /-logo-bus\.(png|jpe?g)$/i);

const PT_PER_MM = 72 / 25.4;
const HEIGHT = 430;

const INK = rgb(0.03, 0.035, 0.045);
const MUTED = rgb(0.34, 0.35, 0.37);
const LINE = rgb(0.74, 0.74, 0.74);
const ACCENT = rgb(0.18, 0.24, 0.31);
const ACCENT_SOFT = rgb(0.95, 0.965, 0.975);

const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

const money = (value) => Number(value || 0).toLocaleString("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const datePe = (value) => {
  const text = String(value || "").slice(0, 10);
  return text ? text.split("-").reverse().join("/") : "-";
};

const timePe = (value) => {
  const text = clean(value);
  if (!text) return "-";
  const time = text.includes("T") ? text.split("T")[1] : text.split(" ")[1] || text;
  const [hour = "0", minute = "00"] = time.split(".")[0].split(":");
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const timePeAmPm = (value) => {
  const text = timePe(value);
  if (text === "-") return "-";
  const [hourText = "0", minute = "00"] = text.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${minute} ${suffix}`;
};

const fit = (value, font, size, maxWidth) => {
  const text = clean(value);
  if (!text) return "";
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let output = text;
  while (output.length > 3 && font.widthOfTextAtSize(`${output}...`, size) > maxWidth) {
    output = output.slice(0, -1);
  }
  return output.length > 3 ? `${output}...` : "";
};

const wrap = (value, font, size, maxWidth, maxLines = 2) => {
  const words = clean(value).split(" ").filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (!lines.length) return [""];
  lines[lines.length - 1] = fit(lines[lines.length - 1], font, size, maxWidth);
  return lines;
};

const base64ToBytes = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const drawText = (page, value, x, y, size, font, color = INK, maxWidth = null) => {
  page.drawText(maxWidth ? fit(value, font, size, maxWidth) : clean(value), { x, y, size, font, color });
};

const rightText = (page, value, rightX, y, size, font, color = INK, maxWidth = null) => {
  const label = maxWidth ? fit(value, font, size, maxWidth) : clean(value);
  page.drawText(label, { x: rightX - font.widthOfTextAtSize(label, size), y, size, font, color });
};

const centered = (page, value, y, size, font, width, color = INK, maxWidth = null) => {
  const text = fit(value, font, size, maxWidth || width - 20);
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
};

const dotted = (page, y, x1, x2) => {
  for (let x = x1; x < x2; x += 5) {
    page.drawCircle({ x, y, size: 0.65, color: LINE });
  }
};

const line = (page, y, x1, x2, thickness = 0.55, color = LINE) => {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
};

const numeroComprobante = (boleto = {}) => (
  [boleto.r_serie, boleto.r_numero].filter(Boolean).join("-") ||
  [boleto.r_cod, boleto.r_serie, boleto.r_numero].filter(Boolean).join("-") ||
  "MODELO"
);

const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
const especiales = {
  10: "DIEZ",
  11: "ONCE",
  12: "DOCE",
  13: "TRECE",
  14: "CATORCE",
  15: "QUINCE",
  20: "VEINTE",
};
const decenas = ["", "", "VEINTI", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

const numeroMenorMilEnLetras = (value) => {
  const number = Number(value || 0);
  if (number === 0) return "";
  if (number === 100) return "CIEN";

  const hundred = Math.floor(number / 100);
  const rest = number % 100;
  const parts = [];

  if (hundred) parts.push(centenas[hundred]);
  if (rest) {
    if (especiales[rest]) {
      parts.push(especiales[rest]);
    } else if (rest < 10) {
      parts.push(unidades[rest]);
    } else if (rest < 20) {
      parts.push(`DIECI${unidades[rest - 10].toLowerCase()}`.toUpperCase());
    } else if (rest < 30) {
      parts.push(`VEINTI${unidades[rest - 20].toLowerCase()}`.toUpperCase());
    } else {
      const ten = Math.floor(rest / 10);
      const unit = rest % 10;
      parts.push(unit ? `${decenas[ten]} Y ${unidades[unit]}` : decenas[ten]);
    }
  }

  return parts.join(" ");
};

const numeroEnLetras = (value) => {
  const number = Math.floor(Number(value || 0));
  if (!number) return "CERO";

  const millions = Math.floor(number / 1000000);
  const thousands = Math.floor((number % 1000000) / 1000);
  const rest = number % 1000;
  const parts = [];

  if (millions) parts.push(millions === 1 ? "UN MILLON" : `${numeroMenorMilEnLetras(millions)} MILLONES`);
  if (thousands) parts.push(thousands === 1 ? "MIL" : `${numeroMenorMilEnLetras(thousands)} MIL`);
  if (rest) parts.push(numeroMenorMilEnLetras(rest));

  return parts.join(" ");
};

const montoLetras = (value) => {
  const total = Number(value || 0);
  let entero = Math.floor(total);
  let centimos = Math.round((total - entero) * 100);
  if (centimos === 100) {
    entero += 1;
    centimos = 0;
  }
  return `${numeroEnLetras(entero)} CON ${String(centimos).padStart(2, "0")}/100 SOLES`;
};

const nombreOrigen = (boleto = {}) => (
  boleto.partida_agencia_nombre ||
  boleto.agencia_origen_nombre ||
  boleto.punto_venta_nombre ||
  boleto.punto_venta_origen_nombre ||
  boleto.origen_nombre ||
  "ORIGEN"
);

const nombreDestino = (boleto = {}) => (
  boleto.llegada_agencia_nombre ||
  boleto.agencia_destino_nombre ||
  boleto.punto_venta_dest_nombre ||
  boleto.punto_venta_destino_nombre ||
  boleto.destino_nombre ||
  boleto.nombre_ruta ||
  boleto.id_punto_venta_dest ||
  "DESTINO"
);

const resolverAncho = (anchoMm) => {
  if (Number(anchoMm) > 0) return Number(anchoMm);
  return 80;
};

const fetchFontBytes = async (url) => {
  const response = await fetch(url);
  return response.arrayBuffer();
};

const obtenerLogoBusUrl = (documentoId) => {
  const ruc = clean(documentoId).replace(/\D/g, "");
  if (!ruc) return null;

  for (const extension of ["png", "jpg", "jpeg"]) {
    try {
      return logoBusContext(`./${ruc}-logo-bus.${extension}`);
    } catch (error) {
      // El logo es opcional por empresa.
    }
  }

  return null;
};

const embedLogoBus = async (pdfDoc, documentoId) => {
  const logoUrl = obtenerLogoBusUrl(documentoId);
  if (!logoUrl) return null;

  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;

    const logoBytes = await response.arrayBuffer();
    return logoUrl.toLowerCase().endsWith(".png")
      ? pdfDoc.embedPng(logoBytes)
      : pdfDoc.embedJpg(logoBytes);
  } catch (error) {
    return null;
  }
};

const embedTicketFonts = async (pdfDoc) => {
  pdfDoc.registerFontkit(fontkit);

  try {
    const [regularBytes, semiboldBytes, boldBytes] = await Promise.all([
      fetchFontBytes(barlowRegularUrl),
      fetchFontBytes(barlowSemiBoldUrl),
      fetchFontBytes(barlowBoldUrl),
    ]);

    const regular = await pdfDoc.embedFont(regularBytes);
    const semibold = await pdfDoc.embedFont(semiboldBytes);
    const bold = await pdfDoc.embedFont(boldBytes);

    return { regular, semibold, bold };
  } catch (error) {
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const semibold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    return { regular, semibold, bold };
  }
};

export async function crearTicketBoletoPdfUrl({ boleto = {}, empresa = {}, anchoMm = "auto" }) {
  const widthMm = resolverAncho(anchoMm);
  const width = widthMm * PT_PER_MM;
  const margin = widthMm <= 56 ? 8 : 12;
  const rightSafeX = width - margin - 3;
  const taxAmountRightX = rightSafeX - 9;
  const taxAmountSize = widthMm <= 56 ? 9.2 : 10.2;
  const contentWidth = width - (margin * 2);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, HEIGHT]);
  const { regular, semibold } = await embedTicketFonts(pdfDoc);

  const comprobante = numeroComprobante(boleto);
  const clienteDocumento = boleto.cliente_documento || boleto.cliente_documento_id || "";
  const esFactura = boleto.r_cod === "01" || clean(clienteDocumento).replace(/\D/g, "").length === 11;
  const total = Number(boleto.r_monto_total || boleto.precio_neto || 0);
  const fecha = boleto.r_fecemi || boleto.fecha || "";
  const hora = boleto.ctrl_crea || boleto.hora_grabacion || "";
  const pasajero = esFactura ? (boleto.ref_pasajero_nombres || "PASAJERO") : (boleto.cliente || "PASAJERO");
  const dni = esFactura ? (boleto.ref_pasajero_dni || "-") : (clienteDocumento || "-");
  const clienteTributario = boleto.cliente || "-";
  const direccionFacturacion = boleto.cliente_direccion_fact || boleto.cliente_direccion || "";
  const asiento = boleto.asiento || "##";
  const origen = nombreOrigen(boleto).toUpperCase();
  const destino = nombreDestino(boleto).toUpperCase();
  const registradoPor = clean(boleto.registrado_por_correo || boleto.ctrl_crea_us || "");
  const detalleValueSize = widthMm <= 56 ? 10.2 : 11.2;
  const emisorDocumento = empresa.ruc || empresa.documento_id || boleto.documento_id || "";
  const logoImage = await embedLogoBus(pdfDoc, emisorDocumento);
  const qrText = [
    emisorDocumento,
    comprobante,
    clienteDocumento || dni,
    fecha,
    total.toFixed(2),
  ].join("|");
  const qrDataUrl = await QRCode.toDataURL(qrText || comprobante || "XPERTCONT");
  const qrImage = await pdfDoc.embedPng(base64ToBytes(qrDataUrl.split(",")[1]));

  let y = HEIGHT;
  const headerHeight = 52;
  page.drawRectangle({ x: 0, y: y - headerHeight, width, height: headerHeight, color: ACCENT_SOFT });
  wrap(empresa.razon_social || empresa.nombre_comercial || empresa.nombre || "TRANSPORTE DE PASAJEROS", semibold, widthMm <= 56 ? 8.2 : 9.2, contentWidth, 2)
    .forEach((line, index) => centered(page, line, y - 12 - (index * 8), widthMm <= 56 ? 8.2 : 9.2, semibold, width, INK, contentWidth));
  centered(page, `RUC ${emisorDocumento}`, y - 28, 10.2, regular, width, INK, contentWidth);
  wrap(empresa.domicilio_fiscal || empresa.direccion || "", regular, 6.2, contentWidth, 2)
    .forEach((line, index) => centered(page, line, y - 40 - (index * 6), 6.2, regular, width, MUTED, contentWidth));
  y -= headerHeight + 7;

  drawText(page, "CPE", margin, y - 10, 8.2, semibold, ACCENT, contentWidth - 76);
  rightText(page, comprobante, rightSafeX, y - 13, widthMm <= 56 ? 15.5 : 17, regular, INK, 104);
  dotted(page, y - 19, margin, width - margin);
  y -= 27;

  drawText(page, "PASAJERO", margin, y - 5, 6.6, semibold, MUTED, contentWidth);
  drawText(page, pasajero.toUpperCase(), margin, y - 15, detalleValueSize, semibold, INK, contentWidth);
  drawText(page, "DNI", margin, y - 24, 6.6, semibold, MUTED, contentWidth);
  drawText(page, dni, margin, y - 34, detalleValueSize, semibold, INK, contentWidth);
  y -= 43;

  drawText(page, "SALE DE", margin, y - 5, 6.6, semibold, MUTED, contentWidth);
  drawText(page, origen, margin, y - 15, detalleValueSize, semibold, INK, contentWidth);
  drawText(page, "DESTINO", margin, y - 24, 6.6, semibold, MUTED, contentWidth);
  drawText(page, destino, margin, y - 34, detalleValueSize, semibold, INK, contentWidth);
  drawText(page, "FECHA", margin, y - 43, 6.5, semibold, MUTED, contentWidth);
  drawText(page, `${datePe(fecha)} ${timePeAmPm(hora)}`, margin, y - 53, detalleValueSize, regular, INK, contentWidth);
  y -= 63;

  page.drawRectangle({ x: margin, y: y - 34, width: contentWidth, height: 34, color: ACCENT_SOFT });
  drawText(page, "ASIENTO", margin + 8, y - 10, 7, semibold, MUTED, 44);
  drawText(page, String(asiento).padStart(2, "0"), margin + 8, y - 29, 24, semibold, INK, 42);
  line(page, y - 17, margin + 58, margin + 58, 0.6, LINE);
  rightText(page, "IMPORTE", rightSafeX - 8, y - 10, 7, semibold, MUTED, 60);
  rightText(page, `S/ ${money(total)}`, rightSafeX - 8, y - 28, 19, semibold, INK, contentWidth - 76);
  y -= 43;

  dotted(page, y, margin, width - margin);
  y -= 10;
  drawText(page, "DATOS TRIBUTARIOS", margin, y, 8, semibold, MUTED, contentWidth);
  y -= 11;
  if (esFactura) {
    drawText(page, "RUC", margin, y, 8.2, regular, INK, 34);
    drawText(page, clienteDocumento, margin + 38, y, 8.2, regular, INK, contentWidth - 38);
    y -= 10;
    drawText(page, "RAZON SOCIAL", margin, y, 8.2, regular, INK, 58);
    drawText(page, clienteTributario.toUpperCase(), margin + 62, y, 8.2, regular, INK, contentWidth - 62);
    y -= 10;
    if (direccionFacturacion) {
      wrap(`DIRECCION: ${direccionFacturacion}`, regular, 8.2, contentWidth, 2)
        .forEach((item, index) => drawText(page, item, margin, y - (index * 7), 8.2, regular, INK, contentWidth));
      y -= 16;
    }
  }
  drawText(page, "BASE EXONERADO", margin, y, 8.2, regular, INK, 80);
  rightText(page, `S/ ${money(boleto.r_exonerado || total)}`, taxAmountRightX, y, taxAmountSize, regular, INK, 76);
  y -= 10;
  drawText(page, "IGV", margin, y, 8.2, regular, INK, 80);
  rightText(page, `S/ ${money(boleto.r_igv || 0)}`, taxAmountRightX, y, taxAmountSize, regular, INK, 76);
  y -= 10;
  drawText(page, "TOTAL", margin, y, 9.2, semibold, INK, 80);
  rightText(page, `S/ ${money(total)}`, taxAmountRightX, y, taxAmountSize + 1, semibold, INK, 84);
  y -= 10;
  const montoLineas = wrap(`MONTO EN LETRAS: ${montoLetras(total)}`, regular, 8.6, contentWidth, 3);
  montoLineas.forEach((item, index) => drawText(page, item, margin, y - (index * 7.5), 8.6, regular, MUTED, contentWidth));
  y -= (montoLineas.length * 7.5) + 7;
  if (logoImage) {
    const logoMaxWidth = Math.min(contentWidth * 0.5, 82);
    const logoMaxHeight = 24;
    const logoScale = Math.min(logoMaxWidth / logoImage.width, logoMaxHeight / logoImage.height);
    const logoWidth = logoImage.width * logoScale;
    const logoHeight = logoImage.height * logoScale;

    page.drawImage(logoImage, {
      x: rightSafeX - logoWidth - 12,
      y: y - logoHeight,
      width: logoWidth,
      height: logoHeight,
      opacity: 0.95,
    });
    y -= logoHeight + 8;
  } else {
    y -= 5;
  }

  dotted(page, y, margin, width - margin);
  y -= 8;
  const qrSize = widthMm <= 56 ? 58 : 72;
  page.drawImage(qrImage, { x: margin, y: y - qrSize, width: qrSize, height: qrSize });
  drawText(page, "CONTROL", margin + qrSize + 10, y - 10, 8, semibold, MUTED, contentWidth - qrSize - 10);
  drawText(page, comprobante, margin + qrSize + 10, y - 25, 13, regular, INK, contentWidth - qrSize - 10);
  drawText(page, `ASIENTO ${String(asiento).padStart(2, "0")}`, margin + qrSize + 10, y - 40, 10, semibold, INK, contentWidth - qrSize - 10);
  y -= qrSize + 9;
  if (registradoPor) {
    centered(page, registradoPor, y, 6.5, regular, width, MUTED, contentWidth);
  }

  const usedHeight = Math.max(190, HEIGHT - y + 12);
  const embedded = await pdfDoc.embedPage(page, { left: 0, bottom: HEIGHT - usedHeight, right: width, top: HEIGHT });
  const cropped = pdfDoc.addPage([width, usedHeight]);
  cropped.drawPage(embedded, { x: 0, y: 0 });
  pdfDoc.removePage(0);

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export default crearTicketBoletoPdfUrl;
