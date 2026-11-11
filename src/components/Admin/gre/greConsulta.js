// API propia del panel comercial; no usa las operaciones de emisión de ventas.
export const greComprobante = (row) => [row.cod, row.serie, row.numero].filter(Boolean).join("-");

export const tieneVenta = (row) => Boolean(row.ref_venta && row.ref_venta.replace(/[-\s]/g, ""));

export const destinatarioGre = (row) => row.destinatario_razon_social || row.detinatario_razon_social || "Sin destinatario";

export const estadoGre = (row) => row.estado || (row.vfirmado ? "Firmada" : "Sin firma registrada");

export const fechaGre = (value) => {
  const fecha = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha.split("-").reverse().join("/") : "—";
};

export async function consultarGre(backHost, segments, signal) {
  const response = await fetch(`${backHost}/${segments.map(encodeURIComponent).join("/")}`, { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo consultar la información.");
  return data;
}

export const rutaGreComercial = (idAnfitrion, idInvitado, documentoId) => ["comercial", "gre", idAnfitrion, idInvitado, documentoId];

export async function apiGre(backHost, segments, { signal, method = "GET", body, query } = {}) {
  const url = `${backHost}/${segments.map(encodeURIComponent).join("/")}${query ? `?${new URLSearchParams(query)}` : ""}`;
  const response = await fetch(url, { signal, method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo procesar la guía comercial.");
  return data;
}
