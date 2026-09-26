import React from "react";
import { Box, IconButton, InputBase } from "@mui/material";
import { MapPin, Truck, UserRound } from "lucide-react";

import palette from "../../../../../theme/palette";
import { destinoDesdeRuta } from "./trEncomiendaModalUtils";
import {
  CaptureInput,
  focusByArrow,
  inputSx,
  searchIconButtonSxPlano,
  searchIconButtonSxColgado,
} from "./TrEncomiendaModalInputs";

export function RutaField({ ruta, onChange, onOpen, inputRef, nextRef }) {
  // Destino visual; internamente se conserva id_ruta para el contrato de mve_transventa.
  const textoRuta = ruta ? destinoDesdeRuta(ruta) : "";

  return (
    <Box sx={{ position: "relative", flex: 1, minWidth: 0, width: "100%", display: "flex", alignItems: "center", cursor: "text" }}>
      <IconButton size="small" onClick={onOpen} sx={searchIconButtonSxColgado}>
        <MapPin />
      </IconButton>
      <InputBase
        inputRef={inputRef}
        value={textoRuta}
        placeholder="Escoger destino"
        onChange={(event) => {
          if (!event.target.value) {
            onChange("");
          }
        }}
        onPaste={(event) => event.preventDefault()}
        onFocus={(event) => {
          const input = event.target;
          window.setTimeout(() => {
            const end = String(input.value || "").length;
            input.setSelectionRange?.(end, end);
          }, 0);
        }}
        onKeyDown={(event) => {
          if (["ArrowUp", "ArrowDown"].includes(event.key)) {
            if (focusByArrow(event, inputRef)) {
              return;
            }
          }
          if (focusByArrow(event, inputRef)) {
            return;
          }
          if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            onChange("");
            return;
          }
          if (event.key === "+" || (event.key === "Enter" && !textoRuta)) {
            event.preventDefault();
            onOpen();
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
          // Igual que CaptureInput: el control ocupa lo que deja el boton, para que
          // el largo del input sea el mismo que en los demas campos del formulario.
          flex: 1,
          minWidth: 0,
          cursor: "text",
          "& input": {
            cursor: "text",
            caretColor: palette.text,
          },
        }}
      />
    </Box>
  );
}

export function PuntoVentaField({ value }) {
  return (
    <Box sx={{ width: "100%", display: "flex", alignItems: "center" }}>
      <IconButton
        size="small"
        tabIndex={-1}
        sx={{
          ...searchIconButtonSxPlano,
          pointerEvents: "none",
          color: palette.border,
        }}
      >
        <MapPin />
      </IconButton>
      <InputBase
        value={value || ""}
        placeholder="Origen"
        readOnly
        sx={inputSx}
      />
    </Box>
  );
}

export function ZonaField({ value, onClear, onOpen, inputRef, nextRef, placeholder }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, width: "100%", display: "flex", alignItems: "center", cursor: "text" }}>
      <IconButton size="small" onClick={onOpen} sx={searchIconButtonSxPlano}>
        <MapPin />
      </IconButton>
      <InputBase
        inputRef={inputRef}
        value={value || ""}
        placeholder={placeholder}
        onChange={(event) => {
          if (!event.target.value) {
            onClear();
          }
        }}
        onPaste={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (focusByArrow(event, inputRef)) {
            return;
          }
          if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            onClear();
            return;
          }
          if (event.key === "+" || (event.key === "Enter" && !value)) {
            event.preventDefault();
            onOpen();
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
          // Igual que CaptureInput: el control ocupa lo que deja el boton, para que
          // el largo del input sea el mismo que en los demas campos del formulario.
          flex: 1,
          minWidth: 0,
          cursor: "text",
          "& input": {
            cursor: "text",
            caretColor: palette.text,
          },
        }}
      />
    </Box>
  );
}

export function PlacaField({ value, onChange, onOpen, inputRef, nextRef }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
      <IconButton size="small" onClick={onOpen} sx={searchIconButtonSxPlano}>
        <Truck />
      </IconButton>
      <CaptureInput
        value={value}
        onChange={(nextValue) => onChange(String(nextValue || "").toUpperCase())}
        inputRef={inputRef}
        nextRef={nextRef}
        placeholder="Placa"
        onPlus={onOpen}
        onEmptyEnter={onOpen}
      />
    </Box>
  );
}

export function LicenciaField({ value, onChange, onOpen, inputRef, nextRef, onEnter }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
      <IconButton size="small" onClick={onOpen} sx={searchIconButtonSxPlano}>
        <UserRound />
      </IconButton>
      <CaptureInput
        value={value}
        onChange={(nextValue) => onChange(String(nextValue || "").toUpperCase())}
        inputRef={inputRef}
        nextRef={nextRef}
        placeholder="Chofer / licencia"
        onPlus={onOpen}
        onEmptyEnter={onOpen}
        onEnter={onEnter}
      />
    </Box>
  );
}
