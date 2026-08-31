import React, { useEffect, useRef, useState } from "react";
import { Box, Dialog, IconButton, InputBase, Typography } from "@mui/material";
import { Search, X } from "lucide-react";

import palette from "../../../../../theme/palette";
import { fieldSx, inputSx } from "./TrEncomiendaModalInputs";
import { destinoDesdeRuta } from "./trEncomiendaModalUtils";

function PickerSearch({ inputRef, value, placeholder, onChange, onKeyDown }) {
  return (
    <Box sx={{ ...fieldSx, mb: 0.9 }}>
      <Box sx={{ color: palette.muted, display: "flex", mr: 0.6 }}>
        <Search size={15} />
      </Box>
      <InputBase
        inputRef={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        sx={inputSx}
        autoFocus
      />
    </Box>
  );
}

function PickerLayout({ open, title, subtitle, search, children, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 3 } }}>
      <Box sx={{ p: 1.1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "15px" }}>{title}</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "11px" }}>{subtitle}</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>

        {search}
        <Box sx={{ maxHeight: 360, overflowY: "auto", display: "grid", gap: 0.65 }}>
          {children}
        </Box>
      </Box>
    </Dialog>
  );
}

function PickerOption({ selected, onSelect, optionRef, children }) {
  return (
    <Box
      ref={optionRef}
      onClick={onSelect}
      sx={{
        p: 0.85,
        borderRadius: 2,
        border: `1px solid ${selected ? palette.accent : palette.borderSoft}`,
        backgroundColor: selected ? palette.accentSoft : palette.bg,
        cursor: "pointer",
        transition: "all .16s ease",
        "&:hover": {
          borderColor: palette.accent,
          backgroundColor: palette.surfaceAlt,
        },
      }}
    >
      {children}
    </Box>
  );
}

function usePickerState(open, itemsLength) {
  const [busqueda, setBusqueda] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const busquedaRef = useRef(null);
  const selectedOptionRef = useRef(null);

  useEffect(() => {
    if (open) {
      setBusqueda("");
      setSelectedIndex(0);
      window.setTimeout(() => {
        busquedaRef.current?.focus();
        busquedaRef.current?.select?.();
      }, 80);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [busqueda]);

  useEffect(() => {
    if (selectedIndex >= itemsLength) {
      setSelectedIndex(Math.max(0, itemsLength - 1));
    }
  }, [itemsLength, selectedIndex]);

  useEffect(() => {
    selectedOptionRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [selectedIndex]);

  return { busqueda, setBusqueda, selectedIndex, setSelectedIndex, busquedaRef, selectedOptionRef };
}

export function RutaPickerModal({ open, rutas, onClose, onSelect }) {
  const state = usePickerState(open, rutas.length);
  const filtradas = rutas.filter((ruta) => [
    ruta.nombre,
    ruta.id_punto_venta_dest,
    ruta.punto_venta_dest_nombre,
    ruta.punto_venta_destino_nombre,
    ruta.destino_nombre,
  ].some((field) => String(field || "").toLowerCase().includes(state.busqueda.toLowerCase())));
  const indexFinal = Math.min(state.selectedIndex, Math.max(0, filtradas.length - 1));

  return (
    <PickerLayout
      open={open}
      title="Escoger destino"
      subtitle="La ruta queda registrada internamente"
      onClose={onClose}
      search={(
        <PickerSearch
          inputRef={state.busquedaRef}
          value={state.busqueda}
          onChange={state.setBusqueda}
          placeholder="Buscar destino..."
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && filtradas.length > 0) {
              event.preventDefault();
              state.setSelectedIndex((prev) => Math.min(prev + 1, filtradas.length - 1));
              return;
            }
            if (event.key === "ArrowUp" && filtradas.length > 0) {
              event.preventDefault();
              state.setSelectedIndex((prev) => Math.max(prev - 1, 0));
              return;
            }
            if (event.key === "Enter" && filtradas[indexFinal]) {
              event.preventDefault();
              onSelect(filtradas[indexFinal]);
            }
          }}
        />
      )}
    >
      {filtradas.map((ruta, index) => {
        const destinoNombre = destinoDesdeRuta(ruta);
        return (
          <PickerOption
            key={ruta.id_ruta}
            selected={index === indexFinal}
            optionRef={index === indexFinal ? state.selectedOptionRef : null}
            onSelect={() => onSelect(ruta)}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
              <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "13px" }}>{destinoNombre}</Typography>
              <Typography sx={{ color: palette.accent, fontWeight: 800, fontSize: "11px" }}>{ruta.id_punto_venta_dest}</Typography>
            </Box>
            {ruta.nombre && ruta.nombre !== destinoNombre && (
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.25 }}>
                {ruta.nombre}
              </Typography>
            )}
          </PickerOption>
        );
      })}

      {filtradas.length === 0 && (
        <Typography sx={{ color: palette.muted, fontSize: "12px", py: 3, textAlign: "center" }}>
          Sin destinos disponibles
        </Typography>
      )}
    </PickerLayout>
  );
}

export function ZonaPickerModal({ open, titulo, zonas, onClose, onSelect }) {
  const state = usePickerState(open, 0);
  const filtradas = zonas.filter((zona) => [
    zona.id_zona,
    zona.nombre,
    zona.descripcion,
  ].some((field) => String(field || "").toLowerCase().includes(state.busqueda.toLowerCase())));
  const indexFinal = Math.min(state.selectedIndex, Math.max(0, filtradas.length - 1));

  return (
    <PickerLayout
      open={open}
      title={titulo}
      subtitle="Se guarda el nombre de la zona"
      onClose={onClose}
      search={(
        <PickerSearch
          inputRef={state.busquedaRef}
          value={state.busqueda}
          onChange={state.setBusqueda}
          placeholder="Buscar zona..."
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && filtradas.length > 0) {
              event.preventDefault();
              state.setSelectedIndex((prev) => Math.min(prev + 1, filtradas.length - 1));
              return;
            }
            if (event.key === "ArrowUp" && filtradas.length > 0) {
              event.preventDefault();
              state.setSelectedIndex((prev) => Math.max(prev - 1, 0));
              return;
            }
            if (event.key === "Enter" && filtradas[indexFinal]) {
              event.preventDefault();
              onSelect(filtradas[indexFinal]);
            }
          }}
        />
      )}
    >
      {filtradas.map((zona, index) => (
        <PickerOption
          key={`${zona.id_punto_venta}-${zona.id_zona}`}
          selected={index === indexFinal}
          optionRef={index === indexFinal ? state.selectedOptionRef : null}
          onSelect={() => onSelect(zona)}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
            <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "13px" }}>{zona.nombre}</Typography>
            <Typography sx={{ color: palette.accent, fontWeight: 800, fontSize: "11px" }}>{zona.id_zona}</Typography>
          </Box>
          <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.25 }}>
            {zona.descripcion || "Sin descripcion"}
          </Typography>
        </PickerOption>
      ))}

      {filtradas.length === 0 && (
        <Typography sx={{ color: palette.muted, fontSize: "12px", py: 3, textAlign: "center" }}>
          Sin zonas disponibles
        </Typography>
      )}
    </PickerLayout>
  );
}

export function PlacaPickerModal({ open, placas, onClose, onSelect }) {
  const state = usePickerState(open, 0);
  const filtradas = placas.filter((item) => [
    item.placa,
    item.marca,
    item.certificado,
  ].some((field) => String(field || "").toLowerCase().includes(state.busqueda.toLowerCase())));
  const indexFinal = Math.min(state.selectedIndex, Math.max(0, filtradas.length - 1));

  return (
    <PickerLayout
      open={open}
      title="Escoger placa"
      subtitle="Busca por placa, marca o certificado"
      onClose={onClose}
      search={(
        <PickerSearch
          inputRef={state.busquedaRef}
          value={state.busqueda}
          onChange={state.setBusqueda}
          placeholder="Buscar placa..."
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && filtradas.length > 0) {
              event.preventDefault();
              state.setSelectedIndex((prev) => Math.min(prev + 1, filtradas.length - 1));
              return;
            }
            if (event.key === "ArrowUp" && filtradas.length > 0) {
              event.preventDefault();
              state.setSelectedIndex((prev) => Math.max(prev - 1, 0));
              return;
            }
            if (event.key === "Enter" && filtradas[indexFinal]) {
              event.preventDefault();
              onSelect(filtradas[indexFinal]);
            }
          }}
        />
      )}
    >
      {filtradas.map((item, index) => (
        <PickerOption
          key={item.placa}
          selected={index === indexFinal}
          optionRef={index === indexFinal ? state.selectedOptionRef : null}
          onSelect={() => onSelect(item)}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
            <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "13px" }}>{item.placa}</Typography>
            <Typography sx={{ color: palette.accent, fontWeight: 800, fontSize: "11px" }}>{item.certificado || "Sin certificado"}</Typography>
          </Box>
          <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.25 }}>
            {item.marca || "Sin marca"}
          </Typography>
        </PickerOption>
      ))}

      {filtradas.length === 0 && (
        <Typography sx={{ color: palette.muted, fontSize: "12px", py: 3, textAlign: "center" }}>
          Sin placas disponibles
        </Typography>
      )}
    </PickerLayout>
  );
}

export function LicenciaPickerModal({ open, licencias, onClose, onSelect }) {
  const state = usePickerState(open, 0);
  const filtradas = licencias.filter((item) => [
    item.licencia,
    item.nombre,
    item.dni,
    item.descripcion,
  ].some((field) => String(field || "").toLowerCase().includes(state.busqueda.toLowerCase())));
  const indexFinal = Math.min(state.selectedIndex, Math.max(0, filtradas.length - 1));

  return (
    <PickerLayout
      open={open}
      title="Escoger licencia"
      subtitle="Busca por licencia, nombre, DNI o descripcion"
      onClose={onClose}
      search={(
        <PickerSearch
          inputRef={state.busquedaRef}
          value={state.busqueda}
          onChange={state.setBusqueda}
          placeholder="Buscar licencia..."
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && filtradas.length > 0) {
              event.preventDefault();
              state.setSelectedIndex((prev) => Math.min(prev + 1, filtradas.length - 1));
              return;
            }
            if (event.key === "ArrowUp" && filtradas.length > 0) {
              event.preventDefault();
              state.setSelectedIndex((prev) => Math.max(prev - 1, 0));
              return;
            }
            if (event.key === "Enter" && filtradas[indexFinal]) {
              event.preventDefault();
              onSelect(filtradas[indexFinal]);
            }
          }}
        />
      )}
    >
      {filtradas.map((item, index) => (
        <PickerOption
          key={item.licencia}
          selected={index === indexFinal}
          optionRef={index === indexFinal ? state.selectedOptionRef : null}
          onSelect={() => onSelect(item)}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
            <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "13px" }}>{item.licencia}</Typography>
            <Typography sx={{ color: palette.accent, fontWeight: 800, fontSize: "11px" }}>{item.dni || "Sin DNI"}</Typography>
          </Box>
          <Typography sx={{ color: palette.text, fontSize: "12.5px", mt: 0.35 }}>{item.nombre || "Sin nombre"}</Typography>
          <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.25 }}>
            {item.descripcion || "Sin descripcion"}
          </Typography>
        </PickerOption>
      ))}

      {filtradas.length === 0 && (
        <Typography sx={{ color: palette.muted, fontSize: "12px", py: 3, textAlign: "center" }}>
          Sin licencias disponibles
        </Typography>
      )}
    </PickerLayout>
  );
}
