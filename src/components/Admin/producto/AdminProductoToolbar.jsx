import React from 'react';
import { Box, Grid, InputBase, Tooltip } from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';
import FindIcon from '@mui/icons-material/FindInPage';
import FolderDeleteIcon from '@mui/icons-material/FolderDelete';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';

import BotonExcelGeneral from '../../BotonExcelGeneral';
import AppButton from '../../ui/AppButton';
import palette from '../../../theme/palette';
import AdminFileProducto from './AdminFileProducto';

const toolbarSurfaceSx = {
  backgroundColor: palette.surface,
  border: `1px solid ${palette.borderSoft}`,
  borderRadius: 2,
  px: { xs: 1, md: 1.5 },
  py: { xs: 0.9, md: 1.25 },
};

const actionButtonSx = {
  height: 40,
  minWidth: { xs: 38, sm: 106 },
  px: { xs: 0, sm: 1.25 },
  backgroundColor: 'rgba(139,154,165,0.08)',
  border: '1px solid transparent',
  color: 'rgba(139,154,165,0.92)',
  fontSize: '12px',
  fontWeight: 700,
  boxShadow: 'none',
  '& svg': {
    color: 'inherit',
  },
  '&:hover': {
    backgroundColor: 'rgba(139,154,165,0.13)',
    borderColor: 'transparent',
    color: palette.text,
    transform: 'translateY(-1px)',
  },
};

const primaryActionSx = {
  ...actionButtonSx,
  color: 'rgba(125,219,211,0.88)',
  '&:hover': {
    backgroundColor: 'rgba(42,161,152,0.12)',
    borderColor: 'transparent',
    color: '#bff5ef',
    transform: 'translateY(-1px)',
  },
};

const dangerActionSx = {
  ...actionButtonSx,
  color: 'rgba(255,177,153,0.86)',
  backgroundColor: 'rgba(255,159,122,0.05)',
  '&:hover': {
    backgroundColor: 'rgba(255,159,122,0.10)',
    borderColor: 'transparent',
    color: '#ffc6b1',
    transform: 'translateY(-1px)',
  },
};

const excelWrapSx = {
  height: 40,
  minWidth: { xs: 38, sm: 96 },
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 2,
  backgroundColor: 'rgba(139,154,165,0.08)',
  border: '1px solid transparent',
  color: 'rgba(139,154,165,0.92)',
  transition: 'all .18s ease',
  '& button, & .MuiIconButton-root': {
    color: 'inherit',
    width: 38,
    height: 38,
  },
  '& svg': {
    color: 'inherit',
  },
  '&:hover': {
    backgroundColor: 'rgba(42,161,152,0.12)',
    borderColor: 'transparent',
    color: '#bff5ef',
    transform: 'translateY(-1px)',
  },
};

const searchSx = {
  width: '100%',
  height: 42,
  px: 1.15,
  display: 'flex',
  alignItems: 'center',
  gap: 0.85,
  color: palette.text,
  backgroundColor: palette.bg,
  border: '1px solid rgba(139,154,165,0.14)',
  borderRadius: 2,
  '&:focus-within': {
    borderColor: 'rgba(42,161,152,0.42)',
  },
};

const inputSx = {
  color: palette.text,
  fontSize: '13px',
  width: '100%',
  '& input': {
    color: palette.text,
    fontSize: '13px',
  },
  '& input::placeholder': {
    color: palette.muted,
    opacity: 1,
  },
};

// Barra operativa del modulo: concentra acciones, importacion Excel y busqueda rapida.
export default function AdminProductoToolbar({
  isSmallScreen,
  registrosdet,
  datosCarga,
  valorVista,
  onNuevo,
  onDescargarPlantilla,
  onEliminarMasivo,
  onImportOk,
  onFiltroChange,
}) {
  return (
    <Grid container spacing={1} alignItems="center" justifyContent="flex-start" sx={toolbarSurfaceSx}>
      <Grid item xs={isSmallScreen ? 4 : 'auto'}>
        <Tooltip title="AGREGAR NUEVO">
          <AppButton icon={<AddBoxIcon sx={{ fontSize: 17 }} />} onClick={onNuevo} sx={primaryActionSx}>
            {isSmallScreen ? '' : 'Nuevo'}
          </AppButton>
        </Tooltip>
      </Grid>

      <Grid item xs={isSmallScreen ? 4 : 'auto'}>
        <Tooltip title="EXPORTAR XLS">
          <Box sx={excelWrapSx}>
            <BotonExcelGeneral
              datos={registrosdet}
              nombreArchivo="Reporte_Productos"
              tituloReporte="Reporte de Productos"
              columnasNumericas={['porc_igv', 'precio_venta', 'cantidad']}
              columnasExcluidas={['auxiliar', 'origen']}
            />
          </Box>
        </Tooltip>
      </Grid>

      <Grid item xs={isSmallScreen ? 4 : 'auto'}>
        <Tooltip title="DESCARGA XLS VACIO">
          <AppButton icon={<KeyboardDoubleArrowDownIcon sx={{ fontSize: 17 }} />} onClick={onDescargarPlantilla} sx={actionButtonSx}>
            {isSmallScreen ? '' : 'Plantilla'}
          </AppButton>
        </Tooltip>
      </Grid>

      <Grid item xs={isSmallScreen ? 4 : 'auto'}>
        <Tooltip title="ELIMINAR MASIVO">
          <AppButton icon={<FolderDeleteIcon sx={{ fontSize: 17 }} />} onClick={onEliminarMasivo} sx={dangerActionSx}>
            {isSmallScreen ? '' : 'Eliminar'}
          </AppButton>
        </Tooltip>
      </Grid>

      <Grid item xs={isSmallScreen ? 12 : true}>
        <AdminFileProducto
          datosCarga={datosCarga}
          onActualizaImportaOK={onImportOk}
          urlApiDestino={valorVista === 'productos' ? '/ad_productoexcel' : '/ad_productoprecioexcel'}
        />
      </Grid>

      <Grid item xs={12}>
        <Box sx={searchSx}>
          <FindIcon sx={{ color: palette.muted, fontSize: 20, flex: '0 0 auto' }} />
          <InputBase
            fullWidth
            sx={inputSx}
            name="busqueda"
            placeholder="Filtrar por producto, descripcion u origen"
            onChange={onFiltroChange}
          />
        </Box>
      </Grid>
    </Grid>
  );
}
