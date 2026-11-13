import React from 'react';
import { Box } from '@mui/material';
import DataTable from 'react-data-table-component';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import DaySelector from '../../AdminDias';
import TrHeader from '../../transporte/common/components/TrHeader';
import TrFiltros from '../../transporte/common/components/TrFiltros';
import { ensureAdminVentaTableTheme } from '../../venta/common/adminVentaTableTheme';
import { ventaDesktopTableStyles } from '../../venta/list/AdminVentaTableColumns';
import palette from '../../../../theme/palette';

const estilosTablaCompacta = {
  ...ventaDesktopTableStyles,
  rows: {
    ...ventaDesktopTableStyles.rows,
    style: { ...ventaDesktopTableStyles.rows.style, minHeight: '42px' },
  },
  cells: {
    style: { ...ventaDesktopTableStyles.cells.style, paddingTop: '2px', paddingBottom: '2px' },
  },
};

export default function AdminStockReportLayout({
  titulo, contadorTexto, buscarTexto, busqueda, onBuscar, acciones,
  filtros, contexto, columnas, registros, paginar = true, compacta = false, children,
}) {
  ensureAdminVentaTableTheme();

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', lg: 1280, xl: 1440 }, mx: 'auto', minWidth: 0, boxSizing: 'border-box', p: { xs: 1, md: 1.5, xl: 2 } }}>
      {children}
      <TrHeader
        titulo={titulo}
        contador={registros.length}
        contadorTexto={contadorTexto}
        buscarTexto={buscarTexto}
        valorBusqueda={busqueda}
        onBuscar={onBuscar}
        headerExtra={acciones}
        mostrarNuevo={false}
        compactControles
        sx={{ flexWrap: 'wrap', '& > *': { minWidth: 0, maxWidth: '100%' } }}
      />
      {filtros && (
        <>
          <TrFiltros
            periodoTrabajo={filtros.periodo}
            periodoSelect={filtros.periodos}
            contabilidadTrabajo={filtros.empresa}
            contabilidadSelect={filtros.empresas}
            onPeriodoSelect={(value) => {
              if (value !== 'default') filtros.onChange({ target: { name: 'periodo', value } });
            }}
            onContabilidadSelect={(value) => {
              if (value !== 'default') filtros.onChange({ target: { name: 'contabilidad', value } });
            }}
            compact
          />
          <Box sx={{ minWidth: 0, overflowX: 'auto' }}>
            <DaySelector period={filtros.periodo} onDaySelect={filtros.onDia} />
          </Box>
        </>
      )}
      {contexto}
      <Box sx={{
        mt: 1.15,
        minWidth: 0,
        overflow: 'hidden',
        borderRadius: palette.radius.listCard,
        backgroundColor: palette.surface,
        '& .rdt_TableWrapper': { maxWidth: '100%', overflowX: 'auto' },
      }}>
        <DataTable
          theme="solarized"
          columns={columnas}
          data={registros}
          customStyles={compacta ? estilosTablaCompacta : ventaDesktopTableStyles}
          pagination={paginar}
          paginationPerPage={15}
          paginationRowsPerPageOptions={[15, 50, 100]}
          paginationComponentOptions={{ rowsPerPageText: 'Filas por página:', rangeSeparatorText: 'de' }}
          sortIcon={<ArrowDownward />}
          highlightOnHover
          responsive
          noDataComponent="No hay registros para los filtros seleccionados"
        />
      </Box>
    </Box>
  );
}
