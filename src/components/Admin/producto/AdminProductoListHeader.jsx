import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import palette from '../../../theme/palette';

// Cabecera visual del modulo: muestra contexto y controla si el listado ve productos o precios.
export default function AdminProductoListHeader({ valorVista, onVistaChange }) {
  return (
    <Box sx={{ display: 'grid', gap: 1, mb: 1.4 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: palette.text, fontSize: '20px', fontWeight: 800, lineHeight: 1.1 }}>
          Productos
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: '12px', mt: 0.35 }}>
          Catalogo comercial y rangos de precios
        </Typography>
      </Box>

      <ToggleButtonGroup
        value={valorVista}
        exclusive
        onChange={onVistaChange}
        aria-label="Vista de productos"
        sx={{
          justifySelf: 'start',
          backgroundColor: 'rgba(139,154,165,0.06)',
          border: '1px solid rgba(139,154,165,0.14)',
          borderRadius: 2,
          p: 0.25,
          '& .MuiToggleButtonGroup-grouped': {
            minWidth: { xs: 0, sm: 118 },
            height: 32,
            border: 0,
            borderRadius: '16px !important',
            color: 'rgba(139,154,165,0.92)',
            px: 1.15,
            fontSize: '11.5px',
            fontWeight: 750,
            textTransform: 'none',
            letterSpacing: 0,
            transition: 'all .18s ease',
            '&:hover': {
              backgroundColor: 'rgba(139,154,165,0.08)',
              color: palette.text,
            },
          },
          '& .Mui-selected, & .Mui-selected:hover': {
            backgroundColor: 'rgba(42,161,152,0.10)',
            color: '#bff5ef',
            boxShadow: 'inset 0 0 0 1px rgba(125,219,211,0.10)',
          },
        }}
      >
        <ToggleButton value="productos">Productos</ToggleButton>
        <ToggleButton value="precios">Rango de Precios</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
