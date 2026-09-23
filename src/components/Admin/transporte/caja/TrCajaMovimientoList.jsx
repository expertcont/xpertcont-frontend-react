import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable, { createTheme } from "react-data-table-component";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, InputBase, MenuItem, Select, Typography } from "@mui/material";
import { ChevronDown, ChevronUp, Edit3, Printer, Search, Trash2, WalletCards, X } from "lucide-react";
import swal2 from "sweetalert2";

import DaySelector from "../../AdminDias";
import { useDialog } from "../../AdminConfirmDialogProvider";
import palette from "../../../../theme/palette";
import AppButton from "../../../ui/AppButton";
import TrHeader from "../common/components/TrHeader";
import TrFiltros from "../common/components/TrFiltros";
import TrHeaderMenuPicker from "../common/components/TrHeaderMenuPicker";
import useTrCatalogos from "../common/hooks/useTrCatalogos";
import crearCierreCajaMovimientoPdf from "./TrCajaMovimientoCierrePdf";

createTheme(
  "transportesDark",
  {
    text: { primary: palette.text, secondary: palette.accent },
    background: { default: "transparent" },
    context: { background: palette.accent, text: palette.onAccent },
    divider: { default: palette.borderSoft },
    action: {
      button: palette.muted,
      hover: palette.accentSoft,
      disabled: palette.border,
    },
  },
  "dark",
);

const fechaHoyLima = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
  //new version
};

const resolverUsuarioTrabajo = ({ rows, usuarioActual, permiteTodos }) => {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const usuarioValido = rows.some((item) => item.id_usuario === usuarioActual);

  if (permiteTodos) {
    return usuarioValido ? usuarioActual : "";
  }

  return usuarioValido ? usuarioActual : rows[0]?.id_usuario || "";
};

const money = (value) => Number(value || 0).toLocaleString("es-PE", {
  style: "currency",
  currency: "PEN",
});

const fieldSx = {
  height: 38,
  px: 1.15,
  borderRadius: palette.radius.control,
  border: `1px solid ${palette.border}`,
  backgroundColor: palette.overlaySoft,
  color: palette.text,
  fontSize: "13px",
  width: "100%",
  "& input": { p: 0, color: palette.text, fontSize: "13px" },
  "& textarea": { p: 0, color: palette.text, fontSize: "13px" },
};

const selectSx = {
  ...fieldSx,
  ".MuiSelect-select": { p: 0, display: "flex", alignItems: "center", minHeight: 0 },
  ".MuiSelect-icon": { color: palette.muted },
};

const menuItemSx = { fontSize: "13px" };

const pickerFieldSx = {
  minHeight: 33,
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

const pickerInputSx = {
  color: palette.text,
  fontSize: "12.5px",
  width: "100%",
  "& input::placeholder, & textarea::placeholder": {
    color: palette.muted,
    opacity: 1,
  },
};

const pickerIconButtonSx = {
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

const emptyDraft = {
  tipo_movimiento: "S",
  fecha: "",
  id_punto_venta: "",
  id_motivo: "",
  descripcion: "",
  importe: "",
  id_forma_pago: "",
  nro_operacion: "",
  beneficiario: "",
  documento_beneficiario: "",
};

function FieldLabel({ children }) {
  return (
    <Typography sx={{ color: palette.muted, fontSize: "11px", fontWeight: 800, mb: 0.5 }}>
      {children}
    </Typography>
  );
}

function ResumenCard({ label, value, tone, onClick, actionIcon, hideActionIcon = false, watermark, watermarkIcon }) {
  const color = tone === "danger" ? palette.danger : tone === "success" ? palette.success : palette.accent;
  const clickable = Boolean(onClick);
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.5,
        minHeight: 78,
        borderRadius: palette.radius.listCard,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surface,
        cursor: clickable ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        transition: "border-color .18s ease, background-color .18s ease",
        "&:hover": clickable ? {
          borderColor: "rgba(77,163,255,0.46)",
          backgroundColor: palette.overlaySoft,
        } : undefined,
        "@keyframes ingreso-detail-vibe": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-1px)" },
          "40%": { transform: "translateX(1px)" },
          "60%": { transform: "translateX(-1px)" },
          "80%": { transform: "translateX(1px)" },
        },
      }}
    >
      {watermark && (
        <Box
          sx={{
            position: "absolute",
            right: 9,
            bottom: 7,
            color: palette.accent,
            fontSize: "12px",
            fontWeight: 900,
            letterSpacing: 0.8,
            lineHeight: 0.95,
            opacity: 0.22,
            textAlign: "right",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {String(watermark).split(" ").map((line) => (
            <Box key={line}>{line}</Box>
          ))}
        </Box>
      )}
      {watermarkIcon && (
        <Box
          sx={{
            position: "absolute",
            right: 8,
            top: 10,
            color: palette.accent,
            opacity: 0.09,
            transform: "rotate(-12deg)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {watermarkIcon}
        </Box>
      )}
      <Typography sx={{ color, fontWeight: 900, fontSize: "21px", lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.45, color: palette.muted, mt: 0.75 }}>
        {clickable && !hideActionIcon && (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              color: palette.accent,
              animation: "ingreso-detail-vibe 1.8s ease-in-out infinite",
            }}
          >
            {actionIcon || <Search size={14} />}
          </Box>
        )}
        <Typography sx={{ fontSize: "11px", fontWeight: 800 }}>{label}</Typography>
      </Box>
    </Box>
  );
}

function IngresosModal({ open, ingresos, loading, onClose }) {
  const tipoLabel = (row) => {
    if (row.tipo_ingreso === "ORIGEN") return "Origen";
    if (row.tipo_ingreso === "ORIGEN_POR_COBRAR_REFERENCIA") return "Por Cobrar";
    if (row.tipo_ingreso === "DESTINO_POR_COBRAR_PENDIENTE") return "Por cobrar destino";
    return "Cobrado en destino";
  };
  const ingresoContabiliza = (row) => row.contabiliza !== false && Number(row.registrado ?? 1) === 1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { width: { xs: "calc(100% - 24px)", sm: 560 }, borderRadius: palette.radius.modal, backgroundColor: palette.surface, border: `1px solid ${palette.border}` } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: palette.text, fontSize: "15px", fontWeight: 500, pb: 1 }}>
        Ingresos por encomiendas
        <IconButton onClick={onClose} size="small" sx={{ color: palette.muted }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          sx={{
            maxHeight: { xs: "64vh", md: "68vh" },
            overflow: "auto",
            borderRadius: palette.radius.listCard,
            border: `1px solid ${palette.borderSoft}`,
            backgroundColor: palette.surface,
            scrollbarWidth: "thin",
            scrollbarColor: `${palette.border} transparent`,
            "&::-webkit-scrollbar": {
              width: 8,
              height: 8,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: palette.border,
              borderRadius: 8,
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: palette.accentSoft,
            },
          }}
        >
          {loading && (
            <Typography sx={{ color: palette.muted, fontSize: "11px", px: 1.2, py: 2 }}>
              Cargando ingresos...
            </Typography>
          )}

          {!loading && ingresos.length === 0 && (
            <Box sx={{ py: 4, px: 1.2, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}>
              <Search size={16} />
              Sin ingresos por encomiendas para el filtro actual
            </Box>
          )}

          {!loading && ingresos.map((row) => (
            (() => {
              const contabiliza = ingresoContabiliza(row);
              const anulado = Number(row.registrado ?? 1) === 0;
              const noAplica = row.tipo_ingreso === "ORIGEN_POR_COBRAR_REFERENCIA" || row.tipo_ingreso === "DESTINO_POR_COBRAR_PENDIENTE";
              const importeTexto = anulado ? "Anulado" : noAplica ? "Por Cobrar" : money(row.r_monto_total);
              const tipoTexto = anulado ? "Anulado" : tipoLabel(row);
              const estadoColor = anulado || noAplica ? palette.danger : contabiliza ? palette.success : palette.warning || palette.accent;
              const estadoBg = anulado || noAplica ? palette.dangerSoft : contabiliza ? palette.successSoft : palette.warningSoft || palette.accentSoft;
              const operador = row.id_operador_caja || "-";
              return (
            <Box
              key={`${row.tipo_ingreso}-${row.r_cod}-${row.r_serie}-${row.r_numero}-${row.elemento}`}
              sx={{
                p: { xs: 1, md: 1.15 },
                borderBottom: `1px solid ${palette.borderSoft}`,
                display: "grid",
                gap: 0.85,
                backgroundColor: "transparent",
                "&:last-of-type": {
                  borderBottom: 0,
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, minWidth: 0 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 600, lineHeight: 1.2 }} noWrap>
                    {row.r_serie || ""}-{row.r_numero || ""}
                  </Typography>
                  <Typography sx={{ color: palette.muted, fontSize: "10.5px", mt: 0.2 }} noWrap>
                    Grabacion: {String(row.fecha_caja || "").slice(0, 16).replace("T", " ")}
                  </Typography>
                  <Typography sx={{ color: palette.accent, fontSize: "10.5px", mt: 0.2, fontWeight: 800 }} noWrap>
                    Usuario: {operador}
                  </Typography>
                </Box>
                <Box sx={{ display: "grid", justifyItems: "end", gap: 0.35 }}>
                  <Typography sx={{ color: contabiliza ? palette.success : palette.muted, fontSize: "13px", fontWeight: 800, lineHeight: 1.1, whiteSpace: "nowrap", textDecoration: anulado ? "line-through" : "none" }}>
                    {importeTexto}
                  </Typography>
                  <Box sx={{ px: 0.7, py: 0.25, borderRadius: palette.radius.control, color: estadoColor, backgroundColor: estadoBg, fontSize: "9.5px", fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap" }}>
                    {tipoTexto}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.65, flexWrap: "wrap" }}>
                {row.observacion_caja && (
                  <Box sx={{ px: 0.7, py: 0.25, borderRadius: palette.radius.control, color: estadoColor, backgroundColor: estadoBg, fontSize: "9.5px", fontWeight: 800, lineHeight: 1.2 }}>
                    Obs: {row.observacion_caja}
                  </Box>
                )}
                <Typography sx={{ color: palette.muted, fontSize: "10.5px" }}>
                  {row.punto_venta_origen_nombre || row.id_punto_venta_origen || "-"} - {row.punto_venta_dest_nombre || row.id_punto_venta_dest || "-"}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 0.35 }}>
                <Typography sx={{ color: palette.muted, fontSize: "10.8px" }} noWrap>
                  Rem: {row.cliente || "-"}
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: "10.8px" }} noWrap>
                  Dest: {row.destinatario || "-"}
                </Typography>
              </Box>
            </Box>
              );
            })()
          ))}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
          <AppButton
            onClick={onClose}
            sx={{
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: 120 },
              justifyContent: "center",
              fontWeight: 800,
            }}
          >
            Cerrar
          </AppButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function MotivoPickerModal({ open, motivos, onClose, onSelect }) {
  const [busqueda, setBusqueda] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const busquedaRef = useRef(null);
  const selectedOptionRef = useRef(null);
  const filtrados = useMemo(() => motivos.filter((item) => [
    item.id_motivo,
    item.nombre,
  ].some((field) => String(field || "").toLowerCase().includes(busqueda.toLowerCase()))), [busqueda, motivos]);
  const indexFinal = Math.min(selectedIndex, Math.max(0, filtrados.length - 1));

  useEffect(() => {
    if (!open) return;
    setBusqueda("");
    setSelectedIndex(0);
    window.setTimeout(() => {
      busquedaRef.current?.focus?.();
      busquedaRef.current?.select?.();
    }, 80);
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [busqueda]);

  useEffect(() => {
    if (selectedIndex >= filtrados.length) {
      setSelectedIndex(Math.max(0, filtrados.length - 1));
    }
  }, [filtrados.length, selectedIndex]);

  useEffect(() => {
    selectedOptionRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [indexFinal]);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" && filtrados.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedIndex((prev) => Math.min(prev + 1, filtrados.length - 1));
      return;
    }
    if (event.key === "ArrowUp" && filtrados.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === "Enter" && filtrados[indexFinal]) {
      event.preventDefault();
      event.stopPropagation();
      onSelect(filtrados[indexFinal]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} onKeyDown={handleKeyDown} maxWidth={false} PaperProps={{ sx: { width: { xs: "calc(100% - 24px)", sm: 360 }, maxWidth: "calc(100% - 24px)", backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: palette.radius.modal } }}>
      <Box sx={{ p: 0.9 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "15px" }}>Escoger motivo</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "11px" }}>Busca por codigo o nombre</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ ...pickerFieldSx, mb: 0.9 }}>
          <Box sx={{ color: palette.muted, display: "flex", mr: 0.6 }}>
            <Search size={15} />
          </Box>
          <InputBase
            inputRef={busquedaRef}
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar motivo..."
            sx={pickerInputSx}
            autoFocus
          />
        </Box>

        <Box sx={{ maxHeight: 300, overflowY: "auto", display: "grid", gap: 0.25 }}>
          {filtrados.map((item, index) => {
            const selected = index === indexFinal;
            return (
              <Box
                key={item.id_motivo}
                ref={selected ? selectedOptionRef : null}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => onSelect(item)}
                sx={{
                  px: 0.85,
                  py: 0.55,
                  borderRadius: palette.radius.control,
                  border: `1px solid ${selected ? palette.accent : "transparent"}`,
                  backgroundColor: selected ? palette.accentSoft : "transparent",
                  cursor: "pointer",
                  transition: "background-color .16s ease, border-color .16s ease",
                  "&:hover": {
                    backgroundColor: palette.surfaceAlt,
                  },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                  <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "13px" }}>{item.nombre}</Typography>
                  <Typography sx={{ color: palette.accent, fontWeight: 800, fontSize: "11px" }}>{item.id_motivo}</Typography>
                </Box>
              </Box>
            );
          })}

          {filtrados.length === 0 && (
            <Typography sx={{ color: palette.muted, fontSize: "12px", py: 3, textAlign: "center" }}>
              Sin motivos disponibles
            </Typography>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

function CajaMoneyStepper({ value, onChange, inputRef, onKeyDown }) {
  const formatMoneyValue = () => {
    if (value === "" || value === null || value === undefined) return;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    onChange(numeric.toFixed(2));
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
        minHeight: 52,
        overflow: "hidden",
        borderRadius: palette.radius.control,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.bg,
        "&:focus-within": {
          borderColor: palette.accent,
          backgroundColor: palette.surfaceAlt,
        },
      }}
    >
      <InputBase
        inputRef={inputRef}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={formatMoneyValue}
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
          onKeyDown?.(event);
        }}
        sx={{
          flex: 1,
          minWidth: 0,
          px: 1,
          color: palette.accent,
          "&::before": {
            content: '"S/"',
            color: palette.muted,
            fontSize: "14px",
            fontWeight: 900,
            mr: 0.75,
            alignSelf: "center",
          },
          "& input": {
            textAlign: "center",
            fontSize: "24px",
            fontWeight: 950,
            color: palette.accent,
            p: 0,
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
          width: 32,
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

function TrCajaMovimientoModal({
  open,
  draft,
  setDraft,
  motivos,
  puntosVenta,
  guardando,
  esEdicion,
  onClose,
  onSubmit,
}) {
  const update = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const [motivoPickerOpen, setMotivoPickerOpen] = useState(false);
  const ingresoRef = useRef(null);
  const salidaRef = useRef(null);
  const motivoRef = useRef(null);
  const importeRef = useRef(null);
  const nroOperacionRef = useRef(null);
  const descripcionRef = useRef(null);
  const guardarRef = useRef(null);
  const tipoMovimiento = draft.tipo_movimiento || "S";
  const esIngreso = tipoMovimiento === "I";
  const nombreMovimiento = esIngreso ? "ingreso" : "salida";
  const motivosMovimiento = useMemo(
    () => motivos.filter((item) => String(item.tipo_movimiento || "").trim() === tipoMovimiento),
    [motivos, tipoMovimiento],
  );
  const motivoSeleccionado = motivosMovimiento.find((item) => item.id_motivo === draft.id_motivo);
  const enfocar = (ref) => {
    window.setTimeout(() => {
      ref.current?.focus?.();
      ref.current?.select?.();
    }, 0);
  };
  const moverVertical = (event, anteriorRef, siguienteRef) => {
    if (event.key === "ArrowUp" && anteriorRef?.current) {
      event.preventDefault();
      enfocar(anteriorRef);
      return true;
    }
    if (event.key === "ArrowDown" && siguienteRef?.current) {
      event.preventDefault();
      enfocar(siguienteRef);
      return true;
    }
    return false;
  };
  const avanzarConEnter = (event, siguienteRef) => {
    if (event.key === "Enter" && siguienteRef?.current) {
      event.preventDefault();
      enfocar(siguienteRef);
    }
  };
  const switchOptionSx = (activo, color) => ({
    flex: 1,
    minHeight: 42,
    borderRadius: palette.radius.control,
    border: `1px solid ${activo ? color : palette.border}`,
    backgroundColor: activo ? `${color}22` : palette.overlaySoft,
    color: activo ? color : palette.muted,
    fontSize: "12px",
    fontWeight: 900,
    cursor: esEdicion ? "default" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color .18s ease, background-color .18s ease, color .18s ease",
    opacity: esEdicion && !activo ? 0.55 : 1,
  });
  const cambiarTipoMovimiento = (tipo) => {
    if (esEdicion || tipo === tipoMovimiento) return;
    setDraft((prev) => ({ ...prev, tipo_movimiento: tipo, id_motivo: "" }));
  };
  const seleccionarMotivo = (motivo, avanzar = true) => {
    if (!motivo) return;
    update("id_motivo", motivo.id_motivo);
    setMotivoPickerOpen(false);
    if (avanzar) enfocar(importeRef);
  };
  const limpiarMotivo = () => {
    update("id_motivo", "");
  };
  const handleChipKeyDown = (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const siguienteTipo = tipoMovimiento === "I" ? "S" : "I";
      cambiarTipoMovimiento(siguienteTipo);
      enfocar(siguienteTipo === "I" ? ingresoRef : salidaRef);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "Enter") {
      event.preventDefault();
      enfocar(motivoRef);
    }
  };
  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => {
      (tipoMovimiento === "I" ? ingresoRef : salidaRef).current?.focus?.();
    }, 90);
  }, [open, tipoMovimiento]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: { xs: "calc(100% - 24px)", sm: 420 }, maxWidth: "calc(100% - 24px)", borderRadius: palette.radius.modal, backgroundColor: palette.surface, border: `1px solid ${palette.border}` } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: palette.text, fontWeight: 800, pb: 1 }}>
        {esEdicion ? `Editar ${nombreMovimiento} manual` : `Registrar ${nombreMovimiento} manual`}
        <IconButton onClick={onClose} size="small" sx={{ color: palette.muted }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.05 }}>
          <Box>
            <FieldLabel>Tipo de movimiento</FieldLabel>
            <Box sx={{ display: "flex", gap: 0.8, p: 0.45, borderRadius: palette.radius.control, border: `1px solid ${palette.borderSoft}`, backgroundColor: palette.surface }}>
              <Box ref={ingresoRef} role="button" tabIndex={0} onClick={() => cambiarTipoMovimiento("I")} onKeyDown={handleChipKeyDown} sx={switchOptionSx(esIngreso, palette.success)}>
                Ingreso
              </Box>
              <Box ref={salidaRef} role="button" tabIndex={0} onClick={() => cambiarTipoMovimiento("S")} onKeyDown={handleChipKeyDown} sx={switchOptionSx(!esIngreso, palette.danger)}>
                Salida
              </Box>
            </Box>
          </Box>

          <Box>
            <FieldLabel>Fecha</FieldLabel>
            <InputBase type="datetime-local" value={draft.fecha} onChange={(event) => update("fecha", event.target.value)} sx={fieldSx} />
          </Box>

          <Box>
            <FieldLabel>Punto de venta</FieldLabel>
            <Select value={draft.id_punto_venta} onChange={(event) => update("id_punto_venta", event.target.value)} sx={selectSx} fullWidth displayEmpty>
              <MenuItem value="" sx={menuItemSx}>Selecciona</MenuItem>
              {puntosVenta.map((item) => (
                <MenuItem key={item.id_punto_venta} value={item.id_punto_venta} sx={menuItemSx}>
                  {item.id_punto_venta} - {item.nombre}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <FieldLabel>Motivo</FieldLabel>
            <Box sx={{ ...pickerFieldSx, width: "100%", minWidth: 0, cursor: "text" }}>
              <IconButton size="small" onClick={() => setMotivoPickerOpen(true)} sx={pickerIconButtonSx}>
                <Search size={18} />
              </IconButton>
              <InputBase
                inputRef={motivoRef}
                value={motivoSeleccionado?.nombre || ""}
                placeholder="Motivo"
                readOnly
                onPaste={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" || event.key === "Delete") {
                    event.preventDefault();
                    limpiarMotivo();
                    return;
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    enfocar(tipoMovimiento === "I" ? ingresoRef : salidaRef);
                    return;
                  }
                  if (event.key === "ArrowDown" || event.key === "+" || (event.key === "Enter" && !motivoSeleccionado)) {
                    event.preventDefault();
                    setMotivoPickerOpen(true);
                    return;
                  }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    enfocar(importeRef);
                  }
                }}
                sx={{
                  ...pickerInputSx,
                  cursor: "text",
                  "& input": {
                    cursor: "text",
                    caretColor: palette.text,
                  },
                }}
              />
            </Box>
          </Box>

          <Box>
            <FieldLabel>Importe</FieldLabel>
            <CajaMoneyStepper
              inputRef={importeRef}
              value={draft.importe}
              onChange={(value) => update("importe", value)}
              onKeyDown={(event) => {
                if (moverVertical(event, motivoRef, nroOperacionRef)) return;
                avanzarConEnter(event, nroOperacionRef);
              }}
            />
          </Box>

          <Box>
            <FieldLabel>Nro. operacion</FieldLabel>
            <InputBase
              inputRef={nroOperacionRef}
              value={draft.nro_operacion}
              onChange={(event) => update("nro_operacion", event.target.value)}
              onKeyDown={(event) => {
                if (moverVertical(event, importeRef, descripcionRef)) return;
                avanzarConEnter(event, descripcionRef);
              }}
              sx={fieldSx}
            />
          </Box>

          <Box>
            <FieldLabel>Descripcion</FieldLabel>
            <InputBase
              inputRef={descripcionRef}
              value={draft.descripcion}
              onChange={(event) => update("descripcion", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  enfocar(nroOperacionRef);
                  return;
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  enfocar(guardarRef);
                }
              }}
              sx={{ ...fieldSx, minHeight: 66, alignItems: "flex-start", py: 1 }}
              multiline
              rows={2}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
          <AppButton onClick={onClose}>Cancelar</AppButton>
          <AppButton buttonRef={guardarRef} onClick={onSubmit} disabled={guardando} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.onAccent, fontWeight: 900 }}>
            {guardando ? "Guardando..." : `Guardar ${nombreMovimiento}`}
          </AppButton>
        </Box>
      </DialogContent>
      <MotivoPickerModal
        open={motivoPickerOpen}
        motivos={motivosMovimiento}
        onClose={() => {
          setMotivoPickerOpen(false);
          enfocar(motivoRef);
        }}
        onSelect={seleccionarMotivo}
      />
    </Dialog>
  );
}

export default function TrCajaMovimientoList() {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const params = useParams();
  const navigate = useNavigate();
  const { confirmDialog } = useDialog();

  const [periodoTrabajo, setPeriodoTrabajo] = useState("");
  const [contabilidadTrabajo, setContabilidadTrabajo] = useState("");
  const [puntoVentaTrabajo, setPuntoVentaTrabajo] = useState("");
  const [diaSel, setDiaSel] = useState("*");
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState("");
  const [motivos, setMotivos] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [motivoFiltro, setMotivoFiltro] = useState("");
  const [usuariosTrabajo, setUsuariosTrabajo] = useState([]);
  const [usuarioTrabajo, setUsuarioTrabajo] = useState("");
  const [resumen, setResumen] = useState({ total_ingresos: 0, total_salidas: 0, neto: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [ingresosModalOpen, setIngresosModalOpen] = useState(false);
  const [ingresosDetalle, setIngresosDetalle] = useState([]);
  const [loadingIngresos, setLoadingIngresos] = useState(false);
  const [editando, setEditando] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [guardando, setGuardando] = useState(false);
  const [imprimiendoCierre, setImprimiendoCierre] = useState(false);
  const guardandoRef = useRef(false);

  const {
    periodoSelect,
    contabilidadSelect,
    puntosVentaAsignados,
    setPuntosVentaAsignados,
    cargarPeriodos,
    cargarContabilidades,
    cargarPuntosVentaAsignados,
  } = useTrCatalogos({
    back_host,
    params,
    contabilidadTrabajo,
    tipoOperacionFijo: "S",
    puntoVentaTrabajo,
    setPuntoVentaTrabajo,
  });

  const superUsuario = sessionStorage.getItem("super") || "0";
  const accesoTotalCaja = params.id_anfitrion === params.id_invitado || superUsuario === "1";
  const usuarioTieneVariasAgencias = puntosVentaAsignados.length > 1;
  const usuarioPuedeVerTodosCorreos = accesoTotalCaja && usuarioTieneVariasAgencias;

  const fechaFiltro = useMemo(() => (
    diaSel && diaSel !== "*" && periodoTrabajo ? `${periodoTrabajo}-${String(diaSel).padStart(2, "0")}` : ""
  ), [diaSel, periodoTrabajo]);

  const fechaInicialModal = useMemo(() => {
    const base = fechaFiltro || (fechaHoyLima().startsWith(periodoTrabajo) ? fechaHoyLima() : `${periodoTrabajo || params.periodo}-01`);
    return `${base}T${new Date().toTimeString().slice(0, 5)}`;
  }, [fechaFiltro, params.periodo, periodoTrabajo]);

  const cargarMotivos = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setMotivos([]);
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transmotivo/${params.id_anfitrion}/${contabilidadTrabajo}?activo=1`);
      const result = await response.json();
      setMotivos(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.log("Error cargando motivos de caja:", error);
      setMotivos([]);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion]);

  const cargarFormasPago = useCallback(async () => {
    try {
      const response = await fetch(`${back_host}/mve_transcaja/formas-pago`);
      const result = await response.json();
      setFormasPago(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.log("Error cargando formas de pago de caja:", error);
      setFormasPago([]);
    }
  }, [back_host]);

  const cargarUsuariosTrabajo = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || !params.id_anfitrion || !params.id_invitado || !accesoTotalCaja) {
      setUsuariosTrabajo([]);
      setUsuarioTrabajo("");
      return;
    }

    try {
      const query = new URLSearchParams();
      query.set("id_invitado", params.id_invitado || "");
      query.set("super_usuario", superUsuario);
      if (puntoVentaTrabajo) query.set("id_punto_venta", puntoVentaTrabajo);
      if (fechaFiltro) query.set("fecha", fechaFiltro);

      const response = await fetch(`${back_host}/mve_transventa/dashboard/usuarios/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query.toString()}`);
      const result = await response.json();
      const rows = Array.isArray(result?.data) ? result.data : [];
      const sessionKey = `usuario_caja_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
      const usuarioGuardado = sessionStorage.getItem(sessionKey) || "";
      const usuarioFinal = resolverUsuarioTrabajo({
        rows,
        usuarioActual: usuarioGuardado,
        permiteTodos: usuarioPuedeVerTodosCorreos,
      });

      setUsuariosTrabajo(rows);
      setUsuarioTrabajo(usuarioFinal);
    } catch (error) {
      console.log("Error cargando usuarios de caja:", error);
      setUsuariosTrabajo([]);
      setUsuarioTrabajo("");
    }
  }, [accesoTotalCaja, back_host, contabilidadTrabajo, fechaFiltro, params.id_anfitrion, params.id_invitado, periodoTrabajo, puntoVentaTrabajo, superUsuario, usuarioPuedeVerTodosCorreos]);

  const armarQuery = useCallback((options = {}) => {
    const { tipoMovimiento = "", incluirMotivo = true } = options;
    const query = new URLSearchParams();
    if (tipoMovimiento) query.set("tipo_movimiento", tipoMovimiento);
    query.set("id_invitado", params.id_invitado);
    query.set("super_usuario", superUsuario);
    if (puntoVentaTrabajo) query.set("id_punto_venta", puntoVentaTrabajo);
    if (usuarioTrabajo) query.set("id_usuario_trabajo", usuarioTrabajo);
    if (fechaFiltro) {
      query.set("fecha_desde", fechaFiltro);
      query.set("fecha_hasta", fechaFiltro);
    }
    if (incluirMotivo && motivoFiltro) query.set("id_motivo", motivoFiltro);
    return query.toString();
  }, [fechaFiltro, motivoFiltro, params.id_invitado, puntoVentaTrabajo, superUsuario, usuarioTrabajo]);

  const cargarCaja = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo) {
      setMovimientos([]);
      setResumen({ total_ingresos: 0, total_salidas: 0, neto: 0 });
      return;
    }

    setLoading(true);
    try {
      const query = armarQuery();
      const [movimientosResponse, resumenResponse] = await Promise.all([
        fetch(`${back_host}/mve_transcaja/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query}`),
        fetch(`${back_host}/mve_transcaja/consolidado/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query}`),
      ]);
      const movimientosResult = await movimientosResponse.json();
      const resumenResult = await resumenResponse.json();

      setMovimientos(Array.isArray(movimientosResult?.data) ? movimientosResult.data : []);
      setResumen(resumenResult?.data || { total_ingresos: 0, total_salidas: 0, neto: 0 });
    } catch (error) {
      console.log("Error cargando caja de transporte:", error);
      setMovimientos([]);
      setResumen({ total_ingresos: 0, total_salidas: 0, neto: 0 });
    } finally {
      setLoading(false);
    }
  }, [armarQuery, back_host, contabilidadTrabajo, params.id_anfitrion, periodoTrabajo]);

  const abrirDetalleIngresos = async () => {
    if (!periodoTrabajo || !contabilidadTrabajo) {
      return;
    }

    setIngresosModalOpen(true);
    setLoadingIngresos(true);
    try {
      const query = armarQuery();
      const response = await fetch(`${back_host}/mve_transcaja/ingresos/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo cargar el detalle de ingresos.");
      }
      setIngresosDetalle(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      setIngresosDetalle([]);
      swal2.fire({ title: "No se pudo cargar", text: error.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    } finally {
      setLoadingIngresos(false);
    }
  };

  const obtenerIngresosCaja = async () => {
    const query = armarQuery();
    const response = await fetch(`${back_host}/mve_transcaja/ingresos/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "No se pudo cargar los ingresos de caja.");
    }
    return Array.isArray(result.data) ? result.data : [];
  };

  const imprimirCierreCaja = async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || imprimiendoCierre) {
      return;
    }

    const cierreWindow = window.open("about:blank", "_blank");
    setImprimiendoCierre(true);

    try {
      cierreWindow?.document?.write(`<p style="font-family:Arial,sans-serif;color:#111827">Generando cierre de caja...</p>`);
      const ingresos = await obtenerIngresosCaja();
      const ingresosManualesQuery = armarQuery({ tipoMovimiento: "I", incluirMotivo: false });
      const ingresosManualesResponse = await fetch(`${back_host}/mve_transcaja/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${ingresosManualesQuery}`);
      const ingresosManualesResult = await ingresosManualesResponse.json();
      if (!ingresosManualesResponse.ok || !ingresosManualesResult.success) {
        throw new Error(ingresosManualesResult.message || "No se pudo cargar los ingresos manuales para el cierre.");
      }
      const salidasQuery = armarQuery({ tipoMovimiento: "S", incluirMotivo: false });
      const salidasResponse = await fetch(`${back_host}/mve_transcaja/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${salidasQuery}`);
      const salidasResult = await salidasResponse.json();
      if (!salidasResponse.ok || !salidasResult.success) {
        throw new Error(salidasResult.message || "No se pudo cargar las salidas para el cierre.");
      }
      const agencia = puntoVentaTrabajo
        ? puntosVentaAsignados.find((item) => item.id_punto_venta === puntoVentaTrabajo)?.nombre || puntoVentaTrabajo
        : "Todas";
      const pdfUrl = await crearCierreCajaMovimientoPdf({
        ingresos,
        ingresosManuales: Array.isArray(ingresosManualesResult.data) ? ingresosManualesResult.data : [],
        salidas: Array.isArray(salidasResult.data) ? salidasResult.data : [],
        generadoPor: params.id_invitado,
        filtros: {
          periodo: periodoTrabajo,
          fecha: fechaFiltro,
          agencia,
        },
      });

      if (cierreWindow) {
        cierreWindow.location.href = pdfUrl;
      } else {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      cierreWindow?.close();
      swal2.fire({
        title: "No se pudo generar el cierre",
        text: error.message || "Revisa los datos de caja e intenta nuevamente.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
      });
    } finally {
      setImprimiendoCierre(false);
    }
  };

  useEffect(() => {
    const periodoHistorial = sessionStorage.getItem("periodo_trabajo") || params.periodo;
    const contabilidadHistorial = sessionStorage.getItem("contabilidad_trabajo") || params.documento_id;
    cargarPeriodos(periodoHistorial, setPeriodoTrabajo);
    cargarContabilidades(contabilidadHistorial, setContabilidadTrabajo);
  }, [cargarContabilidades, cargarPeriodos, params.documento_id, params.periodo]);

  useEffect(() => {
    cargarPuntosVentaAsignados();
  }, [cargarPuntosVentaAsignados]);

  useEffect(() => {
    cargarMotivos();
  }, [cargarMotivos]);

  useEffect(() => {
    cargarFormasPago();
  }, [cargarFormasPago]);

  useEffect(() => {
    cargarUsuariosTrabajo();
  }, [cargarUsuariosTrabajo]);

  useEffect(() => {
    cargarCaja();
  }, [cargarCaja]);

  const dataFiltrada = useMemo(() => {
    const term = valorBusqueda.trim().toLowerCase();
    if (!term) return movimientos;
    return movimientos.filter((item) => [
      item.motivo_nombre,
      item.descripcion,
      item.beneficiario,
      item.forma_pago_nombre,
      item.nro_operacion,
      item.punto_venta_nombre,
      item.id_invitado,
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [movimientos, valorBusqueda]);

  const handlePeriodoSelect = (periodo) => {
    setPeriodoTrabajo(periodo);
    sessionStorage.setItem("periodo_trabajo", periodo);
    setDiaSel("*");
    setUsuarioTrabajo("");
  };

  const handleContabilidadSelect = (documentoId) => {
    if (documentoId === contabilidadTrabajo) return;
    setContabilidadTrabajo(documentoId);
    setPuntosVentaAsignados([]);
    setPuntoVentaTrabajo("");
    setMotivoFiltro("");
    setUsuarioTrabajo("");
    sessionStorage.setItem("contabilidad_trabajo", documentoId);
    navigate(`/ad_transportecaja/${params.id_anfitrion}/${params.id_invitado}/${periodoTrabajo}/${documentoId}`);
  };

  const handlePuntoVentaSelect = (puntoVenta) => {
    setPuntoVentaTrabajo(puntoVenta);
    setUsuarioTrabajo("");
  };

  const handleUsuarioSelect = (usuario) => {
    const sessionKey = `usuario_caja_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
    setUsuarioTrabajo(usuario);
    if (usuario) {
      sessionStorage.setItem(sessionKey, usuario);
    } else {
      sessionStorage.removeItem(sessionKey);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setDraft({
      ...emptyDraft,
      fecha: fechaInicialModal,
      id_punto_venta: puntoVentaTrabajo || puntosVentaAsignados[0]?.id_punto_venta || "",
      id_forma_pago: formasPago[0]?.id_forma_pago || "",
    });
    setModalOpen(true);
  };

  const abrirEdicion = (row) => {
    if (Number(row.registrado) !== 1) return;
    setEditando(row);
    setDraft({
      tipo_movimiento: String(row.tipo_movimiento || "S").trim(),
      fecha: String(row.fecha || "").slice(0, 16),
      id_punto_venta: row.id_punto_venta || "",
      id_motivo: row.id_motivo || "",
      descripcion: row.descripcion || "",
      importe: row.importe || "",
      id_forma_pago: row.id_forma_pago || "",
      nro_operacion: row.nro_operacion || "",
      beneficiario: row.beneficiario || "",
      documento_beneficiario: row.documento_beneficiario || "",
    });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    if (guardandoRef.current) return;
    setModalOpen(false);
    setEditando(null);
  };

  const validarDraft = () => {
    if (!draft.fecha || !draft.id_punto_venta || !draft.id_motivo) {
      return "Completa fecha, punto y motivo.";
    }
    if (Number(draft.importe) <= 0) {
      return "El importe debe ser mayor a cero.";
    }
    return "";
  };

  const guardarCajaMovimiento = async () => {
    if (guardandoRef.current) return;
    const tipoMovimiento = draft.tipo_movimiento || "S";
    const nombreMovimiento = tipoMovimiento === "I" ? "ingreso" : "salida";
    const error = validarDraft();
    if (error) {
      swal2.fire({ title: `Revisa el ${nombreMovimiento}`, text: error, icon: "warning", confirmButtonText: "ACEPTAR" });
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);
    const payload = {
      ...draft,
      tipo_movimiento: tipoMovimiento,
      id_forma_pago: draft.id_forma_pago || formasPago[0]?.id_forma_pago || "01",
      id_usuario: params.id_anfitrion,
      id_anfitrion: params.id_anfitrion,
      id_invitado: params.id_invitado,
      documento_id: contabilidadTrabajo,
      periodo: periodoTrabajo,
      importe: Number(draft.importe),
    };

    try {
      const url = editando
        ? `${back_host}/mve_transcaja/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${editando.id_movimiento}`
        : `${back_host}/mve_transcaja`;
      const response = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `No se pudo guardar el ${nombreMovimiento}.`);
      }

      setModalOpen(false);
      setEditando(null);
      cargarCaja();
    } catch (err) {
      swal2.fire({ title: "No se pudo guardar", text: err.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  const anularCajaMovimiento = async (row) => {
    const nombreMovimiento = String(row.tipo_movimiento || "").trim() === "I" ? "ingreso" : "salida";
    const result = await confirmDialog({
      title: `Anular ${nombreMovimiento}?`,
      message: `Desea anular este ${nombreMovimiento} manual?`,
      icon: "warning",
      confirmText: "ANULAR",
      cancelText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${back_host}/mve_transcaja/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${row.id_movimiento}/anular?id_invitado=${encodeURIComponent(params.id_invitado)}`, {
        method: "PATCH",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || `No se pudo anular el ${nombreMovimiento}.`);
      cargarCaja();
    } catch (err) {
      swal2.fire({ title: "No se pudo anular", text: err.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    }
  };

  const mostrarUsuarioEnMovimientos = usuarioPuedeVerTodosCorreos && !usuarioTrabajo;
  const columns = [
    {
      name: "Fecha",
      selector: (row) => String(row.fecha || "").slice(0, 16).replace("T", " "),
      sortable: true,
      width: "142px",
    },
    {
      name: "Tipo",
      cell: (row) => {
        const esIngreso = String(row.tipo_movimiento || "").trim() === "I";
        return (
          <Box sx={{ px: 0.9, py: 0.35, borderRadius: palette.radius.control, color: esIngreso ? palette.success : palette.danger, backgroundColor: esIngreso ? palette.successSoft : palette.dangerSoft, fontSize: "11px", fontWeight: 900 }}>
            {esIngreso ? "INGRESO" : "SALIDA"}
          </Box>
        );
      },
      sortable: true,
      width: "104px",
    },
    {
      name: "Motivo",
      selector: (row) => row.motivo_nombre || row.id_motivo,
      sortable: true,
      width: "150px",
    },
    {
      name: "Descripcion",
      selector: (row) => row.descripcion || "-",
      width: "210px",
    },
    ...(mostrarUsuarioEnMovimientos ? [{
      name: "Usuario",
      selector: (row) => row.id_invitado || "-",
      sortable: true,
      width: "150px",
    }] : []),
    {
      name: "Importe",
      selector: (row) => money(row.importe),
      right: true,
      sortable: true,
      width: "118px",
    },
    {
      name: "Estado",
      cell: (row) => (
        <Box sx={{ px: 0.9, py: 0.35, borderRadius: palette.radius.control, color: Number(row.registrado) === 1 ? palette.success : palette.danger, backgroundColor: Number(row.registrado) === 1 ? palette.successSoft : palette.dangerSoft, fontSize: "11px", fontWeight: 900 }}>
          {Number(row.registrado) === 1 ? "ACTIVO" : "ANULADO"}
        </Box>
      ),
      width: "104px",
    },
    {
      name: "Acciones",
      cell: (row) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton size="small" disabled={Number(row.registrado) !== 1} onClick={() => abrirEdicion(row)} sx={{ color: palette.accent }}>
            <Edit3 size={16} />
          </IconButton>
          <IconButton size="small" disabled={Number(row.registrado) !== 1} onClick={() => anularCajaMovimiento(row)} sx={{ color: palette.danger }}>
            <Trash2 size={16} />
          </IconButton>
        </Box>
      ),
      width: "104px",
      ignoreRowClick: true,
    },
  ];

  const customStyles = {
    table: { style: { backgroundColor: "transparent" } },
    headRow: { style: { backgroundColor: palette.surface, borderBottomColor: palette.border, minHeight: "42px" } },
    headCells: { style: { color: palette.muted, fontSize: "11px", fontWeight: 800, textTransform: "uppercase" } },
    rows: { style: { backgroundColor: "transparent", borderBottomColor: palette.borderSoft, minHeight: "52px" } },
    cells: { style: { color: palette.text, fontSize: "12.5px" } },
    pagination: { style: { backgroundColor: "transparent", color: palette.muted, borderTopColor: palette.border } },
  };

  return (
    <Box sx={{ minHeight: "100%", backgroundColor: "transparent", p: { xs: 1, md: 4 } }}>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <TrHeader
          titulo="Movimientos de caja"
          contador={dataFiltrada.length}
          contadorTexto="movimientos registrados"
          nuevoTexto="Nuevo movimiento"
          buscarTexto="Buscar movimiento..."
          valorBusqueda={valorBusqueda}
          nuevoDeshabilitado={!puntoVentaTrabajo && puntosVentaAsignados.length === 0}
          onNuevo={abrirNuevo}
          onBuscar={(event) => setValorBusqueda(event.target.value)}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(160px, 220px))" }, justifyContent: { md: "start" }, gap: 1, mb: 1.5 }}>
          <ResumenCard
            label="INGRESOS"
            value={money(resumen.total_ingresos)}
            tone="success"
            onClick={abrirDetalleIngresos}
            hideActionIcon
            watermark="VER DETALLES"
            watermarkIcon={<Search size={46} />}
          />
          <ResumenCard label="SALIDAS" value={money(resumen.total_salidas)} tone="danger" />
          <ResumenCard
            label="NETO"
            value={money(resumen.neto)}
            tone={Number(resumen.neto) >= 0 ? "success" : "danger"}
            onClick={imprimirCierreCaja}
            hideActionIcon
            watermark="IMPRIMIR CIERRE"
            watermarkIcon={<Printer size={46} />}
          />
        </Box>

        <TrFiltros
          periodoTrabajo={periodoTrabajo}
          periodoSelect={periodoSelect}
          contabilidadTrabajo={contabilidadTrabajo}
          contabilidadSelect={contabilidadSelect}
          puntosVentaAsignados={puntosVentaAsignados}
          puntoVentaTrabajo={puntoVentaTrabajo}
          onPeriodoSelect={handlePeriodoSelect}
          onContabilidadSelect={handleContabilidadSelect}
          onPuntoVentaSelect={handlePuntoVentaSelect}
          filtroDerechaPuntoVenta={usuarioPuedeVerTodosCorreos && usuariosTrabajo.length > 0 ? (
            <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
              <TrHeaderMenuPicker
                label="Usuario"
                value={usuarioTrabajo}
                displayValue={
                  usuarioTrabajo
                    ? usuariosTrabajo.find((item) => item.id_usuario === usuarioTrabajo)?.nombre || usuarioTrabajo
                    : "Todos"
                }
                minWidth="100%"
                options={[
                  { value: "", label: "Todos" },
                  ...usuariosTrabajo.map((item) => ({ value: item.id_usuario, label: item.nombre || item.id_usuario })),
                ]}
                onSelect={handleUsuarioSelect}
              />
            </Box>
          ) : null}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 260px)" }, gap: 1, mb: 1.25 }}>
          <TrHeaderMenuPicker
            label="Motivo"
            value={motivoFiltro}
            displayValue={motivos.find((item) => item.id_motivo === motivoFiltro)?.nombre || "Todos"}
            minWidth="100%"
            options={[{ value: "", label: "Todos" }, ...motivos.map((item) => ({ value: item.id_motivo, label: item.nombre }))]}
            onSelect={setMotivoFiltro}
          />
        </Box>

        <DaySelector
          period={periodoTrabajo || params.periodo}
          onDaySelect={(day) => {
            setDiaSel(day === "*" ? "*" : String(day).padStart(2, "0"));
            setUsuarioTrabajo("");
          }}
        />

        <DataTable
          theme="transportesDark"
          columns={columns}
          data={dataFiltrada}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          highlightOnHover
          responsive
          customStyles={customStyles}
          noDataComponent={
            <Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}>
              <Search size={16} />
              Sin movimientos para el filtro actual
            </Box>
          }
        />

        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, color: palette.muted, fontSize: "12px" }}>
          <WalletCards size={14} />
          Movimientos manuales registrados en mve_transcaja.
        </Box>
      </Box>

      <TrCajaMovimientoModal
        open={modalOpen}
        draft={draft}
        setDraft={setDraft}
        motivos={motivos}
        puntosVenta={puntosVentaAsignados}
        guardando={guardando}
        esEdicion={Boolean(editando)}
        onClose={cerrarModal}
        onSubmit={guardarCajaMovimiento}
      />

      <IngresosModal
        open={ingresosModalOpen}
        ingresos={ingresosDetalle}
        loading={loadingIngresos}
        onClose={() => setIngresosModalOpen(false)}
      />
    </Box>
  );
}
