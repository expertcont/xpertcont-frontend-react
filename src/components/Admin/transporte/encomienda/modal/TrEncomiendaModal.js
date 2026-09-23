"use client";

import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, InputBase, Popover, Typography } from "@mui/material";
import { CalendarDays, CheckCircle, ClipboardCopy, MessageCircle, Package, Save, Ticket, X } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import swal2 from "sweetalert2";

import AppButton from "../../../../ui/AppButton";
import AppIconBox from "../../../../ui/AppIconBox";
import palette from "../../../../../theme/palette";
import TrEncomiendaModalClone from "./TrEncomiendaModalClone";
import TrEncomiendaModalSections from "./TrEncomiendaModalSections";
import crearTicketEncomiendaPdf from "./TrEncomiendaTicketPdf";
import crearTicketEncomiendaTributarioPdf from "./TrEncomiendaTicketTributarioPdf";
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

const DESCARGAS_TICKET_BASE_URL = "https://xpertcont-backend-js-production-50e6.up.railway.app/descargas/";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const direccionEmpresa = (datos = {}) => (
  datos.direccion ||
  datos.domicilio_fiscal ||
  datos.direccion_fiscal ||
  datos.domicilio ||
  datos.direccion_completa ||
  ""
);

const withTimeout = (promise, timeoutMs, message) => new Promise((resolve, reject) => {
  const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  promise
    .then(resolve)
    .catch(reject)
    .finally(() => window.clearTimeout(timer));
});

const pdfBlobToPngBlob = async (pdfBlob) => {
  const pdfData = await pdfBlob.arrayBuffer();
  const pdf = await withTimeout(
    pdfjsLib.getDocument({ data: pdfData }).promise,
    8000,
    "No se pudo leer el PDF del ticket."
  );
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await withTimeout(
    page.render({ canvasContext: context, viewport }).promise,
    8000,
    "No se pudo convertir el ticket a imagen."
  );

  return withTimeout(new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("No se pudo convertir el ticket a imagen."));
    }, "image/png");
  }), 8000, "No se pudo preparar la imagen del ticket.");
};

const combinarTicketsParaCorte = async (ticketUrl, ticketAdminUrl) => {
  const [ticketBytes, adminBytes] = await Promise.all([
    fetch(ticketUrl).then((response) => response.arrayBuffer()),
    fetch(ticketAdminUrl).then((response) => response.arrayBuffer()),
  ]);
  const [ticketDoc, adminDoc] = await Promise.all([
    PDFDocument.load(ticketBytes),
    PDFDocument.load(adminBytes),
  ]);
  const [ticketSize, adminSize] = [
    ticketDoc.getPage(0).getSize(),
    adminDoc.getPage(0).getSize(),
  ];
  const separatorHeight = 6;
  const ticketBottomCrop = 160;
  const ticketVisibleHeight = ticketSize.height - ticketBottomCrop;
  const width = Math.max(ticketSize.width, adminSize.width);
  const height = ticketVisibleHeight + adminSize.height + separatorHeight;
  const pdfDoc = await PDFDocument.create();
  const ticketPage = await pdfDoc.embedPage(ticketDoc.getPage(0), {
    left: 0,
    bottom: ticketBottomCrop,
    right: ticketSize.width,
    top: ticketSize.height,
  });
  const [adminPage] = await pdfDoc.embedPdf(adminBytes, [0]);
  const page = pdfDoc.addPage([width, height]);
  const ticketX = (width - ticketSize.width) / 2;
  const adminX = (width - adminSize.width) / 2;

  page.drawPage(adminPage, {
    x: adminX,
    y: 0,
    width: adminSize.width,
    height: adminSize.height,
  });
  page.drawLine({
    start: { x: 12, y: adminSize.height + 3 },
    end: { x: width - 12, y: adminSize.height + 3 },
    thickness: 0.6,
    color: rgb(0.7, 0.72, 0.75),
    dashArray: [4, 4],
  });
  page.drawPage(ticketPage, {
    x: ticketX,
    y: adminSize.height + separatorHeight,
    width: ticketSize.width,
    height: ticketVisibleHeight,
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
};

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
  empresa = {},
  modalNuevoTitulo = "Nueva encomienda",
  modalEditarTitulo = "Editar encomienda",
  soloLectura = false,
  ticketPredeterminado = "completo",
  onClose,
  onSubmit,
  guardando = false,
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
  const [imprimiendoTicket, setImprimiendoTicket] = useState(false);
  const [imprimiendoTicketAdmin, setImprimiendoTicketAdmin] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [whatsappEncomienda, setWhatsappEncomienda] = useState(null);
  const [ticketPickerOpen, setTicketPickerOpen] = useState(false);
  const [enviandoWhatsapp, setEnviandoWhatsapp] = useState(false);
  const [copiandoEnvioRapido, setCopiandoEnvioRapido] = useState(false);
  const [envioRapidoEstado, setEnvioRapidoEstado] = useState("");
  const [operacionGuardada, setOperacionGuardada] = useState(null);
  const [empresaCompleta, setEmpresaCompleta] = useState(empresa);

  const remitenteDocRef = useRef(null);
  const remitenteNombreRef = useRef(null);
  const remitenteTelefonoRef = useRef(null);
  const clienteDireccionFactRef = useRef(null);
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
  const precioChoferRef = useRef(null);
  const condicionPagoRef = useRef(null);
  const llegadaRef = useRef(null);
  const grabarRef = useRef(null);
  const ticketButtonRef = useRef(null);
  const ticketAdminRef = useRef(null);
  const whatsappNumeroRef = useRef(null);
  const whatsappImagenRef = useRef(null);
  const whatsappEnviarRef = useRef(null);
  const whatsappNumeroInicialRef = useRef("");

  useEffect(() => {
    let activo = true;
    const direccionBase = direccionEmpresa(empresa);
    const empresaBase = {
      ...empresa,
      domicilio_fiscal: direccionBase,
      direccion: direccionBase,
    };

    setEmpresaCompleta(empresaBase);

    if (!open || direccionBase || !back_host || !idAnfitrion || !documentoId) {
      return () => {
        activo = false;
      };
    }

    axios.get(`${back_host}/contabilidad/${idAnfitrion}/${documentoId}/ADMIN`)
      .then((response) => {
        if (!activo) return;
        const datos = response.data || {};
        const direccion = direccionEmpresa(datos);
        setEmpresaCompleta((prev) => ({
          ...prev,
          ...datos,
          ruc: datos.documento_id || prev.ruc || prev.documento_id || documentoId,
          documento_id: datos.documento_id || prev.documento_id || documentoId,
          nombre: datos.razon_social || prev.nombre,
          domicilio_fiscal: direccion,
          direccion,
        }));
      })
      .catch((error) => {
        console.log("Error cargando direccion de empresa para ticket:", error);
      });

    return () => {
      activo = false;
    };
  }, [back_host, documentoId, empresa, idAnfitrion, open]);

  focusableRefs.length = 0;
  focusableRefs.push(
    remitenteEntregaRef,
    remitenteZonaRef,
    remitenteDireccionRef,
    remitenteDocRef,
    remitenteNombreRef,
    remitenteTelefonoRef,
    clienteDireccionFactRef,
    rutaRef,
    destinatarioEntregaRef,
    destinatarioZonaRef,
    destinatarioDireccionRef,
    destinatarioDocRef,
    destinatarioNombreRef,
    destinatarioTelefonoRef,
    descripcionRef,
    totalRef,
    condicionPagoRef,
    placaRef,
    choferRef,
    llegadaRef,
    precioChoferRef,
    grabarRef,
  );

  useEffect(() => {
    if (open) {
      setDraft({
        ...crearDraft(operacion, periodoTrabajo, fechaOperacion),
        id_punto_venta: operacion?.id_punto_venta || puntoVentaOrigen || "",
      });
      setOperacionGuardada(null);
      setError("");
      window.setTimeout(() => {
        if (!soloLectura) {
          remitenteDocRef.current?.focus();
          remitenteDocRef.current?.select?.();
        }
      }, 80);
    }
  }, [open, operacion, periodoTrabajo, fechaOperacion, puntoVentaOrigen, soloLectura]);

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
    if (esEdicion || soloLectura) {
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
      cliente_direccion_fact: item.cliente_direccion_fact || "",
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
      punto_venta_dest_nombre: item.punto_venta_dest_nombre || item.punto_venta_destino_nombre || item.destino_nombre || "",
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

  const rutaSeleccionada = rutasDisponibles.find((ruta) => String(ruta.id_ruta) === String(draft.id_ruta));
  const origenVisual = puntoVentaOrigenNombre || draft.id_punto_venta || puntoVentaOrigen;
  const esFactura = (operacion?.r_cod || draft.r_cod) === "01";
  const encomiendaEnviadaSunat = Boolean(operacion?.numero_rdi || operacion?.r_vfirmado);
  const puedeEditarFecha = esEdicion && !encomiendaEnviadaSunat;
  const encomiendaGrabada = !esEdicion && Boolean(operacionGuardada);
  const encomiendaTicketBase = operacion || operacionGuardada || draft;
  const tieneComprobanteReal = (encomienda) => Boolean(encomienda?.r_cod && encomienda?.r_serie && encomienda?.r_numero);
  const puedeGenerarTicket = tieneComprobanteReal(encomiendaTicketBase);
  const comprobanteGrabado = [draft.r_serie, draft.r_numero].filter(Boolean).join("-");
  const numeroEncomiendaCabecera = [draft.r_serie || operacion?.r_serie, draft.r_numero || operacion?.r_numero]
    .filter(Boolean)
    .join("-") || "Sin numero";
  const textoBotonGuardarCorto = esEdicion ? "Guardar" : encomiendaGrabada ? "Grabada" : esFactura ? "Grabar" : "Guardar";
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
    "& svg": {
      width: 18,
      height: 18,
    },
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
    boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
  };
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
      punto_venta_dest_nombre: ruta.punto_venta_dest_nombre || ruta.punto_venta_destino_nombre || ruta.destino_nombre || "",
      destinatario_zona: prev.id_punto_venta_dest === ruta.id_punto_venta_dest ? prev.destinatario_zona : "",
    }));
    setRutaPickerOpen(false);
    window.setTimeout(() => {
      destinatarioDocRef.current?.focus();
      destinatarioDocRef.current?.select?.();
    }, 60);
  };

  const seleccionarZonaRemitente = (zona) => {
    updateDraft("remitente_entrega", "CLIENTE");
    updateDraft("remitente_zona", zona.nombre || "");
    setZonaPickerOpen("");
    window.setTimeout(() => {
      remitenteDireccionRef.current?.focus();
      remitenteDireccionRef.current?.select?.();
    }, 60);
  };

  const seleccionarZonaDestinatario = (zona) => {
    updateDraft("destinatario_entrega", "CLIENTE");
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
      punto_venta_dest_nombre: "",
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
    if (soloLectura) {
      return;
    }

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
      cliente_direccion_fact: "",
      remitente_direccion: "",
    }));

    try {
      const response = await axios.post(`${back_host}/correntistagenera`, {
        ruc: documento,
      });
      const {
        nombre_o_razon_social,
        r_id_doc,
        direccion_completa,
        direccion,
        domicilio_fiscal,
        data,
      } = response.data || {};
      const direccionFacturacion = (
        direccion_completa ||
        direccion ||
        domicilio_fiscal ||
        data?.direccion_completa ||
        data?.direccion ||
        data?.domicilio_fiscal ||
        ""
      );

      setDraft((prev) => ({
        ...prev,
        id_documento: r_id_doc || documentoTipoDesdeNumero(documento),
        r_cod: comprobanteDesdeDocumento(documento).r_cod,
        cliente: nombre_o_razon_social || prev.cliente,
        cliente_direccion_fact: direccionFacturacion,
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
    if (soloLectura) {
      return;
    }

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

  const normalizarTelefonoWhatsapp = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("51") && digits.length >= 11) return digits;
    if (digits.length === 9) return `51${digits}`;
    return digits;
  };

  const obtenerNombresPersona = (nombreCompleto) => {
    const partes = String(nombreCompleto || "").trim().split(/\s+/).filter(Boolean);
    if (partes.length <= 1) return partes.join(" ");

    // La consulta DNI suele devolver: Apellido paterno + apellido materno + nombres.
    // Para saludar por WhatsApp usamos solo nombres y evitamos los apellidos.
    if (partes.length >= 4) return partes.slice(2).join(" ");
    return partes[0];
  };

  const obtenerNombreClienteWhatsapp = (encomienda) => {
    const documento = String(encomienda?.cliente_documento || encomienda?.cliente_documento_id || draft.cliente_documento || "").replace(/\D/g, "");
    const nombre = encomienda?.cliente || draft.cliente || "";
    return documento.length === 8 ? obtenerNombresPersona(nombre) || "cliente" : nombre || "cliente";
  };

  const obtenerDestinoWhatsapp = (encomienda) => {
    const rutaActual = rutasDisponibles.find((ruta) => String(ruta.id_ruta) === String(encomienda?.id_ruta || draft.id_ruta));
    return (
      encomienda?.punto_venta_dest_nombre ||
      encomienda?.punto_venta_destino_nombre ||
      encomienda?.destino_nombre ||
      rutaActual?.punto_venta_dest_nombre ||
      rutaActual?.punto_venta_destino_nombre ||
      rutaActual?.destino_nombre ||
      ""
    );
  };

  const crearMensajeWhatsappTicket = (encomienda, ticketUrl) => {
    const numero = [encomienda?.r_serie, encomienda?.r_numero].filter(Boolean).join("-");
    const destino = obtenerDestinoWhatsapp(encomienda);
    const cliente = obtenerNombreClienteWhatsapp(encomienda);

    return [
      `Hola ${cliente}, te enviamos el ticket de tu encomienda${numero ? ` ${numero}` : ""}.`,
      destino ? `Destino: ${destino}.` : "",
      `Ticket: ${ticketUrl}`,
    ].filter(Boolean).join("\n");
  };

  const normalizarUrlDescargaTicket = (rutaPdf) => {
    const rutaTexto = String(rutaPdf || "").trim();

    if (!rutaTexto) return "";

    if (rutaTexto.startsWith(DESCARGAS_TICKET_BASE_URL)) {
      return rutaTexto;
    }

    const nombreArchivo = rutaTexto.split("/descargas/").pop()?.split("?")[0] || rutaTexto.split("/").pop();
    return `${DESCARGAS_TICKET_BASE_URL}${nombreArchivo}`;
  };

  const cerrarFlujoWhatsapp = () => {
    setWhatsappModalOpen(false);
    setWhatsappEncomienda(null);
  };

  const abrirEnvioWhatsapp = () => {
    const encomiendaBase = { ...draft, ...(operacion || operacionGuardada || {}) };
    const numeroRemitente = encomiendaBase.cliente_telefono || "";
    setWhatsappEncomienda(encomiendaBase);
    whatsappNumeroInicialRef.current = numeroRemitente;
    setWhatsappNumero(numeroRemitente);
    setWhatsappModalOpen(true);
  };

  useEffect(() => {
    if (!whatsappModalOpen || enviandoWhatsapp) {
      return;
    }

    window.setTimeout(() => {
      if (!String(whatsappNumeroInicialRef.current || "").trim()) {
        whatsappNumeroRef.current?.focus();
        whatsappNumeroRef.current?.select?.();
        return;
      }

      whatsappImagenRef.current?.focus();
    }, 80);
  }, [whatsappModalOpen, enviandoWhatsapp]);

  const handleSubmit = async () => {
    if (guardando || soloLectura || encomiendaGrabada) {
      return;
    }

    if (esEdicion && puedeEditarFecha && !String(draft.r_fecemi || "").startsWith(`${periodoTrabajo}-`)) {
      mostrarValidacion("La fecha debe pertenecer al periodo de trabajo.", null);
      return;
    }

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
    const precioChofer = Number(draft.precio_chofer || 0);
    const entregaRemitenteEnOficina = draft.remitente_entrega === "OFICINA";
    const entregaDestinatarioEnOficina = draft.destinatario_entrega === "OFICINA";
    const remitenteEsEmpresa = String(draft.cliente_documento || "").replace(/\D/g, "").length === 11;
    const clienteZonaFinal = entregaRemitenteEnOficina ? "" : draft.remitente_zona;
    const clienteDireccionFinal = entregaRemitenteEnOficina ? "" : draft.remitente_direccion;
    const destinatarioDireccionFinal = entregaDestinatarioEnOficina ? "" : draft.destinatario_direccion;

    const ticketAdminWindow = !esEdicion ? window.open("about:blank", "_blank") : null;
    ticketAdminWindow?.document?.write(`<p style="font-family:Arial,sans-serif;color:${palette.text}">Grabando encomienda...</p>`);

    const operacionGuardadaResponse = await onSubmit({
      ...draft,
      tipo_operacion: "E",
      r_cod: comprobante.r_cod,
      cliente_id_doc: documentoTipoDesdeNumero(draft.cliente_documento),
      cliente_documento_id: draft.cliente_documento,
      cliente_direccion_fact: remitenteEsEmpresa ? draft.cliente_direccion_fact : "",
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
      precio_chofer: precioChofer,
      asiento: null,
    }, { mantenerModalAbierto: true });

    if (!operacionGuardadaResponse || esEdicion) {
      ticketAdminWindow?.close();
      return;
    }

    setOperacionGuardada(operacionGuardadaResponse);
    setDraft((prev) => ({
      ...prev,
      ...operacionGuardadaResponse,
      cliente_documento: operacionGuardadaResponse.cliente_documento || operacionGuardadaResponse.cliente_documento_id || prev.cliente_documento,
      destinatario_documento: operacionGuardadaResponse.destinatario_documento || operacionGuardadaResponse.destinatario_documento_id || prev.destinatario_documento,
      remitente_zona: operacionGuardadaResponse.remitente_zona || operacionGuardadaResponse.cliente_zona || prev.remitente_zona,
      remitente_direccion: operacionGuardadaResponse.remitente_direccion || operacionGuardadaResponse.cliente_direccion || prev.remitente_direccion,
    }));

    // Despues de grabar queda listo el ticket; por defecto imprime el formato completo.
    const numeroRemitente = draft.cliente_telefono || "";
    setWhatsappEncomienda({ ...draft, ...operacionGuardadaResponse });
    whatsappNumeroInicialRef.current = numeroRemitente;
    setWhatsappNumero(numeroRemitente);

    await imprimirTicketModelo({
      modo: ticketPredeterminado,
      encomiendaBase: { ...draft, ...operacionGuardadaResponse },
      ticketWindow: ticketAdminWindow,
    });
  };

  const generarTicketPdfUrl = async ({ encomiendaBase = operacion || operacionGuardada || draft, admin = false, cacheBust = true, local = true } = {}) => {
    const rCod = encomiendaBase?.r_cod || draft.r_cod;
    const rSerie = encomiendaBase?.r_serie || draft.r_serie;
    const rNumero = encomiendaBase?.r_numero || draft.r_numero;
    const elemento = encomiendaBase?.elemento || draft.elemento || 1;
    const rutaTicket = rutasDisponibles.find((ruta) => String(ruta.id_ruta) === String(encomiendaBase?.id_ruta || draft.id_ruta));
    const encomiendaTicket = {
      ...draft,
      ...encomiendaBase,
      r_cod: rCod,
      r_serie: rSerie,
      r_numero: rNumero,
      elemento,
      punto_venta_nombre: (
        encomiendaBase?.punto_venta_nombre ||
        rutaTicket?.punto_venta_nombre ||
        puntoVentaOrigenNombre ||
        encomiendaBase?.id_punto_venta ||
        draft.id_punto_venta
      ),
      punto_venta_dest_nombre: (
        encomiendaBase?.punto_venta_dest_nombre ||
        encomiendaBase?.punto_venta_destino_nombre ||
        encomiendaBase?.destino_nombre ||
        rutaTicket?.punto_venta_dest_nombre ||
        rutaTicket?.punto_venta_destino_nombre ||
        rutaTicket?.destino_nombre ||
        encomiendaBase?.id_punto_venta_dest ||
        draft.id_punto_venta_dest
      ),
    };

    if (!rCod || !rSerie || !rNumero) {
      throw new Error("El ticket necesita serie y numero real del comprobante.");
    }

    if (local) {
      const crearTicketLocal = admin ? crearTicketEncomiendaPdf : crearTicketEncomiendaTributarioPdf;

      return crearTicketLocal({
        encomienda: encomiendaTicket,
        empresa: empresaCompleta,
      });
    }

    const response = await axios.post(`${back_host}/mve_transventa/ticket/encomienda${admin ? "/admin" : ""}`, {
      periodo: periodoTrabajo,
      id_anfitrion: idAnfitrion,
      documento_id: documentoId,
      r_cod: rCod,
      r_serie: rSerie,
      r_numero: rNumero,
      elemento,
      endpoint_pdf: admin ? "/cpesunatticketencomienda" : "/cpesunatticketencomienda/v2",
      rubro: "TRANS_ENCOMIENDA",
    });
    const rutaPdf = response.data?.ruta_pdf;

    if (!rutaPdf || rutaPdf === "error") {
      throw new Error(response.data?.message || response.data?.respuesta_sunat_descripcion || "No se pudo generar el ticket.");
    }

    // Para pantalla conviene cacheBust=true para forzar refresco del PDF recien generado.
    // Para WhatsApp usamos cacheBust=false y enviamos el link limpio de /descargas.
    const urlDescarga = normalizarUrlDescargaTicket(rutaPdf);
    return cacheBust ? `${urlDescarga}${urlDescarga.includes("?") ? "&" : "?"}t=${Date.now()}` : urlDescarga;
  };

  const generarTicketImpresionConAdminUrl = async (ticketBase) => {
    const [ticketUrl, ticketAdminUrl] = await Promise.all([
      generarTicketPdfUrl({ admin: false, encomiendaBase: ticketBase, cacheBust: false, local: true }),
      generarTicketPdfUrl({ admin: true, encomiendaBase: ticketBase, cacheBust: false, local: true }),
    ]);

    try {
      return await combinarTicketsParaCorte(ticketUrl, ticketAdminUrl);
    } finally {
      if (ticketUrl.startsWith("blob:")) URL.revokeObjectURL(ticketUrl);
      if (ticketAdminUrl.startsWith("blob:")) URL.revokeObjectURL(ticketAdminUrl);
    }
  };

  const imprimirTicketModelo = async ({ admin = false, modo = null, encomiendaBase, ticketWindow: ticketWindowParam } = {}) => {
    const modoImpresion = modo || (admin ? "admin" : "completo");
    const esAdmin = modoImpresion === "admin";
    const esCliente = modoImpresion === "cliente";
    const estaImprimiendo = esAdmin ? imprimiendoTicketAdmin : imprimiendoTicket;
    const ticketBase = encomiendaBase || encomiendaTicketBase;

    if (guardando || estaImprimiendo) {
      return;
    }

    if (!tieneComprobanteReal(ticketBase)) {
      swal2.fire({
        title: "Primero graba la encomienda",
        text: "El ticket con logo y QR necesita serie y numero real del comprobante.",
        icon: "warning",
        confirmButtonText: "ACEPTAR",
        color: palette.text,
        background: palette.surface,
      });
      return;
    }

    const ticketWindow = ticketWindowParam || window.open("about:blank", "_blank");
    if (esAdmin) {
      setImprimiendoTicketAdmin(true);
    } else {
      setImprimiendoTicket(true);
    }

    try {
      ticketWindow?.document?.write(`<p style="font-family:Arial,sans-serif;color:${palette.text}">Generando ticket...</p>`);

      const urlConBypassCache = esAdmin
        ? await generarTicketPdfUrl({ admin: true, encomiendaBase: ticketBase })
        : esCliente
          ? await generarTicketPdfUrl({ admin: false, encomiendaBase: ticketBase })
          : await generarTicketImpresionConAdminUrl(ticketBase);

      if (ticketWindow) {
        ticketWindow.location.href = urlConBypassCache;
      } else {
        window.open(urlConBypassCache, "_blank", "noopener,noreferrer");
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
    } finally {
      if (esAdmin) {
        setImprimiendoTicketAdmin(false);
      } else {
        setImprimiendoTicket(false);
      }
    }
  };

  const enviarTicketPorWhatsapp = async () => {
    const telefono = normalizarTelefonoWhatsapp(whatsappNumero);

    if (!telefono) {
      swal2.fire({
        title: "Indica celular",
        text: "Necesitamos el numero para enviar el ticket por WhatsApp.",
        icon: "warning",
        confirmButtonText: "ACEPTAR",
        color: palette.text,
        background: palette.surface,
      });
      return;
    }

    setEnviandoWhatsapp(true);
    try {
      const ticketUrl = await generarTicketPdfUrl({ encomiendaBase: whatsappEncomienda, cacheBust: false, local: false });
      const mensaje = crearMensajeWhatsappTicket(whatsappEncomienda, ticketUrl);
      const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      cerrarFlujoWhatsapp();
    } catch (error) {
      swal2.fire({
        title: "No se pudo generar el ticket",
        text: error.message || "Revisa los datos de la encomienda e intenta nuevamente.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
        color: palette.text,
        background: palette.surface,
      });
    } finally {
      setEnviandoWhatsapp(false);
    }
  };

  const copiarTicketPngEnvioRapido = async () => {
    if (guardando || copiandoEnvioRapido || !puedeGenerarTicket) {
      return;
    }

    const telefono = normalizarTelefonoWhatsapp(whatsappNumero);

    if (!telefono) {
      swal2.fire({
        title: "Indica celular",
        text: "Necesitamos el numero para abrir WhatsApp con el mensaje del ticket.",
        icon: "warning",
        confirmButtonText: "ACEPTAR",
        color: palette.text,
        background: palette.surface,
      });
      return;
    }

    if (!navigator.clipboard?.write || typeof window.ClipboardItem === "undefined") {
      swal2.fire({
        title: "Portapapeles no disponible",
        text: "Tu navegador no permite copiar imagenes al portapapeles. Prueba en Chrome o Edge con HTTPS/localhost.",
        icon: "warning",
        confirmButtonColor: palette.accent,
      });
      return;
    }

    const encomiendaBase = { ...draft, ...(operacion || operacionGuardada || {}) };
    let ticketUrl = "";

    setCopiandoEnvioRapido(true);
    setEnvioRapidoEstado("Generando...");
    try {
      ticketUrl = await generarTicketPdfUrl({
        encomiendaBase,
        admin: false,
        local: true,
        cacheBust: false,
      });
      setEnvioRapidoEstado("Convirtiendo...");
      const response = await fetch(ticketUrl);
      const pdfBlob = await response.blob();
      const pngBlob = await pdfBlobToPngBlob(pdfBlob);

      setEnvioRapidoEstado("Copiando...");
      await navigator.clipboard.write([
        new window.ClipboardItem({ "image/png": pngBlob }),
      ]);

      const numero = [encomiendaBase?.r_serie, encomiendaBase?.r_numero].filter(Boolean).join("-");
      const destino = obtenerDestinoWhatsapp(encomiendaBase);
      const mensaje = [
        `Hola, te comparto el ticket de tu encomienda${numero ? ` ${numero}` : ""}.`,
        destino ? `Destino: ${destino}.` : "",
        "Imagen del ticket."
      ].filter(Boolean).join("\n");

      window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
      cerrarFlujoWhatsapp();
    } catch (error) {
      swal2.fire({
        title: "No se pudo copiar",
        text: error.message || "No se pudo convertir el ticket a imagen.",
        icon: "error",
        confirmButtonColor: palette.accent,
        background: palette.surface,
        color: palette.text,
      });
    } finally {
      if (ticketUrl.startsWith("blob:")) {
        URL.revokeObjectURL(ticketUrl);
      }
      setCopiandoEnvioRapido(false);
      setEnvioRapidoEstado("");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          "& > *": {
            position: "relative",
            zIndex: 1,
          },
        },
      }}
    >
      <Box sx={{ p: { xs: 0.8, md: 1 }, pb: 0, flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 0.75, mb: 0.7, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <AppIconBox>
              <Package size={16} />
            </AppIconBox>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "15px", lineHeight: 1.15 }}>
                {soloLectura ? "Visualizar encomienda" : esEdicion ? modalEditarTitulo : modalNuevoTitulo}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.2 }} noWrap>
                Comprobante: {numeroEncomiendaCabecera}
              </Typography>
            </Box>
          </Box>
          {esEdicion && (
            <Box
              sx={{
                order: { xs: 3, sm: 2 },
                ml: { xs: 0, sm: "auto" },
                width: { xs: "100%", sm: "auto" },
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 0.75,
                flexWrap: "nowrap",
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  height: 32,
                  px: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.65,
                  borderRadius: palette.radius.control,
                  border: `1px solid ${palette.border}`,
                  backgroundColor: palette.overlaySoft,
                  color: palette.text,
                  minWidth: 0,
                  flex: "1 1 auto",
                }}
              >
                <CalendarDays size={14} color={palette.muted} />
                <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
                  Fecha
                </Typography>
                <InputBase
                  value={draft.r_fecemi}
                  onChange={(event) => updateDraft("r_fecemi", event.target.value)}
                  type="date"
                  readOnly={soloLectura || !puedeEditarFecha}
                  sx={{
                    width: 118,
                    color: palette.text,
                    fontSize: "12px",
                    fontWeight: 800,
                    "& input": {
                      p: 0,
                      color: palette.text,
                      fontWeight: 800,
                    },
                  }}
                />
              </Box>
            </Box>
          )}
          <IconButton disabled={guardando} onClick={onClose} sx={{ color: palette.muted, order: { xs: 2, sm: 3 }, ml: "auto" }}>
            <X size={18} />
          </IconButton>
        </Box>
      </Box>

      {encomiendaGrabada && (
        <Box
          sx={{
            mx: { xs: 0.8, md: 1 },
            mb: 0.8,
            px: 1.2,
            py: 0.9,
            display: "flex",
            alignItems: "center",
            gap: 1,
            border: `1px solid ${palette.success}`,
            borderRadius: palette.radius.control,
            backgroundColor: "rgba(66,160,104,0.12)",
            color: palette.text,
            flexShrink: 0,
          }}
        >
          <CheckCircle size={17} color={palette.success} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "12px", fontWeight: 800, lineHeight: 1.2 }}>
              Encomienda grabada correctamente
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.2 }} noWrap>
              Comprobante: {comprobanteGrabado || "generado"}
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ position: "relative", pb: 0.8, minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}>
        <TrEncomiendaModalSections
          draft={draft}
          error={error}
          esEdicion={esEdicion}
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
          soloLectura={soloLectura}
          refs={{
            remitenteDocRef,
            remitenteNombreRef,
            remitenteTelefonoRef,
            clienteDireccionFactRef,
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
            precioChoferRef,
            condicionPagoRef,
            llegadaRef,
            grabarRef,
          }}
        />

        <Box sx={{
          mx: { xs: 0.7, md: 0.85 },
          mt: 0.25,
          pt: 0.7,
          flexShrink: 0,
          display: "grid",
          gridTemplateColumns: "auto auto 1fr auto auto",
          gap: 0.65,
          alignItems: "center",
          borderTop: `1px solid ${palette.borderSoft}`,
        }}>
          {(esEdicion || encomiendaGrabada) && (
            <AppButton icon={<MessageCircle size={18} />} onClick={abrirEnvioWhatsapp} disabled={guardando || imprimiendoTicket || enviandoWhatsapp || !puedeGenerarTicket} sx={accionSecundariaSx}>
              WhatsApp
            </AppButton>
          )}
          {!(esEdicion || encomiendaGrabada) && <Box />}
          <AppButton icon={<X size={18} />} onClick={onClose} disabled={guardando} sx={accionSecundariaSx}>
            Cerrar
          </AppButton>
          <Box />
          <AppButton buttonRef={ticketButtonRef} icon={<Ticket size={18} />} onClick={() => setTicketPickerOpen(true)} disabled={guardando || imprimiendoTicket || imprimiendoTicketAdmin || !puedeGenerarTicket} sx={accionSecundariaSx}>
            Ticket
          </AppButton>
          {!soloLectura && (
            <AppButton buttonRef={grabarRef} icon={<Save size={16} />} onClick={handleSubmit} disabled={guardando || enviandoWhatsapp || copiandoEnvioRapido || encomiendaGrabada} sx={{ ...accionPrincipalSx, justifySelf: "end" }}>
              {guardando ? "Guardando..." : textoBotonGuardarCorto}
            </AppButton>
          )}
        </Box>
      </Box>
      <Popover
        open={ticketPickerOpen}
        onClose={() => setTicketPickerOpen(false)}
        anchorEl={ticketButtonRef.current}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        PaperProps={{
          sx: {
            width: { xs: 300, sm: 320 },
            mb: 0.75,
            backgroundColor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: palette.radius.modal,
            boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, px: 1.4, pt: 1.15, pb: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AppIconBox>
              <Ticket size={16} />
            </AppIconBox>
            <Box>
              <Typography sx={{ fontSize: "15px", fontWeight: 800, lineHeight: 1.15 }}>
                Imprimir ticket
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.2 }}>
                Escoge el formato
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setTicketPickerOpen(false)} size="small" sx={{ color: palette.muted }}>
            <X size={17} />
          </IconButton>
        </Box>
        <Box sx={{ px: 1.4, pt: 0.75, pb: 1.2 }}>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            <AppButton
              icon={<Ticket size={18} />}
              onClick={() => {
                setTicketPickerOpen(false);
                imprimirTicketModelo({ modo: "completo" });
              }}
              disabled={guardando || imprimiendoTicket || !puedeGenerarTicket}
              sx={{ justifyContent: "flex-start" }}
            >
              Ticket completo
            </AppButton>
            <AppButton
              buttonRef={ticketAdminRef}
              icon={<Ticket size={18} />}
              onClick={() => {
                setTicketPickerOpen(false);
                imprimirTicketModelo({ modo: "admin" });
              }}
              disabled={guardando || imprimiendoTicketAdmin || !puedeGenerarTicket}
              sx={{ justifyContent: "flex-start" }}
            >
              Ticket admin
            </AppButton>
            <AppButton
              icon={<Ticket size={18} />}
              onClick={() => {
                setTicketPickerOpen(false);
                imprimirTicketModelo({ modo: "cliente" });
              }}
              disabled={guardando || imprimiendoTicket || !puedeGenerarTicket}
              sx={{ justifyContent: "flex-start" }}
            >
              Ticket cliente
            </AppButton>
            <AppButton
              icon={<X size={16} />}
              onClick={() => setTicketPickerOpen(false)}
              sx={{
                mt: 0.25,
                backgroundColor: palette.overlaySoft,
                borderColor: palette.borderSoft,
                color: palette.muted,
                fontWeight: 800,
              }}
            >
              Cerrar
            </AppButton>
          </Box>
        </Box>
      </Popover>
      <Dialog
        open={whatsappModalOpen}
        onClose={(enviandoWhatsapp || copiandoEnvioRapido) ? undefined : cerrarFlujoWhatsapp}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: palette.radius.modal,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, pb: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AppIconBox>
              <MessageCircle size={16} />
            </AppIconBox>
            <Box>
              <Typography sx={{ fontSize: "15px", fontWeight: 800, lineHeight: 1.15 }}>
                Enviar ticket
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.2 }}>
                WhatsApp del cliente
              </Typography>
            </Box>
          </Box>
          <IconButton disabled={enviandoWhatsapp || copiandoEnvioRapido} onClick={cerrarFlujoWhatsapp} size="small" sx={{ color: palette.muted }}>
            <X size={17} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.1 }}>
          <InputBase
            autoFocus
            inputRef={whatsappNumeroRef}
            value={whatsappNumero}
            onChange={(event) => setWhatsappNumero(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !enviandoWhatsapp) {
                event.preventDefault();
                whatsappImagenRef.current?.focus();
              }
            }}
            placeholder="Celular del cliente"
            inputMode="numeric"
            disabled={enviandoWhatsapp}
            sx={{
              width: "100%",
              height: 40,
              px: 1.2,
              borderRadius: palette.radius.control,
              border: `1px solid ${palette.border}`,
              backgroundColor: palette.overlaySoft,
              color: palette.text,
              fontSize: "13px",
              "& input": { p: 0, color: palette.text },
            }}
          />
          <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.8 }}>
            Si no tiene codigo de pais, se asumira Peru (+51).
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: "11px", mt: 0.8 }}>
            Enviar imagen copia el ticket; en WhatsApp pega con Ctrl+V o Pegar.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.8, mt: 1.6, flexWrap: "wrap" }}>
            <AppButton disabled={enviandoWhatsapp || copiandoEnvioRapido} onClick={cerrarFlujoWhatsapp}>
              Omitir
            </AppButton>
            <AppButton
              buttonRef={whatsappImagenRef}
              icon={<ClipboardCopy size={15} />}
              disabled={enviandoWhatsapp || copiandoEnvioRapido}
              onClick={copiarTicketPngEnvioRapido}
              sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.onAccent, fontWeight: 800 }}
            >
              {copiandoEnvioRapido ? envioRapidoEstado || "Copiando..." : "Enviar imagen"}
            </AppButton>
            <AppButton
              buttonRef={whatsappEnviarRef}
              icon={<MessageCircle size={15} />}
              disabled={enviandoWhatsapp || copiandoEnvioRapido}
              onClick={enviarTicketPorWhatsapp}
            >
              {enviandoWhatsapp ? "Generando link..." : "Enviar link"}
            </AppButton>
          </Box>
        </DialogContent>
      </Dialog>
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
