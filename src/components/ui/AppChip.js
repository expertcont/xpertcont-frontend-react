// components/ui/AppChip.jsx

import { Box } from "@mui/material";
import palette from "../../theme/palette";

export default function AppChip({
  children,
  onClick,
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        height: 30,
        px: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 1.5,
        backgroundColor: palette.chip,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all .18s ease",
        "&:hover": {
          backgroundColor: palette.accent,
          borderColor: palette.accent,
          color: palette.surface,
          transform: "translateY(-1px)",
        },
      }}
    >
      {children}
    </Box>
  );
}