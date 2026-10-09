import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Dialog, Grid, IconButton, Typography } from "@mui/material";
import { ClipboardList, MapPin, Truck, UserRound, X } from "lucide-react";

import palette from "../../../../theme/palette";
import AppButton from "../../../ui/AppButton";
import TrRutaSelect from "../common/components/TrRutaSelect";
import {
  CaptureInput,
  Field,
  sectionSx,
} from "../encomienda/modal/TrEncomiendaModalInputs";
import {
  LicenciaPickerModal,
  PlacaPickerModal,
} from "../encomienda/modal/TrEncomiendaModalPickers";
import {
  FECHA_AAAA_MM_DD,
  emptyManifiesto,
  focusableRefsManifiesto,
  normalizarFechaManifiesto,
  periodoDeFecha,
} from "./trManifiestoUtils";

// ===========================================================================
// ALTA DEL MANIFIESTO (cabecera del viaje)
//
// Columna angosta y vertical, igual que el modal de encomienda: 430px, header
// fijo, SOLO el cuerpo scrollea, footer fijo. Seis campos, uno por fila.
//
// Los controles (Field, CaptureInput, RutaField, PuntoVentaField, sectionSx) NO se
// duplican: se importan del modal de encomienda. Lo unico propio es el registro de
// refs, porque las flechas tienen que recorrer los campos de ESTE formulario y el
// de encomienda es un array de modulo compartido.
// ===========================================================================

const compactSectionSx = { ...sectionSx, p: { xs: 0.35, md: 0.4 } };

const scrollSx = {
  px: { xs: 0.7, md: 0.85 },
  pb: 0.75,
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  scrollbarWidth: "thin",
  scrollbarColor: `${palette.border} ${palette.overlaySoft}`,
  "&::-webkit-scrollbar": { width: 8 },
  "&::-webkit-scrollbar-track": {
    backgroundColor: palette.overlaySoft,
    borderRadius: palette.radius.control,
    border: `1px solid ${palette.borderSoft}`,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: palette.border,
    borderRadius: palette.radius.control,
    border: `2px solid ${palette.surface}`,
  },
  "&::-webkit-scrollbar-thumb:hover": { backgroundColor: palette.accent },
};

const accionSecundariaSx = {
  height: 42,
  minWidth: 44,
  px: 1,
  borderRadius: palette.radius.control,
  color: palette.muted,
  backgroundColor: palette.overlaySoft,
  borderColor: palette.borderSoft,
  fontSize: "12px",
  fontWeight: 800,
  "& svg": { width: 18, height: 18 },
};

const accionPrincipalSx = {
  height: 42,
  minWidth: 132,
  px: 1.4,
  borderRadius: palette.radius.control,
  backgroundColor: palette.accent,
  borderColor: palette.accent,
  color: palette.onAccent,
  fontSize: "13px",
  fontWeight: 800,
};

const pickerIconSx = {
  width: 32,
  height: 32,
  p: 0,
  mr: 0.45,
  flexShrink: 0,
  borderRadius: palette.radius.control,
  border: `1px solid ${palette.accent}`,
  backgroundColor: palette.accentSoft,
  color: palette.accent,
  "& svg": { width: 17, height: 17 },
  "&:hover": {
    backgroundColor: palette.accentSoft,
    color: palette.accent,
  },
};

function SectionHeader({ icon, title }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.55, mb: 0.32 }}>
      <Box sx={{ color: palette.accent, display: "flex" }}>{icon}</Box>
      <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 800 }}>{title}</Typography>
    </Box>
  );
}

export default function TrManifiestoModal({
  open,
  onClose,
  onCrear,
  manifiesto = null,
  modoCierre = false,
  id_usuario,
  documento_id,
  puntoVentaOrigen,
  rutasDisponibles = [],
  placasDisponibles = [],
  licenciasDisponibles = [],
  fechaServidor = "",
  guardando = false,
}) {
  const [draft, setDraft] = useState(emptyManifiesto);
  const [error, setError] = useState("");
  const [placaPickerOpen, setPlacaPickerOpen] = useState(false);
  const [licenciaPickerOpen, setLicenciaPickerOpen] = useState(false);

  const placaRef = useRef(null);
  const licenciaRef = useRef(null);
  const observacionRef = useRef(null);
  const grabarRef = useRef(null);

  const actualizar = (campo, valor) => setDraft((prev) => ({ ...prev, [campo]: valor }));

  const seleccionarPlaca = (item) => {
    setDraft((prev) => ({
      ...prev,
      placa: item?.placa || "",
    }));
    setPlacaPickerOpen(false);
    window.setTimeout(() => licenciaRef.current?.focus(), 60);
  };

  const seleccionarLicencia = (item) => {
    const nombre = String(item?.nombre || `${item?.nombres || ""} ${item?.apellidos || ""}`.trim()).trim();
    setDraft((prev) => ({
      ...prev,
      licencia: item?.licencia || "",
      observacion: prev.observacion || (nombre ? `CHOFER: ${nombre}` : prev.observacion),
    }));
    setLicenciaPickerOpen(false);
    window.setTimeout(() => observacionRef.current?.focus(), 60);
  };

  // Al abrir: la fecha la pone el servidor (no el reloj del navegador) y el origen
  // viene del filtro del panel. El manifiesto ES un viaje, asi que la fecha es
  // parte de su identidad: dos manifiestos del mismo dia son dos viajes distintos.
  //
  // Si la agencia tiene UNA sola ruta de salida de pasajeros, se toma sola y no se
  // pregunta: no hay alternativa posible. Con dos o mas, el select queda vacio a
  // proposito para que el manifiesto elija por que destino sale el viaje.
  useEffect(() => {
    if (open) {
      if (manifiesto) {
        setDraft({
          ...emptyManifiesto(),
          fecha: normalizarFechaManifiesto(manifiesto.fecha || fechaServidor),
          id_punto_venta: manifiesto.id_punto_venta || puntoVentaOrigen || "",
          id_punto_venta_dest: manifiesto.id_punto_venta_dest || "",
          id_ruta: manifiesto.id_ruta || "",
          placa: manifiesto.placa || "",
          licencia: manifiesto.licencia || "",
          observacion: manifiesto.observacion || "",
        });
        setError("");
        window.setTimeout(() => placaRef.current?.focus(), 80);
        return;
      }

      const inicial = {
        ...emptyManifiesto(),
        fecha: normalizarFechaManifiesto(fechaServidor),
        id_punto_venta: puntoVentaOrigen || "",
      };

      const candidatas = rutasDisponibles.filter((r) => Number(r.precio_pasaje || 0) > 0);
      if (candidatas.length === 1) {
        inicial.id_ruta = candidatas[0].id_ruta;
        inicial.id_punto_venta_dest = candidatas[0].id_punto_venta_dest || "";
        inicial.ruta_nombre = candidatas[0].nombre || candidatas[0].nombre_ruta || "";
        inicial.id_punto_venta = candidatas[0].id_punto_venta || inicial.id_punto_venta;
      }

      setDraft(inicial);
      setError("");
      window.setTimeout(() => placaRef.current?.focus(), 80);
    }
  }, [open, fechaServidor, manifiesto, puntoVentaOrigen, rutasDisponibles]);

  // Orden de las flechas: arriba/abajo sigue el orden visual del formulario.
  // Ver trManifiestoUtils para por que este array es propio y no el de encomienda.
  //
  // El select de ruta NO entra en el registro: es un Select de MUI, no un input, y
  // el motor de flechas llama a focus() + select() sobre nodos de texto. Se recorre
  // con Tab como cualquier select, que en un formulario de 6 campos va bien.
  focusableRefsManifiesto.length = 0;
  focusableRefsManifiesto.push(placaRef, licenciaRef, observacionRef, grabarRef);

  const rutaElegida = useMemo(
    () => rutasDisponibles.find((r) => String(r.id_ruta) === String(draft.id_ruta)) || null,
    [rutasDisponibles, draft.id_ruta]
  );

  const rutasConPasaje = useMemo(
    () => rutasDisponibles.filter((r) => Number(r.precio_pasaje || 0) > 0),
    [rutasDisponibles]
  );

  const cerrar = () => {
    onClose();
  };

  const manejarSubmit = () => {
    if (guardando) {
      return;
    }

    const fechaNormalizada = normalizarFechaManifiesto(draft.fecha);

    if (!FECHA_AAAA_MM_DD.test(fechaNormalizada)) {
      setError("La fecha del viaje debe tener formato AAAA-MM-DD.");
      return;
    }

    if (!String(draft.id_punto_venta || "").trim()) {
      setError("No hay punto de venta de salida en el filtro del panel.");
      return;
    }

    if (!rutaElegida) {
      setError("Elige el destino del viaje.");
      return;
    }

    if (modoCierre && (!String(draft.placa || "").trim() || !String(draft.licencia || "").trim())) {
      setError("Indica placa y licencia para finalizar el manifiesto.");
      if (!String(draft.placa || "").trim()) {
        placaRef.current?.focus();
      } else {
        licenciaRef.current?.focus();
      }
      return;
    }

    setError("");
    onCrear({
      id_manifiesto: manifiesto?.id_manifiesto,
      id_usuario,
      documento_id,
      fecha: fechaNormalizada,
      periodo: periodoDeFecha(fechaNormalizada),
      id_ruta: rutaElegida.id_ruta,
      id_punto_venta: draft.id_punto_venta,
      id_punto_venta_dest: rutaElegida.id_punto_venta_dest || "",
      placa: draft.placa || null,
      licencia: draft.licencia || null,
      observacion: draft.observacion || null,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={cerrar}
      maxWidth={false}
      PaperProps={{
        sx: {
          position: "relative",
          width: { xs: "calc(100vw - 12px)", sm: 430 },
          maxWidth: "calc(100vw - 12px)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: palette.radius.modal,
          maxHeight: "calc(100vh - 16px)",
          overflow: "hidden",
        },
      }}
    >
      {/* header fijo: nunca scrollea */}
      <Box sx={{ p: { xs: 0.8, md: 1 }, pb: 0, flexShrink: 0 }}>
        <Box sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 0.75,
          mb: 0.7,
          flexWrap: "wrap",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <Box sx={{
              backgroundColor: palette.accentSoft,
              border: `1px solid ${palette.accent}`,
              color: palette.accent,
              width: 30,
              height: 30,
              borderRadius: palette.radius.control,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <ClipboardList size={16} />
            </Box>
            <Box>
              <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 800 }}>
                {modoCierre ? `Finalizar manifiesto ${manifiesto?.id_manifiesto || ""}` : "Manifiesto NUEVO"}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px", fontWeight: 700 }}>
                Hora automatica.
              </Typography>
            </Box>
          </Box>
          <IconButton
            disabled={guardando}
            onClick={cerrar}
            sx={{ color: palette.muted, order: { xs: 2, sm: 3 }, ml: "auto" }}
          >
            <X size={18} />
          </IconButton>
        </Box>
      </Box>

      {/* unico scroller del dialogo */}
      <Box sx={scrollSx}>
        <Box sx={compactSectionSx}>
          <SectionHeader icon={<MapPin size={15} />} title={`1. Fecha ${draft.fecha || "-"}`} />
          <Grid container columnSpacing={0.65} rowSpacing={0.35}>
            <Grid item xs={12}>
              <Field label="Destino" labelWidth={104}>
                <TrRutaSelect
                  value={draft.id_ruta}
                  onChange={(idRuta) => {
                    actualizar("id_ruta", idRuta);
                    const elegida = rutasConPasaje.find((r) => String(r.id_ruta) === String(idRuta));
                    if (elegida) {
                      actualizar("id_punto_venta", elegida.id_punto_venta || draft.id_punto_venta);
                    }
                    setError("");
                  }}
                  rutas={rutasConPasaje}
                  placeholder="Selecciona"
                />
              </Field>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ ...compactSectionSx, mt: 0.45 }}>
          <SectionHeader icon={<MapPin size={15} />} title="2. Vehiculo" />
          <Grid container columnSpacing={0.65} rowSpacing={0.35}>
            <Grid item xs={12}>
              <Field label="Placa" labelWidth={104}>
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
                  <IconButton
                    size="small"
                    onClick={() => setPlacaPickerOpen(true)}
                    title="Buscar placa"
                    sx={pickerIconSx}
                  >
                    <Truck />
                  </IconButton>
                  <CaptureInput
                    refs={focusableRefsManifiesto}
                    value={draft.placa}
                    onChange={(valor) => actualizar("placa", String(valor || "").toUpperCase())}
                    inputRef={placaRef}
                    nextRef={licenciaRef}
                    placeholder="ABC-123"
                    align="center"
                    onPlus={() => setPlacaPickerOpen(true)}
                    onEmptyEnter={() => setPlacaPickerOpen(true)}
                  />
                </Box>
              </Field>
            </Grid>

            <Grid item xs={12}>
              <Field label="Licencia" labelWidth={104}>
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
                  <IconButton
                    size="small"
                    onClick={() => setLicenciaPickerOpen(true)}
                    title="Buscar licencia"
                    sx={pickerIconSx}
                  >
                    <UserRound />
                  </IconButton>
                  <CaptureInput
                    refs={focusableRefsManifiesto}
                    value={draft.licencia}
                    onChange={(valor) => actualizar("licencia", String(valor || "").toUpperCase())}
                    inputRef={licenciaRef}
                    nextRef={observacionRef}
                    placeholder="Licencia del chofer"
                    onPlus={() => setLicenciaPickerOpen(true)}
                    onEmptyEnter={() => setLicenciaPickerOpen(true)}
                  />
                </Box>
              </Field>
            </Grid>

            <Grid item xs={12}>
              <Field label="Observacion" labelWidth={104}>
                <CaptureInput
                  refs={focusableRefsManifiesto}
                  value={draft.observacion}
                  onChange={(valor) => actualizar("observacion", String(valor || "").toUpperCase())}
                  inputRef={observacionRef}
                  nextRef={grabarRef}
                  placeholder="Detalle opcional"
                />
              </Field>
            </Grid>
          </Grid>
        </Box>

        {error && (
          <Typography sx={{ color: palette.danger, fontSize: "12px", mt: 0.85 }}>{error}</Typography>
        )}
      </Box>

      {/* footer fijo */}
      <Box sx={{
        mx: { xs: 0.7, md: 0.85 },
        mt: 0.25,
        pt: 0.7,
        flexShrink: 0,
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 0.65,
        alignItems: "center",
        borderTop: `1px solid ${palette.borderSoft}`,
      }}>
        <AppButton
          icon={<X size={18} />}
          onClick={cerrar}
          disabled={guardando}
          sx={accionSecundariaSx}
        >
          Cerrar
        </AppButton>
        <Box />
        <AppButton
          buttonRef={grabarRef}
          icon={<ClipboardList size={16} />}
          onClick={manejarSubmit}
          disabled={guardando}
          sx={{ ...accionPrincipalSx, justifySelf: "end" }}
        >
          {guardando ? "Guardando..." : modoCierre ? "Finalizar manifiesto" : "Crear"}
        </AppButton>
      </Box>

      <PlacaPickerModal
        open={placaPickerOpen}
        placas={placasDisponibles}
        onClose={() => setPlacaPickerOpen(false)}
        onSelect={seleccionarPlaca}
      />
      <LicenciaPickerModal
        open={licenciaPickerOpen}
        licencias={licenciasDisponibles}
        onClose={() => setLicenciaPickerOpen(false)}
        onSelect={seleccionarLicencia}
      />
    </Dialog>
  );
}
