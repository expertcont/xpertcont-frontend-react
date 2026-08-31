"use client";

import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import { Package, Save, X } from "lucide-react";
import swal2 from "sweetalert2";

import AppButton from "../../../../ui/AppButton";
import AppIconBox from "../../../../ui/AppIconBox";
import palette from "../../../../../theme/palette";
import crearTicketEncomiendaPdf from "./TrEncomiendaTicketPdf";
import TrEncomiendaModalClone from "./TrEncomiendaModalClone";
import TrEncomiendaModalSections from "./TrEncomiendaModalSections";
import {
  LicenciaPickerModal,
  PlacaPickerModal,
  RutaPickerModal,
  ZonaPickerModal,
} from "./TrEncomiendaModalPickers";
import {
  comprobanteDesdeDocumento,
  crearDraft,
  documentoTipoDesdeNumero,
  focusableRefs,
  normalizarCondicionPago,
  textoBusquedaClone,
  toTimePlusHours,
} from "./trEncomiendaModalUtils";

export default function TrEncomiendaModal({
  open,
  back_host,
  idAnfitrion,
  documentoId,
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
  const [clonePickerOpen, setClonePickerOpen] = useState(false);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [cloneRows, setCloneRows] = useState([]);
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

  const cargarEncomiendasClonables = async () => {
    if (!idAnfitrion || !documentoId) {
      setCloneRows([]);
      return;
    }

    setCloneLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "80");
      if (puntoVentaOrigen) {
        params.set("id_punto_venta", puntoVentaOrigen);
      }

      const response = await fetch(`${back_host}/mve_transventa/encomienda/clonar/${periodoTrabajo}/${idAnfitrion}/${documentoId}?${params.toString()}`);
      const result = await response.json();
      const rows = (Array.isArray(result?.data) ? result.data : [])
        .sort((a, b) => String(b.r_fecemi || "").localeCompare(String(a.r_fecemi || "")))
        .map((item) => ({
          ...item,
          _cloneText: textoBusquedaClone(item),
        }));

      setCloneRows(rows);
    } catch (error) {
      console.log("Error cargando encomiendas para clonar:", error);
      setCloneRows([]);
    } finally {
      setCloneLoading(false);
    }
  };

  const abrirClonePicker = () => {
    if (esEdicion) {
      return;
    }

    setClonePickerOpen(true);
    cargarEncomiendasClonables();
  };

  const clonarEncomienda = (item) => {
    const clienteDocumento = item.cliente_documento || item.cliente_documento_id || "";
    const destinatarioDocumento = item.destinatario_documento || item.destinatario_documento_id || "";
    const remitenteTieneDireccion = Boolean(item.remitente_direccion || item.cliente_direccion || item.cliente_zona);
    const destinatarioTieneDireccion = Boolean(item.destinatario_direccion || item.destinatario_zona);

    setDraft((prev) => ({
      ...prev,
      tipo_operacion: "E",
      r_cod: comprobanteDesdeDocumento(clienteDocumento).r_cod,
      r_numero: "",
      id_documento: item.id_documento || item.cliente_id_doc || documentoTipoDesdeNumero(clienteDocumento),
      cliente: item.cliente || "",
      cliente_documento: clienteDocumento,
      cliente_telefono: item.cliente_telefono || "",
      remitente_entrega: remitenteTieneDireccion ? "CLIENTE" : "OFICINA",
      remitente_zona: item.remitente_zona || item.cliente_zona || "",
      remitente_direccion: item.remitente_direccion || item.cliente_direccion || "",
      destinatario: item.destinatario || "",
      destinatario_documento: destinatarioDocumento,
      destinatario_telefono: item.destinatario_telefono || "",
      destinatario_entrega: destinatarioTieneDireccion ? "CLIENTE" : "OFICINA",
      destinatario_zona: item.destinatario_zona || "",
      destinatario_direccion: item.destinatario_direccion || "",
      id_ruta: item.id_ruta || "",
      id_punto_venta: item.id_punto_venta || puntoVentaOrigen || "",
      id_punto_venta_dest: item.id_punto_venta_dest || "",
      placa: item.placa || "",
      licencia: item.licencia || "",
      descripcion: String(item.descripcion || "").toUpperCase(),
      r_monto_total: item.r_monto_total || item.precio_neto || "",
      condicion_pago: normalizarCondicionPago(item.condicion_pago || item.numero_rdi),
      llegada_aprox: prev.llegada_aprox || toTimePlusHours(2),
    }));
    setClonePickerOpen(false);
    window.setTimeout(() => {
      grabarRef.current?.focus();
    }, 80);
  };

  const rutaSeleccionada = rutasDisponibles.find((ruta) => ruta.id_ruta === draft.id_ruta);
  const origenVisual = puntoVentaOrigenNombre || draft.id_punto_venta || puntoVentaOrigen;
  const esFactura = (operacion?.r_cod || draft.r_cod) === "01";
  const tipoComprobanteTexto = esFactura ? "Factura" : "Boleta";
  const textoBotonGuardar = esEdicion
    ? `Actualizar ${tipoComprobanteTexto}`
    : `${esFactura ? "Grabar" : "Guardar"} ${tipoComprobanteTexto}`;
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

  const imprimirTicketModelo = async () => {
    const ticketWindow = window.open("about:blank", "_blank");

    try {
      ticketWindow?.document?.write("<p style=\"font-family:Arial,sans-serif;color:#334155\">Generando ticket...</p>");

      const comprobante = comprobanteDesdeDocumento(draft.cliente_documento);
      const total = Math.round(Number(draft.r_monto_total || 0));
      const entregaRemitenteEnOficina = draft.remitente_entrega === "OFICINA";
      const entregaDestinatarioEnOficina = draft.destinatario_entrega === "OFICINA";
      const clienteZonaFinal = entregaRemitenteEnOficina ? "" : draft.remitente_zona;
      const clienteDireccionFinal = entregaRemitenteEnOficina ? "" : draft.remitente_direccion;
      const destinatarioDireccionFinal = entregaDestinatarioEnOficina ? "" : draft.destinatario_direccion;
      const url = await crearTicketEncomiendaPdf({
        encomienda: {
          ...draft,
          r_cod: operacion?.r_cod || comprobante.r_cod,
          r_serie: operacion?.r_serie || draft.r_serie,
          r_numero: operacion?.r_numero || draft.r_numero,
          cliente_id_doc: documentoTipoDesdeNumero(draft.cliente_documento),
          cliente_documento_id: draft.cliente_documento,
          cliente_zona: clienteZonaFinal,
          cliente_direccion: clienteDireccionFinal,
          destinatario_id_doc: documentoTipoDesdeNumero(draft.destinatario_documento),
          destinatario_documento_id: draft.destinatario_documento,
          destinatario_direccion: destinatarioDireccionFinal,
          precio_neto: total,
          r_monto_total: total,
        },
        empresa: {
          nombre: sessionStorage.getItem("contabilidad_nombre") || "",
        },
      });

      if (ticketWindow) {
        ticketWindow.location.href = url;
      } else {
        window.open(url, "_blank");
      }
    } catch (error) {
      ticketWindow?.close();
      swal2.fire({
        title: "No se pudo generar el ticket",
        text: error.message || "Revisa los datos de la encomienda e intenta nuevamente.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
        color: palette.text,
        background: palette.surface,
      });
    }
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

      <TrEncomiendaModalSections
        draft={draft}
        error={error}
        rutaSeleccionada={rutaSeleccionada}
        origenVisual={origenVisual}
        updateDraft={updateDraft}
        limpiarRuta={limpiarRuta}
        buscarRemitente={buscarRemitente}
        buscarDestinatario={buscarDestinatario}
        abrirClonePicker={abrirClonePicker}
        setRutaPickerOpen={setRutaPickerOpen}
        setZonaPickerOpen={setZonaPickerOpen}
        setPlacaPickerOpen={setPlacaPickerOpen}
        setLicenciaPickerOpen={setLicenciaPickerOpen}
        buscandoRemitente={buscandoRemitente}
        buscandoDestinatario={buscandoDestinatario}
        refs={{
          remitenteDocRef,
          remitenteNombreRef,
          remitenteTelefonoRef,
          remitenteEntregaRef,
          remitenteZonaRef,
          remitenteDireccionRef,
          destinatarioDocRef,
          destinatarioNombreRef,
          destinatarioTelefonoRef,
          destinatarioEntregaRef,
          destinatarioZonaRef,
          destinatarioDireccionRef,
          rutaRef,
          placaRef,
          choferRef,
          descripcionRef,
          totalRef,
          condicionPagoRef,
          llegadaRef,
          grabarRef,
        }}
      />

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
          <AppButton onClick={imprimirTicketModelo}>Imprimir encomienda</AppButton>
          <AppButton buttonRef={grabarRef} icon={<Save size={16} />} onClick={handleSubmit} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 700, fontSize: "13px" }}>
            {textoBotonGuardar}
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
      <TrEncomiendaModalClone
        open={clonePickerOpen}
        loading={cloneLoading}
        rows={cloneRows}
        initialSearch={draft.cliente_documento}
        onClose={() => setClonePickerOpen(false)}
        onSelect={clonarEncomienda}
      />
    </Dialog>
  );
}
