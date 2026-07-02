// components/ui/AppButton.jsx

import { Box } from "@mui/material";
import palette from "../../theme/palette";

export default function AppButton({
  children,
  icon,
  onClick,
  fullWidth = false,
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        height: 42,
        width: fullWidth ? "100%" : "auto",
        px: 2,

        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,

        borderRadius: 2,

        backgroundColor: palette.chip,
        border: `1px solid ${palette.border}`,

        color: palette.text,

        fontSize: "13px",
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
      {icon}
      {children}
    </Box>
  );
}