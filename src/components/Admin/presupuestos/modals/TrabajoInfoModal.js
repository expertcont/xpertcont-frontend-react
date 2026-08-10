import React from "react";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import { X } from "lucide-react";
import palette from "../../../../theme/palette";

const formatMoney = (moneda, value) => `${moneda || "PEN"} ${Number(value || 0).toLocaleString("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

export default function TrabajoInfoModal({ trabajoInfo, onClose, onSelectTrabajo }) {
  const trabajo = trabajoInfo?.trabajo;
  const presupuesto = trabajoInfo?.presupuesto;
  const trabajos = trabajoInfo?.trabajos || [];

  return (
    <Dialog
      open={Boolean(trabajoInfo)}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      {trabajoInfo && (
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: palette.accent, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>
                {presupuesto.numero}
              </Typography>
              <Typography sx={{ color: palette.text, fontSize: "20px", fontWeight: 800, mt: 0.4, lineHeight: 1.15 }}>
                {trabajo ? trabajo.descripcion || trabajo.numero : "Trabajos presupuestados"}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "12.5px", mt: 0.7 }} noWrap>
                {presupuesto.cliente}
              </Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ color: palette.muted, mt: -0.75, mr: -0.75 }}>
              <X size={18} />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1,
              my: 2,
            }}
          >
            {(trabajo ? [
              { label: "Detalles", value: trabajo.detalles_count ?? trabajo.materiales?.length ?? 0 },
              { label: "Total", value: formatMoney(presupuesto.moneda, trabajo.r_monto_total || 0) },
            ] : [
              { label: "Trabajos", value: trabajos.length },
              { label: "Total", value: formatMoney(presupuesto.moneda, presupuesto.r_monto_total || 0) },
            ]).map((item) => (
              <Box
                key={item.label}
                sx={{
                  backgroundColor: palette.bg,
                  border: `1px solid ${palette.borderSoft}`,
                  borderRadius: 2,
                  p: 1.15,
                  minWidth: 0,
                }}
              >
                <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
                  {item.label}
                </Typography>
                <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 800, mt: 0.45 }} noWrap>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              backgroundColor: palette.bg,
              border: `1px solid ${palette.borderSoft}`,
              borderRadius: 2,
              p: 1.5,
            }}
          >
            {trabajo ? (
              <>
                <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", mb: 0.75 }}>
                  Especificacion
                </Typography>
                <Typography sx={{ color: palette.text, fontSize: "13px", lineHeight: 1.45 }}>
                  {trabajo.especificacion || "Sin especificacion registrada."}
                </Typography>
              </>
            ) : (
              <Box sx={{ display: "grid", gap: 0.75 }}>
                {trabajos.map((item) => (
                  <Box
                    key={item.servicio}
                    onClick={() => onSelectTrabajo(item)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      p: 1,
                      borderRadius: 1.5,
                      color: palette.text,
                      cursor: "pointer",
                      "&:hover": { backgroundColor: palette.surfaceAlt },
                    }}
                  >
                    <Typography sx={{ fontSize: "13px", fontWeight: 700 }} noWrap>
                      {item.descripcion || `Servicio ${item.servicio || ""}`}
                    </Typography>
                    <Typography sx={{ color: palette.accent, fontSize: "12px", fontWeight: 800, whiteSpace: "nowrap" }}>
                      {formatMoney(presupuesto.moneda, item.r_monto_total || 0)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Dialog>
  );
}
