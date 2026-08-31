import React, { useState } from "react";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import { ChevronDown } from "lucide-react";

import palette from "../../../../../theme/palette";

const headerFieldSx = {
  height: { xs: 32, md: 42 },
  px: { xs: 0.5, md: 1.5 },
  display: "flex",
  alignItems: "center",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  color: palette.text,
  fontSize: { xs: "12px", md: "13px" },
};

function HeaderInlineLabel({ children }) {
  return (
    <Typography
      component="span"
      sx={{
        color: palette.muted,
        fontSize: { xs: "9px", md: "10px" },
        fontWeight: 800,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        mr: { xs: 0.5, md: 1 },
        flexShrink: 0,
      }}
    >
      {children}
    </Typography>
  );
}

// Select compacto usado en la cabecera. Se mantiene como Menu para encajar con el diseno oscuro.
export default function TrHeaderMenuPicker({ label, value, displayValue, options, onSelect, minWidth = 140 }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const menuMinWidth = anchorEl?.offsetWidth || (typeof minWidth === "number" ? minWidth : 180);
  const isFullWidth = minWidth === "100%" || minWidth?.xs === "100%";

  return (
    <>
      <Box
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          ...headerFieldSx,
          minWidth: { xs: 0, md: minWidth === "100%" ? 0 : minWidth },
          width: { xs: "100%", md: isFullWidth ? "100%" : "auto" },
          maxWidth: "100%",
          boxSizing: "border-box",
          cursor: "pointer",
          transition: "all .18s ease",
          gap: { xs: 0.5, md: 1 },
          "&:hover": {
            borderColor: palette.accent,
            backgroundColor: palette.surfaceAlt,
          },
        }}
      >
        <HeaderInlineLabel>{label}</HeaderInlineLabel>
        <Box
          component="span"
          sx={{
            minWidth: 0,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: palette.text,
            fontWeight: 700,
          }}
        >
          {displayValue || value || "SELECCIONA"}
        </Box>
        <ChevronDown size={14} color={palette.muted} style={{ flexShrink: 0 }} />
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 0.75,
            bgcolor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            minWidth: menuMinWidth,
            maxWidth: { xs: "calc(100vw - 32px)", md: 520 },
            "& .MuiMenuItem-root": {
              fontSize: "13px",
              maxWidth: { xs: "calc(100vw - 48px)", md: 500 },
              whiteSpace: "normal",
              "&:hover": {
                backgroundColor: palette.accent,
                color: palette.surface,
              },
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === value}
            onClick={() => {
              onSelect(option.value);
              setAnchorEl(null);
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
