import React from 'react';
import { Box, Typography } from '@mui/material';
import { Ban, CloudUpload, Filter, ReceiptText, Users } from 'lucide-react';
import TrHeader from '../../transporte/common/components/TrHeader';
import TrFiltros from '../../transporte/common/components/TrFiltros';
import DaySelector from '../../AdminDias';
import palette from '../../../../theme/palette';

function ResumenCard({ label, value, icon: Icon, color, soft, active, filter, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={filter ? active : undefined}
      sx={{
        minWidth: 0, width: '100%', minHeight: 57, textAlign: 'left', fontFamily: 'inherit',
        display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: 0.7, alignItems: 'center',
        px: { xs: 0.95, sm: 1.05 }, py: 0.75,
        border: `1px solid ${active ? color : palette.borderSoft}`,
        borderRadius: palette.radius.listCard, backgroundColor: palette.surface,
        boxShadow: active ? `0 0 0 1px ${color}` : 'none', cursor: 'pointer',
        transition: 'border-color .16s ease, background-color .16s ease, box-shadow .16s ease',
        '&:hover': { borderColor: color, backgroundColor: soft },
        '&:focus-visible': { outline: `2px solid ${color}`, outlineOffset: 2 },
      }}
    >
      <Box sx={{ width: 28, height: 28, borderRadius: palette.radius.control, display: 'grid', placeItems: 'center', backgroundColor: soft, color }}>
        <Icon size={15} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: palette.muted, fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase' }} noWrap>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ color: palette.text, fontSize: '16px', lineHeight: 1.05, fontWeight: '1000 !important', WebkitTextStroke: '0.16px currentColor' }} noWrap>{value}</Typography>
          {active && <Filter size={12} color={color} />}
        </Box>
      </Box>
    </Box>
  );
}

export default function AdminVentaListToolbar({
  contador, busqueda, onBuscar, onNuevo, acciones,
  periodo, periodos, contabilidad, contabilidades, onChange, onDia,
  filtro, onFiltro, pendientes, anulados, totalVentas, puedeVerTotales, onTotal, onRecords,
}) {
  return (
    <Box sx={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
      <TrHeader
        titulo="Registro de Ventas" contador={contador} contadorTexto="comprobantes visibles"
        nuevoTexto="Nueva venta" buscarTexto="RUC, cliente, comprobante o producto"
        valorBusqueda={busqueda} onBuscar={onBuscar} onNuevo={onNuevo}
        compactControles headerExtra={acciones}
        sx={{
          width: '100%', minWidth: 0, maxWidth: '100%', flexWrap: 'wrap',
          '& > *': { minWidth: 0, maxWidth: '100%' },
        }}
      />
      <TrFiltros
        periodoTrabajo={periodo} periodoSelect={periodos}
        contabilidadTrabajo={contabilidad} contabilidadSelect={contabilidades}
        puntosVentaAsignados={[]} compact
        onPeriodoSelect={(value) => onChange({ target: { name: 'periodo', value } })}
        onContabilidadSelect={(value) => onChange({ target: { name: 'contabilidad', value } })}
      />
      <Box sx={{ width: '100%', minWidth: 0, maxWidth: '100%', overflowX: 'auto' }}>
        <DaySelector period={periodo} onDaySelect={onDia} />
      </Box>
      <Box sx={{ mt: 1.15, mb: 1.1, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: `repeat(${puedeVerTotales ? 4 : 2}, minmax(0, 1fr))` }, gap: 0.65 }}>
        <ResumenCard label="Pendientes SUNAT" value={pendientes} icon={CloudUpload} color="#0891b2" soft="rgba(8,145,178,0.14)" filter active={filtro === 'sunat'} onClick={() => onFiltro('sunat')} />
        <ResumenCard label="Anulados" value={anulados} icon={Ban} color={palette.danger} soft={palette.dangerSoft} filter active={filtro === 'anulados'} onClick={() => onFiltro('anulados')} />
        {puedeVerTotales && <>
          <ResumenCard label="Ventas Total" value={`S/ ${Number(totalVentas || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={ReceiptText} color={palette.accent} soft={palette.accentSoft} onClick={onTotal} />
          <ResumenCard label="RECORDS" value="Por usuario" icon={Users} color={palette.accent} soft={palette.accentSoft} onClick={onRecords} />
        </>}
      </Box>
    </Box>
  );
}
