import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  detalleRecurso,
  resumenTributarioServicio,
  subtotalPresupuesto,
  totalPresupuesto,
  utilidadTrabajo,
  totalRecursosTrabajo,
  totalTrabajo,
} from "./AdminVentaPresupuestoDemoData";

const colors = {
  bg: rgb(0.97, 0.98, 0.98),
  ink: rgb(0.10, 0.13, 0.16),
  muted: rgb(0.42, 0.48, 0.53),
  line: rgb(0.84, 0.88, 0.90),
  dark: rgb(0.12, 0.16, 0.18),
  teal: rgb(0.16, 0.63, 0.60),
  tealSoft: rgb(0.88, 0.96, 0.95),
  white: rgb(1, 1, 1),
};

const formatMoney = (value) => Number(value || 0).toLocaleString("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const cleanText = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^\x20-\x7E]/g, " ");

const drawText = (page, text, options) => {
  page.drawText(cleanText(text), options);
};

const wrapText = (text, font, size, maxWidth) => {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  return lines.length ? lines : [""];
};

const drawWrappedText = (page, text, x, y, maxWidth, options) => {
  const { font, size, lineHeight, color } = options;
  const lines = wrapText(text, font, size, maxWidth);
  lines.forEach((line, index) => {
    drawText(page, line, { x, y: y - (index * lineHeight), size, font, color });
  });
  return y - (lines.length * lineHeight);
};

const numeroPresupuesto = (presupuesto) => [
  presupuesto.r_cod,
  presupuesto.r_serie,
  presupuesto.r_numero,
].filter(Boolean).join("-");

async function createPresupuestoPdf(presupuesto, options = {}) {
  const { modo = "interno" } = options;
  const esCliente = modo === "cliente";
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageSize = [595.28, 841.89];
  const margin = 42;
  const contentWidth = pageSize[0] - (margin * 2);
  const pageBottom = 54;
  let page = pdfDoc.addPage(pageSize);
  let y = 790;

  const addPage = () => {
    page = pdfDoc.addPage(pageSize);
    y = 790;
  };

  const ensureSpace = (height) => {
    if (y - height < pageBottom) {
      addPage();
    }
  };

  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageSize[0],
    height: pageSize[1],
    color: colors.bg,
  });

  page.drawRectangle({
    x: 0,
    y: 742,
    width: pageSize[0],
    height: 100,
    color: colors.dark,
  });

  page.drawRectangle({
    x: margin,
    y: 773,
    width: 44,
    height: 44,
    color: colors.teal,
  });
  drawText(page, "XP", { x: margin + 11, y: 789, size: 15, font: bold, color: colors.white });

  drawText(page, esCliente ? "COTIZACION" : "PRESUPUESTO", { x: margin + 60, y: 803, size: 22, font: bold, color: colors.white });
  const numero = numeroPresupuesto(presupuesto);
  drawText(page, esCliente ? `${numero} - vista cliente` : numero, { x: margin + 60, y: 784, size: 11, font: regular, color: colors.tealSoft });

  const total = totalPresupuesto(presupuesto);
  const subtotal = subtotalPresupuesto(presupuesto);
  const igv = total - subtotal;

  drawText(page, `${presupuesto.r_moneda} ${formatMoney(total)}`, {
    x: pageSize[0] - margin - 150,
    y: 797,
    size: 18,
    font: bold,
    color: colors.white,
  });
  drawText(page, "Total incluido IGV", {
    x: pageSize[0] - margin - 150,
    y: 779,
    size: 9,
    font: regular,
    color: colors.tealSoft,
  });

  y = 710;
  page.drawRectangle({
    x: margin,
    y: y - 78,
    width: contentWidth,
    height: 78,
    color: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
  });

  drawText(page, "Cliente", { x: margin + 16, y: y - 22, size: 8, font: bold, color: colors.muted });
  drawText(page, presupuesto.r_razon_social, { x: margin + 16, y: y - 39, size: 12, font: bold, color: colors.ink });
  drawText(page, `RUC/DNI: ${presupuesto.r_documento_id}`, { x: margin + 16, y: y - 56, size: 9, font: regular, color: colors.muted });
  drawText(page, `Campana: ${presupuesto.glosa || "-"}`, { x: margin + 16, y: y - 70, size: 8.5, font: regular, color: colors.muted });

  drawText(page, "Fecha", { x: margin + 360, y: y - 22, size: 8, font: bold, color: colors.muted });
  drawText(page, presupuesto.r_fecemi, { x: margin + 360, y: y - 39, size: 11, font: bold, color: colors.ink });
  drawText(page, `Pago: ${presupuesto.r_forma_pago_id}`, { x: margin + 360, y: y - 56, size: 9, font: regular, color: colors.muted });
  drawText(page, `Celular: ${presupuesto.contacto_celular || "-"}`, { x: margin + 360, y: y - 70, size: 8.5, font: regular, color: colors.muted });

  y -= 105;
  drawText(page, "Trabajos presupuestados", { x: margin, y, size: 14, font: bold, color: colors.ink });
  y -= 18;

  presupuesto.trabajos.forEach((trabajo, index) => {
    ensureSpace(135);

    const resumenTrabajo = resumenTributarioServicio(trabajo, presupuesto.r_moneda);
    const baseTrabajo = resumenTrabajo.monto_base;
    const recursos = totalRecursosTrabajo(trabajo);
    const utilidad = utilidadTrabajo(trabajo);
    const importe = totalTrabajo(trabajo);

    page.drawRectangle({
      x: margin,
      y: y - 32,
      width: contentWidth,
      height: 32,
      color: colors.tealSoft,
      borderColor: colors.line,
      borderWidth: 1,
    });

    drawText(page, `${index + 1}. ${trabajo.descripcion || `Servicio ${trabajo.servicio || ""}`}`, { x: margin + 12, y: y - 20, size: 11, font: bold, color: colors.ink });
    drawText(page, `${presupuesto.r_moneda} ${formatMoney(importe)}`, {
      x: pageSize[0] - margin - 105,
      y: y - 20,
      size: 11,
      font: bold,
      color: colors.teal,
    });

    y -= 46;
    y = drawWrappedText(page, trabajo.especificacion || "Sin especificacion", margin + 12, y, contentWidth - 24, {
      font: regular,
      size: 9,
      lineHeight: 12,
      color: colors.ink,
    });

    y -= 8;
    if (esCliente) {
      drawText(page, `Importe: ${presupuesto.r_moneda} ${formatMoney(importe)}`, {
        x: margin + 12,
        y,
        size: 9,
        font: bold,
        color: colors.ink,
      });
      y -= 6;
    } else {
      drawText(page, `Base: ${formatMoney(baseTrabajo)}`, { x: margin + 12, y, size: 8.5, font: regular, color: colors.muted });
      drawText(page, `Recursos: ${formatMoney(recursos)}`, { x: margin + 130, y, size: 8.5, font: regular, color: colors.muted });
      drawText(page, `Utilidad ${Number(trabajo.utilidad ?? trabajo.utilidad_pct ?? 0)}%: ${formatMoney(utilidad)}`, { x: margin + 260, y, size: 8.5, font: regular, color: colors.muted });
      drawText(page, `Subtotal sin IGV: ${formatMoney(importe)}`, { x: margin + 395, y, size: 8.5, font: bold, color: colors.ink });

      y -= 18;
      drawText(page, "Recursos incluidos", { x: margin + 12, y, size: 8, font: bold, color: colors.muted });
      y -= 11;

      trabajo.materiales.forEach((recurso) => {
        ensureSpace(32);
        const detalle = detalleRecurso(recurso, formatMoney);
        const importeRecurso = formatMoney(
          recurso.tipo === "MANO_OBRA" || recurso.tipo === "OPERARIO"
            ? Number(recurso.horas || 0) * Number(recurso.operarios || 1) * Number(recurso.costo_hora || 0)
            : recurso.tipo === "SERVICIO"
              ? Number(recurso.largo || 0) * Number(recurso.ancho || 0) * Number(recurso.cantidad || 1) * Number(recurso.costo_m2 || 0)
              : Number(recurso.cantidad || 0) * Number(recurso.costo_unitario || 0),
        );

        drawText(page, recurso.grupo || recurso.tipo, { x: margin + 18, y, size: 7.5, font: bold, color: colors.teal });
        drawText(page, recurso.descripcion, { x: margin + 150, y, size: 8, font: regular, color: colors.ink });
        drawText(page, detalle, { x: margin + 320, y, size: 7.5, font: regular, color: colors.muted });
        drawText(page, importeRecurso, { x: pageSize[0] - margin - 62, y, size: 8, font: bold, color: colors.ink });
        y -= 12;
      });
    }

    y -= 12;
  });

  ensureSpace(105);
  page.drawRectangle({
    x: pageSize[0] - margin - 210,
    y: y - 84,
    width: 210,
    height: 84,
    color: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
  });

  drawText(page, esCliente ? "Valor venta" : "Subtotal", { x: pageSize[0] - margin - 190, y: y - 22, size: 10, font: regular, color: colors.muted });
  drawText(page, `${presupuesto.r_moneda} ${formatMoney(subtotal)}`, { x: pageSize[0] - margin - 85, y: y - 22, size: 10, font: bold, color: colors.ink });
  drawText(page, "IGV", { x: pageSize[0] - margin - 190, y: y - 43, size: 10, font: regular, color: colors.muted });
  drawText(page, `${presupuesto.r_moneda} ${formatMoney(igv)}`, { x: pageSize[0] - margin - 85, y: y - 43, size: 10, font: bold, color: colors.ink });
  drawText(page, "Total", { x: pageSize[0] - margin - 190, y: y - 66, size: 12, font: bold, color: colors.ink });
  drawText(page, `${presupuesto.r_moneda} ${formatMoney(total)}`, { x: pageSize[0] - margin - 95, y: y - 66, size: 12, font: bold, color: colors.teal });

  const pages = pdfDoc.getPages();
  pages.forEach((pdfPage, index) => {
    drawText(pdfPage, `Pagina ${index + 1} de ${pages.length}`, {
      x: margin,
      y: 28,
      size: 8,
      font: regular,
      color: colors.muted,
    });
    drawText(pdfPage, esCliente ? "Xpertcont - cotizacion cliente" : "Xpertcont - presupuesto interno", {
      x: pageSize[0] - margin - 135,
      y: 28,
      size: 8,
      font: regular,
      color: colors.muted,
    });
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export default createPresupuestoPdf;
