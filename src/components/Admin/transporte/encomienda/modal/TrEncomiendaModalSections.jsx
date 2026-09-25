import React from "react";
import { Box, Grid, IconButton, Typography } from "@mui/material";
import { Package, Search, UserRound } from "lucide-react";

import palette from "../../../../../theme/palette";
import {
  PlacaField,
  RutaField,
  ZonaField,
} from "./TrEncomiendaModalFields";
import {
  CaptureInput,
  ChoiceGroup,
  Field,
  MoneyStepper,
  SectionHeader,
  searchIconButtonSx,
  sectionSx,
} from "./TrEncomiendaModalInputs";
import {
  comprobanteDesdeDocumento,
  documentoTipoDesdeNumero,
} from "./trEncomiendaModalUtils";
import TimeWheelPicker from "./TimeWheelPicker";

const compactSectionSx = {
  ...sectionSx,
  p: { xs: 0.35, md: 0.4 },
};

export default function TrEncomiendaModalSections({
  draft,
  error,
  esEdicion,
  rutaSeleccionada,
  updateDraft,
  limpiarRuta,
  buscarRemitente,
  buscarDestinatario,
  abrirClonePicker,
  setRutaPickerOpen,
  setZonaPickerOpen,
  setPlacaPickerOpen,
  buscandoRemitente,
  buscandoDestinatario,
  soloLectura = false,
  refs,
}) {
  const remitenteEsEmpresa = String(draft.cliente_documento || "").replace(/\D/g, "").length === 11;
  const mostrarDireccionRemitente = draft.remitente_entrega === "CLIENTE";
  const rutaEdicion = draft.id_ruta ? {
    id_ruta: draft.id_ruta,
    nombre: draft.nombre_ruta || draft.rutaLabel || "",
    id_punto_venta_dest: draft.id_punto_venta_dest,
    punto_venta_dest_nombre: draft.punto_venta_dest_nombre,
  } : null;
  const rutaVisual = esEdicion ? (rutaEdicion || rutaSeleccionada) : (rutaSeleccionada || rutaEdicion);

  return (
    <Box
      sx={{
        px: { xs: 0.7, md: 0.85 },
        pb: 0.75,
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: `${palette.border} ${palette.overlaySoft}`,
        "&::-webkit-scrollbar": {
          width: 8,
        },
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
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: palette.accent,
        },
      }}
    >
      {soloLectura && (
        <Typography
          sx={{
            color: palette.success,
            backgroundColor: "rgba(121,171,143,0.09)",
            border: "1px solid rgba(121,171,143,0.24)",
            borderRadius: palette.radius.control,
            px: 1,
            py: 0.7,
            mb: 0.75,
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          Encomienda protegida: puedes visualizar e imprimir, pero no modificar los datos.
        </Typography>
      )}
      <Box sx={soloLectura ? { pointerEvents: "none", opacity: 0.82 } : undefined}>
      <SectionHeader icon={<UserRound size={15} />} title="1. Origen" />
      <Box sx={compactSectionSx}>
        <Grid container columnSpacing={0.65} rowSpacing={0.35}>
          <Grid item xs={12}>
            <Field label="" labelWidth={0}>
              <Box sx={{ width: "100%", display: "flex" }}>
                <ChoiceGroup
                  value={draft.remitente_entrega}
                  inputRef={refs.remitenteEntregaRef}
                  nextRef={mostrarDireccionRemitente ? refs.remitenteZonaRef : refs.remitenteDocRef}
                  onChange={(value) => {
                    updateDraft("remitente_entrega", value);
                    if (value === "OFICINA") {
                      updateDraft("remitente_zona", "");
                      updateDraft("remitente_direccion", "");
                    }
                  }}
                />
              </Box>
            </Field>
          </Grid>
          {mostrarDireccionRemitente && (
            <>
              <Grid item xs={12}>
                <Field label="Zona">
                  {/* Zonas filtradas por id_punto_venta de origen; se guarda nombre de zona. */}
                  <ZonaField
                    value={draft.remitente_zona}
                    onClear={() => updateDraft("remitente_zona", "")}
                    onOpen={() => setZonaPickerOpen("remitente")}
                    inputRef={refs.remitenteZonaRef}
                    nextRef={refs.remitenteDireccionRef}
                    placeholder="Escoger zona"
                  />
                </Field>
              </Grid>
              <Grid item xs={12}>
                <Field label="Direccion">
                  <CaptureInput
                    value={draft.remitente_direccion}
                    onChange={(value) => updateDraft("remitente_direccion", String(value || "").toUpperCase())}
                    inputRef={refs.remitenteDireccionRef}
                    nextRef={refs.remitenteDocRef}
                    placeholder="Direccion si envia desde casa"
                  />
                </Field>
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <Field label="DNI / RUC" labelWidth={58} controlHeight={40}>
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
                <IconButton
                  size="small"
                  onClick={buscarRemitente}
                  disabled={buscandoRemitente}
                  sx={{
                    ...searchIconButtonSx,
                    width: 34,
                    height: 34,
                    color: buscandoRemitente ? palette.muted : palette.accent,
                  }}
                >
                  <Search />
                </IconButton>
                <CaptureInput
                  value={draft.cliente_documento}
                  onChange={(value) => {
                    updateDraft("cliente_documento", value);
                    updateDraft("id_documento", documentoTipoDesdeNumero(value));
                    updateDraft("r_cod", comprobanteDesdeDocumento(value).r_cod);
                  }}
                  inputRef={refs.remitenteDocRef}
                  nextRef={draft.cliente ? refs.remitenteTelefonoRef : refs.remitenteNombreRef}
                  placeholder="Documento"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  align="right"
                  prominent
                  onPlus={buscarRemitente}
                  onF3={abrirClonePicker}
                />
              </Box>
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="Nombres / R.Social">
              <CaptureInput value={draft.cliente} onChange={(value) => updateDraft("cliente", String(value || "").toUpperCase())} inputRef={refs.remitenteNombreRef} nextRef={refs.remitenteTelefonoRef} placeholder="Remitente" />
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="Telefono" labelWidth={53}>
              <CaptureInput value={draft.cliente_telefono} onChange={(value) => updateDraft("cliente_telefono", value)} inputRef={refs.remitenteTelefonoRef} nextRef={remitenteEsEmpresa ? refs.clienteDireccionFactRef : refs.rutaRef} placeholder="Celular" inputMode="numeric" pattern="[0-9]*" />
            </Field>
          </Grid>
          {remitenteEsEmpresa && (
            <Grid item xs={12}>
              <Field label="Dir Facturacion" labelWidth={92}>
                <CaptureInput
                  value={draft.cliente_direccion_fact}
                  onChange={(value) => updateDraft("cliente_direccion_fact", String(value || "").toUpperCase())}
                  inputRef={refs.clienteDireccionFactRef}
                  nextRef={refs.rutaRef}
                  placeholder="Direccion fiscal del RUC"
                />
              </Field>
            </Grid>
          )}
        </Grid>
      </Box>

      <SectionHeader icon={<UserRound size={15} />} title="2. Destino" />
      <Box sx={compactSectionSx}>
        <Grid container columnSpacing={0.65} rowSpacing={0.35}>
          <Grid item xs={12}>
            {/* Destino se escoge desde rutas; se conserva id_ruta para guardar la operacion. */}
            <Field label="Destino" labelWidth={58}>
              <RutaField
                ruta={rutaVisual}
                onChange={limpiarRuta}
                onOpen={() => setRutaPickerOpen(true)}
                inputRef={refs.rutaRef}
                nextRef={refs.destinatarioEntregaRef}
              />
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="" labelWidth={0}>
              <Box sx={{ width: "100%", display: "flex" }}>
                <ChoiceGroup
                  value={draft.destinatario_entrega}
                  inputRef={refs.destinatarioEntregaRef}
                  nextRef={draft.destinatario_entrega === "CLIENTE" ? refs.destinatarioZonaRef : refs.destinatarioDocRef}
                  options={[
                    { value: "OFICINA", label: "OFICINA" },
                    { value: "CLIENTE", label: "DOMICILIO" },
                  ]}
                  onChange={(value) => {
                    updateDraft("destinatario_entrega", value);
                    if (value === "OFICINA") {
                      updateDraft("destinatario_zona", "");
                      updateDraft("destinatario_direccion", "");
                    }
                  }}
                />
              </Box>
            </Field>
          </Grid>
          {draft.destinatario_entrega === "CLIENTE" && (
            <>
              <Grid item xs={12}>
                <Field label="Zona">
                  {/* Zonas filtradas por id_punto_venta_dest de la ruta elegida; se guarda nombre de zona. */}
                  <ZonaField
                    value={draft.destinatario_zona}
                    onClear={() => updateDraft("destinatario_zona", "")}
                    onOpen={() => setZonaPickerOpen("destinatario")}
                    inputRef={refs.destinatarioZonaRef}
                    nextRef={refs.destinatarioDireccionRef}
                    placeholder="Escoger zona"
                  />
                </Field>
              </Grid>
              <Grid item xs={12}>
                <Field label="Direccion">
                  <CaptureInput
                    value={draft.destinatario_direccion}
                    onChange={(value) => updateDraft("destinatario_direccion", String(value || "").toUpperCase())}
                    inputRef={refs.destinatarioDireccionRef}
                    nextRef={refs.destinatarioDocRef}
                    placeholder="Direccion si recibe en casa"
                  />
                </Field>
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <Field label="DNI" labelWidth={58} controlHeight={40}>
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
                <IconButton
                  size="small"
                  onClick={buscarDestinatario}
                  disabled={buscandoDestinatario}
                  sx={{
                    ...searchIconButtonSx,
                    width: 34,
                    height: 34,
                    color: buscandoDestinatario ? palette.muted : palette.accent,
                  }}
                >
                  <Search />
                </IconButton>
                <CaptureInput
                  value={draft.destinatario_documento}
                  onChange={(value) => updateDraft("destinatario_documento", value)}
                  inputRef={refs.destinatarioDocRef}
                  nextRef={draft.destinatario ? refs.destinatarioTelefonoRef : refs.destinatarioNombreRef}
                  placeholder="Documento"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  align="right"
                  prominent
                  onPlus={buscarDestinatario}
                />
              </Box>
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="NOMBRES APELLIDOS">
              <CaptureInput value={draft.destinatario} onChange={(value) => updateDraft("destinatario", String(value || "").toUpperCase())} inputRef={refs.destinatarioNombreRef} nextRef={refs.destinatarioTelefonoRef} placeholder="Destinatario" />
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="Telefono" labelWidth={53}>
              <CaptureInput value={draft.destinatario_telefono} onChange={(value) => updateDraft("destinatario_telefono", value)} inputRef={refs.destinatarioTelefonoRef} nextRef={refs.descripcionRef} placeholder="Celular" inputMode="numeric" pattern="[0-9]*" />
            </Field>
          </Grid>
        </Grid>
      </Box>

      <SectionHeader icon={<Package size={15} />} title="3. Encomienda" />
      <Box sx={compactSectionSx}>
        <Grid container columnSpacing={0.65} rowSpacing={0.35}>
          <Grid item xs={12}>
            <Field label="Descripcion" labelWidth={82}>
              <CaptureInput
                value={draft.descripcion}
                onChange={(value) => updateDraft("descripcion", String(value || "").toUpperCase())}
                inputRef={refs.descripcionRef}
                nextRef={refs.totalRef}
                placeholder="Paquete, sobre, caja..."
              />
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="Total S/" controlHeight={40}>
              <MoneyStepper
                value={draft.r_monto_total}
                onChange={(value) => updateDraft("r_monto_total", value)}
                inputRef={refs.totalRef}
                nextRef={refs.condicionPagoRef}
                prominent
                align="center"
                tone={draft.condicion_pago === "POR_COBRAR" ? "warning" : "default"}
              />
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="" tall labelWidth={0}>
              <ChoiceGroup
                value={draft.condicion_pago}
                inputRef={refs.condicionPagoRef}
                nextRef={refs.llegadaRef}
                onChange={(value) => updateDraft("condicion_pago", value)}
                options={[
                  { value: "PAGADO", label: "PAGADO" },
                  { value: "POR_COBRAR", label: "POR COBRAR" },
                ]}
              />
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="" labelWidth={0} plain>
              <TimeWheelPicker
                value={draft.llegada_aprox}
                onChange={(value) => updateDraft("llegada_aprox", value)}
                inputRef={refs.llegadaRef}
                nextRef={refs.placaRef}
                minuteStep={5}
                label="Hora de llegada"
              />
            </Field>
          </Grid>
          <Grid item xs={6}>
            <Field label="" labelWidth={0}>
              {/* Placa admite escritura manual; + o camion abren el catalogo mve_transplaca. */}
              <PlacaField
                value={draft.placa}
                onChange={(value) => updateDraft("placa", value)}
                onOpen={() => setPlacaPickerOpen(true)}
                inputRef={refs.placaRef}
                nextRef={refs.precioChoferRef}
              />
            </Field>
          </Grid>
          <Grid item xs={6}>
            <Field icon={(
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                <UserRound size={15} />
                <Typography component="span" sx={{ fontSize: "10px", fontWeight: 800, lineHeight: 1 }}>
                  S/
                </Typography>
              </Box>
            )} label="" labelWidth={0}>
              <MoneyStepper
                value={draft.precio_chofer}
                onChange={(value) => updateDraft("precio_chofer", value)}
                inputRef={refs.precioChoferRef}
                nextRef={refs.grabarRef}
                align="center"
              />
            </Field>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Typography sx={{ color: palette.danger, fontSize: "12px", mt: 0.85 }}>
          {error}
        </Typography>
      )}
      </Box>
    </Box>
  );
}
