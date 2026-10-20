import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { Calendar, ReceiptText } from 'lucide-react';
import palette from '../../../../theme/palette';
import { esVentaAnulada } from './adminVentaListFilters';

const textoSecundario = { color: palette.muted, fontSize: '10.5px', lineHeight: 1.3 };
const textoPrincipal = { color: palette.text, fontSize: '12px', fontWeight: 800, lineHeight: 1.3 };
const tipos = { '01': 'Factura', '03': 'Boleta', '07': 'Nota de crédito', '08': 'Nota de débito', NV: 'Venta interna' };
const codigoDocumento = (row) => String(['07', '08'].includes(row.r_cod) ? row.r_cod : row.r_cod_ref || row.r_cod || row.comprobante?.split('-')[0] || '').trim();
export const esNotaCredito = (row) => codigoDocumento(row) === '07';
export const montoDocumento = (row) => {
  const monto = Number(row.r_monto_total) || 0;
  return esNotaCredito(row) ? -Math.abs(monto) : monto;
};
const numero = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneda = (row) => String(row.r_moneda || 'PEN').trim().toUpperCase();
const fecha = (value) => {
  if (!value) return '—';
  const [anio, mes, dia] = String(value).slice(0, 10).split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : String(value);
};

export const estadoSunatVenta = (row) => {
  if (esVentaAnulada(row)) return { label: 'Anulado', color: palette.danger, soft: palette.dangerSoft };
  if (codigoDocumento(row) === 'NV') return { label: 'Interno', color: palette.muted, soft: palette.chip };
  const nivel = String(row.cdr_nivel || '').toUpperCase();
  if (nivel === 'RECHAZADO') return { label: 'Rechazado', color: palette.danger, soft: palette.dangerSoft };
  if (String(row.cdr_pendiente) === '1' || ['PENDIENTE', 'ERROR', 'INCIERTO'].includes(nivel)) {
    return { label: nivel === 'ERROR' ? 'Error de envío' : nivel === 'INCIERTO' ? 'Por consultar' : 'Pendiente', color: palette.warning, soft: palette.warningSoft };
  }
  if (nivel === 'ACEPTADO' || row.r_vfirmado) return { label: 'Aceptado', color: palette.success, soft: palette.successSoft };
  if (row.numero_rdi) return { label: 'En resumen', color: palette.accent, soft: palette.accentSoft };
  return { label: 'Pendiente', color: palette.warning, soft: palette.warningSoft };
};

export const numeroComprobanteVisible = (row) => String(row.comprobante || '').replace(/^(?:\d{2}|NV|NP)-/, '') || 'Sin número';

function ComprobanteCell({ row, onVer, renderSunat }) {
  const nc = esNotaCredito(row);
  const sunat = renderSunat?.(row);
  const referencia = nc
    ? (String(row.r_cod) === '07'
      ? [row.r_serie_ref, row.r_numero_ref].filter(Boolean).join('-')
      : String(row.comprobante_ref || [row.r_serie, row.r_numero].filter(Boolean).join('-')).replace(/^(?:\d{2}|NV|NP)-/, ''))
    : '';
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '38px minmax(0, 1fr)', columnGap: 0.85, width: '100%', minWidth: 0, alignItems: 'center' }}>
      <Box sx={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: palette.radius.control, border: `1px solid ${palette.borderSoft}`, backgroundColor: palette.surfaceAlt, color: palette.accent }}>
        {sunat || <ReceiptText size={22} />}
      </Box>
      <Box sx={{ minWidth: 0, display: 'grid', gap: 0.2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.65, minWidth: 0 }}>
          <Typography component="button" type="button" onClick={() => onVer(row)} title="Ver comprobante"
            sx={{ display: 'block', minWidth: 0, maxWidth: '100%', p: 0, border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', ...textoPrincipal, fontSize: '13px', fontWeight: 900, lineHeight: 1.12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', '&:hover': { color: palette.accent, textDecoration: 'underline' }, '&:focus-visible': { outline: `2px solid ${palette.accent}`, outlineOffset: 2 } }}>
            {numeroComprobanteVisible(row)}
          </Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, color: palette.muted, flexShrink: 0 }}>
            <Calendar size={12} />
            <Typography sx={{ fontSize: '10.5px', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap' }}>{fecha(row.r_fecemi)}</Typography>
          </Box>
        </Box>
        <Typography sx={{ color: palette.muted, fontSize: '10.5px', fontWeight: 600, lineHeight: 1.1, opacity: 0.78, textTransform: 'uppercase' }}>{tipos[codigoDocumento(row)] || 'Comprobante'}</Typography>
        <Typography sx={{ color: nc ? palette.danger : palette.text, fontSize: '16px', fontWeight: '1000 !important', WebkitTextStroke: '0.32px currentColor', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', lineHeight: 1, mt: 0.35 }}>{numero(montoDocumento(row))} {moneda(row)}</Typography>
        {nc && <Typography sx={{ ...textoSecundario, mt: 0.35, overflowWrap: 'anywhere' }}>
          Ref: {referencia || 'Sin referencia'}{row.r_fecemi_ref ? ` · ${fecha(row.r_fecemi_ref)}` : ''}
        </Typography>}
      </Box>
    </Box>
  );
}

function ClienteCell({ row }) {
  return <Box sx={{ minWidth: 0, width: '100%' }}>
    <Typography title={row.r_razon_social || ''} sx={{ ...textoPrincipal, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}>{row.r_razon_social || 'Sin cliente'}</Typography>
    <Typography sx={{ ...textoSecundario, mt: 0.2 }}>{row.r_documento_id || 'Sin documento'}</Typography>
  </Box>;
}

function PagosCell({ row }) {
  if (esNotaCredito(row)) {
    return <Typography sx={textoSecundario}>No aplica a NC</Typography>;
  }
  const pagos = [
    { label: 'EFECTIVO', monto: Number(row.efectivo) },
    { label: String(row.forma_pago2 || 'OTROS').trim().toUpperCase(), monto: Number(row.efectivo2) },
  ].filter((pago) => Number.isFinite(pago.monto) && pago.monto !== 0);

  if (!pagos.length) return <Typography sx={textoSecundario}>Sin pagos registrados</Typography>;

  return <Box sx={{ display: 'grid', gap: 0.25, minWidth: 0, width: '100%' }}>
    {pagos.map((pago, index) => <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5, minWidth: 0 }}>
      <Typography title={pago.label} sx={{ color: palette.muted, fontSize: '10px', lineHeight: 1.2, minWidth: 0 }} noWrap>{pago.label}</Typography>
      <Typography sx={{ color: palette.text, fontSize: '11px', fontWeight: 800, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{numero(pago.monto)} {moneda(row)}</Typography>
    </Box>)}
  </Box>;
}

export const columnaPagosVenta = { id: 'pagos', name: 'Pagos', width: '160px', cell: row => <PagosCell row={row} /> };

function EstadoCell({ row }) {
  const estado = estadoSunatVenta(row);
  return <Box sx={{ minWidth: 0, width: '100%' }}>
    <Tooltip title={row.cdr_descripcion || estado.label} arrow>
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.45, px: 0.75, py: 0.35, borderRadius: '6px', backgroundColor: estado.soft, color: estado.color, fontSize: '10px', fontWeight: 800, whiteSpace: 'nowrap' }}>
        <Box component="span" sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'currentColor' }} />{estado.label}
      </Box>
    </Tooltip>
    {row.numero_rdi && <Typography title={row.numero_rdi} sx={{ ...textoSecundario, fontSize: '9px', mt: 0.35 }} noWrap>RDI {row.numero_rdi}</Typography>}
  </Box>;
}

export function AdminVentaTableDetails({ data: row }) {
  const nc = esNotaCredito(row);
  const campos = [
    ['Referencia', row.comprobante_ref], ['Emisión de referencia', fecha(row.r_fecemi_ref)],
    ['Moneda', row.r_moneda], ['Tipo de cambio', row.r_tc],
    ['Efectivo', nc ? 'No aplica a NC' : row.efectivo == null ? '—' : `${moneda(row)} ${numero(row.efectivo)}`],
    [row.forma_pago2 || 'Otro medio de pago', nc ? 'No aplica a NC' : row.efectivo2 == null ? '—' : `${moneda(row)} ${numero(row.efectivo2)}`],
    ['Guía de remisión', row.gre_ref], ['Firma GRE', row.gre_vfirmado],
    ['Creado por', row.ctrl_crea_us], ['Fecha de registro', row.ctrl_crea ? String(row.ctrl_crea).replace('T', ' ').slice(0, 19) : null],
  ];
  return <Box sx={{ px: 2, py: 1.5, backgroundColor: palette.surfaceAlt, borderBottom: `1px solid ${palette.borderSoft}` }}>
    <Typography sx={{ ...textoPrincipal, mb: 1 }}>Detalle de {row.comprobante}</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1.2 }}>
      {campos.map(([label, value]) => <Box key={label} sx={{ minWidth: 0 }}>
        <Typography sx={{ ...textoSecundario, fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>{label}</Typography>
        <Typography sx={{ color: palette.text, fontSize: '11px', overflowWrap: 'anywhere' }}>{value == null || value === '' ? '—' : value}</Typography>
      </Box>)}
    </Box>
    <Typography sx={{ ...textoSecundario, mt: 1.25, overflowWrap: 'anywhere' }}>SUNAT: {row.cdr_descripcion || 'Sin respuesta registrada'}</Typography>
  </Box>;
}

export const crearColumnaDetalleVenta = (onDetalle) => ({
  id: 'detalle', name: 'Resumen', minWidth: '200px', grow: 1.3, ignoreRowClick: true,
  cell: (row) => <Box sx={{ width: '100%', minWidth: 0, display: 'grid', gap: 0.3 }}>
    {(row.detalle_resumen || []).map((item, index) => <Typography key={index}
      title={item.descripcion || ''} sx={{ ...textoSecundario, color: palette.text }} noWrap>
      {item.cantidad == null ? '' : `${Number(item.cantidad)} × `}{item.descripcion || 'Sin descripción'}
    </Typography>)}
    {Number(row.detalle_cantidad) > 0
      ? <Typography component="button" type="button" onClick={() => onDetalle(row)}
        sx={{ border: 0, p: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', color: palette.accent, fontSize: '10.5px', lineHeight: 1.3, '&:hover': { textDecoration: 'underline' } }}>
        Ver detalle · {row.detalle_cantidad} {Number(row.detalle_cantidad) === 1 ? 'producto' : 'productos'}
      </Typography>
      : <Typography sx={textoSecundario}>Sin detalle registrado</Typography>}
  </Box>,
});

export const crearColumnasVenta = ({ onVer, onDetalle, renderSunat, renderAcciones }) => [
  { id: 'comprobante', name: 'Comprobante', selector: row => row.comprobante || '', sortable: true, width: '270px', cell: row => <ComprobanteCell row={row} onVer={onVer} renderSunat={renderSunat} /> },
  { id: 'acciones', name: 'Acciones', width: '150px', center: true, ignoreRowClick: true, allowOverflow: true, cell: renderAcciones },
  { id: 'cliente', name: 'Cliente', selector: row => row.r_razon_social || '', sortable: true, minWidth: '200px', grow: 1.8, cell: row => <ClienteCell row={row} /> },
  crearColumnaDetalleVenta(onDetalle),
  columnaPagosVenta,
  { id: 'sunat', name: 'Estado SUNAT', selector: row => estadoSunatVenta(row).label, sortable: true, minWidth: '125px', grow: 0.8, cell: row => <EstadoCell row={row} /> },
  { id: 'registro', name: 'Registrado por', selector: row => row.ctrl_crea_us || '', sortable: true, minWidth: '145px', grow: 0.9, cell: row => <Typography title={row.ctrl_crea_us || ''} sx={{ ...textoSecundario, fontSize: '10px', overflowWrap: 'anywhere' }}>{row.ctrl_crea_us || 'Sin usuario'}</Typography> },
];

export const ventaDesktopTableStyles = {
  table: { style: { backgroundColor: palette.surface } },
  tableWrapper: { style: { border: `1px solid ${palette.borderSoft}`, borderRadius: palette.radius.listCard, backgroundColor: palette.surface, overflow: 'hidden' } },
  responsiveWrapper: { style: { borderRadius: palette.radius.listCard } },
  headRow: { style: { minHeight: '38px', backgroundColor: palette.surfaceAlt, borderBottom: `1px solid ${palette.borderSoft}` } },
  headCells: { style: { color: palette.muted, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', paddingLeft: '10px', paddingRight: '10px' } },
  rows: { style: { minHeight: '72px', backgroundColor: palette.surface, color: palette.text, borderBottom: `1px solid ${palette.borderSoft}` }, highlightOnHoverStyle: { backgroundColor: palette.rowHover, color: palette.text, transition: 'background-color .15s ease' } },
  cells: { style: { paddingLeft: '10px', paddingRight: '10px', paddingTop: '8px', paddingBottom: '8px' } },
  expanderCell: { style: { flex: '0 0 32px', minWidth: '32px', padding: 0 } },
  expanderButton: { style: { color: palette.muted, '&:focus-visible': { outline: `2px solid ${palette.accent}` } } },
  pagination: { style: { backgroundColor: palette.surface, color: palette.muted, borderTop: `1px solid ${palette.borderSoft}`, borderRadius: `0 0 ${palette.radius.listCard} ${palette.radius.listCard}` } },
};
