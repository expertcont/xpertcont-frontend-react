import React from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import palette from "../../../../theme/palette";

export default function SireComprasDias({ periodo, dia, onChange }) {
  const match = String(periodo || "").match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  const total = match ? new Date(Number(match[1]), Number(match[2]), 0).getDate() : 0;
  if (!total) return null;
  return (
    <Box sx={{ px: { xs: 0.25, md: 0.5 }, py: 0.15, minWidth: 0, overflowX: "auto" }}>
      <ToggleButtonGroup aria-label="Filtrar compras por día" value={dia} exclusive onChange={(_, value) => { if (value) onChange(value); }} sx={{ flexWrap: { xs: "nowrap", sm: "wrap" }, bgcolor: palette.chip, "& .MuiToggleButton-root": { minWidth: 40, borderColor: palette.border, color: palette.accent, "&.Mui-selected": { bgcolor: palette.accent, color: palette.onAccent, borderColor: palette.accent, "&:hover": { bgcolor: palette.accent } }, "&:hover": { bgcolor: palette.accentSoft, borderColor: palette.accent } } }}>
        {Array.from({ length: total }, (_, index) => String(index + 1)).map(d => <ToggleButton key={d} value={d} aria-label={`Día ${d}`}>{d}</ToggleButton>)}
        <ToggleButton value="*" aria-label="Todos los días">*</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
