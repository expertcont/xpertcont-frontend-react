import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import barlowRegularUrl from "../../../../../assets/fonts/cpe/BarlowCondensed-Regular.ttf";
import barlowSemiBoldUrl from "../../../../../assets/fonts/cpe/BarlowCondensed-SemiBold.ttf";
import barlowBoldUrl from "../../../../../assets/fonts/cpe/BarlowCondensed-Bold.ttf";

const logoEmisorContext = require.context("../../../../../assets/images", false, /-logo\.(png|jpe?g)$/i);

const W = 226.77;
const H = 610;
const M = 12;
const CW = W - (M * 2);

const INK = rgb(0.03, 0.035, 0.045);
const MUTED = rgb(0.34, 0.35, 0.37);
const LINE = rgb(0.7, 0.71, 0.73);
const LIGHT_LINE = rgb(0.82, 0.83, 0.85);
const SOFT = rgb(0.94, 0.945, 0.955);
const ALERT = rgb(0.82, 0.12, 0.12);
const ICON_MUTED = rgb(0.48, 0.5, 0.53);
const WHITE = rgb(1, 1, 1);

const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

const ticketPayloadDesdeFormulario = ({ encomienda = {}, empresa = {} }) => ({
  rubro: "TRANS_ENCOMIENDA",
  endpoint_pdf: "/cpesunatticketencomienda/v2",
  empresa: {
    ruc: empresa.ruc || empresa.documento_id || encomienda.documento_id || "",
    razon_social: empresa.razon_social || empresa.nombre || empresa.nombre_comercial || "TRANSPORTE DE ENCOMIENDAS",
    nombre_comercial: empresa.nombre_comercial || empresa.razon_social || empresa.nombre || "TRANSPORTE DE ENCOMIENDAS",
    domicilio_fiscal: empresa.domicilio_fiscal || empresa.direccion || "",
    direccion: empresa.direccion || empresa.domicilio_fiscal || "",
  },
  cliente: {
    razon_social_nombres: encomienda.cliente || "",
    documento_identidad: encomienda.cliente_documento || encomienda.cliente_documento_id || "",
    tipo_identidad: encomienda.cliente_id_doc || encomienda.id_documento || "",
    cliente_direccion: encomienda.cliente_direccion_fact || encomienda.cliente_direccion || encomienda.remitente_direccion || "",
  },
  venta: {
    codigo: encomienda.r_cod_ref || encomienda.r_cod || "03",
    serie: encomienda.r_serie_ref || encomienda.r_serie || "",
    numero: encomienda.r_numero_ref || encomienda.r_numero || "",
    fecha_emision: encomienda.r_fecemi || "",
    hora_emision: encomienda.ctrl_crea_hora || encomienda.ctrl_crea || encomienda.hora_grabacion || "",
    forma_pago_id: encomienda.condicion_pago || "PAGADO",
    total: encomienda.r_monto_total || encomienda.precio_neto || 0,
    r_monto_total: encomienda.r_monto_total || encomienda.precio_neto || 0,
  },
  encomienda: {
    ...encomienda,
    r_fecemi: encomienda.r_fecemi || "",
    registrado_por_correo: encomienda.registrado_por_correo || encomienda.ctrl_crea_us || "",
  },
  ticket: {
    formato: "ENCOMIENDA_BOARDING_PASS_80MM",
    titulo: "ENCOMIENDA",
    mostrar_origen_destino: true,
    mostrar_qr: true,
    registrado_por_correo: encomienda.registrado_por_correo || encomienda.ctrl_crea_us || "",
    endpoint_pdf: "/cpesunatticketencomienda/v2",
    rubro: "TRANS_ENCOMIENDA",
  },
  items: [
    {
      producto: encomienda.descripcion || "SERVICIO DE TRANSPORTE DE ENCOMIENDA",
      cantidad: 1,
      precio_neto: encomienda.r_monto_total || encomienda.precio_neto || 0,
    },
  ],
});

const money = (value) => Number(value || 0).toLocaleString("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const datePe = (value) => {
  const text = String(value || "").slice(0, 10);
  return text ? text.split("-").reverse().join("/") : "-";
};

const timePe = (value) => {
  const textValue = clean(value);
  if (!textValue) return "-";
  const time = textValue.includes("T") ? textValue.split("T")[1] : textValue.split(" ")[1] || textValue;
  const [hour = "0", minute = "00"] = time.split(".")[0].split(":");
  const hourNumber = Number(hour);
  if (!Number.isFinite(hourNumber)) return textValue;
  const suffix = hourNumber >= 12 ? "PM" : "AM";
  const hour12 = hourNumber % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const documentName = (code) => (code === "01" ? "FACTURA ELECTRONICA" : "BOLETA ELECTRONICA");

const base64ToBytes = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const obtenerLogoEmisorUrl = (documentoId) => {
  const ruc = clean(documentoId);
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

  const response = await fetch(logoUrl);
  const logoBytes = await response.arrayBuffer();

  try {
    return await pdfDoc.embedPng(logoBytes);
  } catch (error) {
    try {
      return await pdfDoc.embedJpg(logoBytes);
    } catch (jpgError) {
      return null;
    }
  }
};

const fit = (value, font, size, maxWidth) => {
  const textValue = clean(value);
  if (!textValue) return "";
  if (font.widthOfTextAtSize(textValue, size) <= maxWidth) return textValue;

  let output = textValue;
  while (output.length > 3 && font.widthOfTextAtSize(`${output}...`, size) > maxWidth) {
    output = output.slice(0, -1);
  }
  return output.length > 3 ? `${output}...` : "";
};

const wrap = (value, font, size, maxWidth, maxLines = 2) => {
  const words = clean(value).split(" ").filter(Boolean);
  const lines = [];
  let lineValue = "";

  for (const word of words) {
    const next = lineValue ? `${lineValue} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      lineValue = next;
      continue;
    }
    if (lineValue) lines.push(lineValue);
    lineValue = word;
    if (lines.length >= maxLines) break;
  }

  if (lineValue && lines.length < maxLines) lines.push(lineValue);
  if (!lines.length) return [""];
  lines[lines.length - 1] = fit(lines[lines.length - 1], font, size, maxWidth);
  return lines;
};

const wrapPreservingBreaks = (value, font, size, maxWidth, maxLines = 8) => {
  const sourceLines = String(value || "").replace(/\r\n/g, "\n").split("\n");
  const lines = [];

  for (const sourceLine of sourceLines) {
    if (lines.length >= maxLines) break;
    lines.push(...wrap(sourceLine, font, size, maxWidth, maxLines - lines.length));
  }

  return lines.slice(0, maxLines);
};

const text = (page, value, x, y, size, font, color = INK, maxWidth = null) => {
  page.drawText(maxWidth ? fit(value, font, size, maxWidth) : clean(value), { x, y, size, font, color });
};

const centered = (page, value, y, size, font, color = INK, maxWidth = CW) => {
  const label = fit(value, font, size, maxWidth);
  const width = font.widthOfTextAtSize(label, size);
  page.drawText(label, { x: (W - width) / 2, y, size, font, color });
};

const right = (page, value, y, size, font, color = INK, rightX = W - M, maxWidth = CW) => {
  const label = fit(value, font, size, maxWidth);
  const width = font.widthOfTextAtSize(label, size);
  page.drawText(label, { x: rightX - width, y, size, font, color });
};

const line = (page, y, x1 = M, x2 = W - M, thickness = 0.55, color = LINE) => {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
};

const dotted = (page, y, x1 = M, x2 = W - M) => {
  for (let x = x1; x < x2; x += 5) {
    page.drawCircle({ x, y, size: 0.65, color: LINE });
  }
};

const box = (page, x, y, width, height, fill = WHITE, border = LINE, borderWidth = 0.55) => {
  page.drawRectangle({ x, y, width, height, color: fill, borderColor: border, borderWidth });
};

const drawIcon = (page, pathData, x, y, size = 12, color = ICON_MUTED) => {
  page.drawSvgPath(pathData, { x, y, scale: size / 24, color });
};

const ICONS = {
  place: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  package: "M20 8.69V18c0 .72-.38 1.38-1 1.73l-6 3.46c-.62.36-1.38.36-2 0l-6-3.46A2 2 0 0 1 4 18V8.69c0-.72.38-1.38 1-1.73l6-3.46c.62-.36 1.38-.36 2 0l6 3.46c.62.35 1 1.01 1 1.73zM12 5.23 6.74 8.26 12 11.29l5.26-3.03L12 5.23zm-6 4.76V18l5 2.88v-7.86L6 9.99zm12 0-5 3.03v7.86L18 18V9.99z",
};

const drawTrackingText = (page, value, x, y, size, font, color = INK, tracking = 0.5, maxWidth = null) => {
  const label = maxWidth ? fit(value, font, size, maxWidth) : clean(value);
  let cursor = x;

  for (const character of label) {
    page.drawText(character, { x: cursor, y, size, font, color });
    cursor += font.widthOfTextAtSize(character, size) + tracking;
  }
};

const centeredTracking = (page, value, y, size, font, color = INK, tracking = 0.5, maxWidth = CW) => {
  const label = fit(value, font, size, maxWidth);
  const width = label
    .split("")
    .reduce((total, character) => total + font.widthOfTextAtSize(character, size) + tracking, 0) - tracking;

  drawTrackingText(page, label, (W - width) / 2, y, size, font, color, tracking);
};

const centeredIn = (page, value, x, y, width, size, font, color = INK) => {
  const label = fit(value, font, size, width - 4);
  const textWidth = font.widthOfTextAtSize(label, size);
  page.drawText(label, { x: x + ((width - textWidth) / 2), y, size, font, color });
};

const drawPaymentStatusLarge = (page, { isPending, label, x, y, width, bold, semibold, scale = 1 }) => {
  if (isPending) {
    centeredIn(page, "POR", x, y, width, 19.2 * scale, bold, ALERT);
    centeredIn(page, "PAGAR", x, y - (22 * scale), width, 19.2 * scale, bold, ALERT);
    return;
  }

  centeredIn(page, label, x, y - (11 * scale), width, 18.5 * scale, semibold, INK);
};

const fetchFontBytes = async (url) => {
  const response = await fetch(url);
  return response.arrayBuffer();
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

const generarPdfTicketEncomiendaTributario = async (jsonTicket) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([W, H]);
  const { regular, semibold, bold } = await embedTicketFonts(pdfDoc);

  const empresa = jsonTicket.empresa || {};
  const venta = jsonTicket.venta || {};
  const encomienda = jsonTicket.encomienda || {};
  const cliente = jsonTicket.cliente || {};
  const code = venta.codigo || encomienda.r_cod || "03";
  const serie = venta.serie || encomienda.r_serie || "";
  const number = venta.numero || encomienda.r_numero || "";
  const fullNumber = [code, serie, number].filter(Boolean).join("-");
  const displayNumber = [serie, number].filter(Boolean).join("-") || fullNumber;
  const issueDate = venta.fecha_emision || encomienda.r_fecemi;
  const issueTime = venta.hora_emision || encomienda.ctrl_crea || encomienda.hora_grabacion;
  const total = venta.total || venta.r_monto_total || encomienda.r_monto_total || encomienda.precio_neto;
  const origin = encomienda.punto_venta_nombre || encomienda.id_punto_venta || "ORIGEN";
  const destination = encomienda.punto_venta_dest_nombre || encomienda.punto_venta_destino_nombre || encomienda.destino_nombre || encomienda.id_punto_venta_dest || "DESTINO";
  const senderName = encomienda.cliente || cliente.razon_social_nombres || "-";
  const senderDoc = encomienda.cliente_documento || encomienda.cliente_documento_id || cliente.documento_identidad || "-";
  const senderOriginZone = clean(encomienda.remitente_zona || encomienda.cliente_zona);
  const senderPickupAddress = clean(encomienda.remitente_direccion || encomienda.cliente_direccion || cliente.cliente_direccion || cliente.cliente_direccion_fact || cliente.direccion || "");
  const receiverName = encomienda.destinatario || "-";
  const receiverDoc = encomienda.destinatario_documento || encomienda.destinatario_documento_id || "-";
  const receiverArrivalZone = clean(encomienda.destinatario_zona);
  const receiverAddress = clean(encomienda.destinatario_direccion);
  const unit = `${clean(encomienda.placa)} ${clean(encomienda.licencia)}`.trim() || "-";
  const payment = clean(encomienda.condicion_pago || venta.forma_pago_id || "PAGADO").toUpperCase();
  const paymentNormalized = payment.replace(/[^A-Z]/g, "");
  const isPaymentPending = paymentNormalized.includes("PORCOBRAR") || paymentNormalized.includes("PORPAGAR");
  const paymentLabel = isPaymentPending ? "POR PAGAR" : "PAGADO";
  const arrivalApprox = timePe(encomienda.llegada_aprox || venta.llegada_aprox || jsonTicket.llegada_aprox);
  const registeredBy = clean(
    encomienda.registrado_por_correo ||
    encomienda.ctrl_crea_us ||
    jsonTicket.ticket?.registrado_por_correo ||
    venta.registrado_por_correo ||
    "-"
  );
  const content = encomienda.descripcion || jsonTicket.items?.[0]?.producto || "SERVICIO DE TRANSPORTE DE ENCOMIENDA";

  const originOptionalLineHeight = 6.6;
  const senderZoneLines = senderOriginZone ? wrap(senderOriginZone, regular, 7.1, CW - 65, 2) : [];
  const senderPickupAddressLines = senderPickupAddress ? wrap(senderPickupAddress, regular, 7.1, CW - 65, 2) : [];
  const originOptionalLines = senderZoneLines.length + senderPickupAddressLines.length;
  const originBaseY = originOptionalLines ? 391 - ((originOptionalLines - 1) * originOptionalLineHeight) : 400;

  const destinationOptionalLineHeight = 6.6;
  const receiverZoneLines = receiverArrivalZone ? wrap(receiverArrivalZone, regular, 7.1, CW - 65, 2) : [];
  const receiverAddressLines = receiverAddress ? wrap(receiverAddress, regular, 7.1, CW - 65, 2) : [];
  const destinationOptionalLines = receiverZoneLines.length + receiverAddressLines.length;
  const destinationBaseY = destinationOptionalLines ? 294 - ((destinationOptionalLines - 1) * destinationOptionalLineHeight) : 302;

  const descriptionFontSize = 10.2;
  const descriptionLineHeight = 10;
  const descriptionLines = wrapPreservingBreaks(String(content).toUpperCase(), regular, descriptionFontSize, CW - 16, 8);
  const descriptionLineCount = Math.max(1, descriptionLines.length);
  const encomiendaTopY = 264;
  const encomiendaBaseY = 232 - ((descriptionLineCount - 1) * descriptionLineHeight) - 12;
  const encomiendaHeight = encomiendaTopY - encomiendaBaseY;
  const dynamicSummaryShift = encomiendaBaseY - 149;
  const qrText = [empresa.ruc, code, serie, number, issueDate, senderDoc, total].map(clean).join("|");
  const qrDataUrl = await QRCode.toDataURL(qrText || displayNumber || empresa.ruc || "XPERTCONT");
  const logoImage = await embedLogoEmisor(pdfDoc, empresa.ruc || empresa.documento_id);
  const qrImage = await pdfDoc.embedPng(base64ToBytes(qrDataUrl.split(",")[1]));

  if (logoImage) {
    const scale = Math.min(170 / logoImage.width, 56 / logoImage.height);
    const logoWidth = logoImage.width * scale;
    const logoHeight = logoImage.height * scale;
    page.drawImage(logoImage, {
      x: (W - logoWidth) / 2,
      y: H - logoHeight - 12,
      width: logoWidth,
      height: logoHeight,
    });
  } else {
    centered(page, "TRANSPORTE DE ENCOMIENDAS", 616, 10.5, bold);
  }

  const BODY_Y_OFFSET = -54;
  const bodyY = (value) => value + BODY_Y_OFFSET;
  const HEADER_HEIGHT_REDUCTION = 10;
  const afterHeaderY = (value) => bodyY(value + HEADER_HEIGHT_REDUCTION);
  const ORIGIN_HEIGHT_REDUCTION = 24 + Math.min(0, originBaseY - 394);
  const ORIGIN_TO_DATE_SHIFT = 11;
  const originY = (value) => afterHeaderY(value + ORIGIN_TO_DATE_SHIFT);
  const afterOriginY = (value) => afterHeaderY(value + ORIGIN_HEIGHT_REDUCTION + ORIGIN_TO_DATE_SHIFT);
  const ENCOMIENDA_Y_SHIFT = destinationBaseY - encomiendaTopY - 12;
  const SUMMARY_Y_SHIFT = dynamicSummaryShift + ENCOMIENDA_Y_SHIFT - 31;
  const encomiendaY = (value) => afterOriginY(value + ENCOMIENDA_Y_SHIFT);
  const summaryY = (value) => afterOriginY(value + SUMMARY_Y_SHIFT);
  const issuerAddress = empresa.domicilio_fiscal || empresa.direccion || empresa.direccion_fiscal || empresa.domicilio || empresa.direccion_completa || "";

  wrap(empresa.razon_social || empresa.nombre_comercial || "TRANSPORTE DE ENCOMIENDAS", regular, 7.8, CW, 2)
    .forEach((item, index) => centered(page, item, bodyY(576 - (index * 5.8)), 7.8, regular));
  centered(page, `RUC ${empresa.ruc || ""}`, bodyY(563), 13.8, regular);
  wrap(issuerAddress, regular, 7.4, CW, 2)
    .forEach((item, index) => centered(page, item, bodyY(550 - (index * 8.2)), 7.4, regular, MUTED));

  dotted(page, afterHeaderY(525));
  centered(page, documentName(code), afterHeaderY(514), 9.5, regular);
  centeredTracking(page, displayNumber || "MODELO", afterHeaderY(496), 16.8, regular, INK, 0.55, CW - 8);
  text(page, "FECHA", 39, afterHeaderY(487), 5.8, regular, MUTED, 29);
  text(page, datePe(issueDate), 68, afterHeaderY(484.5), 9.2, regular, INK, 52);
  line(page, afterHeaderY(485), 113, 113, 0.45);
  text(page, "HORA", 126, afterHeaderY(487), 5.8, regular, MUTED, 26);
  text(page, timePe(issueTime), 152, afterHeaderY(484.5), 9.2, regular, INK, 58);

  drawIcon(page, ICONS.place, M + 8, originY(448), 14, ICON_MUTED);
  text(page, "ORIGEN", M + 24, originY(440), 8.1, semibold, MUTED, 44);
  centeredTracking(page, String(origin).toUpperCase(), originY(440), 13.2, regular, INK, 0.12, CW - 18);
  line(page, originY(433), M + 8, W - M - 8, 0.45, LIGHT_LINE);
  text(page, "REMITENTE:", M + 8, originY(422), 7.2, semibold, MUTED, 43);
  text(page, senderName, M + 54, originY(421.4), 8.4, regular, INK, CW - 62);
  text(page, "DOC:", M + 8, originY(409), 7.2, semibold, MUTED, 20);
  text(page, senderDoc, M + 32, originY(408), 9.6, regular, INK, 65);
  text(page, "TEL:", M + 109, originY(409), 7.2, semibold, MUTED, 20);
  text(page, encomienda.cliente_telefono || "-", M + 132, originY(408), 9.6, regular, INK, 61);
  senderZoneLines.forEach((item, index) => {
    const y = 398 - (index * originOptionalLineHeight);
    text(page, index === 0 ? "ZONA ORIGEN:" : "", M + 8, originY(y), 6.3, semibold, MUTED, 46);
    text(page, item, M + 59, originY(y - 0.4), 7.1, regular, INK, CW - 61);
  });
  senderPickupAddressLines.forEach((item, index) => {
    const y = 398 - ((senderZoneLines.length + index) * originOptionalLineHeight);
    text(page, index === 0 ? "DIR RECOJO:" : "", M + 8, originY(y), 6.3, semibold, MUTED, 40);
    text(page, item, M + 53, originY(y - 0.4), 7.1, regular, INK, CW - 61);
  });

  drawIcon(page, ICONS.place, M + 8, afterOriginY(353), 14, ICON_MUTED);
  text(page, "DEST.", M + 25, afterOriginY(346), 8.1, semibold, MUTED, 52);
  centeredTracking(page, String(destination).toUpperCase(), afterOriginY(342), 17.6, regular, INK, 0.22, CW - 18);
  line(page, afterOriginY(333), M + 8, W - M - 8, 0.45, LIGHT_LINE);
  text(page, "DESTINATARIO:", M + 8, afterOriginY(322), 7.1, semibold, MUTED, 52);
  text(page, receiverName, M + 63, afterOriginY(321.8), 8.4, regular, INK, CW - 71);
  text(page, "DNI:", M + 8, afterOriginY(311), 7.1, semibold, MUTED, 20);
  text(page, receiverDoc, M + 32, afterOriginY(310.4), 9.2, regular, INK, 65);
  text(page, "TEL:", M + 109, afterOriginY(311), 7.1, semibold, MUTED, 20);
  text(page, encomienda.destinatario_telefono || "-", M + 132, afterOriginY(310.4), 11.2, regular, INK, 61);
  receiverZoneLines.forEach((item, index) => {
    const y = 300 - (index * destinationOptionalLineHeight);
    text(page, index === 0 ? "ZONA LLEGADA:" : "", M + 8, afterOriginY(y), 6.3, semibold, MUTED, 46);
    text(page, item, M + 59, afterOriginY(y - 0.4), 7.1, regular, INK, CW - 61);
  });
  receiverAddressLines.forEach((item, index) => {
    const y = 300 - ((receiverZoneLines.length + index) * destinationOptionalLineHeight);
    text(page, index === 0 ? "DIR LLEGADA:" : "", M + 8, afterOriginY(y), 6.3, semibold, MUTED, 45);
    text(page, item, M + 57, afterOriginY(y - 0.4), 7.1, regular, INK, CW - 61);
  });

  box(page, M, encomiendaY(encomiendaBaseY), CW, encomiendaHeight, SOFT, LIGHT_LINE, 0.45);
  drawIcon(page, ICONS.package, M + 8, encomiendaY(263), 14, ICON_MUTED);
  text(page, "ENCOMIENDA", M + 25, encomiendaY(249), 9.2, regular, MUTED, 58);
  text(page, "UNIDAD", M + 95, encomiendaY(249), 8.2, regular, MUTED, 26);
  text(page, unit, M + 128, encomiendaY(249.5), 8.2, regular, INK, 74);
  descriptionLines.forEach((item, index) => {
    text(page, item, M + 8, encomiendaY(232 - (index * descriptionLineHeight)), descriptionFontSize, regular, INK, CW - 16);
  });

  box(page, M, summaryY(114), CW, 62, WHITE, LIGHT_LINE, 0.75);
  page.drawImage(qrImage, { x: M + 8, y: summaryY(119), width: 53, height: 53 });
  page.drawLine({ start: { x: 75, y: summaryY(118) }, end: { x: 75, y: summaryY(173) }, thickness: 0.45, color: LIGHT_LINE, dashArray: [2, 3] });
  page.drawLine({ start: { x: 136, y: summaryY(118) }, end: { x: 136, y: summaryY(173) }, thickness: 0.45, color: LIGHT_LINE, dashArray: [2, 3] });
  drawPaymentStatusLarge(page, {
    isPending: isPaymentPending,
    label: paymentLabel,
    x: 77,
    y: summaryY(150),
    width: 58,
    bold,
    semibold,
  });
  centeredIn(page, "TOTAL", W - M - 7 - 67, summaryY(164), 67, 8, regular);
  centeredIn(page, "S/", W - M - 7 - 67, summaryY(149), 67, 9.8, regular);
  right(page, money(total), summaryY(127), 21, regular, INK, W - M - 7, 67);

  text(page, "TERMINOS Y CONDICIONES", M, summaryY(99), 6.5, regular);
  wrap("Conserva este ticket para seguimiento y entrega. No se aceptan reclamos por articulos no declarados o embalaje inadecuado.", regular, 6.1, 138, 3)
    .forEach((item, index) => text(page, item, M, summaryY(89 - (index * 6.8)), 6.1, regular, MUTED, 138));
  page.drawLine({ start: { x: 160, y: summaryY(72) }, end: { x: 160, y: summaryY(102) }, thickness: 0.45, color: LINE, dashArray: [2, 3] });
  text(page, "GRACIAS", 176, summaryY(96), 7, semibold, INK, 42);
  text(page, "POR CONFIAR", 176, summaryY(85), 6, regular, INK, 42);
  text(page, "EN NOSOTROS", 176, summaryY(77), 6, regular, INK, 42);

  centered(page, `HORA LLEGADA: ${arrivalApprox || "-"}`, summaryY(68), 8.8, semibold, INK, CW);
  centered(page, `REGISTRADO POR: ${registeredBy || "-"}`, summaryY(55), 6.8, regular, MUTED, CW);

  return pdfDoc.save();
};

export default async function crearTicketEncomiendaTributarioPdf({ encomienda = {}, empresa = {} }) {
  const jsonTicket = ticketPayloadDesdeFormulario({ encomienda, empresa });
  const pdfBytes = await generarPdfTicketEncomiendaTributario(jsonTicket);
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
