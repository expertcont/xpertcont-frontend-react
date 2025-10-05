import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useMediaQuery
} from "@mui/material";
import { CheckCircle, Warning, Info, Error as ErrorIcon } from "@mui/icons-material";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const icons = {
  success: <CheckCircle color="success" sx={{ fontSize: 40, mr: 1 }} />,
  warning: <ErrorOutlineIcon color="warning" sx={{ fontSize: 40, mr: 1 }} />,
  info: <Info color="info" sx={{ fontSize: 40, mr: 1 }} />,
  error: <ErrorIcon color="error" sx={{ fontSize: 40, mr: 1 }} />,
};

const AdminConfirmDialog = ({ open, options, onClose }) => {
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  if (!options) return null;

  return (
    <Dialog open={open} 
            onClose={() => onClose(false)}
            PaperProps={{
              style: {
                top: isSmallScreen ? "-10vh" : "0vh",
                left: isSmallScreen ? "0%" : "0%",
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '10vh',
                background: 'rgba(30, 39, 46, 0.95)', // Plomo transparencia
                color:'white',
                width: isSmallScreen ? ('100%') : ('30%'),
              },
            }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
        {options.icon && icons[options.icon]}
        {options.title}
      </DialogTitle>
      <DialogContent>{options.message}</DialogContent>
      <DialogActions>
        {/* Mostrar el botón solo si viene cancelText */}
        {options.cancelText && (
          <Button onClick={() => onClose(false)} color="inherit">
            {options.cancelText}
          </Button>
        )}
        {/* Mostrar el botón solo si viene confirmText */}
        {options.confirmText && (
          <Button onClick={() => onClose(true)} color="primary" variant="contained">
            {options.confirmText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AdminConfirmDialog;
