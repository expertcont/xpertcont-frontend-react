import React from "react";
import { Box, Typography } from "@mui/material";
import { Plus } from "lucide-react";

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
