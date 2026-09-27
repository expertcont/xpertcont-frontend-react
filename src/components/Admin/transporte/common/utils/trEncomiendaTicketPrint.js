import axios from "axios";
import { PDFDocument, rgb } from "pdf-lib";

import palette from "../../../../../theme/palette";
import crearTicketEncomiendaPdf from "../../encomienda/modal/TrEncomiendaTicketPdf";
import crearTicketEncomiendaTributarioPdf from "../../encomienda/modal/TrEncomiendaTicketTributarioPdf";

const DESCARGAS_TICKET_BASE_URL = "https://xpertcont-backend-js-production-50e6.up.railway.app/descargas/";

export const direccionEmpresa = (datos = {}) => (
  datos.direccion ||
  datos.domicilio_fiscal ||
  datos.direccion_fiscal ||
  datos.domicilio ||
  datos.direccion_completa ||
  ""
);

export const prepararEmpresaTicket = (empresa = {}, documentoId = "") => {
  const direccion = direccionEmpresa(empresa);

  return {
    ...empresa,
    ruc: empresa.ruc || empresa.documento_id || documentoId,
    documento_id: empresa.documento_id || documentoId,
    nombre: empresa.nombre || empresa.razon_social,
    domicilio_fiscal: direccion,
    direccion,
  };
};

export const normalizarUrlDescargaTicket = (rutaPdf) => {
  const rutaTexto = String(rutaPdf || "").trim();

  if (!rutaTexto) return "";

  if (rutaTexto.startsWith(DESCARGAS_TICKET_BASE_URL)) {
    return rutaTexto;
  }

  const nombreArchivo = rutaTexto.split("/descargas/").pop()?.split("?")[0] || rutaTexto.split("/").pop();
  return `${DESCARGAS_TICKET_BASE_URL}${nombreArchivo}`;
};

export const combinarTicketsParaCorte = async (ticketUrl, ticketAdminUrl) => {
  const [ticketBytes, adminBytes] = await Promise.all([
    fetch(ticketUrl).then((response) => response.arrayBuffer()),
    fetch(ticketAdminUrl).then((response) => response.arrayBuffer()),
  ]);
  const [ticketDoc, adminDoc] = await Promise.all([
    PDFDocument.load(ticketBytes),
    PDFDocument.load(adminBytes),
  ]);
  const [ticketSize, adminSize] = [
    ticketDoc.getPage(0).getSize(),
    adminDoc.getPage(0).getSize(),
  ];
  const separatorHeight = 6;
  const ticketVisibleHeight = ticketSize.height;
  const width = Math.max(ticketSize.width, adminSize.width);
  const height = ticketVisibleHeight + adminSize.height + separatorHeight;
  const pdfDoc = await PDFDocument.create();
  const ticketPage = await pdfDoc.embedPage(ticketDoc.getPage(0), {
    left: 0,
    bottom: 0,
    right: ticketSize.width,
    top: ticketSize.height,
  });
  const [adminPage] = await pdfDoc.embedPdf(adminBytes, [0]);
  const page = pdfDoc.addPage([width, height]);
  const ticketX = (width - ticketSize.width) / 2;
  const adminX = (width - adminSize.width) / 2;

  page.drawPage(adminPage, {
    x: adminX,
    y: 0,
    width: adminSize.width,
    height: adminSize.height,
  });
  page.drawLine({
    start: { x: 12, y: adminSize.height + 3 },
    end: { x: width - 12, y: adminSize.height + 3 },
    thickness: 0.6,
    color: rgb(0.7, 0.72, 0.75),
    dashArray: [4, 4],
  });
  page.drawPage(ticketPage, {
    x: ticketX,
    y: adminSize.height + separatorHeight,
    width: ticketSize.width,
    height: ticketVisibleHeight,
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
};

export const generarTicketEncomiendaPdfUrl = async ({
  backHost,
  periodoTrabajo,
  idAnfitrion,
  documentoId,
  encomiendaBase = {},
  draft = {},
  rutasDisponibles = [],
  puntoVentaOrigenNombre = "",
  empresa = {},
  admin = false,
  cacheBust = true,
  local = true,
} = {}) => {
  const rCod = encomiendaBase?.r_cod || draft.r_cod;
  const rSerie = encomiendaBase?.r_serie || draft.r_serie;
  const rNumero = encomiendaBase?.r_numero || draft.r_numero;
  const elemento = encomiendaBase?.elemento || draft.elemento || 1;
  const rutaTicket = rutasDisponibles.find((ruta) => String(ruta.id_ruta) === String(encomiendaBase?.id_ruta || draft.id_ruta));
  const encomiendaTicket = {
    ...draft,
    ...encomiendaBase,
    r_cod: rCod,
    r_serie: rSerie,
    r_numero: rNumero,
    elemento,
    punto_venta_nombre: (
      encomiendaBase?.punto_venta_nombre ||
      rutaTicket?.punto_venta_nombre ||
      puntoVentaOrigenNombre ||
      encomiendaBase?.id_punto_venta ||
      draft.id_punto_venta
    ),
    punto_venta_dest_nombre: (
      encomiendaBase?.punto_venta_dest_nombre ||
      encomiendaBase?.punto_venta_destino_nombre ||
      encomiendaBase?.destino_nombre ||
      rutaTicket?.punto_venta_dest_nombre ||
      rutaTicket?.punto_venta_destino_nombre ||
      rutaTicket?.destino_nombre ||
      encomiendaBase?.id_punto_venta_dest ||
      draft.id_punto_venta_dest
    ),
  };

  if (!rCod || !rSerie || !rNumero) {
    throw new Error("El ticket necesita serie y numero real del comprobante.");
  }

  if (local) {
    const crearTicketLocal = admin ? crearTicketEncomiendaPdf : crearTicketEncomiendaTributarioPdf;

    return crearTicketLocal({
      encomienda: encomiendaTicket,
      empresa: prepararEmpresaTicket(empresa, documentoId),
    });
  }

  const response = await axios.post(`${backHost}/mve_transventa/ticket/encomienda${admin ? "/admin" : ""}`, {
    periodo: periodoTrabajo,
    id_anfitrion: idAnfitrion,
    documento_id: documentoId,
    r_cod: rCod,
    r_serie: rSerie,
    r_numero: rNumero,
    elemento,
    endpoint_pdf: admin ? "/cpesunatticketencomienda" : "/cpesunatticketencomienda/v2",
    rubro: "TRANS_ENCOMIENDA",
  });
  const rutaPdf = response.data?.ruta_pdf;

  if (!rutaPdf || rutaPdf === "error") {
    throw new Error(response.data?.message || response.data?.respuesta_sunat_descripcion || "No se pudo generar el ticket.");
  }

  const urlDescarga = normalizarUrlDescargaTicket(rutaPdf);
  return cacheBust ? `${urlDescarga}${urlDescarga.includes("?") ? "&" : "?"}t=${Date.now()}` : urlDescarga;
};

export const generarTicketEncomiendaImpresionConAdminUrl = async (opciones = {}) => {
  const [ticketUrl, ticketAdminUrl] = await Promise.all([
    generarTicketEncomiendaPdfUrl({ ...opciones, admin: false, cacheBust: false, local: true }),
    generarTicketEncomiendaPdfUrl({ ...opciones, admin: true, cacheBust: false, local: true }),
  ]);

  try {
    return await combinarTicketsParaCorte(ticketUrl, ticketAdminUrl);
  } finally {
    if (ticketUrl.startsWith("blob:")) URL.revokeObjectURL(ticketUrl);
    if (ticketAdminUrl.startsWith("blob:")) URL.revokeObjectURL(ticketAdminUrl);
  }
};

export const imprimirTicketEncomienda = async ({
  modo = "completo",
  ticketWindow: ticketWindowParam,
  ...opciones
} = {}) => {
  const modoImpresion = ["completo", "admin", "cliente"].includes(modo) ? modo : "completo";
  const esAdmin = modoImpresion === "admin";
  const esCliente = modoImpresion === "cliente";
  const ticketBase = opciones.encomiendaBase || {};

  if (!ticketBase.r_cod || !ticketBase.r_serie || !ticketBase.r_numero) {
    throw new Error("El ticket con logo y QR necesita serie y numero real del comprobante.");
  }

  const ticketWindow = ticketWindowParam || window.open("about:blank", "_blank");

  try {
    ticketWindow?.document?.write(`<p style="font-family:Arial,sans-serif;color:${palette.text}">Generando ticket...</p>`);

    const urlConBypassCache = esAdmin
      ? await generarTicketEncomiendaPdfUrl({ ...opciones, admin: true })
      : esCliente
        ? await generarTicketEncomiendaPdfUrl({ ...opciones, admin: false })
        : await generarTicketEncomiendaImpresionConAdminUrl(opciones);

    if (ticketWindow) {
      ticketWindow.location.href = urlConBypassCache;
      return;
    }

    window.open(urlConBypassCache, "_blank", "noopener,noreferrer");
  } catch (error) {
    ticketWindow?.close();
    throw error;
  }
};
