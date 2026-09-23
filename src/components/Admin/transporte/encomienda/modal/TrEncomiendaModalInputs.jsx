import React from "react";
import { Box, InputBase, Typography } from "@mui/material";
import { ChevronDown, ChevronUp } from "lucide-react";

import palette from "../../../../../theme/palette";
import { focusableRefs } from "./trEncomiendaModalUtils";

export const fieldSx = {
  minHeight: 30,
  px: 0.9,
  display: "flex",
  alignItems: "center",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: palette.radius.control,
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
  borderRadius: palette.radius.listCard,
  backgroundColor: palette.overlaySoft,
  border: `1px solid ${palette.borderSoft}`,
};

export const searchIconButtonSx = {
  width: { xs: 34, md: 28 },
  height: { xs: 34, md: 28 },
  mr: 0.45,
  borderRadius: palette.radius.control,
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
    color: palette.onAccent,
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
};

const focusControl = (ref) => {
  const target = ref?.current;

  if (!target) {
    return;
  }

  target.focus();

  if (target.tagName !== "TEXTAREA") {
    target.select?.();
  }
};

export function Field({ label, icon, children, labelWidth = "auto", tall = false, controlHeight, plain = false }) {
  return (
    <Box
      sx={{
        ...(plain ? {
          minHeight: controlHeight || (tall ? 35 : fieldSx.minHeight),
          display: "flex",
          alignItems: "center",
        } : fieldSx),
        minHeight: controlHeight || (tall ? 35 : fieldSx.minHeight),
      }}
    >
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
        focusControl(nextRef);
        return true;
      }
      nextIndex += delta;
    }

    return false;
  };

  if (event.key === "ArrowDown") {
    return move(1);
  }

  if (event.key === "ArrowUp") {
    return move(-1);
  }

  return false;
};

export function CaptureInput({ value, onChange, inputRef, nextRef, placeholder, type = "text", inputMode, pattern, multiline = false, align = "left", readOnly = false, prominent = false, onPlus, onEmptyEnter, onEnter, onF3 }) {
  return (
    <InputBase
      inputRef={inputRef}
      type={type}
      inputProps={{
        inputMode,
        pattern,
      }}
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
          focusControl(nextRef);
        }
      }}
      sx={{
        ...inputSx,
        fontSize: prominent ? "18px" : inputSx.fontSize,
        "& input": {
          textAlign: align,
          fontSize: prominent ? "18px" : undefined,
        },
        "& textarea": {
          textAlign: align,
        },
      }}
    />
  );
}

export function MultilineCapture({ value, onChange, inputRef, nextRef, placeholder, minRows = 2, minHeight = 42 }) {
  return (
    <Box
      sx={{
        minHeight,
        px: 0.9,
        py: 0.55,
        display: "flex",
        alignItems: "flex-start",
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: palette.radius.control,
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
        minRows={minRows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
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

export function MoneyStepper({ value, onChange, inputRef, nextRef, prominent = false, align = "right", tone = "default" }) {
  const toneColor = tone === "warning" ? palette.warning : palette.text;
  const formatMoneyValue = (rawValue) => {
    const numericValue = Number(String(rawValue || "0").replace(",", "."));
    return Number.isFinite(numericValue) ? Math.max(0, numericValue).toFixed(2) : "0.00";
  };
  const commitMoneyValue = () => {
    onChange(formatMoneyValue(value));
  };
  const updateValue = (delta) => {
    const current = Number(value || 0);
    const next = Math.max(0, current + delta);
    onChange(next.toFixed(2));
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
        borderRadius: palette.radius.control,
      }}
    >
      <InputBase
        inputRef={inputRef}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={commitMoneyValue}
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
          if (["ArrowUp", "ArrowDown"].includes(event.key)) {
            event.preventDefault();
            focusByArrow(event, inputRef);
            return;
          }
          if (event.key === "Enter" && nextRef?.current) {
            event.preventDefault();
            commitMoneyValue();
            focusControl(nextRef);
          }
        }}
        sx={{
          ...inputSx,
          flex: 1,
          minWidth: 0,
          px: 1,
          backgroundColor: palette.bg,
          color: tone === "warning" ? palette.warning : prominent ? palette.accent : palette.text,
          "& input": {
            textAlign: align,
            fontSize: prominent ? "20px" : undefined,
            fontWeight: prominent ? 950 : 800,
            color: tone === "warning" ? palette.warning : prominent ? palette.accent : toneColor,
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

const parseArrivalTime = (value) => {
  const match = String(value || "").match(/(\d{1,2}):(\d{2})/);
  const now = new Date();
  const fallbackTotal = Math.round((now.getHours() * 60 + now.getMinutes()) / 30) * 30;

  if (!match) {
    return {
      hours: Math.floor((fallbackTotal % 1440) / 60),
      minutes: fallbackTotal % 60,
    };
  }

  return {
    hours: Math.min(23, Math.max(0, Number(match[1]) || 0)),
    minutes: Math.min(59, Math.max(0, Number(match[2]) || 0)),
  };
};

const arrivalTimeValue = (hours, minutes) => [
  String((hours + 24) % 24).padStart(2, "0"),
  String(minutes).padStart(2, "0"),
  "00",
].join(":");

export function ArrivalTimePicker({ value, onChange, inputRef, nextRef }) {
  const hourRef = React.useRef(null);
  const minuteRef = React.useRef(null);
  const periodRef = React.useRef(null);
  const { hours, minutes } = parseArrivalTime(value);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  const minuteValue = minutes;
  const [hourDraft, setHourDraft] = React.useState("");
  const [minuteDraft, setMinuteDraft] = React.useState("");

  React.useEffect(() => {
    if (document.activeElement !== hourRef.current) {
      setHourDraft("");
    }

    if (document.activeElement !== minuteRef.current) {
      setMinuteDraft("");
    }
  }, [displayHour, minuteValue]);

  React.useEffect(() => {
    if (!inputRef) {
      return undefined;
    }

    inputRef.current = {
      focus: () => hourRef.current?.focus(),
      select: () => hourRef.current?.focus(),
    };

    return () => {
      inputRef.current = null;
    };
  }, [inputRef]);

  const partInputSx = {
    minWidth: 0,
    height: "100%",
    px: 0.35,
    color: palette.text,
    backgroundColor: "transparent",
    border: 0,
    borderRadius: 0,
    fontSize: "14px",
    fontWeight: 900,
    outline: "none",
    lineHeight: 1,
    "& input": {
      p: 0,
      height: 34,
      textAlign: "center",
      fontSize: "14px",
      fontWeight: 900,
      color: "inherit",
    },
    "&:focus-within": {
      backgroundColor: "transparent",
      boxShadow: "none",
    },
  };
  const stepButtonSx = {
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: palette.muted,
    cursor: "pointer",
    transition: "all .16s ease",
    userSelect: "none",
    "&:hover": {
      backgroundColor: palette.accentSoft,
      color: palette.accent,
    },
    "&:active": {
      backgroundColor: palette.accent,
      color: palette.onAccent,
    },
  };

  const updateHour = (nextDisplayHour) => {
    const safeDisplayHour = Math.min(12, Math.max(1, Number(nextDisplayHour) || 12));
    const normalizedHour = safeDisplayHour % 12;
    onChange(arrivalTimeValue(period === "PM" ? normalizedHour + 12 : normalizedHour, minuteValue));
  };

  const updateMinute = (nextMinute) => {
    const safeMinute = Math.min(59, Math.max(0, Number(nextMinute) || 0));
    onChange(arrivalTimeValue(hours, safeMinute));
  };

  const updatePeriod = (nextPeriod) => {
    const baseHour = hours % 12;
    onChange(arrivalTimeValue(nextPeriod === "PM" ? baseHour + 12 : baseHour, minuteValue));
  };

  const handlePartKeyDown = (event, part) => {
    if (event.key === "+" || event.key === "=" || event.key === "-") {
      event.preventDefault();
      event.stopPropagation();
      const direction = event.key === "-" ? -1 : 1;

      if (part === "hour") {
        if (direction > 0) {
          updateHour(displayHour === 12 ? 1 : displayHour + 1);
        } else {
          updateHour(displayHour === 1 ? 12 : displayHour - 1);
        }
        window.setTimeout(() => {
          hourRef.current?.focus();
          hourRef.current?.select?.();
        }, 0);
        return;
      }

      if (part === "minute") {
        updateMinute((minuteValue + (direction * 15) + 60) % 60);
        window.setTimeout(() => {
          minuteRef.current?.focus();
          minuteRef.current?.select?.();
        }, 0);
        return;
      }

      updatePeriod(period === "AM" ? "PM" : "AM");
      window.setTimeout(() => {
        periodRef.current?.focus();
        periodRef.current?.select?.();
      }, 0);
      return;
    }

    if (event.key.toLowerCase() === "p") {
      event.preventDefault();
      updatePeriod("PM");
      return;
    }

    if (event.key.toLowerCase() === "a") {
      event.preventDefault();
      updatePeriod("AM");
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (part === "hour") {
        commitHourDraft();
        minuteRef.current?.focus();
        return;
      }

      if (part === "minute") {
        commitMinuteDraft();
        periodRef.current?.focus();
        return;
      }

      focusControl(nextRef);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (part === "hour") {
        commitHourDraft();
        minuteRef.current?.focus();
        minuteRef.current?.select?.();
        return;
      }

      if (part === "minute") {
        commitMinuteDraft();
        periodRef.current?.focus();
        periodRef.current?.select?.();
        return;
      }

      focusControl(nextRef);
      return;
    }

    if (event.key === "ArrowUp") {
      if (part === "minute") {
        event.preventDefault();
        commitMinuteDraft();
        hourRef.current?.focus();
        hourRef.current?.select?.();
        return;
      }

      if (part === "period") {
        event.preventDefault();
        minuteRef.current?.focus();
        minuteRef.current?.select?.();
        return;
      }

      if (focusByArrow(event, inputRef)) {
        commitHourDraft();
      }
      return;
    }
  };

  const handleHourChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 2);
    setHourDraft(digits);

    if (!digits) {
      return;
    }

    if (digits.length === 2) {
      updateHour(digits);
      setHourDraft("");
    }
  };

  const handleMinuteChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 2);
    setMinuteDraft(digits);

    if (!digits) {
      return;
    }

    if (digits.length === 2) {
      updateMinute(digits);
      setMinuteDraft("");
    }
  };

  const commitHourDraft = () => {
    if (hourDraft) {
      updateHour(hourDraft);
      setHourDraft("");
    }
  };

  const commitMinuteDraft = () => {
    if (minuteDraft) {
      updateMinute(minuteDraft);
      setMinuteDraft("");
    }
  };

  const handlePeriodChange = (event) => {
    const nextValue = event.target.value.toUpperCase();
    const lastChar = nextValue.slice(-1);

    if (lastChar === "A") {
      updatePeriod("AM");
      return;
    }

    if (lastChar === "P") {
      updatePeriod("PM");
    }
  };

  const stepHour = (direction) => {
    updateHour(direction > 0
      ? displayHour === 12 ? 1 : displayHour + 1
      : displayHour === 1 ? 12 : displayHour - 1);
    hourRef.current?.focus();
    hourRef.current?.select?.();
  };

  const stepMinute = (direction) => {
    updateMinute((minuteValue + (direction * 15) + 60) % 60);
    minuteRef.current?.focus();
    minuteRef.current?.select?.();
  };

  const renderTimeInputPart = (children, onStep) => (
    <Box
      sx={{
        minWidth: 0,
        height: "100%",
        display: "grid",
        gridTemplateRows: onStep ? "1fr 28px" : "1fr",
        alignItems: "stretch",
      }}
    >
      {children}
      {onStep && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderTop: `1px solid ${palette.borderSoft}`,
            "& > div + div": {
              borderLeft: `1px solid ${palette.borderSoft}`,
            },
          }}
        >
          <StepButton onClick={() => onStep(-1)}>-</StepButton>
          <StepButton onClick={() => onStep(1)}>+</StepButton>
        </Box>
      )}
    </Box>
  );

  const StepButton = ({ children, onClick }) => (
    <Box
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      sx={{
        ...stepButtonSx,
        minHeight: 28,
        borderRadius: 0,
        backgroundColor: palette.bg,
        color: palette.muted,
        fontSize: "15px",
        fontWeight: 950,
        lineHeight: 1,
        "&:hover": {
          backgroundColor: palette.accentSoft,
          color: palette.accent,
        },
      }}
    >
      {children}
    </Box>
  );

  return (
    <Box
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.defaultPrevented) {
          return;
        }

        if (event.key.toLowerCase() === "p") {
          event.preventDefault();
          updatePeriod("PM");
          return;
        }
        if (event.key.toLowerCase() === "a") {
          event.preventDefault();
          updatePeriod("AM");
          return;
        }
        if (event.key === "ArrowDown" && nextRef?.current) {
          event.preventDefault();
          focusControl(nextRef);
          return;
        }
        if (event.key === "ArrowUp" && focusByArrow(event, inputRef)) {
          return;
        }
        if (event.key === "Enter" && nextRef?.current) {
          event.preventDefault();
          focusControl(nextRef);
        }
      }}
      sx={{
        width: "100%",
        height: "100%",
        minWidth: 0,
        display: "grid",
        gridTemplateColumns: "1.35fr 14px 1.35fr 0.9fr",
        gap: 0,
        alignItems: "stretch",
        overflow: "hidden",
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: palette.radius.control,
        outline: "none",
        transition: "border-color .18s ease, background-color .18s ease",
        "&:focus-within": {
          borderColor: palette.border,
          backgroundColor: palette.bg,
        },
      }}
    >
      {renderTimeInputPart(
        <InputBase
          inputRef={hourRef}
          value={hourDraft || String(displayHour).padStart(2, "0")}
          onChange={handleHourChange}
          onKeyDown={(event) => handlePartKeyDown(event, "hour")}
          onFocus={(event) => event.target.select()}
          onBlur={commitHourDraft}
          title="Hora"
          inputProps={{ inputMode: "numeric", maxLength: 2, "aria-label": "Hora" }}
          sx={partInputSx}
        />,
        stepHour,
      )}
      <Box
        className="time-separator"
        aria-hidden="true"
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          color: palette.muted,
          fontSize: "20px",
          fontWeight: 900,
          lineHeight: 1,
          pt: "8px",
          backgroundColor: palette.bg,
        }}
      >
        :
      </Box>
      {renderTimeInputPart(
        <InputBase
          inputRef={minuteRef}
          value={minuteDraft || String(minuteValue).padStart(2, "0")}
          onChange={handleMinuteChange}
          onKeyDown={(event) => handlePartKeyDown(event, "minute")}
          onFocus={(event) => event.target.select()}
          onBlur={commitMinuteDraft}
          title="Minutos"
          inputProps={{ inputMode: "numeric", maxLength: 2, "aria-label": "Minutos" }}
          sx={partInputSx}
        />,
        stepMinute,
      )}
      {renderTimeInputPart(
        <InputBase
          inputRef={periodRef}
          value={period}
          onChange={handlePeriodChange}
          onKeyDown={(event) => handlePartKeyDown(event, "period")}
          onFocus={(event) => event.target.select()}
          onClick={() => updatePeriod(period === "AM" ? "PM" : "AM")}
          title="AM o PM"
          inputProps={{ maxLength: 2, "aria-label": "AM o PM" }}
          sx={{
            ...partInputSx,
            color: period === "PM" ? palette.onAccent : palette.text,
            backgroundColor: period === "PM" ? palette.accent : palette.bg,
            "& input": {
              ...partInputSx["& input"],
              letterSpacing: 0,
            },
            "&:focus-within": {
              backgroundColor: period === "PM" ? palette.accent : palette.accentSoft,
              boxShadow: `inset 0 0 0 1px ${palette.accent}`,
            },
          }}
        />,
      )}
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

export function ChoiceGroup({ value, onChange, options = ["OFICINA", "CLIENTE"], inputRef, nextRef, compact = false }) {
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
          focusControl(nextRef);
          return;
        }
        if (event.key === "ArrowUp" && focusByArrow(event, inputRef)) {
          return;
        }
        if (event.key === "Enter" && nextRef?.current) {
          event.preventDefault();
          focusControl(nextRef);
        }
      }}
      sx={{
        display: "flex",
        gap: 0,
        flexWrap: "nowrap",
        alignItems: "center",
        justifyContent: "flex-start",
        minWidth: 0,
        width: compact ? "auto" : "100%",
        alignSelf: "stretch",
        p: 0.15,
        outline: "none",
        borderRadius: palette.radius.control,
        overflow: "hidden",
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        "&:focus-visible": {
          boxShadow: `0 0 0 2px ${palette.accent}`,
        },
      }}
    >
      {normalizedOptions.map((option, index) => {
        const selected = value === option.value;
        const warningSelected = selected && option.value === "POR_COBRAR";

        return (
          <Box
            key={option.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            sx={{
              height: 26,
              px: 0.95,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: index === 0
                ? `${palette.radius.control} 0 0 ${palette.radius.control}`
                : index === normalizedOptions.length - 1
                  ? `0 ${palette.radius.control} ${palette.radius.control} 0`
                  : 0,
              backgroundColor: warningSelected ? palette.warningSoft : selected ? palette.accent : "transparent",
              border: warningSelected ? `1px solid ${palette.warning}` : "1px solid transparent",
              color: warningSelected ? palette.warning : selected ? palette.onAccent : palette.muted,
              fontSize: "10px",
              fontWeight: 800,
              cursor: "pointer",
              lineHeight: 1,
              whiteSpace: "nowrap",
              flex: compact ? "0 0 auto" : 1,
              minWidth: 0,
              boxShadow: selected ? palette.shadowSoft : "none",
              transition: "all .16s ease",
              "&:hover": {
                color: warningSelected ? palette.warning : selected ? palette.onAccent : palette.text,
                backgroundColor: warningSelected ? palette.warningSoft : selected ? palette.accent : palette.chip,
              },
            }}
          >
            {option.label}
          </Box>
        );
      })}
    </Box>
  );
}
