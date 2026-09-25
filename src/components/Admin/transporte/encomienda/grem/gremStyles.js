import palette from "../../../../../theme/palette";

import "../../common/trDataTableTheme";

export const gremTableStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: { style: { display: "none" } },
  rows: {
    style: {
      backgroundColor: palette.surface,
      color: palette.text,
      minHeight: "112px",
      marginBottom: "10px",
      borderRadius: palette.radius.listCard,
      border: `1px solid ${palette.borderSoft}`,
      paddingLeft: "16px",
      paddingRight: "16px",
      transition: "border-color .18s ease, background-color .18s ease",
      "&:hover": {
        backgroundColor: palette.surfaceAlt,
        borderColor: palette.border,
      },
    },
  },
  pagination: {
    style: {
      backgroundColor: "transparent",
      color: palette.muted,
      borderTop: `1px solid ${palette.borderSoft}`,
      marginTop: "8px",
    },
    pageButtonsStyle: {
      color: palette.muted,
      fill: palette.muted,
      "&:hover:not(:disabled)": { backgroundColor: palette.accentSoft },
      "&:disabled": { color: palette.border, fill: palette.border },
    },
  },
};

export const buttonSx = {
  height: 42,
  borderRadius: 2,
  borderColor: palette.border,
  color: palette.text,
  fontSize: 13,
  fontWeight: 360,
  fontVariationSettings: '"wght" 360',
  letterSpacing: 0,
  textTransform: "none",
  px: 2,
  "&:hover": {
    borderColor: palette.accent,
    backgroundColor: palette.accent,
    color: palette.onAccent,
    transform: "translateY(-1px)",
  },
  "&.Mui-disabled": {
    borderColor: palette.border,
    color: palette.muted,
    opacity: 0.55,
  },
};

export const actionButtonSx = {
  width: { xs: 42, sm: 30 },
  height: { xs: 42, sm: 30 },
  minWidth: 0,
  borderRadius: palette.radius.control,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: palette.chip,
  border: `1px solid ${palette.border}`,
  color: palette.muted,
  cursor: "pointer",
  transition: "all .18s ease",
  boxShadow: { xs: palette.shadowSoft, sm: "none" },
  p: 0,
  "& svg": {
    width: { xs: 20, sm: 14 },
    height: { xs: 20, sm: 14 },
  },
  "&:hover": {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
    color: palette.onAccent,
  },
  "&.Mui-disabled": {
    backgroundColor: palette.chip,
    borderColor: palette.border,
    color: palette.border,
    opacity: 0.6,
  },
};
