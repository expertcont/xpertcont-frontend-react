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

// Para reportes, incluir todas las paginas en una imagen continua.
export const pdfReporteToPngBlob = async (pdfBlob) => {
  const pdf = await pdfjsLib.getDocument({ data: await pdfBlob.arrayBuffer() }).promise;
  try {
    const paginas = [];
    let altoTotal = 0;
    let anchoMaximo = 0;
    for (let numero = 1; numero <= pdf.numPages; numero += 1) {
      const page = await pdf.getPage(numero);
      const viewport = page.getViewport({ scale: 1 });
      paginas.push({ page, viewport });
      altoTotal += viewport.height;
      anchoMaximo = Math.max(anchoMaximo, viewport.width);
    }
    const escala = Math.min(1.7, 16000 / altoTotal, 4000 / anchoMaximo);
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(anchoMaximo * escala);
    canvas.height = Math.ceil(altoTotal * escala);
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    let y = 0;
    for (const { page } of paginas) {
      const viewport = page.getViewport({ scale: escala });
      const paginaCanvas = document.createElement("canvas");
      paginaCanvas.width = Math.ceil(viewport.width);
      paginaCanvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: paginaCanvas.getContext("2d"), viewport }).promise;
      context.drawImage(paginaCanvas, 0, y);
      y += viewport.height;
      paginaCanvas.width = 0;
      paginaCanvas.height = 0;
    }
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo preparar la imagen del reporte.")), "image/png");
    });
  } finally {
    await pdf.destroy();
  }
};

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
