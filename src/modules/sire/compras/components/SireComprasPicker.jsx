import React, { useState } from "react";
import { Box, ButtonBase, Menu, MenuItem, Typography } from "@mui/material";
import { ChevronDown } from "lucide-react";
import palette from "../../../../theme/palette";

export default function SireComprasPicker({ label, ariaLabel = label, value, displayValue, options, onSelect, disabled }) {
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <ButtonBase aria-label={ariaLabel} aria-haspopup="menu" aria-expanded={Boolean(anchor)} disabled={disabled} onClick={e => setAnchor(e.currentTarget)} sx={{ width: "100%", minWidth: 0, height: { xs: 30, md: 34 }, px: { xs: 0.4, md: 0.75 }, border: `1px solid ${palette.borderSoft}`, borderRadius: palette.radius.control, bgcolor: palette.bg, color: palette.text, display: "flex", gap: 0.5, justifyContent: "flex-start", "&:hover": { borderColor: palette.accent, bgcolor: palette.surfaceAlt }, "&.Mui-disabled": { opacity: 0.6 } }}>
        <Typography component="span" sx={{ color: palette.muted, fontSize: 9, fontWeight: 800, textTransform: "uppercase", flexShrink: 0 }}>{label}</Typography>
        <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, textAlign: "left" }}>{displayValue || value || "SELECCIONA"}</Box>
        <ChevronDown size={14} color={palette.muted} style={{ flexShrink: 0 }} />
      </ButtonBase>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} PaperProps={{ sx: { mt: 0.75, bgcolor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, minWidth: anchor?.offsetWidth || 180, maxWidth: "calc(100vw - 32px)", "& .MuiMenuItem-root": { fontSize: 13, whiteSpace: "normal", "&:hover": { bgcolor: palette.accent, color: palette.onAccent } } } }}>
        {options.map(option => <MenuItem key={option.value} selected={option.value === value} onClick={() => { onSelect(option.value); setAnchor(null); }}>{option.label}</MenuItem>)}
      </Menu>
    </>
  );
}
