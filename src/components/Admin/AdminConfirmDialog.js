import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { CheckCircle, Warning, Info, Error as ErrorIcon } from "@mui/icons-material";

const icons = {
  success: <CheckCircle color="success" sx={{ fontSize: 40, mr: 1 }} />,
  warning: <Warning color="warning" sx={{ fontSize: 40, mr: 1 }} />,
  info: <Info color="info" sx={{ fontSize: 40, mr: 1 }} />,
  error: <ErrorIcon color="error" sx={{ fontSize: 40, mr: 1 }} />,
};

const AdminConfirmDialog = ({ open, options, onClose }) => {
  if (!options) return null;

  return (
    <Dialog open={open} onClose={() => onClose(false)}>
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
