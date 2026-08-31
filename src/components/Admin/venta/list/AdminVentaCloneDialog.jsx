import React from "react";
import { Button, Dialog, DialogTitle, TextField } from "@mui/material";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

export default function AdminVentaCloneDialog({
  open,
  isSmallScreen,
  fechaClon,
  onFechaChange,
  onClone,
  onClose,
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
        style: {
          top: isSmallScreen ? "-30vh" : "0vh",
          left: isSmallScreen ? "-25%" : "0%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "10vh",
          background: "rgba(30, 39, 46, 0.95)",
          color: "white",
          width: isSmallScreen ? "50%" : "30%",
        },
      }}
    >
      <DialogTitle>Emision</DialogTitle>

      <TextField
        variant="outlined"
        fullWidth
        size="small"
        sx={{
          display: "flex",
          width: 270,
          "& .MuiInputBase-input": {
            color: "white",
            textAlign: "center",
          },
          margin: ".5rem 0",
        }}
        name="fecha_clon"
        type="date"
        value={fechaClon}
        onChange={onFechaChange}
        inputProps={{ style: { color: "white" } }}
        InputLabelProps={{ style: { color: "white" } }}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={onClone}
        sx={{
          display: "flex",
          alignItems: "center",
          margin: ".5rem 0",
          width: 270,
          mt: -0.5,
          fontWeight: "bold",
        }}
        startIcon={<TaskAltIcon />}
      >
        CLONAR
      </Button>

      <Button
        variant="contained"
        onClick={onClose}
        sx={{
          display: "block",
          margin: ".5rem 0",
          width: 270,
          backgroundColor: "rgba(30, 39, 46)",
          "&:hover": {
            backgroundColor: "rgba(30, 39, 46, 0.1)",
          },
          mt: -0.5,
        }}
      >
        ESC - CERRAR
      </Button>
    </Dialog>
  );
}
