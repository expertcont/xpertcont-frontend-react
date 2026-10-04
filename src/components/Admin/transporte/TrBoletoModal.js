"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Dialog, Grid, IconButton, InputBase, Typography } from "@mui/material";
import { Bus, MapPin, Save, UserRound, X } from "lucide-react";

import AppButton from "../../ui/AppButton";
import AppIconBox from "../../ui/AppIconBox";
import palette from "../../../theme/palette";
import TrRutaSelect from "./common/components/TrRutaSelect";

const documentoTipoDesdeNumero = (documento) => {
  const limpio = String(documento || "").replace(/\D/g, "");
  return limpio.length === 11 ? "6" : "1";
};

// El boleto solo necesita estos datos del pasajero. La agencia, el destino y el
// total NO se piden: salen de la ruta elegida, y el precio lo aplica el backend
// desde mve_transruta.precio_pasaje, nunca desde este formulario.
const crearDraft = (operacion, periodoTrabajo, fechaOperacion) => ({
  tipo_operacion: "B",
  r_fecemi: String(operacion?.r_fecemi || fechaOperacion || `${periodoTrabajo}-01`).slice(0, 10),
  r_cod: operacion?.r_cod || "03",
  r_serie: operacion?.r_serie || "B001",
  r_numero: operacion?.r_numero || "",
  id_documento: operacion?.id_documento || documentoTipoDesdeNumero(operacion?.cliente_documento),
  cliente: operacion?.cliente || "",
  cliente_documento: operacion?.cliente_documento || "",
  cliente_telefono: operacion?.cliente_telefono || "",
  id_ruta: operacion?.id_ruta || "",
  id_punto_venta: operacion?.id_punto_venta || "",
  id_punto_venta_dest: operacion?.id_punto_venta_dest || "",
  asiento: operacion?.asiento || "",
});

const fieldSx = {
  height: 33,
  px: 1,
  display: "flex",
  alignItems: "center",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
};

const inputSx = {
  color: palette.text,
  fontSize: "12.5px",
  width: "100%",
  "& input::placeholder": { color: palette.muted, opacity: 1 },
};

function Field({ label, children }) {
  return (
    <Box sx={fieldSx}>
      <Typography component="span" sx={{ color: palette.muted, fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase", mr: 0.75, whiteSpace: "nowrap" }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

function CaptureInput({ value, onChange, placeholder, type = "text", align = "left" }) {
  return (
    <InputBase
      type={type}
      value={value || ""}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      sx={{ ...inputSx, "& input": { textAlign: align } }}
    />
  );
}

// Valor que se muestra pero no se escribe: destino y total salen de la ruta.
// Comparte la tipografia de los campos editables para que la fila se lea igual.
function ValorInfo({ value, align = "left", vacio = "-" }) {
  return (
    <Box sx={{ ...inputSx, color: value ? palette.text : palette.muted, py: 0.5, textAlign: align, lineHeight: "20px" }}>
      {value || vacio}
    </Box>
  );
}

function RutaSelect({ value, onChange, rutas }) {
  return <TrRutaSelect value={value} onChange={onChange} rutas={rutas} />;
}

export default function TrBoletoModal({
  open,
  operacion,
  periodoTrabajo,
  fechaOperacion,
  rutasDisponibles = [],
  modalNuevoTitulo = "Nuevo boleto",
  modalEditarTitulo = "Editar boleto",
  onClose,
  onSubmit,
  guardarActionId,
}) {
  const esEdicion = Boolean(operacion);
  const [draft, setDraft] = useState(() => crearDraft(operacion, periodoTrabajo, fechaOperacion));
  const [error, setError] = useState("");

  // Solo hay una ruta de salida de pasajeros: se toma sola y no se pregunta.
  // `precio_pasaje > 0` ya filtro la lista (el backend lo aplica con
  // ?solo_pasaje=true), asi que este caso es "esta agencia tiene un solo destino".
  // Con dos o mas rutas sigue apareciendo el select para elegir.
  const rutasPasaje = useMemo(
    () => rutasDisponibles.filter((ruta) => Number(ruta.precio_pasaje || 0) > 0),
    [rutasDisponibles]
  );

  useEffect(() => {
    if (open) {
      const inicial = crearDraft(operacion, periodoTrabajo, fechaOperacion);

      // Al editar se respeta la ruta ya guardada. Al crear, si hay una sola ruta
      // de pasaje se preselecciona para no obligar a elegir algo que no tiene
      // alternativa.
      if (!operacion && !inicial.id_ruta && rutasPasaje.length === 1) {
        inicial.id_ruta = rutasPasaje[0].id_ruta;
        inicial.id_punto_venta = rutasPasaje[0].id_punto_venta || inicial.id_punto_venta;
        inicial.id_punto_venta_dest = rutasPasaje[0].id_punto_venta_dest || "";
      }

      setDraft(inicial);
      setError("");
    }
  }, [open, operacion, periodoTrabajo, fechaOperacion, rutasPasaje]);

  const rutaSeleccionada = useMemo(
    () => rutasDisponibles.find((ruta) => ruta.id_ruta === draft.id_ruta),
    [draft.id_ruta, rutasDisponibles],
  );

  const updateDraft = (name, value) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const seleccionarRuta = (idRuta) => {
    const ruta = rutasDisponibles.find((item) => item.id_ruta === idRuta);
    setDraft((prev) => ({
      ...prev,
      id_ruta: idRuta,
      id_punto_venta: ruta?.id_punto_venta || "",
      id_punto_venta_dest: ruta?.id_punto_venta_dest || "",
    }));
  };

  // Destino y total se LEEN de la ruta elegida. No se editan y no se envian:
  // el backend toma el precio de mve_transruta.precio_pasaje, asi que escribir
  // un total aqui no cambiaria lo que se guarda.
  const precioPasaje = Number(rutaSeleccionada?.precio_pasaje || 0);
  const destinoNombre = rutaSeleccionada?.punto_venta_dest_nombre
    || rutaSeleccionada?.id_punto_venta_dest
    || "";

  const handleSubmit = () => {
    if (!draft.cliente_documento || !draft.cliente) {
      setError("Indica documento y nombres del pasajero.");
      return;
    }

    if (!draft.id_ruta) {
      setError("Indica la ruta del boleto.");
      return;
    }

    if (!draft.asiento) {
      setError("Indica el asiento.");
      return;
    }

    // No se envian precios: el total lo aplica el backend desde
    // mve_transruta.precio_pasaje. condicion_pago se sigue mandando, aunque la
    // funcion de boleto todavia no lo persiste (no esta en su INSERT).
    onSubmit({
      ...draft,
      tipo_operacion: "B",
      cantidad: 1,
      condicion_pago: "PAGADO",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 3 } }}>
      <Box sx={{ p: { xs: 0.9, md: 1.15 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
            <AppIconBox><Bus size={16} /></AppIconBox>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "15px" }}>{esEdicion ? modalEditarTitulo : modalNuevoTitulo}</Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px" }} noWrap>Captura de boleto de pasajero</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}><X size={18} /></IconButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5, mb: 0.55 }}>
          <UserRound size={15} color={palette.accent} />
          <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 800 }}>Pasajero</Typography>
        </Box>
        <Grid container spacing={0.85}>
          <Grid item xs={12} md={2.4}>
            <Field label="DNI/RUC">
              <CaptureInput
                value={draft.cliente_documento}
                onChange={(value) => {
                  updateDraft("cliente_documento", value);
                  updateDraft("id_documento", documentoTipoDesdeNumero(value));
                }}
                placeholder="Documento"
                align="right"
              />
            </Field>
          </Grid>
          <Grid item xs={12} md={6.6}>
            <Field label="Nombres">
              <CaptureInput value={draft.cliente} onChange={(value) => updateDraft("cliente", value)} placeholder="Pasajero" />
            </Field>
          </Grid>
          <Grid item xs={12} md={3}>
            <Field label="Telefono">
              <CaptureInput value={draft.cliente_telefono} onChange={(value) => updateDraft("cliente_telefono", value)} placeholder="Celular" />
            </Field>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1, mb: 0.55 }}>
          <MapPin size={15} color={palette.accent} />
          <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 800 }}>Viaje</Typography>
        </Box>
        <Grid container spacing={0.85}>
          <Grid item xs={12} md={5}>
            <Field label="Ruta">
              <RutaSelect value={draft.id_ruta} onChange={seleccionarRuta} rutas={rutasDisponibles} />
            </Field>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <Field label="Asiento">
              <CaptureInput value={draft.asiento} onChange={(value) => updateDraft("asiento", value)} placeholder="Nro" align="right" />
            </Field>
          </Grid>
          <Grid item xs={6} md={4}>
            <Field label="Destino">
              <ValorInfo value={destinoNombre} vacio="Elegi una ruta" />
            </Field>
          </Grid>
          <Grid item xs={12} md={1.5}>
            <Field label="Total S/">
              <ValorInfo
                value={rutaSeleccionada ? precioPasaje.toFixed(2) : ""}
                align="right"
                vacio="0.00"
              />
            </Field>
          </Grid>
        </Grid>

        {error && <Typography sx={{ color: "#ff8a65", fontSize: "12px", mt: 1 }}>{error}</Typography>}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.75, mt: 1.2, flexWrap: "wrap" }}>
          <AppButton onClick={onClose}>Cancelar</AppButton>
          <AppButton data-action-id={guardarActionId} icon={<Save size={16} />} onClick={handleSubmit} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
            Grabar boleto
          </AppButton>
        </Box>
      </Box>
    </Dialog>
  );
}
