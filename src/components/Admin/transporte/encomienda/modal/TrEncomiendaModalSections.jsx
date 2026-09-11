import React from "react";
import { Box, Grid, IconButton, Typography } from "@mui/material";
import { Package, Search, UserRound } from "lucide-react";

import palette from "../../../../../theme/palette";
import {
  LicenciaField,
  PlacaField,
  PuntoVentaField,
  RutaField,
  ZonaField,
} from "./TrEncomiendaModalFields";
import {
  CaptureInput,
  ChoiceGroup,
  Field,
  MoneyStepper,
  MultilineCapture,
  SectionHeader,
  searchIconButtonSx,
  sectionSx,
} from "./TrEncomiendaModalInputs";
import {
  comprobanteDesdeDocumento,
  documentoTipoDesdeNumero,
} from "./trEncomiendaModalUtils";

export default function TrEncomiendaModalSections({
  draft,
  error,
  rutaSeleccionada,
  origenVisual,
  updateDraft,
  limpiarRuta,
  buscarRemitente,
  buscarDestinatario,
  abrirClonePicker,
  setRutaPickerOpen,
  setZonaPickerOpen,
  setPlacaPickerOpen,
  setLicenciaPickerOpen,
  buscandoRemitente,
  buscandoDestinatario,
  refs,
}) {
  const remitenteEsEmpresa = String(draft.cliente_documento || "").replace(/\D/g, "").length === 11;
  const mostrarDireccionRemitente = draft.remitente_entrega === "CLIENTE";

  return (
    <Box sx={{ px: { xs: 0.8, md: 1 }, pb: 0.75, overflowY: "auto" }}>
      <SectionHeader icon={<UserRound size={15} />} title="1. Origen" />
      <Box sx={sectionSx}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={mostrarDireccionRemitente ? 4 : 9}>
            {/* Origen automatico desde el punto de venta operativo seleccionado antes de nueva encomienda. */}
            <Field label="Origen" labelWidth={58}>
              <PuntoVentaField value={origenVisual} />
            </Field>
          </Grid>
          <Grid item xs={12} md={mostrarDireccionRemitente ? 2 : 3}>
            <Field label="" labelWidth={0}>
              <Box sx={{ width: 142, maxWidth: "100%", display: "flex" }}>
                <ChoiceGroup
                  compact
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
              <Grid item xs={12} md={2.4}>
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
              <Grid item xs={12} md={3.2}>
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
                  inputRef={refs.remitenteDocRef}
                  nextRef={draft.cliente ? refs.remitenteTelefonoRef : refs.remitenteNombreRef}
                  placeholder="Documento"
                  align="right"
                  onPlus={buscarRemitente}
                  onF3={abrirClonePicker}
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
              <CaptureInput value={draft.cliente} onChange={(value) => updateDraft("cliente", String(value || "").toUpperCase())} inputRef={refs.remitenteNombreRef} nextRef={refs.remitenteTelefonoRef} placeholder="Remitente" />
            </Field>
          </Grid>
          <Grid item xs={12} md={3}>
            <Field label="Telefono">
              <CaptureInput value={draft.cliente_telefono} onChange={(value) => updateDraft("cliente_telefono", value)} inputRef={refs.remitenteTelefonoRef} nextRef={remitenteEsEmpresa ? refs.clienteDireccionFactRef : refs.rutaRef} placeholder="Celular" />
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
      <Box sx={sectionSx}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={draft.destinatario_entrega === "CLIENTE" ? 4 : 9}>
            {/* Destino se escoge desde rutas; se conserva id_ruta para guardar la operacion. */}
            <Field label="Destino" labelWidth={58}>
              <RutaField
                ruta={rutaSeleccionada || (draft.id_ruta ? {
                  id_ruta: draft.id_ruta,
                  id_punto_venta_dest: draft.id_punto_venta_dest,
                  punto_venta_dest_nombre: draft.punto_venta_dest_nombre,
                } : null)}
                onChange={limpiarRuta}
                onOpen={() => setRutaPickerOpen(true)}
                inputRef={refs.rutaRef}
                nextRef={refs.destinatarioEntregaRef}
              />
            </Field>
          </Grid>
          <Grid item xs={12} md={draft.destinatario_entrega === "CLIENTE" ? 2 : 3}>
            <Field label="" labelWidth={0}>
              <Box sx={{ width: 142, maxWidth: "100%", display: "flex" }}>
                <ChoiceGroup
                  compact
                  value={draft.destinatario_entrega}
                  inputRef={refs.destinatarioEntregaRef}
                  nextRef={draft.destinatario_entrega === "CLIENTE" ? refs.destinatarioZonaRef : refs.destinatarioDocRef}
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
              <Grid item xs={12} md={2.4}>
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
              <Grid item xs={12} md={3.2}>
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
          <Grid item xs={12} md={3}>
            <Field label="DNI">
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
                <CaptureInput
                  value={draft.destinatario_documento}
                  onChange={(value) => updateDraft("destinatario_documento", value)}
                  inputRef={refs.destinatarioDocRef}
                  nextRef={draft.destinatario ? refs.destinatarioTelefonoRef : refs.destinatarioNombreRef}
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
              <CaptureInput value={draft.destinatario} onChange={(value) => updateDraft("destinatario", String(value || "").toUpperCase())} inputRef={refs.destinatarioNombreRef} nextRef={refs.destinatarioTelefonoRef} placeholder="Destinatario" />
            </Field>
          </Grid>
          <Grid item xs={12} md={3}>
            <Field label="Telefono">
              <CaptureInput value={draft.destinatario_telefono} onChange={(value) => updateDraft("destinatario_telefono", value)} inputRef={refs.destinatarioTelefonoRef} nextRef={refs.descripcionRef} placeholder="Celular" />
            </Field>
          </Grid>
        </Grid>
      </Box>

      <SectionHeader icon={<Package size={15} />} title="3. Encomienda, pago y unidad" />
      <Box sx={sectionSx}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={8}>
            <Typography sx={{ color: palette.muted, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", mb: 0.35 }}>
              Descripcion encomienda
            </Typography>
            <MultilineCapture
              value={draft.descripcion}
              onChange={(value) => updateDraft("descripcion", String(value || "").toUpperCase())}
              inputRef={refs.descripcionRef}
              nextRef={refs.condicionPagoRef}
              placeholder="Paquete, sobre, caja..."
              minRows={5}
              minHeight={207}
            />
          </Grid>
          <Grid item xs={12} md={4} sx={{ mt: { md: "17px" } }}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Field label="" tall labelWidth={0}>
                  <ChoiceGroup
                    value={draft.condicion_pago}
                    inputRef={refs.condicionPagoRef}
                    nextRef={refs.totalRef}
                    onChange={(value) => updateDraft("condicion_pago", value)}
                    options={[
                      { value: "PAGADO", label: "PAGADO" },
                      { value: "POR_COBRAR", label: "POR COBRAR" },
                    ]}
                  />
                </Field>
              </Grid>
              <Grid item xs={12}>
                <Field label="Total S/" tall>
                  <MoneyStepper
                    value={draft.r_monto_total}
                    onChange={(value) => updateDraft("r_monto_total", value)}
                    inputRef={refs.totalRef}
                    nextRef={refs.llegadaRef}
                  />
                </Field>
              </Grid>
              <Grid item xs={12}>
                <Field label="Llegada aprox." tall>
                  <CaptureInput value={draft.llegada_aprox} onChange={(value) => updateDraft("llegada_aprox", value)} inputRef={refs.llegadaRef} nextRef={refs.placaRef} align="center" />
                </Field>
              </Grid>
              <Grid item xs={12}>
                <Field label="" labelWidth={0}>
                  {/* Placa admite escritura manual; + o camion abren el catalogo mve_transplaca. */}
                  <PlacaField
                    value={draft.placa}
                    onChange={(value) => updateDraft("placa", value)}
                    onOpen={() => setPlacaPickerOpen(true)}
                    inputRef={refs.placaRef}
                    nextRef={refs.choferRef}
                  />
                </Field>
              </Grid>
              <Grid item xs={12}>
                <Field label="" labelWidth={0}>
                  {/* Licencia admite escritura manual; + o usuario abren el catalogo mve_translicencia. */}
                  <LicenciaField
                    value={draft.licencia}
                    onChange={(value) => updateDraft("licencia", value)}
                    onOpen={() => setLicenciaPickerOpen(true)}
                    inputRef={refs.choferRef}
                    nextRef={refs.grabarRef}
                  />
                </Field>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Typography sx={{ color: palette.danger, fontSize: "12px", mt: 0.85 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
