import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Dialog, Grid, IconButton, InputBase, Typography } from "@mui/material";
import { ClipboardList, MapPin, Search, X } from "lucide-react";

import palette from "../../../../theme/palette";
import AppButton from "../../../ui/AppButton";
import {
  CaptureInput,
  Field,
  sectionSx,
} from "../encomienda/modal/TrEncomiendaModalInputs";
import { PuntoVentaField, RutaField } from "../encomienda/modal/TrEncomiendaModalFields";
import {
  FECHA_AAAA_MM_DD,
  emptyManifiesto,
  focusableRefsManifiesto,
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

function SectionHeader({ icon, title }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.55, mb: 0.32 }}>
      <Box sx={{ color: palette.accent, display: "flex" }}>{icon}</Box>
      <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 800 }}>{title}</Typography>
    </Box>
  );
}

// ===========================================================================
// Selector de ruta.
//
// NO reutiliza RutaPickerModal de encomienda: ese devuelve el objeto ruta completo
// con el contrato de mve_transventa (nombre_ruta, id_punto_venta_dest, ...), y el
// manifiesto solo necesita id_ruta, destino y nombre. Arrastrar el resto seria
// mandar campos que el manifiesto no usa.
//
// Mismo comportamiento que el de encomienda: busqueda por texto, flechas para
// mover el resaltado, Enter para elegir, y el resaltado arranca en 0 al escribir.
// ===========================================================================
function DialogoRuta({ open, rutas, onClose, onElegir }) {
  const [busqueda, setBusqueda] = useState("");
  const [indice, setIndice] = useState(0);
  const busquedaRef = useRef(null);

  useEffect(() => {
    if (open) {
      setBusqueda("");
      setIndice(0);
      window.setTimeout(() => {
        busquedaRef.current?.focus();
        busquedaRef.current?.select?.();
      }, 80);
    }
  }, [open]);

  useEffect(() => {
    setIndice(0);
  }, [busqueda]);

  const texto = String(busqueda || "").toLowerCase();
  const filtradas = rutas.filter((ruta) => (
    [ruta.nombre, ruta.nombre_ruta, ruta.id_punto_venta_dest, ruta.punto_venta_dest_nombre]
      .some((campo) => String(campo || "").toLowerCase().includes(texto))
  ));

  const indiceFinal = Math.min(indice, Math.max(0, filtradas.length - 1));

  const alTeclear = (event) => {
    if (!filtradas.length) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      setIndice(Math.min(indiceFinal + 1, filtradas.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      setIndice(Math.max(indiceFinal - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      if (filtradas[indiceFinal]) {
        onElegir(filtradas[indiceFinal]);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      onKeyDown={alTeclear}
      PaperProps={{
        sx: {
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: palette.radius.modal,
        },
      }}
    >
      <Box sx={{ p: 1.1 }}>
        <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 800, mb: 0.2 }}>
          Ruta del viaje
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: "11px", fontWeight: 700, mb: 0.8 }}>
          Solo las rutas con pasaje configurado
        </Typography>

        <Box sx={{
          minHeight: 30,
          px: 0.9,
          display: "flex",
          alignItems: "center",
          mb: 0.9,
          backgroundColor: palette.bg,
          border: `1px solid ${palette.border}`,
          borderRadius: palette.radius.control,
          "&:focus-within": { borderColor: palette.accent, backgroundColor: palette.surfaceAlt },
        }}>
          <Box sx={{ color: palette.muted, display: "flex", mr: 0.6 }}>
            <Search size={15} />
          </Box>
          <InputBase
            inputRef={busquedaRef}
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            onKeyDown={alTeclear}
            placeholder="Buscar por nombre o destino"
            autoFocus
            sx={{ color: palette.text, fontSize: "12.5px", width: "100%" }}
          />
        </Box>

        <Box sx={{ maxHeight: 360, overflowY: "auto", display: "grid", gap: 0.65 }}>
          {filtradas.length === 0 && (
            <Typography sx={{ color: palette.muted, fontSize: "12px", fontWeight: 700, p: 1 }}>
              Ninguna ruta coincide.
            </Typography>
          )}

          {filtradas.map((ruta, i) => {
            const resaltada = i === indiceFinal;
            return (
              <Box
                key={ruta.id_ruta}
                onClick={() => onElegir(ruta)}
                sx={{
                  p: 0.8,
                  cursor: "pointer",
                  borderRadius: palette.radius.listCard,
                  border: `1px solid ${resaltada ? palette.accent : palette.borderSoft}`,
                  backgroundColor: resaltada ? palette.accentSoft : palette.bg,
                  transition: "all .16s ease",
                  "&:hover": {
                    borderColor: palette.accent,
                    backgroundColor: palette.surfaceAlt,
                  },
                }}
              >
                <Typography sx={{ color: palette.text, fontSize: "12.5px", fontWeight: 800 }}>
                  {ruta.nombre || ruta.nombre_ruta || ruta.id_punto_venta_dest}
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: "11px", fontWeight: 700 }}>
                  {[ruta.punto_venta_dest_nombre || ruta.id_punto_venta_dest]
                    .concat(Number(ruta.precio_pasaje || 0) > 0
                      ? `  -  S/ ${Number(ruta.precio_pasaje).toFixed(2)}`
                      : [])
                    .filter(Boolean)
                    .join("")}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Dialog>
  );
}

export default function TrManifiestoModal({
  open,
  onClose,
  onCrear,
  id_usuario,
  documento_id,
  puntoVentaOrigen,
  rutasDisponibles = [],
  fechaServidor = "",
  guardando = false,
}) {
  const [draft, setDraft] = useState(emptyManifiesto);
  const [error, setError] = useState("");
  const [rutaPickerOpen, setRutaPickerOpen] = useState(false);

  const fechaRef = useRef(null);
  const rutaRef = useRef(null);
  const placaRef = useRef(null);
  const licenciaRef = useRef(null);
  const choferRef = useRef(null);
  const grabarRef = useRef(null);

  const actualizar = (campo, valor) => setDraft((prev) => ({ ...prev, [campo]: valor }));

  // Al abrir: la fecha la pone el servidor (no el reloj del navegador) y el origen
  // viene del filtro del panel. El manifiesto ES un viaje, asi que la fecha es
  // parte de su identidad: dos manifiestos del mismo dia son dos viajes distintos.
  useEffect(() => {
    if (open) {
      setDraft({
        ...emptyManifiesto(),
        fecha: fechaServidor,
        id_punto_venta: puntoVentaOrigen || "",
      });
      setError("");
      window.setTimeout(() => {
        fechaRef.current?.focus();
        fechaRef.current?.select?.();
      }, 80);
    }
  }, [open, fechaServidor, puntoVentaOrigen]);

  // Orden de las flechas: arriba/abajo sigue el orden visual del formulario.
  // Ver trManifiestoUtils para por que este array es propio y no el de encomienda.
  focusableRefsManifiesto.length = 0;
  focusableRefsManifiesto.push(fechaRef, rutaRef, placaRef, licenciaRef, choferRef, grabarRef);

  const rutaElegida = useMemo(
    () => rutasDisponibles.find((r) => String(r.id_ruta) === String(draft.id_ruta)) || null,
    [rutasDisponibles, draft.id_ruta]
  );

  const rutasConPasaje = useMemo(
    () => rutasDisponibles.filter((r) => Number(r.precio_pasaje || 0) > 0),
    [rutasDisponibles]
  );

  const cerrar = () => {
    setRutaPickerOpen(false);
    onClose();
  };

  const manejarSubmit = () => {
    if (guardando) {
      return;
    }

    if (!FECHA_AAAA_MM_DD.test(draft.fecha)) {
      setError("La fecha del viaje debe tener formato AAAA-MM-DD.");
      fechaRef.current?.focus();
      return;
    }

    if (!String(draft.id_punto_venta || "").trim()) {
      setError("No hay punto de venta de salida en el filtro del panel.");
      return;
    }

    if (!rutaElegida) {
      setError("Elige la ruta del viaje: de ella salen el destino y el precio.");
      rutaRef.current?.focus();
      return;
    }

    setError("");
    onCrear({
      id_usuario,
      documento_id,
      fecha: draft.fecha,
      periodo: periodoDeFecha(draft.fecha),
      id_punto_venta: draft.id_punto_venta,
      id_punto_venta_dest: rutaElegida.id_punto_venta_dest || "",
      ruta_nombre: rutaElegida.nombre || rutaElegida.nombre_ruta || "",
      placa: draft.placa || null,
      licencia: draft.licencia || null,
      chofer: draft.chofer || null,
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
                Manifiesto NUEVO
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px", fontWeight: 700 }}>
                Datos del viaje. Los pasajeros se suman despues.
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
          <SectionHeader icon={<MapPin size={15} />} title="1. Viaje" />
          <Grid container columnSpacing={0.65} rowSpacing={0.35}>
            <Grid item xs={12}>
              <Field label="Fecha" labelWidth={104} controlHeight={40}>
                <CaptureInput
                  refs={focusableRefsManifiesto}
                  value={draft.fecha}
                  onChange={(valor) => {
                    actualizar("fecha", valor);
                    if (FECHA_AAAA_MM_DD.test(valor)) {
                      setError("");
                    }
                  }}
                  inputRef={fechaRef}
                  nextRef={rutaRef}
                  placeholder="AAAA-MM-DD"
                  align="center"
                  prominent
                  prominentSize="17px"
                />
              </Field>
            </Grid>

            <Grid item xs={12}>
              <Field label="Origen" labelWidth={104}>
                <PuntoVentaField value={puntoVentaOrigen} />
              </Field>
            </Grid>

            <Grid item xs={12}>
              <Field label="Ruta" labelWidth={104}>
                <RutaField
                  refs={focusableRefsManifiesto}
                  ruta={rutaElegida}
                  inputRef={rutaRef}
                  onOpen={() => setRutaPickerOpen(true)}
                  onChange={() => {}}
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
                <CaptureInput
                  refs={focusableRefsManifiesto}
                  value={draft.placa}
                  onChange={(valor) => actualizar("placa", String(valor || "").toUpperCase())}
                  inputRef={placaRef}
                  nextRef={licenciaRef}
                  placeholder="ABC-123"
                  align="center"
                />
              </Field>
            </Grid>

            <Grid item xs={12}>
              <Field label="Licencia" labelWidth={104}>
                <CaptureInput
                  refs={focusableRefsManifiesto}
                  value={draft.licencia}
                  onChange={(valor) => actualizar("licencia", String(valor || "").toUpperCase())}
                  inputRef={licenciaRef}
                  nextRef={choferRef}
                  placeholder="Licencia del chofer"
                />
              </Field>
            </Grid>

            <Grid item xs={12}>
              <Field label="Chofer" labelWidth={104}>
                <CaptureInput
                  refs={focusableRefsManifiesto}
                  value={draft.chofer}
                  onChange={(valor) => actualizar("chofer", String(valor || "").toUpperCase())}
                  inputRef={choferRef}
                  nextRef={grabarRef}
                  placeholder="Nombre del chofer"
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
          {guardando ? "Guardando..." : "Crear"}
        </AppButton>
      </Box>

      {rutaPickerOpen && (
        <DialogoRuta
          open={rutaPickerOpen}
          rutas={rutasConPasaje}
          onClose={() => setRutaPickerOpen(false)}
          onElegir={(ruta) => {
            actualizar("id_ruta", ruta.id_ruta);
            setRutaPickerOpen(false);
            window.setTimeout(() => placaRef.current?.focus(), 60);
          }}
        />
      )}
    </Dialog>
  );
}
