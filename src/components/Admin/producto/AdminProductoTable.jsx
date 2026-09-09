import React from 'react';
import { Box } from '@mui/material';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Checkbox from '@mui/material/Checkbox';
import DataTable, { createTheme } from 'react-data-table-component';
import palette from '../../../theme/palette';

createTheme(
  'productoDark',
  {
    text: { primary: palette.text, secondary: palette.accent },
    background: { default: 'transparent' },
    divider: { default: palette.borderSoft },
    action: { hover: 'rgba(42,161,152,0.06)' },
  },
  'dark',
);

const customStyles = {
  table: { style: { backgroundColor: 'transparent' } },
  headRow: {
    style: {
      backgroundColor: palette.surfaceAlt,
      color: palette.muted,
      borderBottom: `1px solid ${palette.borderSoft}`,
      minHeight: '38px',
    },
  },
  headCells: {
    style: {
      color: palette.muted,
      fontSize: '11px',
      fontWeight: 800,
      textTransform: 'uppercase',
    },
  },
  rows: {
    style: {
      backgroundColor: palette.surface,
      color: palette.text,
      borderBottom: `1px solid ${palette.borderSoft}`,
      minHeight: '42px',
    },
    highlightOnHoverStyle: {
      backgroundColor: palette.surfaceAlt,
      color: palette.text,
      borderBottomColor: palette.border,
    },
  },
  cells: {
    style: {
      color: palette.text,
      fontSize: '12.5px',
      minWidth: 0,
    },
  },
  pagination: {
    style: {
      backgroundColor: 'transparent',
      borderTop: `1px solid ${palette.borderSoft}`,
      color: palette.muted,
    },
  },
};

// Tabla del catalogo: concentra configuracion visual y mantiene limpia la pantalla contenedora.
export default function AdminProductoTable({ columns, data, onSelectedRowsChange, clearSelectedRows }) {
  return (
    <Box
      sx={{
        backgroundColor: palette.surface,
        border: `1px solid ${palette.borderSoft}`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <DataTable
        theme="productoDark"
        columns={columns}
        data={data}
        customStyles={customStyles}
        highlightOnHover
        onSelectedRowsChange={onSelectedRowsChange}
        clearSelectedRows={clearSelectedRows}
        pagination
        paginationPerPage={15}
        paginationRowsPerPageOptions={[15, 50, 100]}
        selectableRowsComponent={Checkbox}
        sortIcon={<ArrowDownward />}
        dense
      />
    </Box>
  );
}
