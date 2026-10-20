export const BACK_HOST = process.env.BACK_HOST || 'https://xpertcont-backend-js-production-50e6.up.railway.app';
export const money = value => `S/ ${Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const unitPrice = value => Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
export const integer = value => Number(value || 0).toLocaleString('es-PE', { maximumFractionDigits: 0 });

export async function requestProducto(path, options) {
  const response = await fetch(`${BACK_HOST}${path}`, options);
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  if (!response.ok) throw new Error(data?.message || data?.error || 'No se pudo completar la operación.');
  return data;
}

export function revisarRangos(rangos) {
  if (!rangos.length) return 'Agrega al menos un rango de precios.';
  const usadas = new Set();
  for (const [i, rango] of rangos.entries()) {
    for (const campo of ['unidades', 'cant_min', 'cant_max']) {
      const n = Number(rango[campo]);
      if (!Number.isSafeInteger(n) || n < 1 || n > (campo === 'unidades' ? 2147483647 : 999999999999)) return `Rango ${i + 1}: las cantidades deben ser enteros positivos dentro del límite permitido.`;
    }
    if (Number(rango.cant_min) > Number(rango.cant_max)) return `Rango ${i + 1}: el mínimo no puede superar al máximo.`;
    if (usadas.has(Number(rango.unidades))) return 'No repitas las unidades de referencia.';
    usadas.add(Number(rango.unidades));
    if (!/^\d+(\.\d{1,2})?$/.test(String(rango.precio_venta)) || Number(rango.precio_venta) > 999999999999.99) return `Rango ${i + 1}: el precio debe ser positivo o cero y tener hasta dos decimales.`;
  }
  if (!usadas.has(1)) return 'Incluye una referencia de 1 unidad para que el producto aparezca en el selector de venta.';
  let siguiente = 1;
  for (const rango of [...rangos].sort((a, b) => Number(a.cant_min) - Number(b.cant_min))) {
    if (Number(rango.cant_min) !== siguiente) return 'Los rangos deben comenzar en 1 y ser consecutivos, sin huecos ni superposiciones.';
    siguiente = Number(rango.cant_max) + 1;
  }
  return '';
}
