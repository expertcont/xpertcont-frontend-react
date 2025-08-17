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

const icons = {
  success: <CheckCircle color="success" sx={{ fontSize: 40, mr: 1 }} />,
  warning: <Warning color="warning" sx={{ fontSize: 40, mr: 1 }} />,
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
                top: isSmallScreen ? "-30vh" : "0vh", // Ajusta la distancia desde arriba
                left: isSmallScreen ? "-25%" : "0%", // Centrado horizontal
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '10vh', // Ajusta este valor según tus necesidades
                background: 'rgba(30, 39, 46, 0.95)', // Plomo transparencia                              
                //background: 'rgba(16, 27, 61, 0.95)', // Azul transparencia                              
                color:'white',
                width: isSmallScreen ? ('50%') : ('30%'), // Ajusta este valor según tus necesidades
                //width: isSmallScreen ? ('100%') : ('40%'), // Ajusta este valor según tus necesidades
                //maxWidth: 'none' // Esto es importante para permitir que el valor de width funcione
              },
            }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
        {options.icon && icons[options.icon]}
        {options.title}
      </DialogTitle>
      <DialogContent>{options.message}</DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} color="inherit">
          {options.cancelText || "Cancelar"}
        </Button>
        <Button onClick={() => onClose(true)} color="primary" variant="contained">
          {options.confirmText || "Aceptar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminConfirmDialog;
