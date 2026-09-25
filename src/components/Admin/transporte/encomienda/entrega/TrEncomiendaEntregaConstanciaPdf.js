import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import "pdfjs-dist/legacy/build/pdf.worker.entry";

const logoEmisorContext = require.context("../../../../../assets/images", false, /-logo\.(png|jpe?g)$/i);

const STANDARD_FONT_DATA_URL = `${process.env.PUBLIC_URL || ""}/pdfjs/standard_fonts/`;

const PAGE_WIDTH_MM = 80;
const MIN_PAGE_HEIGHT_MM = 118;
const RECEIVED_BLOCK_OFFSET_MM = 4;
const PAGE_BOTTOM_PADDING_MM = 0;
const mmToPt = (value) => (value * 72) / 25.4;
const pointsToMm = (value) => value / mmToPt(1);
const TICKET_PNG_SCALE = 2;
const TICKET_PNG_WIDTH_PX = Math.round(mmToPt(PAGE_WIDTH_MM) * TICKET_PNG_SCALE);
const PENDING_LOGO_MAX_WIDTH_MM = 46;
const PENDING_LOGO_MAX_HEIGHT_MM = 16;
const PENDING_LOGO_GAP_MM = 4; // reserva de alto en el respaldo, no separa el logo del estado
const PENDING_STATUS_BLOCK_GAP_MM = 2;
// Sin holgura entre "PENDIENTE DE ENTREGA" y el logo: solo la altura de la linea.
const PENDING_STATUS_TO_LOGO_MM = 3;
// En el render de canvas el texto se dibuja en px de canvas (1 mm = 9 px).
const PENDING_STATUS_TO_LOGO_CANVAS_MM = 20 / 9;
const PENDING_LOGO_FALLBACK_HEIGHT_MM = 6;
const DESTINO_ICON_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";

const COLORS = {
  page: rgb(0.985, 0.988, 0.992),
  paper: rgb(1, 1, 1),
  soft: rgb(0.969, 0.976, 0.984),
  line: rgb(0.86, 0.88, 0.90),
  ink: rgb(0.10, 0.13, 0.16),
  muted: rgb(0.40, 0.45, 0.50),
  accent: rgb(0.20, 0.36, 0.46),
  success: rgb(0.10, 0.48, 0.32),
  pending: rgb(0.68, 0.45, 0.12),
};

const cleanPdfText = (value) => {
  const text = String(value || "")
    .normalize("NFC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const safeCharacters = "ÁÉÍÓÚÜÑáéíóúüÑºª°";

  return Array.from(text)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return (code >= 32 && code <= 126) || safeCharacters.includes(character);
    })
    .join("");
};

const obtenerLogoEmisorUrl = (documentoId) => {
  const ruc = cleanPdfText(documentoId);
  if (!ruc) return null;

  try {
    return logoEmisorContext(`./${ruc}-logo.png`);
  } catch (error) {
    try {
      return logoEmisorContext(`./${ruc}-logo.jpg`);
    } catch (jpgError) {
      return null;
    }
  }
};

const embedLogoEmisor = async (pdfDoc, documentoId) => {
  const logoUrl = obtenerLogoEmisorUrl(documentoId);
  if (!logoUrl) return null;

  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;

    const logoBytes = await response.arrayBuffer();
    try {
      return await pdfDoc.embedPng(logoBytes);
    } catch (error) {
      return await pdfDoc.embedJpg(logoBytes);
    }
  } catch (error) {
    return null;
  }
};

const loadImage = (url) => new Promise((resolve) => {
  if (!url || typeof Image === "undefined") {
    resolve(null);
    return;
  }

  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => resolve(null);
  image.src = url;
});

const numeroOperacion = (item = {}) => [item.r_cod, item.r_serie, item.r_numero]
  .filter(Boolean)
  .join("-");

const formatFechaHoraEntrega = (value) => {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return text || "-";

  const fecha = `${match[3]}/${match[2]}/${match[1]}`;
  if (!match[4]) return fecha;

  const hora24 = Number(match[4]);
  const minuto = match[5];
  if (!Number.isInteger(hora24) || hora24 < 0 || hora24 > 23) {
    return `${fecha} ${match[4]}:${minuto}`;
  }

  const hora12 = String(hora24 % 12 || 12).padStart(2, "0");
  const sufijo = hora24 >= 12 ? "PM" : "AM";
  return `${fecha} ${hora12}:${minuto} ${sufijo}`;
};

const formatFechaEmision = (item = {}) => formatFechaHoraEntrega(item.r_fecemi || item.fecha);

const formatComprobante = (item = {}) => {
  const comprobante = item.comprobante || [item.r_serie, item.r_numero].filter(Boolean).join("-");
  return comprobante || numeroOperacion(item) || "-";
};

const emailRegistroEntrega = (item = {}) => (
  item.email_registro_entrega || item.entrega_ctrl_email || item.entrega_ctrl_us || item.registro_email || "-"
);

const dniEntrega = (item = {}) => (
  item.entrega_documento_id || item.entrega_documento || item.destinatario_documento_id || item.destinatario_documento || "-"
);

const destinoEntrega = (item = {}) => {
  const ruta = String(item.nombre_ruta || "").trim();
  if (ruta) {
    const partes = ruta
      .split(/\s*(?:->|=>|—|–|-|\/)\s*/)
      .map((parte) => parte.trim())
      .filter(Boolean);
    const destinoRuta = partes[partes.length - 1];
    if (destinoRuta) return destinoRuta;
  }

  return String(
    item.punto_venta_dest_nombre ||
    item.punto_venta_destino_nombre ||
    item.destino_nombre ||
    item.destino ||
    item.id_punto_venta_dest ||
    ""
  ).trim();
};

const blobToUint8Array = async (blob) => {
  if (typeof blob?.arrayBuffer === "function") {
    return new Uint8Array(await blob.arrayBuffer());
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer el PDF de la constancia."));
    reader.readAsArrayBuffer(blob);
  });
};

const wrapText = (text, font, size, maxWidth, maxLines = 2) => {
  const words = cleanPdfText(text).split(" ").filter(Boolean);
  if (!words.length) return [""];

  const lines = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
      current = candidate;
      return;
    }
    lines.push(current);
    current = word;
  });
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;

  const visible = lines.slice(0, maxLines);
  let truncated = visible[maxLines - 1];
  while (truncated.length > 1 && font.widthOfTextAtSize(`${truncated}...`, size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  visible[maxLines - 1] = `${truncated}...`;
  return visible;
};

export async function generarConstanciaEntregaPdfBlob(encomienda = {}, { pendienteEntrega = false } = {}) {
  const ticketPendienteEntrega = Boolean(pendienteEntrega);
  const pdfDoc = await PDFDocument.create();
  const headerText = ticketPendienteEntrega ? "LLEGO TU ENCOMIENDA" : "ENCOMIENDA";
  const headerSize = ticketPendienteEntrega ? 11.5 : 14;
  const statusText = ticketPendienteEntrega ? "PENDIENTE DE ENTREGA" : "RECIBIDO CONFORME";
  const statusColor = ticketPendienteEntrega ? COLORS.pending : COLORS.success;
  pdfDoc.setTitle(`Constancia de entrega ${numeroOperacion(encomienda)}`);
  pdfDoc.setSubject("Constancia de entrega de encomienda");
  pdfDoc.setCreator("Xpertcont");

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logoDocumentoId = encomienda.empresa_documento_id || encomienda.documento_id;
  const logoImage = ticketPendienteEntrega
    ? await embedLogoEmisor(pdfDoc, logoDocumentoId)
    : null;
  const logoScale = logoImage
    ? Math.min(mmToPt(PENDING_LOGO_MAX_WIDTH_MM) / logoImage.width, mmToPt(PENDING_LOGO_MAX_HEIGHT_MM) / logoImage.height)
    : 0;
  const logoWidthPt = logoImage ? logoImage.width * logoScale : 0;
  const logoHeightMm = logoImage ? pointsToMm(logoImage.height * logoScale) : 0;
  const logoBlockHeightMm = logoImage ? logoHeightMm + 3 : PENDING_LOGO_FALLBACK_HEIGHT_MM;
  const countLines = (text, font, size, maxWidthMm, maxLines) => (
    wrapText(text, font, size, mmToPt(maxWidthMm), maxLines).length
  );
  const estimatedEmpresaLineCount = countLines(encomienda.empresa_razon_social || "EMPRESA", regular, 7.2, 72, 2);
  const destination = destinoEntrega(encomienda);
  const estimatedRucTop = 11 + (estimatedEmpresaLineCount * 3.4) + 1.2;
  const estimatedEntregaTop = estimatedRucTop + 2.5;
  const estimarDestinatario = (fechaEntrega) => {
    estimatedCursor += (countLines(formatFechaHoraEntrega(fechaEntrega), regular, 9, 72, 1) * 4) + 1;
    estimatedCursor += (countLines(encomienda.destinatario || "-", bold, 12, 72, 3) * 4.2) + 1;
    estimatedCursor += (countLines(dniEntrega(encomienda), bold, 10.5, 72, 2) * 4) + 2;
    if (ticketPendienteEntrega) {
      estimatedCursor += 6;
    }
    if (destination) {
      estimatedCursor += (countLines(destination, regular, 8.5, 47, 2) * 3.6) + 3;
    }
  };
  const estimarRemitente = () => {
    estimatedCursor += 6;
    estimatedCursor += (countLines(encomienda.cliente || "-", bold, 9.2, 72, 3) * 3.8) + 1.5;
    estimatedCursor += 10;
    estimatedCursor += 6;
    estimatedCursor += (countLines(encomienda.descripcion || "-", regular, 8.5, 72, 3) * 3.8) + 5;
  };
  let estimatedCursor = estimatedEntregaTop + 10.5;
  if (ticketPendienteEntrega) {
    // Destinatario y destino, despues estado + logo, y al final el remitente.
    estimarDestinatario(encomienda.llegada_real);
    estimatedCursor += 4;
    estimatedCursor += PENDING_STATUS_BLOCK_GAP_MM;
    estimatedCursor += 6;
    estimatedCursor += PENDING_STATUS_TO_LOGO_MM;
    estimatedCursor += logoBlockHeightMm;
    estimarRemitente();
  } else {
    estimarRemitente();
    estimatedCursor += 5 + RECEIVED_BLOCK_OFFSET_MM;
    estimatedCursor += 6;
    estimatedCursor += 7;
    estimarDestinatario(encomienda.entrega_fecha);
  }
  estimatedCursor += 6;
  const pageHeightMm = Math.max(MIN_PAGE_HEIGHT_MM, estimatedCursor + PAGE_BOTTOM_PADDING_MM);
  const pageWidth = mmToPt(PAGE_WIDTH_MM);
  const pageHeight = mmToPt(pageHeightMm);
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const x = (value) => mmToPt(value);
  const baseline = (top) => pageHeight - mmToPt(top);
  const rectTop = (top, height) => pageHeight - mmToPt(top + height);

  const drawText = (text, left, top, options = {}) => {
    const {
      font = regular,
      size = 8,
      color = COLORS.ink,
      align = "left",
      right,
    } = options;
    const value = cleanPdfText(text) || "-";
    let drawX = x(left);
    if (align === "center") {
      drawX = (pageWidth - font.widthOfTextAtSize(value, size)) / 2;
    }
    if (align === "right") {
      const rightEdge = Number.isFinite(right) ? right : left;
      drawX = x(rightEdge) - font.widthOfTextAtSize(value, size);
    }
    page.drawText(value, { x: drawX, y: baseline(top), size, font, color });
  };

  const drawWrappedText = (text, left, top, options = {}) => {
    const {
      font = regular,
      size = 8,
      color = COLORS.ink,
      maxWidth = 60,
      lineHeightMm = 4.2,
      maxLines = 2,
      align = "left",
    } = options;
    const lines = wrapText(text, font, size, x(maxWidth), maxLines);
    lines.forEach((line, index) => {
      drawText(line, align === "center" ? 40 : left, top + (index * lineHeightMm), { font, size, color, align });
    });
    return lines.length;
  };

  const drawRectangle = (left, top, width, height, options = {}) => {
    const {
      color = COLORS.paper,
      borderColor = COLORS.line,
      borderWidth = 0.6,
    } = options;
    page.drawRectangle({
      x: x(left),
      y: rectTop(top, height),
      width: x(width),
      height: x(height),
      color,
      borderColor,
      borderWidth,
    });
  };

  const drawDivider = (top) => {
    page.drawLine({
      start: { x: x(10), y: baseline(top) },
      end: { x: x(70), y: baseline(top) },
      thickness: 0.55,
      color: COLORS.line,
    });
  };

  const drawSectionTitle = (title, top, options = {}) => {
    const { font = bold } = options;
    drawText(title.toUpperCase(), 40, top, {
      font,
      size: 7.1,
      color: COLORS.muted,
      align: "center",
    });
  };

  const drawDestination = (top, value) => {
    const text = cleanPdfText(value);
    if (!text) return 0;

    const size = 8.5;
    const lineHeightMm = 3.6;
    const maxWidthMm = 47;
    const lines = wrapText(text, regular, size, x(maxWidthMm), 2);
    const textWidthMm = Math.max(
      ...lines.map((line) => pointsToMm(regular.widthOfTextAtSize(line, size)))
    );
    const iconSizeMm = 5;
    const iconGapMm = 1.5;
    const groupLeft = 40 - ((iconSizeMm + iconGapMm + textWidthMm) / 2);

    page.drawSvgPath(DESTINO_ICON_PATH, {
      x: x(groupLeft),
      y: baseline(top - 0.8 - ((iconSizeMm * 9) / 24)),
      scale: x(iconSizeMm) / 24,
      color: COLORS.accent,
    });
    lines.forEach((line, index) => {
      drawText(line, groupLeft + iconSizeMm + iconGapMm, top + (index * lineHeightMm), {
        font: regular,
        size,
        color: COLORS.ink,
        align: "left",
      });
    });

    return lines.length;
  };

  const drawRecipientBlock = (startTop, dateValue = encomienda.llegada_real) => {
    let cursor = startTop;
    const arrivalLineCount = drawWrappedText(formatFechaHoraEntrega(dateValue), 40, cursor, {
      font: regular,
      size: 9,
      color: COLORS.ink,
      maxWidth: 72,
      maxLines: 1,
      lineHeightMm: 4,
      align: "center",
    });
    cursor += (arrivalLineCount * 4) + 1;
    const destinatarioLineCount = drawWrappedText(encomienda.destinatario || "-", 40, cursor, {
      font: bold,
      size: 12,
      color: COLORS.ink,
      maxWidth: 72,
      maxLines: 3,
      lineHeightMm: 4.2,
      align: "center",
    });
    cursor += (destinatarioLineCount * 4.2) + 1;
    const dniLineCount = drawWrappedText(dniEntrega(encomienda), 40, cursor, {
      font: bold,
      size: 10.5,
      color: COLORS.ink,
      maxWidth: 72,
      maxLines: 2,
      lineHeightMm: 4,
      align: "center",
    });
    cursor += (dniLineCount * 4) + 2;
    if (ticketPendienteEntrega) {
      drawSectionTitle("Agencia", cursor, { font: regular });
      cursor += 6;
    }
    if (destination) {
      const destinoLineCount = drawDestination(cursor, destination);
      cursor += (destinoLineCount * 3.6) + 3;
    }
    return cursor;
  };

  const drawSenderBlock = (startTop) => {
    let cursor = startTop;
    drawSectionTitle("Remitente", cursor, { font: regular });
    cursor += 6;
    const remitenteLineCount = drawWrappedText(encomienda.cliente || "-", 40, cursor, {
      font: regular,
      size: 9.2,
      color: COLORS.ink,
      maxWidth: 72,
      maxLines: 3,
      lineHeightMm: 3.8,
      align: "center",
    });
    cursor += (remitenteLineCount * 3.8) + 1.5;
    drawWrappedText(formatFechaEmision(encomienda), 40, cursor, {
      font: regular,
      size: 9,
      color: COLORS.ink,
      maxWidth: 72,
      maxLines: 1,
      lineHeightMm: 4,
      align: "center",
    });
    cursor += 5;
    drawWrappedText(formatComprobante(encomienda), 40, cursor, {
      font: bold,
      size: 9,
      color: COLORS.ink,
      maxWidth: 72,
      maxLines: 1,
      lineHeightMm: 4,
      align: "center",
    });
    cursor += 5;
    drawSectionTitle("Descripción de la encomienda", cursor);
    cursor += 6;
    const descripcionLineCount = drawWrappedText(encomienda.descripcion || "-", 40, cursor, {
      font: regular,
      size: 8.5,
      color: COLORS.ink,
      maxWidth: 72,
      maxLines: 3,
      lineHeightMm: 3.8,
      align: "center",
    });
    return cursor + (descripcionLineCount * 3.8) + 5;
  };

  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: COLORS.page });
  drawRectangle(3, 3, 74, pageHeightMm - 6, { color: COLORS.paper, borderColor: COLORS.line, borderWidth: 0.45 });
  const empresaLineCount = drawWrappedText(encomienda.empresa_razon_social || "EMPRESA", 40, 11, {
    font: regular,
    size: 7.2,
    color: COLORS.ink,
    maxWidth: 72,
    maxLines: 2,
    lineHeightMm: 3.4,
    align: "center",
  });
  const rucTop = 11 + (empresaLineCount * 3.4) + 1.2;
  drawText(`RUC: ${encomienda.empresa_documento_id || "-"}`, 40, rucTop, {
    font: regular,
    size: 7.2,
    color: COLORS.muted,
    align: "center",
  });
  const entregaTop = rucTop + 2.5;
  drawRectangle(6, entregaTop, 68, 8, { color: COLORS.soft, borderColor: COLORS.soft, borderWidth: 0 });
  drawText(headerText, 40, entregaTop + 5.5, {
    font: bold,
    size: headerSize,
    color: COLORS.ink,
    align: "center",
  });

  let cursor = entregaTop + 10.5;
  if (ticketPendienteEntrega) {
    // Destinatario y destino, despues estado + logo, y al final el remitente.
    cursor = drawRecipientBlock(cursor, encomienda.llegada_real);
    cursor += 4;

    // El estado va pegado justo arriba del logo.
    cursor += PENDING_STATUS_BLOCK_GAP_MM;
    cursor += 6;
    drawText(statusText, 40, cursor, {
      font: bold,
      size: 9.8,
      color: statusColor,
      align: "center",
    });
    cursor += PENDING_STATUS_TO_LOGO_MM;

    const logoTop = cursor;
    if (logoImage) {
      page.drawImage(logoImage, {
        x: (pageWidth - logoWidthPt) / 2,
        y: baseline(logoTop + logoHeightMm),
        width: logoWidthPt,
        height: mmToPt(logoHeightMm),
      });
    } else {
      drawText("expertcont.pe", 40, logoTop, {
        font: bold,
        size: 6.5,
        color: COLORS.accent,
        align: "center",
      });
    }
    cursor += logoBlockHeightMm;

    cursor = drawSenderBlock(cursor);
  } else {
    cursor = drawSenderBlock(cursor);
    cursor += 5 + RECEIVED_BLOCK_OFFSET_MM;
    drawDivider(cursor);
    cursor += 6;
    drawText(statusText, 40, cursor, {
      font: bold,
      size: 10.5,
      color: statusColor,
      align: "center",
    });
    cursor += 7;
    cursor = drawRecipientBlock(cursor, encomienda.entrega_fecha);
  }
  drawText(`Registró la entrega: ${emailRegistroEntrega(encomienda)}`, 40, cursor, {
    font: regular,
    size: 5.8,
    color: COLORS.muted,
    align: "center",
  });
  cursor += 3;
  drawText("expertcont.pe", 40, cursor, {
    font: bold,
    size: 6.5,
    color: COLORS.accent,
    align: "center",
  });

  const bytes = await pdfDoc.save();
  const pdfBlob = new Blob([bytes], { type: "application/pdf" });
  pdfBlob.ticketPageHeightMm = pageHeightMm;
  return pdfBlob;
}

export async function pdfBlobToPngBlob(pdfBlob, scale = TICKET_PNG_SCALE) {
  const data = await blobToUint8Array(pdfBlob);
  const pdf = await pdfjsLib.getDocument({
    data,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("No se pudo convertir el PDF en imagen.");
  }

  await page.render({ canvasContext: context, viewport }).promise;
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("No se pudo preparar la imagen de la constancia."));
    }, "image/png");
  });
}

export async function generarConstanciaEntregaPngFallback(encomienda = {}, pageHeightMm = MIN_PAGE_HEIGHT_MM, { pendienteEntrega = false } = {}) {
  const ticketPendienteEntrega = Boolean(pendienteEntrega);
  const logoDocumentoId = encomienda.empresa_documento_id || encomienda.documento_id;
  const logoImage = ticketPendienteEntrega
    ? await loadImage(obtenerLogoEmisorUrl(logoDocumentoId))
    : null;

  return new Promise((resolve, reject) => {
    const scale = 1.5;
    const width = 720;
    const unit = 9;
    const px = (value) => value * unit;
    const logoScale = logoImage
      ? Math.min(px(PENDING_LOGO_MAX_WIDTH_MM) / logoImage.width, px(PENDING_LOGO_MAX_HEIGHT_MM) / logoImage.height)
      : 0;
    const logoWidth = logoImage ? logoImage.width * logoScale : 0;
    const logoHeightMm = logoImage ? (logoImage.height * logoScale) / unit : 0;
    const logoBlockHeightMm = logoImage ? logoHeightMm + 3 : PENDING_LOGO_FALLBACK_HEIGHT_MM;
    const logoReserveMm = ticketPendienteEntrega ? PENDING_LOGO_GAP_MM + logoBlockHeightMm : 0;
    const fallbackPageHeightMm = Math.max(
      MIN_PAGE_HEIGHT_MM,
      Number(pageHeightMm) || MIN_PAGE_HEIGHT_MM,
      MIN_PAGE_HEIGHT_MM + logoReserveMm
    );
    const height = Math.round(fallbackPageHeightMm * unit);
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");

    if (!context) {
      reject(new Error("No se pudo preparar la imagen de respaldo."));
      return;
    }

    context.scale(scale, scale);
    const colors = {
      page: "#fbfcfd",
      paper: "#ffffff",
      soft: "#f1f5f7",
      line: "#d9dee2",
      ink: "#1a2025",
      muted: "#68737d",
      accent: "#345c75",
      success: "#1a7a52",
      pending: "#ad7320",
    };

    const destination = destinoEntrega(encomienda);

    const roundedRect = (x, y, rectWidth, rectHeight, radius = 12) => {
      const r = Math.min(radius, rectWidth / 2, rectHeight / 2);
      context.beginPath();
      context.moveTo(x + r, y);
      context.lineTo(x + rectWidth - r, y);
      context.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + r);
      context.lineTo(x + rectWidth, y + rectHeight - r);
      context.quadraticCurveTo(x + rectWidth, y + rectHeight, x + rectWidth - r, y + rectHeight);
      context.lineTo(x + r, y + rectHeight);
      context.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - r);
      context.lineTo(x, y + r);
      context.quadraticCurveTo(x, y, x + r, y);
      context.closePath();
    };

    const wrapCanvasText = (text, x, y, maxWidth, lineHeight = 20, maxLines = 2, align = "center") => {
      const words = cleanPdfText(text).split(" ").filter(Boolean);
      const lines = [];
      let current = "";

      words.forEach((word) => {
        const candidate = current ? `${current} ${word}` : word;
        if (context.measureText(candidate).width <= maxWidth || !current) {
          current = candidate;
          return;
        }
        lines.push(current);
        current = word;
      });
      if (current) lines.push(current);

      const visible = lines.slice(0, maxLines);
      if (lines.length > maxLines && visible.length) {
        let last = visible[visible.length - 1];
        while (last.length > 1 && context.measureText(`${last}...`).width > maxWidth) {
          last = last.slice(0, -1);
        }
        visible[visible.length - 1] = `${last}...`;
      }

      context.textAlign = align;
      visible.forEach((line, index) => context.fillText(line, x, y + (index * lineHeight)));
      return visible.length;
    };

    const sectionTitle = (title, y, options = {}) => {
      const { font = "900 12px Arial" } = options;
      context.textAlign = "center";
      context.fillStyle = colors.muted;
      context.font = font;
      context.fillText(String(title).toUpperCase(), width / 2, px(y));
    };

    const wrapDestinationLines = (text, maxWidth, maxLines) => {
      const words = cleanPdfText(text).split(" ").filter(Boolean);
      const lines = [];
      let current = "";

      words.forEach((word) => {
        const candidate = current ? `${current} ${word}` : word;
        if (context.measureText(candidate).width <= maxWidth || !current) {
          current = candidate;
          return;
        }
        lines.push(current);
        current = word;
      });
      if (current) lines.push(current);

      const visible = lines.slice(0, maxLines);
      if (lines.length > maxLines && visible.length) {
        let last = visible[visible.length - 1];
        while (last.length > 1 && context.measureText(`${last}...`).width > maxWidth) {
          last = last.slice(0, -1);
        }
        visible[visible.length - 1] = `${last}...`;
      }
      return visible;
    };

    const drawDestination = (top, value) => {
      const text = cleanPdfText(value);
      if (!text) return 0;

      const fontSize = 17;
      const lineHeight = px(3.6);
      context.font = `500 ${fontSize}px Arial`;
      const lines = wrapDestinationLines(text, px(47), 2);
      const textWidth = Math.max(...lines.map((line) => context.measureText(line).width));
      const iconSize = px(5);
      const iconGap = px(1.5);
      const groupLeft = (width - (iconSize + iconGap + textWidth)) / 2;
      const iconCenter = groupLeft + (iconSize / 2);
      const iconRadius = iconSize * (1.45 / 4.2);
      const iconShoulder = iconSize * (2.45 / 4.2);
      const iconTip = iconSize * (4.1 / 4.2);
      const iconInnerRadius = iconSize * (0.55 / 4.2);
      const iconCircleCenterY = px(top) - px(0.8);
      const iconTop = iconCircleCenterY - iconRadius;

      context.fillStyle = colors.accent;
      context.beginPath();
      context.arc(iconCenter, iconCircleCenterY, iconRadius, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.moveTo(iconCenter - (iconRadius * 0.8), iconTop + iconShoulder);
      context.lineTo(iconCenter, iconTop + iconTip);
      context.lineTo(iconCenter + (iconRadius * 0.8), iconTop + iconShoulder);
      context.closePath();
      context.fill();
      context.fillStyle = colors.paper;
      context.beginPath();
      context.arc(iconCenter, iconCircleCenterY, iconInnerRadius, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = colors.ink;
      context.textAlign = "left";
      lines.forEach((line, index) => {
        context.fillText(line, groupLeft + iconSize + iconGap, px(top) + (index * lineHeight));
      });
      return lines.length;
    };

    const drawRecipientBlock = (startTop, dateValue = encomienda.llegada_real) => {
      let cursor = startTop;
      context.textAlign = "center";
      context.fillStyle = colors.ink;
      context.font = "500 18px Arial";
      const arrivalLineCount = wrapCanvasText(formatFechaHoraEntrega(dateValue), width / 2, px(cursor), px(72), 20, 1, "center");
      cursor += (arrivalLineCount * 4) + 1;
      context.font = "900 26px Arial";
      const destinatarioLineCount = wrapCanvasText(encomienda.destinatario || "-", width / 2, px(cursor), px(72), 25, 3, "center");
      cursor += (destinatarioLineCount * 4.2) + 1;
      context.font = "900 22px Arial";
      const dniLineCount = wrapCanvasText(dniEntrega(encomienda), width / 2, px(cursor), px(72), 22, 2, "center");
      cursor += (dniLineCount * 4) + 2;
      if (ticketPendienteEntrega) {
        sectionTitle("Agencia", cursor, { font: "500 12px Arial" });
        cursor += 6;
      }
      if (destination) {
        const destinoLineCount = drawDestination(cursor, destination);
        cursor += (destinoLineCount * 3.6) + 3;
      }
      return cursor;
    };

    const divider = (y) => {
      context.strokeStyle = colors.line;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(px(10), px(y));
      context.lineTo(px(70), px(y));
      context.stroke();
    };

    const drawSenderBlockCanvas = (startTop) => {
      let cursor = startTop;
      sectionTitle("Remitente", cursor, { font: "500 12px Arial" });
      cursor += 6;
      context.fillStyle = colors.ink;
      context.font = "500 20px Arial";
      const remitenteLineCount = wrapCanvasText(encomienda.cliente || "-", width / 2, px(cursor), px(72), 18, 3, "center");
      cursor += (remitenteLineCount * 3.8) + 1.5;
      context.fillStyle = colors.ink;
      context.font = "500 18px Arial";
      wrapCanvasText(formatFechaEmision(encomienda), width / 2, px(cursor), px(72), 20, 1, "center");
      cursor += 5;
      context.font = "800 18px Arial";
      wrapCanvasText(formatComprobante(encomienda), width / 2, px(cursor), px(72), 20, 1, "center");
      cursor += 5;

      sectionTitle("Descripción de la encomienda", cursor);
      cursor += 6;
      context.fillStyle = colors.ink;
      context.font = "500 17px Arial";
      const descripcionLineCount = wrapCanvasText(encomienda.descripcion || "-", width / 2, px(cursor), px(72), 18, 3, "center");
      return cursor + (descripcionLineCount * 3.8) + 5;
    };

    context.fillStyle = colors.page;
    context.fillRect(0, 0, width, height);
    roundedRect(px(3), px(3), px(74), px(fallbackPageHeightMm - 6), px(2));
    context.fillStyle = colors.paper;
    context.fill();
    context.strokeStyle = colors.line;
    context.lineWidth = 1.2;
    context.stroke();
    context.textAlign = "center";
    context.fillStyle = colors.ink;
    context.font = "500 15px Arial";
    const empresaLineCount = wrapCanvasText(encomienda.empresa_razon_social || "EMPRESA", width / 2, px(11), px(72), 23, 2, "center");
    const rucTop = 11 + (empresaLineCount * 3.4) + 1.2;
    context.font = "500 13px Arial";
    context.fillStyle = colors.muted;
    context.fillText(`RUC: ${encomienda.empresa_documento_id || "-"}`, width / 2, px(rucTop));
    const entregaTop = rucTop + 2.5;
    roundedRect(px(6), px(entregaTop), px(68), px(8), px(1.5));
    context.fillStyle = colors.soft;
    context.fill();
    context.fillStyle = colors.ink;
    context.font = ticketPendienteEntrega ? "900 23px Arial" : "900 28px Arial";
    context.fillText(ticketPendienteEntrega ? "LLEGO TU ENCOMIENDA" : "ENCOMIENDA", width / 2, px(entregaTop + 5.5));

    const finalizarImagen = () => {
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = TICKET_PNG_WIDTH_PX;
      outputCanvas.height = Math.max(1, Math.round((canvas.height * TICKET_PNG_WIDTH_PX) / canvas.width));
      const outputContext = outputCanvas.getContext("2d");
      if (!outputContext) {
        reject(new Error("No se pudo preparar la imagen de respaldo."));
        return;
      }
      outputContext.imageSmoothingEnabled = true;
      outputContext.drawImage(canvas, 0, 0, outputCanvas.width, outputCanvas.height);
      outputCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("No se pudo preparar la imagen de respaldo."));
      }, "image/png");
    };

    let cursor = entregaTop + 10.5;
    if (ticketPendienteEntrega) {
      // Destinatario y destino, despues estado + logo, y al final el remitente.
      cursor = drawRecipientBlock(cursor, encomienda.llegada_real);
      cursor += 4;

      // El estado va pegado justo arriba del logo.
      cursor += PENDING_STATUS_BLOCK_GAP_MM;
      cursor += 6;
      context.textAlign = "center";
      context.fillStyle = colors.pending;
      context.font = "900 19px Arial";
      context.fillText("PENDIENTE DE ENTREGA", width / 2, px(cursor));
      cursor += PENDING_STATUS_TO_LOGO_CANVAS_MM;

      const logoTop = cursor;
      if (logoImage) {
        context.drawImage(logoImage, (width - logoWidth) / 2, px(logoTop), logoWidth, logoHeightMm * unit);
      } else {
        context.fillStyle = colors.accent;
        context.font = "900 14px Arial";
        context.textAlign = "center";
        context.fillText("expertcont.pe", width / 2, px(logoTop));
      }
      cursor += logoBlockHeightMm;

      cursor = drawSenderBlockCanvas(cursor);
    } else {
      cursor = drawSenderBlockCanvas(cursor);
      cursor += 5 + RECEIVED_BLOCK_OFFSET_MM;
      divider(cursor);
      cursor += 6;
      context.textAlign = "center";
      context.fillStyle = colors.success;
      context.font = "900 21px Arial";
      context.fillText("RECIBIDO CONFORME", width / 2, px(cursor));
      cursor += 7;
      cursor = drawRecipientBlock(cursor, encomienda.entrega_fecha);
    }
    context.textAlign = "center";
    context.fillStyle = colors.muted;
    context.font = "500 12px Arial";
    context.fillText(`Registró la entrega: ${emailRegistroEntrega(encomienda)}`, width / 2, px(cursor));
    cursor += 3;
    context.fillStyle = colors.accent;
    context.font = "900 14px Arial";
    context.fillText("expertcont.pe", width / 2, px(cursor));
    context.textAlign = "left";
    finalizarImagen();
  });
}
