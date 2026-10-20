import React, { useState } from 'react';
import { Box, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import AppButton from '../../ui/AppButton';
import palette from '../../../theme/palette';
import { ProductoField, ProductoSection, actionSx } from './ProductoFields';
import { integer, money, revisarRangos, unitPrice } from './productoMantenimiento';

export default function ProductoRangosEditor({ rangos, onChange, readOnly }) {
  const [cantidad, setCantidad] = useState('18');
  const error = revisarRangos(rangos);
  const cantidadValida = Number.isSafeInteger(Number(cantidad)) && Number(cantidad) > 0;
  const matches = rangos.filter(r => Number(cantidad) >= Number(r.cant_min) && Number(cantidad) <= Number(r.cant_max));
  const rango = !error && cantidadValida && matches.length === 1 ? matches[0] : null;
  const update = (index, field, value) => onChange(rangos.map((r, i) => i === index ? { ...r, [field]: value } : r));
  const agregar = () => {
    const ultimo = rangos.length ? Math.max(...rangos.map(r => Number(r.cant_max) || 0)) : 0;
    onChange([...rangos, { unidades: rangos.length ? '' : '1', precio_venta: '', cant_min: ultimo + 1, cant_max: '' }]);
  };
  return <>
    <ProductoSection title="Precios por cantidad" description="El precio de referencia se divide entre sus unidades. El rango indica cuándo se aplica; no exige vender múltiplos de la referencia.">
      <TableContainer sx={{ '& .MuiTableCell-root': { borderColor: palette.borderSoft, color: palette.text, px: 0.8, py: 1 }, '& .MuiTableCell-head': { color: palette.muted, fontSize: 10.5, fontWeight: 800, bgcolor: palette.surfaceAlt } }}>
        <Table size="small" sx={{ minWidth: 690 }} aria-label="Rangos de precios del producto">
          <TableHead><TableRow>{['Desde', 'Hasta', 'Unidades ref.', 'Precio ref. (S/)', 'S/ por unidad', ''].map((text, i) => <TableCell key={i}>{text}</TableCell>)}</TableRow></TableHead>
          <TableBody>{rangos.map((r, index) => <TableRow key={index}>
            {['cant_min', 'cant_max', 'unidades', 'precio_venta'].map((field, i) => <TableCell key={field} sx={{ minWidth: 115 }}>
              <ProductoField label={`${['Desde', 'Hasta', 'Unidades ref.', 'Precio ref.'][i]} · ${index + 1}`} value={r[field]} type="number" min={field === 'precio_venta' ? 0 : 1}
                step={field === 'precio_venta' ? '0.01' : 1} readOnly={readOnly} onChange={value => update(index, field, value)} />
            </TableCell>)}
            <TableCell sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{Number(r.unidades) > 0 && r.precio_venta !== '' ? unitPrice(Number(r.precio_venta) / Number(r.unidades)) : '—'}</TableCell>
            <TableCell><IconButton aria-label={`Eliminar rango ${index + 1}`} disabled={readOnly} onClick={() => onChange(rangos.filter((_, i) => i !== index))} sx={{ ...actionSx, color: palette.danger }}><Trash2 size={14} /></IconButton></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </TableContainer>
      {!rangos.length && <Typography sx={{ py: 2, color: palette.muted, fontSize: 12 }}>Este producto todavía no tiene precios por cantidad.</Typography>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
        <AppButton icon={<Plus size={16} />} disabled={readOnly} onClick={agregar}>Agregar rango</AppButton>
        <Typography sx={{ color: error ? palette.warning : palette.success, fontSize: 11.5 }}>{error || `${rangos.length} rangos consecutivos · hasta ${integer(Math.max(...rangos.map(r => Number(r.cant_max))))} unidades`}</Typography>
      </Box>
      <Typography sx={{ color: palette.muted, fontSize: 11.5, mt: 1 }}>Todas las cantidades son enteras. Conserva una referencia de 1 unidad para el selector de venta.</Typography>
    </ProductoSection>
    <ProductoSection title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Calculator size={16} />Probar una cantidad</Box>} description="Comprueba el rango y el importe antes de guardar.">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '170px 1fr' }, gap: 2, alignItems: 'center' }}>
        <ProductoField label="Cantidad de venta" value={cantidad} onChange={setCantidad} type="number" step={1} min={1} />
        {rango ? <Box sx={{ bgcolor: palette.accentSoft, borderRadius: 2, p: 1.5 }}>
          <Typography sx={{ color: palette.muted, fontSize: 12 }}>Rango {integer(rango.cant_min)}–{integer(rango.cant_max)} · {money(rango.precio_venta)} por {integer(rango.unidades)} unidades</Typography>
          <Typography sx={{ fontSize: 12, mt: 0.4 }}>S/ {unitPrice(Number(rango.precio_venta) / Number(rango.unidades))} por unidad</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: palette.accent, mt: 0.4 }}>{money(Number(cantidad) * Number(rango.precio_venta) / Number(rango.unidades))}</Typography>
        </Box> : <Typography role="status" sx={{ color: palette.warning, fontSize: 12 }}>{!cantidadValida ? 'Ingresa una cantidad entera mayor que cero.' : error ? 'Completa y corrige los rangos para simular la venta.' : 'Esta cantidad no tiene un rango de precios configurado.'}</Typography>}
      </Box>
    </ProductoSection>
  </>;
}
