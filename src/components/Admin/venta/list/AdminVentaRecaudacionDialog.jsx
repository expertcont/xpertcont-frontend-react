import React from "react";
import { Box, Button, Card, CardContent, Dialog, DialogTitle, Typography } from "@mui/material";

export default function AdminVentaRecaudacionDialog({
  open,
  isSmallScreen,
  recaudaciones,
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
      <DialogTitle>Datos - Recaudacion</DialogTitle>

      <Card sx={{ width: "90%", background: "rgba(255,255,255,0.05)", color: "white", mb: 2 }}>
        <CardContent>
          {recaudaciones.length > 0 ? (
            recaudaciones.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  pb: 0.5,
                }}
              >
                <Typography variant="body1">{item.recaudacion}</Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  S/ {Number(item.monto).toFixed(2)}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>No hay recaudaciones</Typography>
          )}
        </CardContent>
      </Card>

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
