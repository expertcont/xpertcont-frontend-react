import React, { useEffect, useMemo, useRef } from "react";
import { Box, Popover, Typography } from "@mui/material";
import { CornerDownLeft, Timer } from "lucide-react";

import palette from "../../../../../theme/palette";
import { focusByArrow } from "./TrEncomiendaModalInputs";

const pad = (numero) => String(numero).padStart(2, "0");

const focusControl = (ref) => {
  const target = ref?.current;

  if (!target) {
    return;
  }

  target.focus();
  target.select?.();
};

const parseValue = (valor) => {
  const [h = "0", m = "0"] = String(valor || "00:00").split(":");
  let hour24 = Number(h);
  let minute = Number(m);

  if (Number.isNaN(hour24)) hour24 = 0;
  if (Number.isNaN(minute)) minute = 0;

  hour24 = Math.max(0, Math.min(23, hour24));
  minute = Math.max(0, Math.min(59, minute));
  minute = Math.round(minute / 5) * 5;

  if (minute >= 60) {
    return {
      hour24: (hour24 + 1) % 24,
      minute: 0,
    };
  }

  return {
    hour24,
    minute,
  };
};

const formatValue = (newHour24, newMinute) => {
  let total = newHour24 * 60 + newMinute;
  total = ((total % 1440) + 1440) % 1440;

  const h = Math.floor(total / 60);
  const m = total % 60;

  return `${pad(h)}:${pad(m)}`;
};

const to12 = (h) => {
  const valor = h % 12;
  return valor === 0 ? 12 : valor;
};

export default function TimeWheelPicker({
  value = "08:30",
  onChange,
  minuteStep = 5,
  label = "Hora de llegada",
  inputRef,
  nextRef,
}) {
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const touchStartYRef = useRef(null);
  const lastTapRef = useRef(0);
  const confirmingRef = useRef(false);
  const digitBufferRef = useRef("");
  const digitTimerRef = useRef(null);
  const [expanded, setExpanded] = React.useState(false);
  const [activePart, setActivePart] = React.useState("hour");
  const { hour24, minute } = parseValue(value);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = useMemo(() => to12(hour24), [hour24]);

  useEffect(() => {
    if (!inputRef) {
      return undefined;
    }

    inputRef.current = {
      focus: () => rootRef.current?.focus(),
      select: () => rootRef.current?.focus(),
    };

    return () => {
      inputRef.current = null;
    };
  }, [inputRef]);

  useEffect(() => {
    digitBufferRef.current = "";
    if (digitTimerRef.current) {
      window.clearTimeout(digitTimerRef.current);
      digitTimerRef.current = null;
    }
  }, [activePart]);

  useEffect(() => () => {
    if (digitTimerRef.current) {
      window.clearTimeout(digitTimerRef.current);
    }
  }, []);

  const emitirCambio = (newHour24, newMinute) => {
    onChange?.(formatValue(newHour24, newMinute));
  };

  const cambiarMinutos = (delta) => {
    emitirCambio(hour24, minute + delta);
  };

  const cambiarHora = (delta) => {
    emitirCambio(hour24 + delta, minute);
  };

  const cambiarPeriodo = (nuevoPeriodo) => {
    if (nuevoPeriodo === period) return;
    emitirCambio(nuevoPeriodo === "PM" ? hour24 + 12 : hour24 - 12, minute);
  };

  const setHora12Digitada = (digits) => {
    const parsed = Number(digits);
    const safeHour12 = Math.min(12, Math.max(1, parsed || 12));
    const baseHour = safeHour12 % 12;
    emitirCambio(period === "PM" ? baseHour + 12 : baseHour, minute);
  };

  const setMinutoDigitado = (digits) => {
    const parsed = Math.min(59, Math.max(0, Number(digits) || 0));
    const snapped = Math.min(60 - minuteStep, Math.round(parsed / minuteStep) * minuteStep);
    emitirCambio(hour24, snapped);
  };

  const commitDigitBuffer = () => {
    const digits = digitBufferRef.current;
    digitBufferRef.current = "";

    if (!digits) {
      return;
    }

    if (activePart === "hour") {
      setHora12Digitada(digits);
      return;
    }

    if (activePart === "minute") {
      setMinutoDigitado(digits);
    }
  };

  const handleDigit = (digit) => {
    if (!["hour", "minute"].includes(activePart)) {
      return false;
    }

    digitBufferRef.current = `${digitBufferRef.current}${digit}`.slice(-2);

    if (digitTimerRef.current) {
      window.clearTimeout(digitTimerRef.current);
    }

    if (digitBufferRef.current.length >= 2) {
      commitDigitBuffer();
      return true;
    }

    digitTimerRef.current = window.setTimeout(commitDigitBuffer, 650);
    return true;
  };

  const cambiarParteActiva = (delta) => {
    const parts = ["hour", "minute", "period"];
    const currentIndex = parts.indexOf(activePart);
    const nextIndex = Math.min(parts.length - 1, Math.max(0, currentIndex + delta));
    setActivePart(parts[nextIndex]);
  };

  const ajustarParteActiva = (delta) => {
    if (activePart === "hour") {
      cambiarHora(delta);
      return;
    }

    if (activePart === "minute") {
      cambiarMinutos(delta * minuteStep);
      return;
    }

    cambiarPeriodo(period === "AM" ? "PM" : "AM");
  };

  // Rueda del mouse: ajusta la parte activa (hora, minutos o AM/PM) igual que el
  // teclado con + / -. Arriba suma, abajo resta, y no deja que la pagina se mueva
  // mientras el puntero esta sobre el control.
  const wheelHandlerRef = useRef(null);

  useEffect(() => {
    wheelHandlerRef.current = (event) => {
      if (!event.deltaY) {
        return;
      }
      event.preventDefault();
      ajustarParteActiva(event.deltaY < 0 ? 1 : -1);
    };
  });

  // Se usa addEventListener y no onWheel porque React registra la rueda como
  // listener pasivo: sin preventDefault la pagina scrollea en paralelo.
  useEffect(() => {
    const nodes = [rootRef.current, expanded ? panelRef.current : null].filter(Boolean);
    if (!nodes.length) {
      return undefined;
    }

    const onWheel = (event) => wheelHandlerRef.current?.(event);
    nodes.forEach((node) => node.addEventListener("wheel", onWheel, { passive: false }));

    return () => {
      nodes.forEach((node) => node.removeEventListener("wheel", onWheel));
    };
  }, [expanded]);

  const wheelOffsets = [-2, -1, 0, 1, 2];

  const handleKeyDown = (event) => {
    if (/^\d$/.test(event.key)) {
      if (handleDigit(event.key)) {
        event.preventDefault();
        return;
      }
    }

    if (event.key.toLowerCase() === "a") {
      event.preventDefault();
      setActivePart("period");
      cambiarPeriodo("AM");
      return;
    }

    if (event.key.toLowerCase() === "p") {
      event.preventDefault();
      setActivePart("period");
      cambiarPeriodo("PM");
      return;
    }

    if (event.key === "+" || event.key === "=" || event.code === "NumpadAdd") {
      event.preventDefault();
      ajustarParteActiva(1);
      return;
    }

    if (event.key === "-" || event.code === "NumpadSubtract") {
      event.preventDefault();
      ajustarParteActiva(-1);
      return;
    }

    if (event.key === "PageUp") {
      event.preventDefault();
      cambiarHora(1);
      return;
    }

    if (event.key === "PageDown") {
      event.preventDefault();
      cambiarHora(-1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setExpanded(false);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (activePart === "hour") {
        setExpanded(false);
        focusByArrow(event, inputRef);
        return;
      }
      cambiarParteActiva(-1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (activePart === "period") {
        setExpanded(false);
        focusControl(nextRef);
        return;
      }
      cambiarParteActiva(1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (activePart === "hour") {
        setActivePart("minute");
        return;
      }

      if (activePart === "minute") {
        setActivePart("period");
        return;
      }

      setExpanded(false);
      focusControl(nextRef);
    }
  };

  const displayValue = `${pad(hour12)}:${pad(minute)} ${period}`;

  const handleFocus = () => {
    if (confirmingRef.current) {
      return;
    }

    if (!expanded) {
      setActivePart("hour");
    }
    setExpanded(true);
  };

  const handleClose = () => {
    setExpanded(false);
  };

  const confirmarValor = () => {
    confirmingRef.current = true;
    commitDigitBuffer();
    setExpanded(false);
    rootRef.current?.blur();
    panelRef.current?.blur();

    window.setTimeout(() => {
      focusControl(nextRef);
      confirmingRef.current = false;
    }, 0);
  };

  const handleTouchStart = (event) => {
    touchStartYRef.current = event.touches?.[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event, part) => {
    const startY = touchStartYRef.current;
    const endY = event.changedTouches?.[0]?.clientY;
    touchStartYRef.current = null;

    if (startY === null || endY === undefined) {
      return;
    }

    const deltaY = endY - startY;
    const now = Date.now();

    if (Math.abs(deltaY) < 22) {
      if (now - lastTapRef.current < 320) {
        confirmarValor();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
      return;
    }

    lastTapRef.current = 0;
    setActivePart(part);

    if (part === "hour") {
      cambiarHora(deltaY < 0 ? 1 : -1);
      return;
    }

    if (part === "minute") {
      cambiarMinutos(deltaY < 0 ? minuteStep : -minuteStep);
      return;
    }

    cambiarPeriodo(period === "AM" ? "PM" : "AM");
  };

  const wheelItem = {
    minHeight: { xs: 38, md: 31 },
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    userSelect: "none",
    fontVariantNumeric: "tabular-nums",
    transition: "opacity .16s ease, color .16s ease, font-size .16s ease",
  };

  const wheelItemSx = (offset, active = true) => {
    const distance = Math.abs(offset);

    return {
      ...wheelItem,
      fontSize: offset === 0 ? { xs: "29px", md: "25px" } : { xs: "21px", md: "18px" },
      fontWeight: offset === 0 ? 950 : 750,
      color: offset === 0 ? palette.text : palette.muted,
      opacity: !active ? 0 : offset === 0 ? 1 : distance === 1 ? 0.42 : 0.16,
      cursor: active ? "pointer" : "default",
      lineHeight: 1,
    };
  };

  const activePartSx = (part) => activePart === part ? {
    backgroundColor: palette.accentSoft,
  } : {};

  const handleWheelItemClick = (part, offset, targetPeriod) => {
    setActivePart(part);

    if (part === "hour") {
      cambiarHora(offset);
      return;
    }

    if (part === "minute") {
      cambiarMinutos(offset * minuteStep);
      return;
    }

    if (targetPeriod) {
      cambiarPeriodo(targetPeriod);
    }
  };

  const renderWheelColumn = (part, items, onTouchPart = part) => (
    <Box
      onClick={() => setActivePart(part)}
      onTouchStart={handleTouchStart}
      onTouchEnd={(event) => handleTouchEnd(event, onTouchPart)}
      sx={{
        position: "relative",
        zIndex: 1,
        borderRadius: palette.radius.control,
        touchAction: "pan-y",
        overflow: "hidden",
        ...activePartSx(part),
      }}
    >
      {items.map((item) => (
        <Box
          key={`${part}-${item.offset}-${item.label}`}
          onClick={(event) => {
            event.stopPropagation();
            handleWheelItemClick(part, item.offset, item.targetPeriod);
          }}
          sx={wheelItemSx(item.offset, item.active !== false)}
        >
          {item.label}
        </Box>
      ))}
    </Box>
  );

  const hourItems = wheelOffsets.map((offset) => ({
    offset,
    label: pad(to12(hour24 + offset)),
  }));
  const minuteItems = wheelOffsets.map((offset) => ({
    offset,
    label: pad((minute + (offset * minuteStep) + 60) % 60),
  }));
  const periodItems = period === "PM"
    ? [
      { offset: -2, label: "", active: false },
      { offset: -1, label: "AM", targetPeriod: "AM" },
      { offset: 0, label: "PM", targetPeriod: "PM" },
      { offset: 1, label: "", active: false },
      { offset: 2, label: "", active: false },
    ]
    : [
      { offset: -2, label: "", active: false },
      { offset: -1, label: "", active: false },
      { offset: 0, label: "AM", targetPeriod: "AM" },
      { offset: 1, label: "PM", targetPeriod: "PM" },
      { offset: 2, label: "", active: false },
    ];

  const renderWheel = () => (
    <Box
      sx={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "minmax(66px, 1fr) 16px minmax(66px, 1fr) minmax(64px, .82fr)",
        alignItems: "center",
        columnGap: { xs: 1, md: 0.7 },
        opacity: 0.96,
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          height: "1px",
          backgroundColor: palette.border,
          zIndex: 0,
        },
        "&::before": {
          top: "40%",
        },
        "&::after": {
          bottom: "40%",
        },
      }}
    >
      {renderWheelColumn("hour", hourItems)}

      <Box
        aria-hidden="true"
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "center",
          color: palette.muted,
          fontSize: { xs: "26px", md: "20px" },
          fontWeight: 950,
        }}
      >
        :
      </Box>

      {renderWheelColumn("minute", minuteItems)}
      {renderWheelColumn("period", periodItems)}
    </Box>
  );

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 0.35 }}>
      {label && (
        <Typography
          component="span"
          sx={{
            color: palette.muted,
            fontSize: "9px",
            fontWeight: 800,
            textTransform: "uppercase",
            lineHeight: 1,
            ml: 0.25,
          }}
        >
          {label}
        </Typography>
      )}
      <Box
        ref={rootRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={() => rootRef.current?.focus()}
        sx={{
          width: "100%",
          alignSelf: "stretch",
          outline: "none",
          color: palette.text,
          cursor: "default",
          transition: "border-color .18s ease, background-color .18s ease, box-shadow .18s ease",
          "&:focus-visible": {
            boxShadow: "none",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            minHeight: 34,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 1,
            backgroundColor: palette.bg,
            boxShadow: `inset 0 1px 0 ${palette.borderSoft}, inset 0 -1px 0 ${palette.borderSoft}`,
            borderRadius: 0.75,
            py: 0.15,
            overflow: "hidden",
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              justifySelf: "start",
              ml: 0.35,
              width: { xs: 34, md: 28 },
              height: { xs: 34, md: 28 },
              borderRadius: palette.radius.control,
              color: palette.accent,
              backgroundColor: palette.accentSoft,
              border: `1px solid ${palette.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              "& svg": {
                width: { xs: 18, md: 16 },
                height: { xs: 18, md: 16 },
              },
            }}
          >
            <Timer />
          </Box>
          <Typography
            sx={{
              color: palette.text,
              fontSize: { xs: "19px", md: "17px" },
              fontWeight: 950,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              justifySelf: "center",
            }}
          >
            {displayValue}
          </Typography>
          {label && (
            <Typography
              aria-hidden="true"
              sx={{
                justifySelf: "end",
                mr: 0.55,
                color: palette.muted,
                fontSize: "11.5px",
                fontWeight: 800,
                letterSpacing: 0,
                opacity: 0.95,
                textTransform: "none",
                lineHeight: 1,
              }}
            >
              {label}
            </Typography>
          )}
        </Box>
      </Box>
      <Popover
        open={expanded}
        anchorEl={rootRef.current}
        onClose={handleClose}
        disableAutoFocus
        disableEnforceFocus
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          ref: panelRef,
          tabIndex: 0,
          onKeyDown: handleKeyDown,
          onDoubleClick: (event) => {
            event.preventDefault();
            event.stopPropagation();
            confirmarValor();
          },
          sx: {
            mt: 0.5,
            width: { xs: 304, sm: 288 },
            maxWidth: "calc(100vw - 24px)",
            px: { xs: 1.05, md: 0.9 },
            py: { xs: 0.85, md: 0.7 },
            borderRadius: palette.radius.modal,
            border: 0,
            backgroundColor: palette.surface,
            color: palette.text,
            boxShadow: "none",
            outline: "none",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 1,
            mb: 0.45,
          }}
        >
          <Typography
            sx={{
              color: palette.muted,
              fontSize: "10px",
              fontWeight: 800,
              textTransform: "uppercase",
              ml: 0.2,
            }}
          >
            Editando hora
          </Typography>
          <Typography
            sx={{
              color: palette.muted,
              fontSize: "10px",
              lineHeight: 1.2,
              textAlign: "right",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 0.35,
              whiteSpace: "nowrap",
            }}
          >
            <CornerDownLeft size={13} />
            Enter / Doble Click
          </Typography>
        </Box>
        {renderWheel()}
      </Popover>
    </Box>
  );
}
