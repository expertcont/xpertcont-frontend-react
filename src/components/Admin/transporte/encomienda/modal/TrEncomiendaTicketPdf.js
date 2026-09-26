import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

const W = 226.77;
const H = 360;
const M = 12;
const CW = W - (M * 2);

const LAYOUT = {
  logo: {
    maxWidth: 170,
    maxHeight: 56,
    topMargin: 12,
    issuerGap: 8,
  },
  issuer: {
    fallbackTopGap: 18,
    fallbackIssuerGap: 8,
    razonSize: 7.8,
    razonLineHeight: 5.8,
    rucGap: 12,
    rucSize: 9.2,
    addressGap: 18,
    addressSize: 6.5,
    addressLineHeight: 7.2,
    cpeGap: 32,
  },
  cpe: {
    titleGap: 8,
    titleSize: 10.4,
    numberGap: 23,
    numberSize: 16.8,
    // Las etiquetas FECHA/HORA se dibujan en la misma linea base que su valor
    // (mismo gap). Antes iban 3pt mas arriba y se leian flotando al lado del dato.
    dateLabelGap: 33,
    dateLabelSize: 7.4,
    dateValueGap: 33,
    dateValueSize: 9.2,
  },
  delivery: {
    topGap: 42,
    iconX: M + 10,
    iconGap: 4,
    iconSize: 16,
    destinationGap: 6,
    destinationSize: 16.2,
    detailsGap: 22,
    detailsLabelX: M + 8,
    detailsTextX: M + 40,
    detailsLabelSize: 8.2,
    detailsTextSize: 12.4,
    detailsLineHeight: 12.6,
    detailsLabelYOffset: 1.2,
    detailsAfterGap: 4,
  },
  recipient: {
    separatorYOffset: 5,
    labelGap: 8,
    labelSize: 8.2,
    nameGap: 24,
    nameSize: 12.4,
    nameLineHeight: 11.8,
    phoneGap: 1.8,
    phoneSize: 9.2,
    phoneLineHeight: 10,
    descriptionGap: 4,
    descriptionSize: 7.8,
    descriptionLineHeight: 9.2,
    descriptionMaxLines: 2,
  },
  qr: {
    size: 111,
    minBottom: 58,
    preferredBottom: 74,
    minSize: 86,
    preferredY: 118,
    gapAbove: 0,
    emailGap: 9,
    emailSize: 6.8,
  },
};

const INK = rgb(0.03, 0.035, 0.045);
const MUTED = rgb(0.34, 0.35, 0.37);
const LINE = rgb(0.7, 0.71, 0.73);
const ICON_MUTED = rgb(0.48, 0.5, 0.53);
const ALERT = rgb(0.82, 0.12, 0.12);

const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

const ticketPayloadDesdeFormulario = ({ encomienda = {}, empresa = {} }) => ({
  empresa: {
    ruc: empresa.ruc || empresa.documento_id || encomienda.documento_id || "",
    razon_social: empresa.razon_social || empresa.nombre || empresa.nombre_comercial || "TRANSPORTE DE ENCOMIENDAS",
    nombre_comercial: empresa.nombre_comercial || empresa.razon_social || empresa.nombre || "TRANSPORTE DE ENCOMIENDAS",
    domicilio_fiscal: empresa.domicilio_fiscal || empresa.direccion || "",
    direccion: empresa.direccion || empresa.domicilio_fiscal || "",
  },
  venta: {
    codigo: encomienda.r_cod || "03",
    serie: encomienda.r_serie || "",
    numero: encomienda.r_numero || "",
    fecha_emision: encomienda.r_fecemi || "",
    hora_emision: encomienda.ctrl_crea || encomienda.hora_grabacion || encomienda.llegada_aprox || "",
    llegada_aprox: encomienda.llegada_aprox || "",
    forma_pago_id: encomienda.condicion_pago || "PAGADO",
    total: encomienda.r_monto_total || encomienda.precio_neto || 0,
  },
  cliente: {
    razon_social_nombres: encomienda.cliente || "",
    documento_identidad: encomienda.cliente_documento || encomienda.cliente_documento_id || "",
    cliente_direccion: encomienda.cliente_direccion || encomienda.remitente_direccion || "",
    cliente_direccion_fact: encomienda.cliente_direccion_fact || "",
  },
  encomienda,
  ticket: {
    registrado_por_correo: encomienda.registrado_por_correo || encomienda.ctrl_crea_us || "",
  },
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
  const hourNumber = Number(hour);
  if (!Number.isFinite(hourNumber)) return text;

  const suffix = hourNumber >= 12 ? "PM" : "AM";
  const hour12 = hourNumber % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
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
      continue;
    }

    if (line) lines.push(line);
    line = word;
    if (lines.length >= maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (!lines.length) return [""];
  lines[lines.length - 1] = fit(lines[lines.length - 1], font, size, maxWidth);
  return lines;
};

const base64ToUint8Array = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const text = (page, value, x, y, size, font, color = INK, maxWidth = null) => {
  page.drawText(maxWidth ? fit(value, font, size, maxWidth) : clean(value), { x, y, size, font, color });
};

const centered = (page, value, y, size, font, color = INK, maxWidth = CW) => {
  const label = fit(value, font, size, maxWidth);
  const width = font.widthOfTextAtSize(label, size);
  page.drawText(label, { x: (W - width) / 2, y, size, font, color });
};

const line = (page, y, x1 = M, x2 = W - M, thickness = 0.55, color = LINE) => {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
};

const dotted = (page, y, x1 = M, x2 = W - M) => {
  for (let x = x1; x < x2; x += 5) {
    page.drawCircle({ x, y, size: 0.65, color: LINE });
  }
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

const drawIcon = (page, pathData, x, y, size = 12, color = ICON_MUTED) => {
  page.drawSvgPath(pathData, { x, y, scale: size / 24, color });
};

const ICONS = {
  place: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
};

const generarPdfTicketEncomienda = async (logo, jsonTicket) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([W, H]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const semibold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const empresa = jsonTicket.empresa || {};
  const venta = jsonTicket.venta || {};
  const encomienda = jsonTicket.encomienda || {};
  const code = venta.codigo || encomienda.r_cod || "03";
  const serie = venta.serie || encomienda.r_serie || "";
  const number = venta.numero || encomienda.r_numero || "";
  const fullNumber = [code, serie, number].filter(Boolean).join("-");
  const displayNumber = [serie, number].filter(Boolean).join("-") || fullNumber;
  const issueDate = venta.fecha_emision || encomienda.r_fecemi;
  const issueTime = venta.hora_emision || encomienda.ctrl_crea || encomienda.hora_grabacion;
  const arrivalApprox = timePe(encomienda.llegada_aprox || venta.llegada_aprox);
  const payment = clean(encomienda.condicion_pago || venta.forma_pago_id || "PAGADO").toUpperCase();
  const paymentNormalized = payment.replace(/[^A-Z]/g, "");
  const isPaymentPending = paymentNormalized.includes("PORCOBRAR") || paymentNormalized.includes("PORPAGAR");
  const paymentLabel = isPaymentPending ? "POR PAGAR" : "CANCELADO";
  const destination = (
    encomienda.punto_venta_dest_nombre ||
    encomienda.punto_venta_destino_nombre ||
    encomienda.destino_nombre ||
    encomienda.id_punto_venta_dest ||
    "DESTINO"
  );
  const senderName = encomienda.cliente || jsonTicket.cliente?.razon_social_nombres || "-";
  const senderPhone = clean(encomienda.cliente_telefono);
  const receiverName = encomienda.destinatario || "-";
  const receiverPhone = clean(encomienda.destinatario_telefono);
  const receiverDescription = clean(encomienda.descripcion);
  const receiverArrivalZone = clean(encomienda.destinatario_zona);
  const receiverAddress = clean(encomienda.destinatario_direccion);
  const registeredByEmail = clean(
    encomienda.registrado_por_correo ||
    encomienda.ctrl_crea_us ||
    jsonTicket.ticket?.registrado_por_correo ||
    ""
  );
  const receiverNameLines = wrap(String(receiverName).toUpperCase(), semibold, 15.2, CW - 16, 2);
  const receiverZoneLines = receiverArrivalZone ? wrap(receiverArrivalZone.toUpperCase(), semibold, 12.4, CW - 16, 2) : [];
  const receiverAddressLines = receiverAddress ? wrap(receiverAddress.toUpperCase(), semibold, 12.4, CW - 16, 4) : [];
  const qrText = displayNumber || [code, serie, number].filter(Boolean).join("-");
  const qrDataUrl = await QRCode.toDataURL(qrText || displayNumber || empresa.ruc || "XPERTCONT");
  const qrImage = await pdfDoc.embedPng(base64ToUint8Array(qrDataUrl.split(",")[1]));

  let issuerTopY = H - 74;
  if (logo) {
    const scale = Math.min(LAYOUT.logo.maxWidth / logo.width, LAYOUT.logo.maxHeight / logo.height);
    const logoWidth = logo.width * scale;
    const logoHeight = logo.height * scale;
    const logoX = (W - logoWidth) / 2;
    const logoY = H - logoHeight - LAYOUT.logo.topMargin;
    issuerTopY = logoY - LAYOUT.logo.issuerGap;
    page.drawImage(logo, {
      x: logoX,
      y: logoY,
      width: logoWidth,
      height: logoHeight,
    });
  } else {
    issuerTopY = H - LAYOUT.issuer.fallbackTopGap - LAYOUT.issuer.fallbackIssuerGap;
  }

  const cpeTopY = issuerTopY - LAYOUT.issuer.cpeGap;
  const issuerAddress = empresa.domicilio_fiscal || empresa.direccion || empresa.direccion_fiscal || empresa.domicilio || empresa.direccion_completa || "";

  wrap(empresa.razon_social || empresa.nombre_comercial || "TRANSPORTE DE ENCOMIENDAS", regular, 7.8, CW, 2)
    .forEach((item, index) => centered(page, item, issuerTopY - (index * LAYOUT.issuer.razonLineHeight), LAYOUT.issuer.razonSize, regular));
  centered(page, `RUC ${empresa.ruc || ""}`, issuerTopY - LAYOUT.issuer.rucGap, LAYOUT.issuer.rucSize, regular);
  wrap(issuerAddress, regular, LAYOUT.issuer.addressSize, CW, 2)
    .forEach((item, index) => centered(page, item, issuerTopY - LAYOUT.issuer.addressGap - (index * LAYOUT.issuer.addressLineHeight), LAYOUT.issuer.addressSize, regular, MUTED));

  dotted(page, cpeTopY + 5);
  centered(page, "DATOS DE ENTREGA", cpeTopY - LAYOUT.cpe.titleGap, LAYOUT.cpe.titleSize, semibold);
  centeredTracking(page, displayNumber || "MODELO", cpeTopY - LAYOUT.cpe.numberGap, LAYOUT.cpe.numberSize, regular, INK, 0.55, CW - 8);
  text(page, "FECHA", 39, cpeTopY - LAYOUT.cpe.dateLabelGap, LAYOUT.cpe.dateLabelSize, regular, MUTED, 29);
  text(page, datePe(issueDate), 68, cpeTopY - LAYOUT.cpe.dateValueGap, LAYOUT.cpe.dateValueSize, regular, INK, 52);
  line(page, cpeTopY - 40, 113, 113, 0.45);
  text(page, "HORA", 126, cpeTopY - LAYOUT.cpe.dateLabelGap, LAYOUT.cpe.dateLabelSize, regular, MUTED, 26);
  text(page, timePe(issueTime), 152, cpeTopY - LAYOUT.cpe.dateValueGap, LAYOUT.cpe.dateValueSize, regular, INK, 58);

  const deliveryTopY = cpeTopY - LAYOUT.delivery.topGap;
  drawIcon(page, ICONS.place, LAYOUT.delivery.iconX - 5, deliveryTopY - LAYOUT.delivery.iconGap + 10, LAYOUT.delivery.iconSize, ICON_MUTED);
  centeredTracking(page, String(destination).toUpperCase(), deliveryTopY - LAYOUT.delivery.destinationGap, LAYOUT.delivery.destinationSize, semibold, INK, 0.22, CW - 18);

  let cursorY = deliveryTopY - LAYOUT.delivery.detailsGap;
  receiverZoneLines.forEach((item, index) => {
    text(page, index === 0 ? "ZONA:" : "", LAYOUT.delivery.detailsLabelX, cursorY + LAYOUT.delivery.detailsLabelYOffset, LAYOUT.delivery.detailsLabelSize, semibold, MUTED, 28);
    text(page, item, LAYOUT.delivery.detailsTextX, cursorY, LAYOUT.delivery.detailsTextSize, semibold, INK, CW - 48);
    cursorY -= LAYOUT.delivery.detailsLineHeight;
  });
  receiverAddressLines.forEach((item, index) => {
    text(page, index === 0 ? "DIR:" : "", LAYOUT.delivery.detailsLabelX, cursorY + LAYOUT.delivery.detailsLabelYOffset, LAYOUT.delivery.detailsLabelSize, semibold, MUTED, 25);
    text(page, item, LAYOUT.delivery.detailsTextX, cursorY, LAYOUT.delivery.detailsTextSize, semibold, INK, CW - 48);
    cursorY -= LAYOUT.delivery.detailsLineHeight;
  });

  cursorY -= receiverZoneLines.length || receiverAddressLines.length ? LAYOUT.delivery.detailsAfterGap : 0;
  dotted(page, cursorY + LAYOUT.recipient.separatorYOffset);
  centered(page, "DESTINATARIO", cursorY - LAYOUT.recipient.labelGap, LAYOUT.recipient.labelSize, semibold, MUTED);
  cursorY -= LAYOUT.recipient.nameGap;
  receiverNameLines.forEach((item) => {
    centered(page, item, cursorY, LAYOUT.recipient.nameSize, regular, INK, CW - 16);
    cursorY -= LAYOUT.recipient.nameLineHeight;
  });
  if (receiverPhone) {
    cursorY -= LAYOUT.recipient.phoneGap;
    centered(page, `TEL: ${receiverPhone}`, cursorY, LAYOUT.recipient.phoneSize, semibold, INK, CW - 16);
    cursorY -= LAYOUT.recipient.phoneLineHeight;
  }

  if (receiverDescription) {
    cursorY -= LAYOUT.recipient.descriptionGap;
    const descriptionLines = wrap(
      `DESCRIPCIÓN: ${receiverDescription.toUpperCase()}`,
      regular,
      LAYOUT.recipient.descriptionSize,
      CW - 16,
      LAYOUT.recipient.descriptionMaxLines,
    );
    descriptionLines.forEach((item, index) => {
      centered(
        page,
        item,
        cursorY - (index * LAYOUT.recipient.descriptionLineHeight),
        LAYOUT.recipient.descriptionSize,
        regular,
        MUTED,
        CW - 16,
      );
    });
    cursorY -= descriptionLines.length * LAYOUT.recipient.descriptionLineHeight;
  }

  const qrAvailableHeight = cursorY - LAYOUT.qr.gapAbove - LAYOUT.qr.preferredBottom;
  const qrSize = Math.max(LAYOUT.qr.minSize, Math.min(LAYOUT.qr.size, qrAvailableHeight));
  const qrY = Math.max(
    LAYOUT.qr.minBottom,
    Math.min(LAYOUT.qr.preferredY, cursorY - LAYOUT.qr.gapAbove - qrSize)
  );
  page.drawImage(qrImage, { x: (W - qrSize) / 2, y: qrY, width: qrSize, height: qrSize });
  centered(page, `REM: ${senderName}`, qrY - 8, 7.5, regular, MUTED, CW - 12);
  centered(page, `TEL: ${senderPhone || "-"}`, qrY - 18, 9, semibold, INK, CW - 12);
  centered(page, paymentLabel, qrY - 33, 16.5, semibold, isPaymentPending ? ALERT : INK, CW);
  centered(page, `HORA LLEGADA: ${arrivalApprox || "-"}`, qrY - 49, 8.8, semibold, INK, CW);
  if (registeredByEmail) {
    centered(page, `REGISTRADO POR: ${registeredByEmail}`, qrY - 58, 6.8, regular, MUTED, CW);
  }

  return pdfDoc.save();
};

export default async function crearTicketEncomiendaPdf({ encomienda = {}, empresa = {} }) {
  const jsonTicket = ticketPayloadDesdeFormulario({ encomienda, empresa });
  const pdfBytes = await generarPdfTicketEncomienda(null, jsonTicket);
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
