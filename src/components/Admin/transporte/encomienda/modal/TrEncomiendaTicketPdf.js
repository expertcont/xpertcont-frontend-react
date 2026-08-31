import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const TICKET_WIDTH = 226.77;
const TICKET_HEIGHT = 620;
const MARGIN = 12;
const CONTENT_WIDTH = TICKET_WIDTH - (MARGIN * 2);
const ACCENT = rgb(0.09, 0.55, 0.52);
const INK = rgb(0.1, 0.12, 0.14);
const MUTED = rgb(0.36, 0.4, 0.44);
const SOFT = rgb(0.94, 0.97, 0.96);
const LINE = rgb(0.82, 0.86, 0.86);

const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const money = (value) => Number(value || 0).toLocaleString("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fecha = (value) => {
  const text = String(value || "").slice(0, 10);
  return text ? text.split("-").reverse().join("/") : "";
};

const comprobanteNombre = (rCod) => (rCod === "01" ? "FACTURA ELECTRONICA" : "BOLETA ELECTRONICA");

const drawCentered = (page, text, y, size, font, color = INK) => {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: Math.max(MARGIN, (TICKET_WIDTH - width) / 2),
    y,
    size,
    font,
    color,
  });
};

const drawRight = (page, text, y, size, font, color = INK, right = TICKET_WIDTH - MARGIN) => {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: right - width,
    y,
    size,
    font,
    color,
  });
};

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
    if (line) {
      lines.push(line);
    }
    line = word;
  });

  if (line) {
    lines.push(line);
  }

  return lines.length ? lines : [""];
};

const drawLabelValue = (page, label, value, y, fonts) => {
  page.drawText(label, { x: MARGIN, y, size: 6.8, font: fonts.bold, color: MUTED });
  const lines = wrapText(value || "-", fonts.regular, 8.2, CONTENT_WIDTH);
  lines.forEach((line, index) => {
    page.drawText(line, { x: MARGIN, y: y - 9 - (index * 9), size: 8.2, font: fonts.regular, color: INK });
  });
  return y - 13 - (Math.max(lines.length, 1) * 9);
};

const drawSection = (page, title, y, fonts) => {
  page.drawRectangle({
    x: MARGIN,
    y: y - 4,
    width: CONTENT_WIDTH,
    height: 14,
    color: SOFT,
    borderColor: LINE,
    borderWidth: 0.4,
  });
  page.drawText(title, { x: MARGIN + 7, y, size: 7.8, font: fonts.bold, color: ACCENT });
  return y - 17;
};

export default async function crearTicketEncomiendaPdf({ encomienda, empresa = {} }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([TICKET_WIDTH, TICKET_HEIGHT]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular, bold };

  const numero = [
    encomienda.r_cod,
    encomienda.r_serie,
    encomienda.r_numero || "MODELO",
  ].filter(Boolean).join("-");

  let y = TICKET_HEIGHT - 24;

  drawCentered(page, "XPERTCONT EXPRESS", y, 12, bold, ACCENT);
  y -= 13;
  drawCentered(page, cleanText(empresa.nombre) || "TRANSPORTE DE ENCOMIENDAS", y, 7.8, regular, MUTED);
  y -= 15;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: TICKET_WIDTH - MARGIN, y }, thickness: 0.7, color: LINE });
  y -= 17;

  drawCentered(page, comprobanteNombre(encomienda.r_cod), y, 9.3, bold);
  y -= 12;
  drawCentered(page, numero, y, 11.5, bold, ACCENT);
  y -= 13;
  drawCentered(page, `FECHA ${fecha(encomienda.r_fecemi)}   HORA ${cleanText(encomienda.llegada_aprox || "-")}`, y, 7.4, regular, MUTED);
  y -= 18;

  y = drawSection(page, "ORIGEN", y, fonts);
  y = drawLabelValue(page, "REMITENTE", encomienda.cliente, y, fonts);
  y = drawLabelValue(page, "DNI / RUC", encomienda.cliente_documento || encomienda.cliente_documento_id, y, fonts);
  y = drawLabelValue(page, "TELEFONO", encomienda.cliente_telefono, y, fonts);
  if (encomienda.remitente_direccion || encomienda.cliente_direccion) {
    y = drawLabelValue(page, "DIRECCION", encomienda.remitente_direccion || encomienda.cliente_direccion, y, fonts);
  }

  y = drawSection(page, "DESTINO", y, fonts);
  y = drawLabelValue(page, "DESTINATARIO", encomienda.destinatario, y, fonts);
  y = drawLabelValue(page, "DNI", encomienda.destinatario_documento || encomienda.destinatario_documento_id, y, fonts);
  y = drawLabelValue(page, "TELEFONO", encomienda.destinatario_telefono, y, fonts);
  y = drawLabelValue(page, "RUTA", `${cleanText(encomienda.id_ruta)}  ${cleanText(encomienda.id_punto_venta)} -> ${cleanText(encomienda.id_punto_venta_dest)}`, y, fonts);
  if (encomienda.destinatario_direccion) {
    y = drawLabelValue(page, "DIRECCION ENTREGA", encomienda.destinatario_direccion, y, fonts);
  }

  y = drawSection(page, "ENCOMIENDA", y, fonts);
  y = drawLabelValue(page, "CONTENIDO", encomienda.descripcion, y, fonts);
  y = drawLabelValue(page, "UNIDAD", `${cleanText(encomienda.placa)}  ${cleanText(encomienda.licencia)}`, y, fonts);

  y -= 2;
  page.drawRectangle({
    x: MARGIN,
    y: y - 38,
    width: CONTENT_WIDTH,
    height: 38,
    color: rgb(0.98, 0.99, 0.99),
    borderColor: ACCENT,
    borderWidth: 0.8,
  });
  page.drawText("CONDICION", { x: MARGIN + 8, y: y - 13, size: 7, font: bold, color: MUTED });
  page.drawText(cleanText(encomienda.condicion_pago || "PAGADO"), { x: MARGIN + 8, y: y - 27, size: 10, font: bold, color: INK });
  page.drawText("TOTAL S/", { x: TICKET_WIDTH - MARGIN - 78, y: y - 13, size: 7, font: bold, color: MUTED });
  drawRight(page, money(encomienda.r_monto_total || encomienda.precio_neto), y - 29, 15, bold, ACCENT);
  y -= 53;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: TICKET_WIDTH - MARGIN, y }, thickness: 0.7, color: LINE });
  y -= 16;
  drawCentered(page, "Gracias por confiar tu envio con nosotros", y, 8, regular, MUTED);
  y -= 11;
  drawCentered(page, "Conserva este ticket para seguimiento y entrega", y, 6.8, regular, MUTED);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
