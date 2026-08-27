"use client";

import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Box, Dialog, Grid, IconButton, InputBase, Typography } from "@mui/material";
import { ChevronDown, ChevronUp, Clock, MapPin, Package, Save, Search, Truck, UserRound, X } from "lucide-react";
import swal2 from "sweetalert2";

import AppButton from "../../ui/AppButton";
import AppIconBox from "../../ui/AppIconBox";
import palette from "../../../theme/palette";

const focusableRefs = [];

const toTimePlusHours = (hours = 2) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join(":");
};

const documentoTipoDesdeNumero = (documento) => {
  const limpio = String(documento || "").replace(/\D/g, "");
  if (limpio.length === 11) {
    return "6";
  }
  return "1";
};

const comprobanteDesdeDocumento = (documento) => {
  const limpio = String(documento || "").replace(/\D/g, "");
  if (limpio.length === 11) {
    return { r_cod: "01", label: "GRABAR FACTURA" };
  }

  return { r_cod: "03", label: "GRABAR BOLETA" };
};

const normalizarCondicionPago = (value) => {
  if (value === "CANCELADO") {
    return "PAGADO";
  }
  if (value === "POR_PAGAR") {
    return "POR_COBRAR";
  }
  return value || "PAGADO";
};

const destinoDesdeRuta = (ruta = {}) => {
  const nombreDestino = ruta.punto_venta_dest_nombre || ruta.punto_venta_destino_nombre || ruta.destino_nombre || "";
  if (nombreDestino) {
    return nombreDestino;
  }

  const nombreRuta = String(ruta.nombre || "");
  if (nombreRuta.includes(".")) {
    return nombreRuta.split(".").pop();
  }

  return ruta.id_punto_venta_dest || "";
};

const crearDraft = (operacion, periodoTrabajo, fechaOperacion) => ({
  tipo_operacion: "E",
  r_fecemi: String(operacion?.r_fecemi || fechaOperacion || `${periodoTrabajo}-01`).slice(0, 10),
  r_cod: operacion?.r_cod || comprobanteDesdeDocumento(operacion?.cliente_documento || operacion?.cliente_documento_id).r_cod,
  r_serie: operacion?.r_serie || "B001",
  r_numero: operacion?.r_numero || "",
  id_documento: operacion?.id_documento || operacion?.cliente_id_doc || documentoTipoDesdeNumero(operacion?.cliente_documento || operacion?.cliente_documento_id),
  cliente: operacion?.cliente || "",
  cliente_documento: operacion?.cliente_documento || operacion?.cliente_documento_id || "",
  cliente_telefono: operacion?.cliente_telefono || "",
  remitente_entrega: operacion?.remitente_entrega || "OFICINA",
  remitente_zona: operacion?.remitente_zona || operacion?.cliente_zona || "",
  remitente_direccion: operacion?.remitente_direccion || operacion?.cliente_direccion || "",
  destinatario: operacion?.destinatario || "",
  destinatario_documento: operacion?.destinatario_documento || operacion?.destinatario_documento_id || "",
  destinatario_telefono: operacion?.destinatario_telefono || "",
  destinatario_entrega: operacion?.destinatario_entrega || "OFICINA",
  destinatario_zona: operacion?.destinatario_zona || "",
  destinatario_direccion: operacion?.destinatario_direccion || "",
  id_ruta: operacion?.id_ruta || "",
  id_punto_venta: operacion?.id_punto_venta || "",
  id_punto_venta_dest: operacion?.id_punto_venta_dest || "",
  placa: operacion?.placa || "",
  licencia: operacion?.licencia || "",
  descripcion: operacion?.descripcion || "",
  r_monto_total: operacion?.r_monto_total || operacion?.precio_neto || "",
  condicion_pago: normalizarCondicionPago(operacion?.condicion_pago || operacion?.numero_rdi),
  celulares: false,
  clave: "",
  llegada_aprox: operacion?.llegada_aprox || operacion?.estado_sunat || toTimePlusHours(2),
});

const fieldSx = {
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

const inputSx = {
  color: palette.text,
  fontSize: "12.5px",
  width: "100%",
  "& input::placeholder, & textarea::placeholder": {
    color: palette.muted,
    opacity: 1,
  },
};

const sectionSx = {
  p: { xs: 0.65, md: 0.7 },
  borderRadius: 2,
  backgroundColor: "rgba(255,255,255,.018)",
  border: `1px solid ${palette.borderSoft}`,
};

const searchIconButtonSx = {
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

function Field({ label, icon, children, labelWidth = "auto", tall = false }) {
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

const focusByArrow = (event, inputRef) => {
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

function CaptureInput({ value, onChange, inputRef, nextRef, placeholder, type = "text", multiline = false, align = "left", readOnly = false, onPlus, onEmptyEnter, onEnter }) {
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

function MultilineCapture({ value, onChange, inputRef, nextRef, placeholder }) {
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

function MoneyStepper({ value, onChange, inputRef, nextRef }) {
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

function SectionHeader({ icon, title }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.55, mb: 0.32 }}>
      <Box sx={{ color: palette.accent, display: "flex" }}>{icon}</Box>
      <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 800 }}>
        {title}
      </Typography>
    </Box>
  );
}

function ChoiceGroup({ value, onChange, options = ["OFICINA", "CLIENTE"], inputRef, nextRef }) {
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

function RutaPickerModal({ open, rutas, onClose, onSelect }) {
  const [busqueda, setBusqueda] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const busquedaRef = useRef(null);
  const selectedOptionRef = useRef(null);
  const filtradas = rutas.filter((ruta) => [
    ruta.nombre,
    ruta.id_punto_venta_dest,
    ruta.punto_venta_dest_nombre,
    ruta.punto_venta_destino_nombre,
    ruta.destino_nombre,
  ].some((field) => String(field || "").toLowerCase().includes(busqueda.toLowerCase())));

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
    if (selectedIndex >= filtradas.length) {
      setSelectedIndex(Math.max(0, filtradas.length - 1));
    }
  }, [filtradas.length, selectedIndex]);

  useEffect(() => {
    selectedOptionRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 3 } }}>
      <Box sx={{ p: 1.1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "15px" }}>Escoger destino</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "11px" }}>La ruta queda registrada internamente</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ ...fieldSx, mb: 0.9 }}>
          <Box sx={{ color: palette.muted, display: "flex", mr: 0.6 }}>
            <Search size={15} />
          </Box>
          <InputBase
            inputRef={busquedaRef}
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && filtradas.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtradas.length - 1));
                return;
              }
              if (event.key === "ArrowUp" && filtradas.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                return;
              }
              if (event.key === "Enter" && filtradas[selectedIndex]) {
                event.preventDefault();
                onSelect(filtradas[selectedIndex]);
              }
            }}
            placeholder="Buscar destino..."
            sx={inputSx}
            autoFocus
          />
        </Box>

        <Box sx={{ maxHeight: 360, overflowY: "auto", display: "grid", gap: 0.65 }}>
          {filtradas.map((ruta, index) => {
            const destinoNombre = destinoDesdeRuta(ruta);

            return (
              <Box
                key={ruta.id_ruta}
                id={`ruta-opcion-${index}`}
                ref={index === selectedIndex ? selectedOptionRef : null}
                onClick={() => onSelect(ruta)}
                sx={{
                  p: 0.85,
                  borderRadius: 2,
                  border: `1px solid ${index === selectedIndex ? palette.accent : palette.borderSoft}`,
                  backgroundColor: index === selectedIndex ? palette.accentSoft : palette.bg,
                  cursor: "pointer",
                  transition: "all .16s ease",
                  "&:hover": {
                    borderColor: palette.accent,
                    backgroundColor: palette.surfaceAlt,
                  },
                }}
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
              </Box>
            );
          })}

          {filtradas.length === 0 && (
            <Typography sx={{ color: palette.muted, fontSize: "12px", py: 3, textAlign: "center" }}>
              Sin destinos disponibles
            </Typography>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

function ZonaPickerModal({ open, titulo, zonas, onClose, onSelect }) {
  const [busqueda, setBusqueda] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const busquedaRef = useRef(null);
  const selectedOptionRef = useRef(null);
  const filtradas = zonas.filter((zona) => [
    zona.id_zona,
    zona.nombre,
    zona.descripcion,
  ].some((field) => String(field || "").toLowerCase().includes(busqueda.toLowerCase())));

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
    if (selectedIndex >= filtradas.length) {
      setSelectedIndex(Math.max(0, filtradas.length - 1));
    }
  }, [filtradas.length, selectedIndex]);

  useEffect(() => {
    selectedOptionRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 3 } }}>
      <Box sx={{ p: 1.1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "15px" }}>{titulo}</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "11px" }}>Se guarda el nombre de la zona</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ ...fieldSx, mb: 0.9 }}>
          <Box sx={{ color: palette.muted, display: "flex", mr: 0.6 }}>
            <Search size={15} />
          </Box>
          <InputBase
            inputRef={busquedaRef}
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && filtradas.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtradas.length - 1));
                return;
              }
              if (event.key === "ArrowUp" && filtradas.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                return;
              }
              if (event.key === "Enter" && filtradas[selectedIndex]) {
                event.preventDefault();
                onSelect(filtradas[selectedIndex]);
              }
            }}
            placeholder="Buscar zona..."
            sx={inputSx}
            autoFocus
          />
        </Box>

        <Box sx={{ maxHeight: 360, overflowY: "auto", display: "grid", gap: 0.65 }}>
          {filtradas.map((zona, index) => (
            <Box
              key={`${zona.id_punto_venta}-${zona.id_zona}`}
              ref={index === selectedIndex ? selectedOptionRef : null}
              onClick={() => onSelect(zona)}
              sx={{
                p: 0.85,
                borderRadius: 2,
                border: `1px solid ${index === selectedIndex ? palette.accent : palette.borderSoft}`,
                backgroundColor: index === selectedIndex ? palette.accentSoft : palette.bg,
                cursor: "pointer",
                transition: "all .16s ease",
                "&:hover": {
                  borderColor: palette.accent,
                  backgroundColor: palette.surfaceAlt,
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "13px" }}>{zona.nombre}</Typography>
                <Typography sx={{ color: palette.accent, fontWeight: 800, fontSize: "11px" }}>{zona.id_zona}</Typography>
              </Box>
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.25 }}>
                {zona.descripcion || "Sin descripcion"}
              </Typography>
            </Box>
          ))}

          {filtradas.length === 0 && (
            <Typography sx={{ color: palette.muted, fontSize: "12px", py: 3, textAlign: "center" }}>
              Sin zonas disponibles
            </Typography>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

function RutaField({ ruta, onChange, onOpen, inputRef, nextRef }) {
  // Destino visual; internamente se conserva id_ruta para el contrato de mve_transventa.
  const textoRuta = ruta ? destinoDesdeRuta(ruta) : "";

  return (
    <Box sx={{ width: "100%", display: "flex", alignItems: "center", cursor: "text" }}>
      <IconButton
        size="small"
        onClick={onOpen}
        sx={searchIconButtonSx}
      >
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
          if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
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

function PuntoVentaField({ value }) {
  return (
    <Box sx={{ width: "100%", display: "flex", alignItems: "center" }}>
      <IconButton
        size="small"
        tabIndex={-1}
        sx={{
          ...searchIconButtonSx,
          pointerEvents: "none",
          color: palette.muted,
          backgroundColor: palette.chip,
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

function ZonaField({ value, onClear, onOpen, inputRef, nextRef, placeholder }) {
  return (
    <Box sx={{ width: "100%", display: "flex", alignItems: "center", cursor: "text" }}>
      <IconButton
        size="small"
        onClick={onOpen}
        sx={searchIconButtonSx}
      >
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

// Selector de placas usado por encomiendas. Enter elige la primera coincidencia filtrada.
function PlacaPickerModal({ open, placas, onClose, onSelect }) {
  const [busqueda, setBusqueda] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const busquedaRef = useRef(null);
  const selectedOptionRef = useRef(null);
  const filtradas = placas.filter((item) => [
    item.placa,
    item.marca,
    item.certificado,
  ].some((field) => String(field || "").toLowerCase().includes(busqueda.toLowerCase())));

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
    if (selectedIndex >= filtradas.length) {
      setSelectedIndex(Math.max(0, filtradas.length - 1));
    }
  }, [filtradas.length, selectedIndex]);

  useEffect(() => {
    selectedOptionRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 3 } }}>
      <Box sx={{ p: 1.1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "15px" }}>Escoger placa</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "11px" }}>Busca por placa, marca o certificado</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ ...fieldSx, mb: 0.9 }}>
          <Box sx={{ color: palette.muted, display: "flex", mr: 0.6 }}>
            <Search size={15} />
          </Box>
          <InputBase
            inputRef={busquedaRef}
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && filtradas.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtradas.length - 1));
                return;
              }
              if (event.key === "ArrowUp" && filtradas.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                return;
              }
              if (event.key === "Enter" && filtradas[selectedIndex]) {
                event.preventDefault();
                onSelect(filtradas[selectedIndex]);
              }
            }}
            placeholder="Buscar placa..."
            sx={inputSx}
            autoFocus
          />
        </Box>

        <Box sx={{ maxHeight: 360, overflowY: "auto", display: "grid", gap: 0.65 }}>
          {filtradas.map((item, index) => (
            <Box
              key={item.placa}
              ref={index === selectedIndex ? selectedOptionRef : null}
              onClick={() => onSelect(item)}
              sx={{
                p: 0.85,
                borderRadius: 2,
                border: `1px solid ${index === selectedIndex ? palette.accent : palette.borderSoft}`,
                backgroundColor: index === selectedIndex ? palette.accentSoft : palette.bg,
                cursor: "pointer",
                transition: "all .16s ease",
                "&:hover": {
                  borderColor: palette.accent,
                  backgroundColor: palette.surfaceAlt,
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "13px" }}>{item.placa}</Typography>
                <Typography sx={{ color: palette.accent, fontWeight: 800, fontSize: "11px" }}>{item.certificado || "Sin certificado"}</Typography>
              </Box>
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.25 }}>
                {item.marca || "Sin marca"}
              </Typography>
            </Box>
          ))}

          {filtradas.length === 0 && (
            <Typography sx={{ color: palette.muted, fontSize: "12px", py: 3, textAlign: "center" }}>
              Sin placas disponibles
            </Typography>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

// Campo editable de placa: permite captura manual y abre selector con + o icono de camion.
function PlacaField({ value, onChange, onOpen, inputRef, nextRef }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
      <IconButton
        size="small"
        onClick={onOpen}
        sx={searchIconButtonSx}
      >
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

// Selector de licencias usado por encomiendas. Enter elige la primera coincidencia filtrada.
function LicenciaPickerModal({ open, licencias, onClose, onSelect }) {
  const [busqueda, setBusqueda] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const busquedaRef = useRef(null);
  const selectedOptionRef = useRef(null);
  const filtradas = licencias.filter((item) => [
    item.licencia,
    item.nombre,
    item.dni,
    item.descripcion,
  ].some((field) => String(field || "").toLowerCase().includes(busqueda.toLowerCase())));

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
    if (selectedIndex >= filtradas.length) {
      setSelectedIndex(Math.max(0, filtradas.length - 1));
    }
  }, [filtradas.length, selectedIndex]);

  useEffect(() => {
    selectedOptionRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 3 } }}>
      <Box sx={{ p: 1.1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "15px" }}>Escoger licencia</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "11px" }}>Busca por licencia, nombre, DNI o descripcion</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ ...fieldSx, mb: 0.9 }}>
          <Box sx={{ color: palette.muted, display: "flex", mr: 0.6 }}>
            <Search size={15} />
          </Box>
          <InputBase
            inputRef={busquedaRef}
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && filtradas.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtradas.length - 1));
                return;
              }
              if (event.key === "ArrowUp" && filtradas.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                return;
              }
              if (event.key === "Enter" && filtradas[selectedIndex]) {
                event.preventDefault();
                onSelect(filtradas[selectedIndex]);
              }
            }}
            placeholder="Buscar licencia..."
            sx={inputSx}
            autoFocus
          />
        </Box>

        <Box sx={{ maxHeight: 360, overflowY: "auto", display: "grid", gap: 0.65 }}>
          {filtradas.map((item, index) => (
            <Box
              key={item.licencia}
              ref={index === selectedIndex ? selectedOptionRef : null}
              onClick={() => onSelect(item)}
              sx={{
                p: 0.85,
                borderRadius: 2,
                border: `1px solid ${index === selectedIndex ? palette.accent : palette.borderSoft}`,
                backgroundColor: index === selectedIndex ? palette.accentSoft : palette.bg,
                cursor: "pointer",
                transition: "all .16s ease",
                "&:hover": {
                  borderColor: palette.accent,
                  backgroundColor: palette.surfaceAlt,
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "13px" }}>{item.licencia}</Typography>
                <Typography sx={{ color: palette.accent, fontWeight: 800, fontSize: "11px" }}>{item.dni || "Sin DNI"}</Typography>
              </Box>
              <Typography sx={{ color: palette.text, fontSize: "12.5px", mt: 0.35 }}>{item.nombre || "Sin nombre"}</Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.25 }}>
                {item.descripcion || "Sin descripcion"}
              </Typography>
            </Box>
          ))}

          {filtradas.length === 0 && (
            <Typography sx={{ color: palette.muted, fontSize: "12px", py: 3, textAlign: "center" }}>
              Sin licencias disponibles
            </Typography>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

// Campo editable de licencia: permite captura manual y abre selector con + o icono de usuario.
function LicenciaField({ value, onChange, onOpen, inputRef, nextRef, onEnter }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
      <IconButton
        size="small"
        onClick={onOpen}
        sx={searchIconButtonSx}
      >
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

export default function TransportesEncomiendaModal({
  open,
  back_host,
  operacion,
  periodoTrabajo,
  fechaOperacion,
  rutasDisponibles = [],
  puntoVentaOrigen = "",
  puntoVentaOrigenNombre = "",
  zonasDisponibles = [],
  placasDisponibles = [],
  licenciasDisponibles = [],
  modalNuevoTitulo = "Nueva encomienda",
  modalEditarTitulo = "Editar encomienda",
  onClose,
  onSubmit,
}) {
  const esEdicion = Boolean(operacion);
  const [draft, setDraft] = useState(() => crearDraft(operacion, periodoTrabajo, fechaOperacion));
  const [error, setError] = useState("");
  const [rutaPickerOpen, setRutaPickerOpen] = useState(false);
  const [zonaPickerOpen, setZonaPickerOpen] = useState("");
  const [placaPickerOpen, setPlacaPickerOpen] = useState(false);
  const [licenciaPickerOpen, setLicenciaPickerOpen] = useState(false);
  const [buscandoRemitente, setBuscandoRemitente] = useState(false);
  const [buscandoDestinatario, setBuscandoDestinatario] = useState(false);

  const remitenteDocRef = useRef(null);
  const remitenteNombreRef = useRef(null);
  const remitenteTelefonoRef = useRef(null);
  const remitenteEntregaRef = useRef(null);
  const remitenteZonaRef = useRef(null);
  const remitenteDireccionRef = useRef(null);
  const destinatarioDocRef = useRef(null);
  const destinatarioNombreRef = useRef(null);
  const destinatarioTelefonoRef = useRef(null);
  const destinatarioEntregaRef = useRef(null);
  const destinatarioZonaRef = useRef(null);
  const destinatarioDireccionRef = useRef(null);
  const rutaRef = useRef(null);
  const placaRef = useRef(null);
  const choferRef = useRef(null);
  const descripcionRef = useRef(null);
  const totalRef = useRef(null);
  const condicionPagoRef = useRef(null);
  const llegadaRef = useRef(null);
  const grabarRef = useRef(null);

  focusableRefs.length = 0;
  focusableRefs.push(
    remitenteDocRef,
    remitenteNombreRef,
    remitenteTelefonoRef,
    remitenteEntregaRef,
    remitenteZonaRef,
    remitenteDireccionRef,
    rutaRef,
    destinatarioDocRef,
    destinatarioNombreRef,
    destinatarioTelefonoRef,
    destinatarioEntregaRef,
    destinatarioZonaRef,
    destinatarioDireccionRef,
    descripcionRef,
    condicionPagoRef,
    totalRef,
    llegadaRef,
    placaRef,
    choferRef,
    grabarRef,
  );

  useEffect(() => {
    if (open) {
      setDraft({
        ...crearDraft(operacion, periodoTrabajo, fechaOperacion),
        id_punto_venta: operacion?.id_punto_venta || puntoVentaOrigen || "",
      });
      setError("");
      window.setTimeout(() => {
        remitenteDocRef.current?.focus();
        remitenteDocRef.current?.select?.();
      }, 80);
    }
  }, [open, operacion, periodoTrabajo, fechaOperacion, puntoVentaOrigen]);

  const updateDraft = (name, value) => {
    setDraft((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const rutaSeleccionada = rutasDisponibles.find((ruta) => ruta.id_ruta === draft.id_ruta);
  const origenVisual = puntoVentaOrigenNombre || draft.id_punto_venta || puntoVentaOrigen;
  const comprobanteActual = comprobanteDesdeDocumento(draft.cliente_documento);
  const zonasOrigen = zonasDisponibles.filter((zona) => zona.id_punto_venta === draft.id_punto_venta);
  const zonasDestino = zonasDisponibles.filter((zona) => zona.id_punto_venta === draft.id_punto_venta_dest);

  const seleccionarRuta = (ruta) => {
    if (puntoVentaOrigen && ruta.id_punto_venta !== puntoVentaOrigen) {
      setError("La ruta seleccionada no corresponde al punto de venta operativo.");
      return;
    }

    setDraft((prev) => ({
      ...prev,
      id_ruta: ruta.id_ruta,
      id_punto_venta: ruta.id_punto_venta,
      id_punto_venta_dest: ruta.id_punto_venta_dest,
      destinatario_zona: prev.id_punto_venta_dest === ruta.id_punto_venta_dest ? prev.destinatario_zona : "",
    }));
    setRutaPickerOpen(false);
    window.setTimeout(() => {
      destinatarioDocRef.current?.focus();
      destinatarioDocRef.current?.select?.();
    }, 60);
  };

  const seleccionarZonaRemitente = (zona) => {
    updateDraft("remitente_zona", zona.nombre || "");
    setZonaPickerOpen("");
    window.setTimeout(() => {
      remitenteDireccionRef.current?.focus();
      remitenteDireccionRef.current?.select?.();
    }, 60);
  };

  const seleccionarZonaDestinatario = (zona) => {
    updateDraft("destinatario_zona", zona.nombre || "");
    setZonaPickerOpen("");
    window.setTimeout(() => {
      destinatarioDireccionRef.current?.focus();
      destinatarioDireccionRef.current?.select?.();
    }, 60);
  };

  // Limpia ruta y los puntos derivados, para no guardar origen/destino de una ruta borrada.
  const limpiarRuta = () => {
    setDraft((prev) => ({
      ...prev,
      id_ruta: "",
      id_punto_venta: puntoVentaOrigen || "",
      id_punto_venta_dest: "",
      destinatario_zona: "",
    }));
  };

  // Al escoger una placa solo se graba la PK textual en mve_transventa.placa.
  const seleccionarPlaca = (item) => {
    setDraft((prev) => ({
      ...prev,
      placa: item.placa || "",
    }));
    setPlacaPickerOpen(false);
    window.setTimeout(() => {
      choferRef.current?.focus();
      choferRef.current?.select?.();
    }, 60);
  };

  // Al escoger una licencia solo se graba la PK textual en mve_transventa.licencia.
  const seleccionarLicencia = (item) => {
    setDraft((prev) => ({
      ...prev,
      licencia: item.licencia || "",
    }));
    setLicenciaPickerOpen(false);
  };

  const buscarRemitente = async () => {
    const documento = String(draft.cliente_documento || "").trim();

    if (!documento) {
      setError("Indica DNI/RUC del remitente.");
      remitenteDocRef.current?.focus();
      return;
    }

    setBuscandoRemitente(true);
    setError("");
    setDraft((prev) => ({
      ...prev,
      remitente_direccion: "",
    }));

    try {
      const response = await axios.post(`${back_host}/correntistagenera`, {
        ruc: documento,
      });
      const { nombre_o_razon_social, r_id_doc, direccion_completa } = response.data || {};

      setDraft((prev) => ({
        ...prev,
        id_documento: r_id_doc || documentoTipoDesdeNumero(documento),
        r_cod: comprobanteDesdeDocumento(documento).r_cod,
        cliente: nombre_o_razon_social || prev.cliente,
        remitente_direccion: direccion_completa || "",
      }));
      window.setTimeout(() => {
        const nextRef = nombre_o_razon_social ? remitenteTelefonoRef : remitenteNombreRef;
        nextRef.current?.focus();
        nextRef.current?.select?.();
      }, 60);
    } catch (err) {
      console.log(err);
      setError("No se pudo consultar el DNI/RUC del remitente.");
      remitenteNombreRef.current?.focus();
      remitenteNombreRef.current?.select?.();
    } finally {
      setBuscandoRemitente(false);
    }
  };

  const buscarDestinatario = async () => {
    const documento = String(draft.destinatario_documento || "").trim();

    if (!documento) {
      setError("Indica DNI del destinatario.");
      destinatarioDocRef.current?.focus();
      return;
    }

    setBuscandoDestinatario(true);
    setError("");

    try {
      const response = await axios.post(`${back_host}/correntistagenera`, {
        ruc: documento,
      });
      const { nombre_o_razon_social } = response.data || {};

      setDraft((prev) => ({
        ...prev,
        destinatario: nombre_o_razon_social || "",
      }));
      window.setTimeout(() => {
        const nextRef = nombre_o_razon_social ? destinatarioTelefonoRef : destinatarioNombreRef;
        nextRef.current?.focus();
        nextRef.current?.select?.();
      }, 60);
    } catch (err) {
      console.log(err);
      setError("No se pudo consultar el DNI del destinatario.");
      destinatarioNombreRef.current?.focus();
      destinatarioNombreRef.current?.select?.();
    } finally {
      setBuscandoDestinatario(false);
    }
  };

  const mostrarValidacion = (message, focusRef) => {
    setError(message);
    swal2.fire({
      title: "Validacion",
      text: message,
      icon: "warning",
      confirmButtonText: "ACEPTAR",
      color: palette.text,
      background: palette.surface,
    }).then(() => {
      window.setTimeout(() => {
        focusRef?.current?.focus();
        focusRef?.current?.select?.();
      }, 40);
    });
  };

  const handleSubmit = () => {
    if (!draft.id_ruta) {
      mostrarValidacion("Indica la ruta.", rutaRef);
      return;
    }

    if (puntoVentaOrigen && draft.id_punto_venta !== puntoVentaOrigen) {
      mostrarValidacion("La ruta debe iniciar en el punto de venta operativo.", rutaRef);
      return;
    }

    if (!draft.id_punto_venta_dest) {
      mostrarValidacion("La ruta seleccionada no tiene punto de venta destino.", rutaRef);
      return;
    }

    if (!draft.cliente_documento) {
      mostrarValidacion("Indica DNI/RUC del remitente.", remitenteDocRef);
      return;
    }

    const comprobante = comprobanteDesdeDocumento(draft.cliente_documento);

    if (esEdicion && comprobante.r_cod !== operacion?.r_cod) {
      mostrarValidacion("En edicion no se cambia el tipo de comprobante; ingresa otro documento del mismo tipo.", remitenteDocRef);
      return;
    }

    if (!draft.destinatario_documento || !draft.destinatario) {
      mostrarValidacion("Indica DNI y nombre del destinatario.", destinatarioDocRef);
      return;
    }

    if (!draft.descripcion) {
      mostrarValidacion("Describe la encomienda.", descripcionRef);
      return;
    }

    if (!draft.placa) {
      mostrarValidacion("Indica la placa.", placaRef);
      return;
    }

    if (!draft.licencia) {
      mostrarValidacion("Indica chofer/licencia.", choferRef);
      return;
    }

    const total = Math.round(Number(draft.r_monto_total || 0));
    const entregaRemitenteEnOficina = draft.remitente_entrega === "OFICINA";
    const entregaDestinatarioEnOficina = draft.destinatario_entrega === "OFICINA";
    const clienteZonaFinal = entregaRemitenteEnOficina ? "" : draft.remitente_zona;
    const clienteDireccionFinal = entregaRemitenteEnOficina ? "" : draft.remitente_direccion;
    const destinatarioDireccionFinal = entregaDestinatarioEnOficina ? "" : draft.destinatario_direccion;

    onSubmit({
      ...draft,
      tipo_operacion: "E",
      r_cod: comprobante.r_cod,
      cliente_id_doc: documentoTipoDesdeNumero(draft.cliente_documento),
      cliente_documento_id: draft.cliente_documento,
      cliente_zona: clienteZonaFinal,
      cliente_direccion: clienteDireccionFinal,
      destinatario_id_doc: documentoTipoDesdeNumero(draft.destinatario_documento),
      destinatario_documento_id: draft.destinatario_documento,
      id_punto_venta: draft.id_punto_venta,
      id_punto_venta_dest: draft.id_punto_venta_dest,
      remitente_zona: clienteZonaFinal,
      remitente_direccion: clienteDireccionFinal,
      destinatario_zona: entregaDestinatarioEnOficina ? "" : draft.destinatario_zona,
      destinatario_direccion: destinatarioDireccionFinal,
      precio_unitario: total,
      precio_neto: total,
      r_monto_total: total,
      asiento: null,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: 3,
          maxHeight: "calc(100vh - 48px)",
        },
      }}
    >
      <Box sx={{ p: { xs: 0.8, md: 1 }, pb: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.7 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <AppIconBox>
              <Package size={16} />
            </AppIconBox>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "15px", lineHeight: 1.15 }}>
                {esEdicion ? modalEditarTitulo : modalNuevoTitulo}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.2 }} noWrap>
                Registro operativo de envio y recepcion
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 0.8, md: 1 }, pb: 0.75, overflowY: "auto" }}>
        <SectionHeader icon={<UserRound size={15} />} title="1. Origen" />
        <Box sx={sectionSx}>
          <Grid container spacing={1}>
            <Grid item xs={12} md={3}>
              {/* Origen automatico desde el punto de venta operativo seleccionado antes de nueva encomienda. */}
              <Field label="">
                <PuntoVentaField value={origenVisual} />
              </Field>
            </Grid>
            <Grid item xs={12} md={3}>
              <Field label="DNI / RUC">
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
                  <CaptureInput
                    value={draft.cliente_documento}
                    onChange={(value) => {
                      updateDraft("cliente_documento", value);
                      updateDraft("id_documento", documentoTipoDesdeNumero(value));
                      updateDraft("r_cod", comprobanteDesdeDocumento(value).r_cod);
                    }}
                    inputRef={remitenteDocRef}
                    nextRef={draft.cliente ? remitenteTelefonoRef : remitenteNombreRef}
                    placeholder="Documento"
                    align="right"
                    onPlus={buscarRemitente}
                  />
                  <IconButton
                    size="small"
                    onClick={buscarRemitente}
                    disabled={buscandoRemitente}
                    sx={{
                      ...searchIconButtonSx,
                      mr: 0,
                      ml: 0.45,
                      color: buscandoRemitente ? palette.muted : palette.accent,
                    }}
                  >
                    <Search />
                  </IconButton>
                </Box>
              </Field>
            </Grid>
            <Grid item xs={12} md={6}>
              <Field label="Nombres / R.Social">
                <CaptureInput value={draft.cliente} onChange={(value) => updateDraft("cliente", value)} inputRef={remitenteNombreRef} nextRef={remitenteTelefonoRef} placeholder="Remitente" />
              </Field>
            </Grid>
            <Grid item xs={12} md={3}>
              <Field label="Telefono">
                <CaptureInput value={draft.cliente_telefono} onChange={(value) => updateDraft("cliente_telefono", value)} inputRef={remitenteTelefonoRef} nextRef={remitenteEntregaRef} placeholder="Celular" />
              </Field>
            </Grid>
            <Grid item xs={12} md={draft.remitente_entrega === "CLIENTE" ? 3 : 9}>
              <Field label="" labelWidth={0}>
                <ChoiceGroup
                  value={draft.remitente_entrega}
                  inputRef={remitenteEntregaRef}
                  nextRef={draft.remitente_entrega === "CLIENTE" ? remitenteZonaRef : rutaRef}
                  onChange={(value) => {
                    updateDraft("remitente_entrega", value);
                    if (value === "OFICINA") {
                      updateDraft("remitente_zona", "");
                      updateDraft("remitente_direccion", "");
                    }
                  }}
                />
              </Field>
            </Grid>
            {draft.remitente_entrega === "CLIENTE" && (
              <>
                <Grid item xs={12} md={3}>
                  <Field label="Zona">
                    {/* Zonas filtradas por id_punto_venta de origen; se guarda nombre de zona. */}
                    <ZonaField
                      value={draft.remitente_zona}
                      onClear={() => updateDraft("remitente_zona", "")}
                      onOpen={() => setZonaPickerOpen("remitente")}
                      inputRef={remitenteZonaRef}
                      nextRef={remitenteDireccionRef}
                      placeholder="Escoger zona"
                    />
                  </Field>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Field label="Direccion">
                    <CaptureInput
                      value={draft.remitente_direccion}
                      onChange={(value) => updateDraft("remitente_direccion", value)}
                      inputRef={remitenteDireccionRef}
                      nextRef={rutaRef}
                      placeholder="Direccion si envia desde casa"
                    />
                  </Field>
                </Grid>
              </>
            )}
          </Grid>
        </Box>

        <SectionHeader icon={<UserRound size={15} />} title="2. Destino" />
        <Box sx={sectionSx}>
          <Grid container spacing={1}>
            <Grid item xs={12} md={3}>
              {/* Destino se escoge desde rutas; se conserva id_ruta para guardar la operacion. */}
              <Field label="">
                <RutaField
                  ruta={rutaSeleccionada || (draft.id_ruta ? { id_ruta: draft.id_ruta, id_punto_venta_dest: draft.id_punto_venta_dest } : null)}
                  onChange={limpiarRuta}
                  onOpen={() => setRutaPickerOpen(true)}
                  inputRef={rutaRef}
                  nextRef={destinatarioDocRef}
                />
              </Field>
            </Grid>
            <Grid item xs={12} md={3}>
              <Field label="DNI">
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
                  <CaptureInput
                    value={draft.destinatario_documento}
                    onChange={(value) => updateDraft("destinatario_documento", value)}
                    inputRef={destinatarioDocRef}
                    nextRef={draft.destinatario ? destinatarioTelefonoRef : destinatarioNombreRef}
                    placeholder="Documento"
                    align="right"
                    onPlus={buscarDestinatario}
                  />
                  <IconButton
                    size="small"
                    onClick={buscarDestinatario}
                    disabled={buscandoDestinatario}
                    sx={{
                      ...searchIconButtonSx,
                      mr: 0,
                      ml: 0.45,
                      color: buscandoDestinatario ? palette.muted : palette.accent,
                    }}
                  >
                    <Search />
                  </IconButton>
                </Box>
              </Field>
            </Grid>
            <Grid item xs={12} md={6}>
              <Field label="NOMBRES APELLIDOS">
                <CaptureInput value={draft.destinatario} onChange={(value) => updateDraft("destinatario", value)} inputRef={destinatarioNombreRef} nextRef={destinatarioTelefonoRef} placeholder="Destinatario" />
              </Field>
            </Grid>
            <Grid item xs={12} md={3}>
              <Field label="Telefono">
                <CaptureInput value={draft.destinatario_telefono} onChange={(value) => updateDraft("destinatario_telefono", value)} inputRef={destinatarioTelefonoRef} nextRef={destinatarioEntregaRef} placeholder="Celular" />
              </Field>
            </Grid>
            <Grid item xs={12} md={draft.destinatario_entrega === "CLIENTE" ? 3 : 9}>
              <Field label="" labelWidth={0}>
                <ChoiceGroup
                  value={draft.destinatario_entrega}
                  inputRef={destinatarioEntregaRef}
                  nextRef={draft.destinatario_entrega === "CLIENTE" ? destinatarioZonaRef : descripcionRef}
                  onChange={(value) => {
                    updateDraft("destinatario_entrega", value);
                    if (value === "OFICINA") {
                      updateDraft("destinatario_zona", "");
                      updateDraft("destinatario_direccion", "");
                    }
                  }}
                />
              </Field>
            </Grid>
            {draft.destinatario_entrega === "CLIENTE" && (
              <>
                <Grid item xs={12} md={3}>
                  <Field label="Zona">
                    {/* Zonas filtradas por id_punto_venta_dest de la ruta elegida; se guarda nombre de zona. */}
                    <ZonaField
                      value={draft.destinatario_zona}
                      onClear={() => updateDraft("destinatario_zona", "")}
                      onOpen={() => setZonaPickerOpen("destinatario")}
                      inputRef={destinatarioZonaRef}
                      nextRef={destinatarioDireccionRef}
                      placeholder="Escoger zona"
                    />
                  </Field>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Field label="Direccion">
                    <CaptureInput
                      value={draft.destinatario_direccion}
                      onChange={(value) => updateDraft("destinatario_direccion", value)}
                      inputRef={destinatarioDireccionRef}
                      nextRef={descripcionRef}
                      placeholder="Direccion si recibe en casa"
                    />
                  </Field>
                </Grid>
              </>
            )}
          </Grid>
        </Box>

        <SectionHeader icon={<Package size={15} />} title="3. Encomienda, pago y unidad" />
        <Box sx={sectionSx}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <MultilineCapture
                value={draft.descripcion}
                onChange={(value) => updateDraft("descripcion", value)}
                inputRef={descripcionRef}
                nextRef={condicionPagoRef}
                placeholder="Descripcion encomienda: paquete, sobre, caja..."
              />
            </Grid>
            <Grid item xs={12} md={2.8}>
              <Field label="" tall labelWidth={0}>
                <ChoiceGroup
                  value={draft.condicion_pago}
                  inputRef={condicionPagoRef}
                  nextRef={totalRef}
                  onChange={(value) => updateDraft("condicion_pago", value)}
                  options={[
                    { value: "PAGADO", label: "PAGADO" },
                    { value: "POR_COBRAR", label: "POR COBRAR" },
                  ]}
                />
              </Field>
            </Grid>
            <Grid item xs={12} md={5.2}>
              <Field label="Total S/" tall>
                <MoneyStepper
                  value={draft.r_monto_total}
                  onChange={(value) => updateDraft("r_monto_total", value)}
                  inputRef={totalRef}
                  nextRef={llegadaRef}
                />
              </Field>
            </Grid>
            <Grid item xs={12} md={4}>
              <Field label="Llegada aprox." tall>
                <CaptureInput value={draft.llegada_aprox} onChange={(value) => updateDraft("llegada_aprox", value)} inputRef={llegadaRef} nextRef={placaRef} align="center" />
              </Field>
            </Grid>
            <Grid item xs={12} md={4}>
              <Field label="" labelWidth={0}>
                {/* Placa admite escritura manual; + o camion abren el catalogo mve_transplaca. */}
                <PlacaField
                  value={draft.placa}
                  onChange={(value) => updateDraft("placa", value)}
                  onOpen={() => setPlacaPickerOpen(true)}
                  inputRef={placaRef}
                  nextRef={choferRef}
                />
              </Field>
            </Grid>
            <Grid item xs={12} md={8}>
              <Field label="" labelWidth={0}>
                {/* Licencia admite escritura manual; + o usuario abren el catalogo mve_translicencia. */}
                <LicenciaField
                  value={draft.licencia}
                  onChange={(value) => updateDraft("licencia", value)}
                  onOpen={() => setLicenciaPickerOpen(true)}
                  inputRef={choferRef}
                  nextRef={grabarRef}
                />
              </Field>
            </Grid>
          </Grid>
        </Box>

        {error && (
          <Typography sx={{ color: "#ff8a65", fontSize: "12px", mt: 0.85 }}>
            {error}
          </Typography>
        )}
      </Box>

        <Box sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 0.75,
          p: { xs: 0.8, md: 0.95 },
          pt: 0.7,
          flexWrap: "wrap",
          borderTop: `1px solid ${palette.borderSoft}`,
          backgroundColor: palette.surface,
          position: "sticky",
          bottom: 0,
          zIndex: 1,
        }}>
          <AppButton onClick={onClose}>Salir [Esc]</AppButton>
          <AppButton>Imprimir encomienda</AppButton>
          <AppButton buttonRef={grabarRef} icon={<Save size={16} />} onClick={handleSubmit} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
            {comprobanteActual.label} [F12]
          </AppButton>
        </Box>
      <RutaPickerModal
        open={rutaPickerOpen}
        rutas={rutasDisponibles}
        onClose={() => setRutaPickerOpen(false)}
        onSelect={seleccionarRuta}
      />
      <ZonaPickerModal
        open={zonaPickerOpen === "remitente"}
        titulo="Escoger zona origen"
        zonas={zonasOrigen}
        onClose={() => setZonaPickerOpen("")}
        onSelect={seleccionarZonaRemitente}
      />
      <ZonaPickerModal
        open={zonaPickerOpen === "destinatario"}
        titulo="Escoger zona destino"
        zonas={zonasDestino}
        onClose={() => setZonaPickerOpen("")}
        onSelect={seleccionarZonaDestinatario}
      />
      {/* Modal de busqueda del catalogo mve_transplaca. */}
      <PlacaPickerModal
        open={placaPickerOpen}
        placas={placasDisponibles}
        onClose={() => setPlacaPickerOpen(false)}
        onSelect={seleccionarPlaca}
      />
      {/* Modal de busqueda del catalogo mve_translicencia. */}
      <LicenciaPickerModal
        open={licenciaPickerOpen}
        licencias={licenciasDisponibles}
        onClose={() => setLicenciaPickerOpen(false)}
        onSelect={seleccionarLicencia}
      />
    </Dialog>
  );
}
