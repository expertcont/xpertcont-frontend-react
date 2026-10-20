export const esVentaAnulada = (row) => Number(row.registrado ?? 1) === 0;

export const esVentaPendienteSunat = (row) => {
  const codigo = String(row.r_cod_ref || row.r_cod || '').trim();
  if (esVentaAnulada(row) || !['01', '03', '07', '08'].includes(codigo)) return false;
  const nivel = String(row.cdr_nivel || '').trim().toUpperCase();
  return String(row.cdr_pendiente || '') === '1'
    || ['PENDIENTE', 'ERROR', 'INCIERTO'].includes(nivel)
    || (!row.r_vfirmado && !row.numero_rdi && nivel !== 'ACEPTADO');
};

export const filtrarVentas = (rows, busqueda, estado) => {
  const texto = busqueda.trim().toLowerCase();
  return rows.filter((row) => {
    if (estado === 'sunat' && !esVentaPendienteSunat(row)) return false;
    if (estado === 'anulados' && !esVentaAnulada(row)) return false;
    return !texto || [row.r_razon_social, row.r_documento_id, row.comprobante, row.detalle_busqueda]
      .some((valor) => String(valor || '').toLowerCase().includes(texto));
  });
};
