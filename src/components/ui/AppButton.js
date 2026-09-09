// components/ui/AppButton.jsx

import { Box } from "@mui/material";
import palette from "../../theme/palette";

export default function AppButton({
  children,
  icon,
  onClick,
  fullWidth = false,
  sx = {},
  buttonRef,
  disabled = false,
}) {
  return (
    <Box
      ref={buttonRef}
      role="button"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={(event) => {
        if (disabled) return;
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(event);
        }
      }}
      sx={{
        height: 42,
        width: fullWidth ? "100%" : "auto",
        boxSizing: "border-box",
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

        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? "none" : "auto",

        transition: "all .18s ease",

        "&:hover": {
          backgroundColor: disabled ? palette.chip : palette.accent,
          borderColor: disabled ? palette.border : palette.accent,
          color: disabled ? palette.text : palette.surface,
          transform: disabled ? "none" : "translateY(-1px)",
        },
        ...sx,
      }}
    >
      {icon}
      {children}
    </Box>
  );
}
