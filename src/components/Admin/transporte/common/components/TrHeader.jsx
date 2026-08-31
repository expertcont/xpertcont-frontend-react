import React from "react";
import { Box, Typography } from "@mui/material";
import { Plus } from "lucide-react";

import AppButton from "../../../../ui/AppButton";
import AppSearch from "../../../../ui/AppSearch";
import palette from "../../../../../theme/palette";

// Cabecera superior del formulario: titulo, contador, boton nuevo y buscador.
export default function TrHeader({
  titulo,
  contador,
  contadorTexto,
  nuevoTexto,
  buscarTexto,
  valorBusqueda,
  nuevoDeshabilitado,
  onNuevo,
  onBuscar,
}) {
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
      </Box>

      <AppButton
        icon={<Plus size={18} />}
        onClick={onNuevo}
        disabled={nuevoDeshabilitado}
        sx={{
          backgroundColor: nuevoDeshabilitado ? palette.chip : palette.accent,
          borderColor: nuevoDeshabilitado ? palette.border : palette.accent,
          color: nuevoDeshabilitado ? palette.muted : palette.surface,
          fontWeight: 800,
          "&:hover": {
            backgroundColor: nuevoDeshabilitado ? palette.chip : palette.accent,
            borderColor: nuevoDeshabilitado ? palette.border : palette.accent,
            color: nuevoDeshabilitado ? palette.muted : palette.surface,
          },
        }}
      >
        {nuevoTexto}
      </AppButton>

      <AppSearch
        placeholder={buscarTexto}
        value={valorBusqueda}
        onChange={onBuscar}
      />
    </Box>
  );
}
