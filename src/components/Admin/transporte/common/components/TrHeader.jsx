import React from "react";
import { Box, Typography } from "@mui/material";
import { Ban, CheckCircle2, Layers, Plus, ReceiptText, ShieldCheck } from "lucide-react";

import AppButton from "../../../../ui/AppButton";
import AppSearch from "../../../../ui/AppSearch";
import palette from "../../../../../theme/palette";

// Cabecera superior del formulario: titulo, contador, buscador y accion principal.
export default function TrHeader({
  titulo,
  contador,
  contadorTexto,
  nuevoTexto,
  buscarTexto,
  valorBusqueda,
  nuevoDeshabilitado,
  mostrarAnuladas,
  ticketModo,
  onTicketModoChange,
  onToggleAnuladas,
  onNuevo,
  onBuscar,
}) {
  const ticketOptions = [
    { value: "completo", label: "Completo", icon: Layers },
    { value: "admin", label: "Admin", icon: ShieldCheck },
    { value: "cliente", label: "Cliente", icon: ReceiptText },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 1, sm: 2 },
        mb: { xs: 1.25, md: 3 },
      }}
    >
      <Box>
        <Typography sx={{ color: palette.text, fontWeight: 700, fontSize: "22px", lineHeight: 1.2 }}>
          {titulo}
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: "13px", mt: 0.5 }}>
          {contador} {contadorTexto}
        </Typography>
        {onTicketModoChange && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.55, mt: 0.85, flexWrap: "wrap" }}>
            <Typography sx={{ color: palette.muted, fontSize: "10.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.35 }}>
              Ticket pred.
            </Typography>
            {ticketOptions.map(({ value, label, icon: Icon }) => {
              const active = ticketModo === value;

              return (
                <Box
                  key={value}
                  component="button"
                  type="button"
                  onClick={() => onTicketModoChange(value)}
                  title={`Imprimir por defecto: Ticket ${label}`}
                  sx={{
                    height: 25,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.35,
                    px: 0.75,
                    borderRadius: "6px",
                    border: `1px solid ${active ? palette.accent : palette.borderSoft}`,
                    backgroundColor: active ? palette.accentSoft : "rgba(255,255,255,0.025)",
                    color: active ? palette.accent : palette.muted,
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer",
                    lineHeight: 1,
                    boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.03)" : "none",
                    transition: "all .16s ease",
                    "&:hover": {
                      borderColor: palette.accent,
                      color: palette.accent,
                      backgroundColor: palette.accentSoft,
                    },
                  }}
                >
                  <Icon size={12} />
                  {label}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1,
          width: { xs: "100%", sm: "auto" },
          flexWrap: { xs: "wrap", md: "nowrap" },
        }}
      >
        <AppSearch
          placeholder={buscarTexto}
          value={valorBusqueda}
          onChange={onBuscar}
        />

        {onToggleAnuladas && (
          <AppButton
            icon={mostrarAnuladas ? <CheckCircle2 size={18} /> : <Ban size={18} />}
            onClick={onToggleAnuladas}
            sx={{
              backgroundColor: mostrarAnuladas ? "rgba(245,158,11,0.18)" : palette.surface,
              borderColor: mostrarAnuladas ? "rgba(245,158,11,0.45)" : palette.border,
              color: mostrarAnuladas ? "#fbbf24" : palette.text,
              fontWeight: 800,
              "&:hover": {
                backgroundColor: mostrarAnuladas ? "rgba(245,158,11,0.24)" : palette.chip,
                borderColor: mostrarAnuladas ? "rgba(245,158,11,0.55)" : palette.border,
                color: mostrarAnuladas ? "#fbbf24" : palette.text,
              },
            }}
          >
            {mostrarAnuladas ? "Ver activas" : "Anuladas"}
          </AppButton>
        )}

        <AppButton
          icon={<Plus size={18} />}
          onClick={onNuevo}
          disabled={nuevoDeshabilitado}
          sx={{
            backgroundColor: nuevoDeshabilitado ? palette.chip : palette.accent,
            borderColor: nuevoDeshabilitado ? palette.border : palette.accent,
            color: nuevoDeshabilitado ? palette.muted : palette.onAccent,
            fontWeight: 800,
            ml: { xs: "auto", sm: 0 },
            "&:hover": {
              backgroundColor: nuevoDeshabilitado ? palette.chip : palette.accent,
              borderColor: nuevoDeshabilitado ? palette.border : palette.accent,
              color: nuevoDeshabilitado ? palette.muted : palette.onAccent,
            },
          }}
        >
          {nuevoTexto}
        </AppButton>
      </Box>
    </Box>
  );
}
