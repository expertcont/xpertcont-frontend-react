import { useEffect, useState } from 'react';

/**
 * Visibilidad de «Grupos Color» en el menú lateral.
 * Estructura: contexto de navegación -> parámetros existentes -> habilitación.
 * `enabled` recibe la condición de rubro comercial y acceso administrativo del
 * menú; este hook agrega producto_sku === '1'. El servidor valida de nuevo el
 * rubro y SKU al acceder al mantenimiento o realizar operaciones.
 */
export default function useProductoGruposHabilitado(backHost, idAnfitrion, documentoId, enabled) {
  const [config, setConfig] = useState(null);
  // Vincula la respuesta con su empresa para no mostrar la opción con datos
  // de la selección anterior mientras se completa la siguiente consulta.
  const key = `${idAnfitrion}/${documentoId}`;
  useEffect(() => {
    setConfig(null);
    if (!enabled || !idAnfitrion || !documentoId) return undefined;
    // Cancela peticiones al cambiar de contexto o desmontar el menú.
    const controller = new AbortController();
    // Se reutiliza la consulta comercial existente para la visibilidad del menú.
    fetch(`${backHost}/ad_productoparametros/${encodeURIComponent(idAnfitrion)}/${encodeURIComponent(documentoId)}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('No se pudo consultar SKU'); return response.json(); })
      .then(data => { if (!controller.signal.aborted) setConfig({ key, habilitado: data?.producto_sku === '1' }); })
      .catch(() => { if (!controller.signal.aborted) setConfig(null); });
    return () => controller.abort();
  }, [backHost, idAnfitrion, documentoId, enabled, key]);
  return enabled && config?.key === key && config.habilitado;
}
