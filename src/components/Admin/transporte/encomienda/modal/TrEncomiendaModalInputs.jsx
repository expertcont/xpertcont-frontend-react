import React from "react";
import { Box, InputBase, Typography } from "@mui/material";
import { ChevronDown, ChevronUp } from "lucide-react";

import palette from "../../../../../theme/palette";
import { focusableRefs } from "./trEncomiendaModalUtils";

export const fieldSx = {
  minHeight: 33,
  px: 0.9,
  display: "flex",
  alignItems: "center",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  color: palette.text,
  fontSize: "13px",
  transition: "border-color .18s ease, background-color .18s ease",
  "&:focus-within": {
    borderColor: palette.accent,
    backgroundColor: palette.surfaceAlt,
  },
};

export const inputSx = {
  color: palette.text,
  fontSize: "12.5px",
  width: "100%",
  "& input::placeholder, & textarea::placeholder": {
    color: palette.muted,
    opacity: 1,
  },
};

export const sectionSx = {
  p: { xs: 0.65, md: 0.7 },
  borderRadius: 2,
  backgroundColor: "rgba(255,255,255,.018)",
  border: `1px solid ${palette.borderSoft}`,
};

export const searchIconButtonSx = {
  width: { xs: 34, md: 28 },
  height: { xs: 34, md: 28 },
  mr: 0.45,
  borderRadius: 1.6,
  color: palette.accent,
  backgroundColor: palette.accentSoft,
  border: `1px solid ${palette.border}`,
  flexShrink: 0,
  transition: "all .16s ease",
  "& svg": {
    width: { xs: 18, md: 16 },
    height: { xs: 18, md: 16 },
  },
  "&:hover": {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
    color: palette.surface,
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
};

export function Field({ label, icon, children, labelWidth = "auto", tall = false }) {
  return (
    <Box sx={{ ...fieldSx, minHeight: tall ? 35 : fieldSx.minHeight }}>
      {icon && (
        <Box sx={{ color: palette.muted, display: "flex", alignItems: "center", mr: 0.55 }}>
          {icon}
        </Box>
      )}
      {label && (
        <Typography
          component="span"
          sx={{
            color: palette.muted,
            fontSize: "9px",
            fontWeight: 800,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            mr: 0.75,
            width: labelWidth,
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
      )}
      <Box sx={{ minWidth: 0, flex: 1, alignSelf: "stretch", display: "flex", alignItems: "stretch" }}>
        {children}
      </Box>
    </Box>
  );
}

export const focusByArrow = (event, inputRef) => {
  const currentIndex = focusableRefs.findIndex((ref) => ref === inputRef);
  if (currentIndex === -1) {
    return false;
  }

  const move = (delta) => {
    let nextIndex = currentIndex + delta;

    while (nextIndex >= 0 && nextIndex < focusableRefs.length) {
      const nextRef = focusableRefs[nextIndex];
      if (nextRef?.current) {
        event.preventDefault();
        nextRef.current.focus();
        nextRef.current.select?.();
        return true;
      }
      nextIndex += delta;
    }

    return false;
  };

  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
    return move(1);
  }

  if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    return move(-1);
  }

  return false;
};

export function CaptureInput({ value, onChange, inputRef, nextRef, placeholder, type = "text", multiline = false, align = "left", readOnly = false, onPlus, onEmptyEnter, onEnter, onF3 }) {
  return (
    <InputBase
      inputRef={inputRef}
      type={type}
      value={value}
      placeholder={placeholder}
      multiline={multiline}
      minRows={multiline ? 3 : undefined}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "F3" && onF3) {
          event.preventDefault();
          onF3();
          return;
        }
        if (focusByArrow(event, inputRef)) {
          return;
        }
        if (event.key === "+" && !multiline && onPlus) {
          event.preventDefault();
          onPlus();
          return;
        }
        if (event.key === "Enter" && !multiline && !String(value || "").trim() && onEmptyEnter) {
          event.preventDefault();
          onEmptyEnter();
          return;
        }
        if (event.key === "Enter" && !multiline && onEnter) {
          event.preventDefault();
          onEnter();
          return;
        }
        if (event.key === "Enter" && !multiline && nextRef?.current) {
          event.preventDefault();
          nextRef.current.focus();
          nextRef.current.select?.();
        }
      }}
      sx={{
        ...inputSx,
        "& input": {
          textAlign: align,
        },
        "& textarea": {
          textAlign: align,
        },
      }}
    />
  );
}

export function MultilineCapture({ value, onChange, inputRef, nextRef, placeholder }) {
  return (
    <Box
      sx={{
        minHeight: 42,
        px: 0.9,
        py: 0.55,
        display: "flex",
        alignItems: "flex-start",
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 2,
        color: palette.text,
        transition: "border-color .18s ease, background-color .18s ease",
        "&:focus-within": {
          borderColor: palette.accent,
          backgroundColor: palette.surfaceAlt,
        },
      }}
    >
      <InputBase
        inputRef={inputRef}
        multiline
        minRows={2}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && focusByArrow(event, inputRef)) {
            return;
          }
          if (event.key === "Enter" && nextRef?.current) {
            event.preventDefault();
            nextRef.current.focus();
            nextRef.current.select?.();
          }
        }}
        sx={{
          ...inputSx,
          alignItems: "flex-start",
          lineHeight: 1.2,
          "& textarea": {
            p: 0,
            resize: "none",
          },
        }}
      />
    </Box>
  );
}

export function MoneyStepper({ value, onChange, inputRef, nextRef }) {
  const updateValue = (delta) => {
    const current = Number(value || 0);
    const next = Math.max(0, current + delta);
    onChange(String(Math.round(next)));
  };

  const buttonSx = {
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: palette.muted,
    cursor: "pointer",
    transition: "all .16s ease",
    "&:hover": {
      backgroundColor: palette.accentSoft,
      color: palette.accent,
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        width: "100%",
        alignSelf: "stretch",
        mr: -1,
        my: 0,
        overflow: "hidden",
        borderRadius: 2,
      }}
    >
      <InputBase
        inputRef={inputRef}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "+" || event.key === "=") {
            event.preventDefault();
            updateValue(1);
            return;
          }
          if (event.key === "-") {
            event.preventDefault();
            updateValue(-1);
            return;
          }
          if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
            event.preventDefault();
            focusByArrow(event, inputRef);
            return;
          }
          if (event.key === "Enter" && nextRef?.current) {
            event.preventDefault();
            nextRef.current.focus();
            nextRef.current.select?.();
          }
        }}
        sx={{
          ...inputSx,
          flex: 1,
          minWidth: 0,
          px: 1,
          backgroundColor: palette.bg,
          "& input": {
            textAlign: "right",
            fontWeight: 800,
            MozAppearance: "textfield",
          },
          "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
            WebkitAppearance: "none",
            margin: 0,
          },
        }}
      />
      <Box
        sx={{
          width: 30,
          alignSelf: "stretch",
          display: "grid",
          gridTemplateRows: "1fr 1fr",
          borderLeft: `1px solid ${palette.border}`,
          backgroundColor: palette.bg,
          flexShrink: 0,
        }}
      >
        <Box onClick={() => updateValue(1)} sx={{ ...buttonSx, borderBottom: `1px solid ${palette.borderSoft}` }}>
          <ChevronUp size={15} />
        </Box>
        <Box onClick={() => updateValue(-1)} sx={buttonSx}>
          <ChevronDown size={15} />
        </Box>
      </Box>
    </Box>
  );
}

export function SectionHeader({ icon, title }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.55, mb: 0.32 }}>
      <Box sx={{ color: palette.accent, display: "flex" }}>{icon}</Box>
      <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 800 }}>
        {title}
      </Typography>
    </Box>
  );
}

export function ChoiceGroup({ value, onChange, options = ["OFICINA", "CLIENTE"], inputRef, nextRef }) {
  const normalizedOptions = options.map((option) => ({
    value: option.value || option,
    label: option.label || option,
  }));

  const moveOption = (delta) => {
    const currentIndex = normalizedOptions.findIndex((option) => option.value === value);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (safeIndex + delta + normalizedOptions.length) % normalizedOptions.length;
    onChange(normalizedOptions[nextIndex].value);
  };

  return (
    <Box
      ref={inputRef}
      tabIndex={0}
      role="radiogroup"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          moveOption(-1);
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          moveOption(1);
          return;
        }
        if (event.key === "ArrowDown" && nextRef?.current) {
          event.preventDefault();
          nextRef.current.focus();
          nextRef.current.select?.();
          return;
        }
        if (event.key === "ArrowUp" && focusByArrow(event, inputRef)) {
          return;
        }
        if (event.key === "Enter" && nextRef?.current) {
          event.preventDefault();
          nextRef.current.focus();
          nextRef.current.select?.();
        }
      }}
      sx={{
        display: "flex",
        gap: 0.6,
        flexWrap: "nowrap",
        alignItems: "center",
        justifyContent: "flex-start",
        minWidth: 0,
        width: "100%",
        pl: 0.2,
        outline: "none",
        borderRadius: 1.5,
        "&:focus-visible": {
          boxShadow: `0 0 0 2px ${palette.accent}`,
        },
      }}
    >
      {normalizedOptions.map((option) => (
        <Box
          key={option.value}
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          sx={{
            height: 20,
            px: 0.65,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 1.25,
            backgroundColor: value === option.value ? palette.accentSoft : palette.chip,
            border: `1px solid ${value === option.value ? palette.accent : palette.border}`,
            color: value === option.value ? palette.accent : palette.text,
            fontSize: "10px",
            fontWeight: 800,
            cursor: "pointer",
            lineHeight: 1,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {option.label}
        </Box>
      ))}
    </Box>
  );
}
