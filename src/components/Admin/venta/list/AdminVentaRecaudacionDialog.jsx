import React from "react";
import { Box, Button, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import palette from "../../../../theme/palette";

const formatearMonto = (monto) => Number(monto || 0).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function AdminVentaRecaudacionDialog({
  open,
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
        sx: {
          m: { xs: 1.5, sm: 2 },
          width: { xs: "calc(100vw - 24px)", sm: 420 },
          maxWidth: "calc(100vw - 24px)",
          maxHeight: { xs: "calc(100dvh - 24px)", sm: "80vh" },
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: 1.5, sm: 2 },
          py: 1.4,
          borderBottom: `1px solid ${palette.borderSoft}`,
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: "16px", lineHeight: 1.2 }}>
          Datos de recaudacion
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: "12px", mt: 0.25 }}>
          Resumen segun el filtro actual
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 1.5, sm: 2 },
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: 0.75,
            mb: 1.5,
          }}
        >
          {recaudaciones.length > 0 ? (
            recaudaciones.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.25,
                  minHeight: 42,
                  px: 1.2,
                  py: 0.85,
                  backgroundColor: index % 2 === 0 ? palette.bg : palette.surfaceAlt,
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  title={item.recaudacion}
                  sx={{
                    color: palette.text,
                    fontSize: "13px",
                    fontWeight: 700,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.recaudacion}
                </Typography>
                <Typography sx={{ color: "#7ddbd3", fontSize: "13px", fontWeight: 800, whiteSpace: "nowrap" }}>
                  S/ {formatearMonto(item.monto)}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography sx={{ color: palette.muted, fontSize: "13px", textAlign: "center", py: 2 }}>
              No hay recaudaciones
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            width: "100%",
            height: 42,
            borderRadius: 2,
            backgroundColor: palette.chip,
            border: `1px solid ${palette.border}`,
            color: palette.text,
            boxShadow: "none",
            fontSize: "12px",
            fontWeight: 800,
            "&:hover": {
              backgroundColor: palette.accent,
              borderColor: palette.accent,
              color: palette.surface,
              boxShadow: "none",
            },
          }}
        >
          ESC - CERRAR
        </Button>
      </DialogContent>
    </Dialog>
  );
}
