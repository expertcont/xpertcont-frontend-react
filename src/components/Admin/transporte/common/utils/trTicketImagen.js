import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const logos = require.context("../../../../../assets/images", false, /-logo\.(png|jpe?g)$/i);

const cargarLogo = async (documentoId) => {
  const ruc = String(documentoId || "").trim();
  const archivo = logos.keys().find((key) => key.replace(/^\.\//, "").toLowerCase().startsWith(`${ruc}-logo.`));
  if (!ruc || !archivo) return null;
  return new Promise((resolve) => {
    const imagen = new Image();
    const timer = window.setTimeout(() => resolve(null), 8000);
    imagen.onload = () => { window.clearTimeout(timer); resolve(imagen); };
    imagen.onerror = () => { window.clearTimeout(timer); resolve(null); };
    imagen.src = logos(archivo);
  });
};

const dibujarSelloEncomienda = async (page, viewport, context, documentoId) => {
  const logo = await cargarLogo(documentoId);
  if (!logo) return;
  const contenido = await page.getTextContent();
  const titulo = contenido.items.find((item) => item.str?.trim() === "ENCOMIENDA");
  const pie = contenido.items.find((item) => item.str?.trim() === "TOTAL");
  if (!titulo || !pie) return;
  const top = viewport.convertToViewportPoint(titulo.transform[4], titulo.transform[5])[1] - 8 * viewport.scale;
  // El recuadro de QR y total empieza 12 puntos por encima del rotulo TOTAL.
  const bottom = viewport.convertToViewportPoint(pie.transform[4], pie.transform[5])[1] - 16 * viewport.scale;
  const margen = 16 * viewport.scale;
  const ancho = viewport.width - margen * 2;
  const alto = bottom - top;
  if (alto <= 0 || ancho <= 0) return;
  // Reducir un 40% adicional el sello y conservar la alineacion derecha.
  const escala = (ancho * 0.85 * 0.6) / logo.naturalWidth;
  const width = logo.naturalWidth * escala;
  const height = logo.naturalHeight * escala;
  context.save();
  // Multiply conserva la tinta del texto al superponer el sello sobre el fondo blanco.
  context.globalCompositeOperation = "multiply";
  context.globalAlpha = 0.13;
  context.drawImage(logo, viewport.width - margen - width, top + (alto - height) / 2, width, height);
  context.restore();
};

const withTimeout = (promise, timeoutMs, message) => new Promise((resolve, reject) => {
  const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  promise.then(resolve).catch(reject).finally(() => window.clearTimeout(timer));
});

export const pdfBlobToPngBlob = async (pdfBlob, { selloEmpresaDocumentoId } = {}) => {
  const pdfData = await pdfBlob.arrayBuffer();
  const pdf = await withTimeout(
    pdfjsLib.getDocument({ data: pdfData }).promise,
    8000,
    "No se pudo leer el PDF del ticket."
  );
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await withTimeout(
    page.render({ canvasContext: context, viewport }).promise,
    8000,
    "No se pudo convertir el ticket a imagen."
  );
  if (selloEmpresaDocumentoId) {
    await dibujarSelloEncomienda(page, viewport, context, selloEmpresaDocumentoId);
  }
  return withTimeout(new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("No se pudo convertir el ticket a imagen."));
    }, "image/png");
  }), 8000, "No se pudo preparar la imagen del ticket.");
};
