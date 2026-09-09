import React from 'react';
import { Box, Dialog, DialogTitle, TextField } from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import palette from '../../../theme/palette';
import AppButton from '../../ui/AppButton';

const fieldSx = {
  display: 'flex',
  width: 270,
  margin: '.5rem 0',
  '& .MuiInputBase-input': {
    color: palette.text,
    textAlign: 'center',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: palette.border,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: palette.accent,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: palette.accent,
  },
};

// Dialogo de clonado del producto base; solo captura el nuevo codigo/nombre y delega la accion.
export default function AdminProductoCloneDialog({
  open,
  isSmallScreen,
  idProducto,
  idProductoNuevo,
  nombreNuevo,
  onChange,
  onClose,
  onClonar,
}) {
  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      disableScrollLock
      PaperProps={{
        sx: {
          top: isSmallScreen ? '-30vh' : '0vh',
          left: isSmallScreen ? '-25%' : '0%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: '10vh',
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: 2,
          width: isSmallScreen ? '50%' : '30%',
        },
      }}
    >
      <Box sx={{ p: 1.5 }}>
        <DialogTitle sx={{ color: palette.text, textAlign: 'center', py: 1 }}>Emision</DialogTitle>

        <TextField
          variant="outlined"
          label="Original"
          fullWidth
          size="small"
          sx={fieldSx}
          name="id_producto"
          value={idProducto}
          onChange={onChange}
          inputProps={{ style: { color: palette.text } }}
          InputLabelProps={{ style: { color: palette.muted } }}
        />

        <TextField
          variant="outlined"
          label="Nuevo"
          fullWidth
          size="small"
          sx={fieldSx}
          name="id_producto_nuevo"
          value={idProductoNuevo}
          onChange={onChange}
          inputProps={{ style: { color: palette.text } }}
          InputLabelProps={{ style: { color: palette.muted } }}
        />

        <TextField
          variant="outlined"
          label="Nombre Nuevo"
          fullWidth
          size="small"
          sx={fieldSx}
          name="nombre_nuevo"
          value={nombreNuevo}
          onChange={onChange}
          inputProps={{ style: { color: palette.text } }}
          InputLabelProps={{ style: { color: palette.muted } }}
        />

        <AppButton
          icon={<TaskAltIcon sx={{ fontSize: 18 }} />}
          onClick={onClonar}
          sx={{
            margin: '.5rem 0',
            width: 270,
            backgroundColor: palette.accent,
            color: palette.surface,
            fontWeight: 800,
            '&:hover': {
              backgroundColor: '#7ddbd3',
              borderColor: '#7ddbd3',
              color: palette.surface,
            },
          }}
        >
          CLONAR
        </AppButton>

        <AppButton
          onClick={onClose}
          sx={{
            margin: '.5rem 0',
            width: 270,
            backgroundColor: palette.chip,
            color: palette.text,
            '&:hover': {
              backgroundColor: palette.surfaceAlt,
              borderColor: 'rgba(139,154,165,0.26)',
              color: palette.text,
            },
          }}
        >
          ESC - CERRAR
        </AppButton>
      </Box>
    </Dialog>
  );
}
