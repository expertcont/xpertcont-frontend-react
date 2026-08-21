"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Dialog, Grid, IconButton, InputBase, Typography } from "@mui/material";
import { ChevronDown, ChevronUp, Clock, MapPin, Package, Save, Search, Truck, UserRound, X } from "lucide-react";

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

const normalizarCondicionPago = (value) => {
  if (value === "CANCELADO") {
    return "PAGADO";
  }
  if (value === "POR_PAGAR") {
    return "POR_COBRAR";
  }
  return value || "PAGADO";
};

const crearDraft = (operacion, periodoTrabajo, fechaOperacion) => ({
  tipo_operacion: "E",
  r_fecemi: String(operacion?.r_fecemi || fechaOperacion || `${periodoTrabajo}-01`).slice(0, 10),
  r_cod: operacion?.r_cod || "03",
  r_serie: operacion?.r_serie || "B001",
  r_numero: operacion?.r_numero || "",
  id_documento: operacion?.id_documento || documentoTipoDesdeNumero(operacion?.cliente_documento),
  cliente: operacion?.cliente || "",
  cliente_documento: operacion?.cliente_documento || "",
  cliente_telefono: operacion?.cliente_telefono || "",
  remitente_entrega: "OFICINA",
  remitente_zona: operacion?.remitente_zona || "",
  remitente_direccion: operacion?.remitente_direccion || "",
  destinatario: operacion?.destinatario || "",
  destinatario_documento: operacion?.destinatario_documento || "",
  destinatario_telefono: operacion?.destinatario_telefono || "",
  destinatario_entrega: "OFICINA",
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
  height: 31,
  px: 1,
  display: "flex",
  alignItems: "center",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  color: palette.text,
  fontSize: "12.5px",
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

function Field({ label, icon, children, labelWidth = "auto", tall = false }) {
  return (
    <Box sx={{ ...fieldSx, height: tall ? 38 : fieldSx.height }}>
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
            fontSize: "9.5px",
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
    const nextRef = focusableRefs[currentIndex + delta];
    if (nextRef?.current) {
      event.preventDefault();
      nextRef.current.focus();
      nextRef.current.select?.();
      return true;
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

function CaptureInput({ value, onChange, inputRef, nextRef, placeholder, type = "text", multiline = false, align = "left", readOnly = false }) {
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
        minHeight: 38,
        px: 1,
        py: 0.75,
        display: "flex",
        alignItems: "flex-start",
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 2,
        color: palette.text,
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
          if (event.key === "Enter" && event.ctrlKey && nextRef?.current) {
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
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.85, mb: 0.35 }}>
      <Box sx={{ color: palette.accent, display: "flex" }}>{icon}</Box>
      <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 800 }}>
        {title}
      </Typography>
    </Box>
  );
}

function ChoiceGroup({ value, onChange, options = ["OFICINA", "CLIENTE"] }) {
  return (
    <Box sx={{ display: "flex", gap: 0.55, flexWrap: "nowrap", alignItems: "center", justifyContent: "center", minWidth: 0, width: "100%", pl: 0.35 }}>
      {options.map((option) => {
        const optionValue = option.value || option;
        const optionLabel = option.label || option;

        return (
        <Box
          key={optionValue}
          onClick={() => onChange(optionValue)}
          sx={{
            height: 20,
            px: 0.55,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 1.25,
            backgroundColor: value === optionValue ? palette.accentSoft : palette.chip,
            border: `1px solid ${value === optionValue ? palette.accent : palette.border}`,
            color: value === optionValue ? palette.accent : palette.text,
            fontSize: "10px",
            fontWeight: 800,
            cursor: "pointer",
            lineHeight: 1,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {optionLabel}
        </Box>
        );
      })}
    </Box>
  );
}

function RutaPickerModal({ open, rutas, onClose, onSelect }) {
  const [busqueda, setBusqueda] = useState("");
  const filtradas = rutas.filter((ruta) => [
    ruta.id_ruta,
    ruta.nombre,
    ruta.id_punto_venta,
    ruta.id_punto_venta_dest,
    ruta.punto_venta_nombre,
    ruta.punto_venta_dest_nombre,
  ].some((field) => String(field || "").toLowerCase().includes(busqueda.toLowerCase())));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 3 } }}>
      <Box sx={{ p: 1.1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "15px" }}>Escoger ruta</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "11px" }}>Se grabara id_ruta y sus puntos de venta</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ ...fieldSx, mb: 0.9 }}>
          <Box sx={{ color: palette.muted, display: "flex", mr: 0.6 }}>
            <Search size={15} />
          </Box>
          <InputBase value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar ruta..." sx={inputSx} autoFocus />
        </Box>

        <Box sx={{ maxHeight: 360, overflowY: "auto", display: "grid", gap: 0.65 }}>
          {filtradas.map((ruta) => (
            <Box
              key={ruta.id_ruta}
              onClick={() => onSelect(ruta)}
              sx={{
                p: 0.85,
                borderRadius: 2,
                border: `1px solid ${palette.borderSoft}`,
                backgroundColor: palette.bg,
                cursor: "pointer",
                transition: "all .16s ease",
                "&:hover": {
                  borderColor: palette.accent,
                  backgroundColor: palette.surfaceAlt,
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "13px" }}>{ruta.id_ruta}</Typography>
                <Typography sx={{ color: palette.accent, fontWeight: 800, fontSize: "11px" }}>{ruta.id_punto_venta} -> {ruta.id_punto_venta_dest}</Typography>
              </Box>
              <Typography sx={{ color: palette.text, fontSize: "12.5px", mt: 0.35 }}>{ruta.nombre}</Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.25 }}>
                {[ruta.punto_venta_nombre, ruta.punto_venta_dest_nombre].filter(Boolean).join(" -> ")}
              </Typography>
            </Box>
          ))}

          {filtradas.length === 0 && (
            <Typography sx={{ color: palette.muted, fontSize: "12px", py: 3, textAlign: "center" }}>
              Sin rutas disponibles
            </Typography>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

function RutaField({ ruta, onOpen, inputRef }) {
  const textoRuta = ruta ? `${ruta.id_ruta} - ${ruta.nombre}` : "";

  return (
    <Box onClick={onOpen} sx={{ width: "100%", display: "flex", alignItems: "center", cursor: "pointer" }}>
      <InputBase
        inputRef={inputRef}
        value={textoRuta}
        placeholder="Escoger ruta"
        readOnly
        sx={{ ...inputSx, pointerEvents: "none" }}
      />
    </Box>
  );
}

export default function TransportesEncomiendaModal({
  open,
  operacion,
  periodoTrabajo,
  fechaOperacion,
  rutasDisponibles = [],
  modalNuevoTitulo = "Nueva encomienda",
  modalEditarTitulo = "Editar encomienda",
  onClose,
  onSubmit,
}) {
  const esEdicion = Boolean(operacion);
  const [draft, setDraft] = useState(() => crearDraft(operacion, periodoTrabajo, fechaOperacion));
  const [error, setError] = useState("");
  const [rutaPickerOpen, setRutaPickerOpen] = useState(false);

  const remitenteDocRef = useRef(null);
  const destinatarioDocRef = useRef(null);
  const rutaRef = useRef(null);
  const placaRef = useRef(null);
  const choferRef = useRef(null);
  const descripcionRef = useRef(null);
  const totalRef = useRef(null);
  const llegadaRef = useRef(null);

  focusableRefs.length = 0;
  focusableRefs.push(
    remitenteDocRef,
    destinatarioDocRef,
    rutaRef,
    placaRef,
    choferRef,
    descripcionRef,
    totalRef,
    llegadaRef,
  );

  useEffect(() => {
    if (open) {
      setDraft(crearDraft(operacion, periodoTrabajo, fechaOperacion));
      setError("");
      window.setTimeout(() => {
        remitenteDocRef.current?.focus();
        remitenteDocRef.current?.select?.();
      }, 80);
    }
  }, [open, operacion, periodoTrabajo, fechaOperacion]);

  const updateDraft = (name, value) => {
    setDraft((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const rutaSeleccionada = rutasDisponibles.find((ruta) => ruta.id_ruta === draft.id_ruta);

  const seleccionarRuta = (ruta) => {
    setDraft((prev) => ({
      ...prev,
      id_ruta: ruta.id_ruta,
      id_punto_venta: ruta.id_punto_venta,
      id_punto_venta_dest: ruta.id_punto_venta_dest,
    }));
    setRutaPickerOpen(false);
    window.setTimeout(() => {
      placaRef.current?.focus();
      placaRef.current?.select?.();
    }, 60);
  };

  const handleSubmit = () => {
    if (!draft.cliente_documento) {
      setError("Indica DNI/RUC del remitente.");
      remitenteDocRef.current?.focus();
      return;
    }

    if (!draft.destinatario_documento || !draft.destinatario) {
      setError("Indica DNI y nombre del destinatario.");
      destinatarioDocRef.current?.focus();
      return;
    }

    if (!draft.id_ruta) {
      setError("Indica la ruta.");
      rutaRef.current?.focus();
      return;
    }

    if (!draft.descripcion) {
      setError("Describe la encomienda.");
      descripcionRef.current?.focus();
      return;
    }

    const total = Math.round(Number(draft.r_monto_total || 0));

    onSubmit({
      ...draft,
      tipo_operacion: "E",
      id_punto_venta: draft.id_punto_venta,
      id_punto_venta_dest: draft.id_punto_venta_dest,
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
        },
      }}
    >
      <Box sx={{ p: { xs: 0.85, md: 1 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.65 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <AppIconBox>
              <Package size={16} />
            </AppIconBox>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "14.5px" }}>
                {esEdicion ? modalEditarTitulo : modalNuevoTitulo}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px" }} noWrap>
                Captura rapida en el orden del sistema anterior
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>

        <SectionHeader icon={<UserRound size={15} />} title="1. Remitente" />
        <Grid container spacing={0.85}>
          <Grid item xs={12} md={2.4}>
            <Field label="DNI / RUC">
              <CaptureInput
                value={draft.cliente_documento}
                onChange={(value) => {
                  updateDraft("cliente_documento", value);
                  updateDraft("id_documento", documentoTipoDesdeNumero(value));
                }}
                inputRef={remitenteDocRef}
                nextRef={destinatarioDocRef}
                placeholder="Documento"
                align="right"
              />
            </Field>
          </Grid>
          <Grid item xs={12} md={6.6}>
            <Field label="Nombres / R.Social">
              <CaptureInput value={draft.cliente} onChange={(value) => updateDraft("cliente", value)} nextRef={destinatarioDocRef} placeholder=" Remitente" />
            </Field>
          </Grid>
          <Grid item xs={12} md={3}>
            <Field label="Telefono">
              <CaptureInput value={draft.cliente_telefono} onChange={(value) => updateDraft("cliente_telefono", value)} nextRef={destinatarioDocRef} placeholder="Celular" />
            </Field>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Field label="" labelWidth={0}>
              <ChoiceGroup value={draft.remitente_entrega} onChange={(value) => updateDraft("remitente_entrega", value)} />
            </Field>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Field label="Zona">
              <CaptureInput value={draft.remitente_zona} onChange={(value) => updateDraft("remitente_zona", value)} placeholder="Zona" />
            </Field>
          </Grid>
          <Grid item xs={12} md={7.2}>
            <Field label="Direccion">
              <CaptureInput value={draft.remitente_direccion} onChange={(value) => updateDraft("remitente_direccion", value)} placeholder="Direccion si envia desde casa" />
            </Field>
          </Grid>
        </Grid>

        <SectionHeader icon={<UserRound size={15} />} title="2. Destinatario" />
        <Grid container spacing={0.85}>
          <Grid item xs={12} md={2.4}>
            <Field label="DNI">
              <CaptureInput value={draft.destinatario_documento} onChange={(value) => updateDraft("destinatario_documento", value)} inputRef={destinatarioDocRef} nextRef={rutaRef} placeholder="Documento" align="right" />
            </Field>
          </Grid>
          <Grid item xs={12} md={6.6}>
            <Field label="NOMBRES APELLIDOS">
              <CaptureInput value={draft.destinatario} onChange={(value) => updateDraft("destinatario", value)} nextRef={rutaRef} placeholder="Destinatario" />
            </Field>
          </Grid>
          <Grid item xs={12} md={3}>
            <Field label="Telefono">
              <CaptureInput value={draft.destinatario_telefono} onChange={(value) => updateDraft("destinatario_telefono", value)} nextRef={rutaRef} placeholder="Celular" />
            </Field>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Field label="" labelWidth={0}>
              <ChoiceGroup value={draft.destinatario_entrega} onChange={(value) => updateDraft("destinatario_entrega", value)} />
            </Field>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Field label="Zona">
              <CaptureInput value={draft.destinatario_zona} onChange={(value) => updateDraft("destinatario_zona", value)} placeholder="Zona" />
            </Field>
          </Grid>
          <Grid item xs={12} md={7.2}>
            <Field label="Direccion">
              <CaptureInput value={draft.destinatario_direccion} onChange={(value) => updateDraft("destinatario_direccion", value)} placeholder="Direccion si recibe en casa" />
            </Field>
          </Grid>
        </Grid>

        <SectionHeader icon={<MapPin size={15} />} title="3. Ruta, unidad y encomienda" />
        <Grid container spacing={0.85}>
          <Grid item xs={12} md={4}>
            <Field label="Ruta" icon={<MapPin size={15} />}>
              <RutaField ruta={rutaSeleccionada || (draft.id_ruta ? { id_ruta: draft.id_ruta, nombre: "" } : null)} onOpen={() => setRutaPickerOpen(true)} inputRef={rutaRef} />
            </Field>
          </Grid>
          <Grid item xs={12} md={2}>
            <Field label="Placa" icon={<Truck size={15} />}>
              <CaptureInput value={draft.placa} onChange={(value) => updateDraft("placa", value)} inputRef={placaRef} nextRef={choferRef} placeholder="Placa" />
            </Field>
          </Grid>
          <Grid item xs={12} md={6}>
            <Field label="Chofer">
              <CaptureInput value={draft.licencia} onChange={(value) => updateDraft("licencia", value)} inputRef={choferRef} nextRef={descripcionRef} placeholder="Chofer / licencia" />
            </Field>
          </Grid>
          <Grid item xs={12}>
            <MultilineCapture
              value={draft.descripcion}
              onChange={(value) => updateDraft("descripcion", value)}
              inputRef={descripcionRef}
              nextRef={totalRef}
              placeholder="Descripcion encomienda: paquete, sobre, caja..."
            />
          </Grid>
        </Grid>

        <SectionHeader icon={<Clock size={15} />} title="4. Pago y llegada" />
        <Grid container spacing={0.85}>
          <Grid item xs={12} md={2.8}>
            <Field label="" tall labelWidth={0}>
              <ChoiceGroup
                value={draft.condicion_pago}
                onChange={(value) => updateDraft("condicion_pago", value)}
                options={[
                  { value: "PAGADO", label: "PAGADO" },
                  { value: "POR_COBRAR", label: "POR COBRAR" },
                ]}
              />
            </Field>
          </Grid>
          <Grid item xs={12} md={4}>
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
              <CaptureInput value={draft.llegada_aprox} onChange={(value) => updateDraft("llegada_aprox", value)} inputRef={llegadaRef} align="center" />
            </Field>
          </Grid>
        </Grid>

        {error && (
          <Typography sx={{ color: "#ff8a65", fontSize: "12px", mt: 0.85 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.55, mt: 0.75, flexWrap: "wrap" }}>
          <AppButton onClick={onClose}>Salir [Esc]</AppButton>
          <AppButton>Imprimir boleto</AppButton>
          <AppButton icon={<Save size={16} />} onClick={handleSubmit} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
            Grabar encomienda [F12]
          </AppButton>
        </Box>
      </Box>
      <RutaPickerModal
        open={rutaPickerOpen}
        rutas={rutasDisponibles}
        onClose={() => setRutaPickerOpen(false)}
        onSelect={seleccionarRuta}
      />
    </Dialog>
  );
}
