import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import palette from '../../../../theme/palette';
import { esNotaCredito, montoDocumento, numeroComprobanteVisible } from './AdminVentaTableColumns';

const monto = (value) => value == null ? '—' : Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const columnas = 'minmax(0, 1fr) 75px 100px 110px';

export default function AdminVentaDetalleDialog({ venta, periodo, documentoId, idAnfitrion, backHost, onClose }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setItems([]);
    setError('');
    const segmentos = [periodo, idAnfitrion, documentoId, venta.r_cod, venta.r_serie, venta.r_numero, venta.elemento];
    axios.get(`${backHost}/ad_ventadet/${segmentos.map(encodeURIComponent).join('/')}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Respuesta de detalle inválida');
        if (!controller.signal.aborted) setItems(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('No se pudo cargar el detalle de la venta.');
      })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [backHost, periodo, idAnfitrion, documentoId, venta, intento]);

  const moneda = venta.r_moneda || 'PEN';
  const nc = esNotaCredito(venta);
  return <Dialog open onClose={onClose} maxWidth="md" fullWidth disableScrollLock
    aria-labelledby="venta-detalle-titulo"
    PaperProps={{ sx: { m: { xs: 1, sm: 3 }, width: { xs: 'calc(100% - 16px)', sm: '100%' }, maxHeight: '90dvh', backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.borderSoft}`, borderRadius: palette.radius.listCard } }}>
    <DialogTitle id="venta-detalle-titulo" sx={{ borderBottom: `1px solid ${palette.borderSoft}` }}>
      <Typography component="span" sx={{ fontSize: '16px' }}>Detalle de {numeroComprobanteVisible(venta)}</Typography>
      <Typography sx={{ color: palette.muted, fontSize: '12px', mt: 0.5, overflowWrap: 'anywhere' }}>{venta.r_razon_social || 'Sin cliente'} · {moneda}</Typography>
    </DialogTitle>
    <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      {cargando ? <Box role="status" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, py: 4 }}><CircularProgress size={22} /><Typography>Cargando productos…</Typography></Box>
        : error ? <Alert severity="error" action={<Button onClick={() => setIntento(value => value + 1)}>Reintentar</Button>}>{error}</Alert>
          : !items.length ? <Typography sx={{ color: palette.muted, py: 3 }}>Sin detalle registrado.</Typography>
            : <Box>
              <Box sx={{ display: { xs: 'none', sm: 'grid' }, gridTemplateColumns: columnas, gap: 1, py: 1, color: palette.muted }}>
                {['Producto', 'Cantidad', 'P. unitario', 'Importe'].map((label, index) => <Typography key={label} sx={{ fontSize: '11px', textAlign: index ? 'right' : 'left' }}>{label}</Typography>)}
              </Box>
              {items.map((item, index) => <Box key={item.item ?? index} sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', sm: columnas }, gap: 1, py: 1.5, borderBottom: `1px solid ${palette.borderSoft}`, alignItems: 'start' }}>
                <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' }, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '12px', overflowWrap: 'anywhere' }}>{item.descripcion || 'Sin descripción'}</Typography>
                  {item.id_producto && <Typography sx={{ color: palette.muted, fontSize: '10.5px', overflowWrap: 'anywhere', mt: 0.3 }}>{item.id_producto}</Typography>}
                </Box>
                {[
                  ['Cantidad', item.cantidad == null ? '—' : Number(item.cantidad)],
                  ['P. unitario', monto(item.precio_unitario)],
                  ['Importe', monto(item.precio_neto == null ? null : nc ? -Math.abs(Number(item.precio_neto)) : item.precio_neto)],
                ].map(([label, value]) => <Box key={label} sx={{ minWidth: 0, textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography sx={{ display: { xs: 'block', sm: 'none' }, color: palette.muted, fontSize: '10px' }}>{label}</Typography>
                  <Typography sx={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>{value}</Typography>
                </Box>)}
              </Box>)}
            </Box>}
    </DialogContent>
    <DialogActions sx={{ px: 2.5, py: 1.5, justifyContent: 'space-between', borderTop: `1px solid ${palette.borderSoft}`, gap: 1 }}>
      <Typography sx={{ color: nc ? palette.danger : palette.text, fontVariantNumeric: 'tabular-nums', fontSize: '14px' }}>Total: {monto(montoDocumento(venta))} {moneda}</Typography>
      <Button onClick={onClose} sx={{ color: palette.accent }}>Cerrar</Button>
    </DialogActions>
  </Dialog>;
}
