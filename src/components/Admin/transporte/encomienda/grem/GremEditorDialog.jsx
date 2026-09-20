import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Alert, Box, Collapse, Dialog, DialogContent, DialogTitle, Grid, IconButton, InputBase, Typography } from "@mui/material";
import { ArrowLeft, CheckCircle2, Code2, FileCheck2, FilePlus2, FileText, MapPin, MessageCircle, RotateCcw, Search, Send, Truck, X } from "lucide-react";

import AppButton from "../../../../ui/AppButton";
import AppSearch from "../../../../ui/AppSearch";
import palette from "../../../../../theme/palette";
import { useDialog } from "../../../AdminConfirmDialogProvider";
import {
  CaptureInput,
  Field,
  SectionHeader,
  sectionSx,
} from "../modal/TrEncomiendaModalInputs";
import { PlacaField, LicenciaField } from "../modal/TrEncomiendaModalFields";
import { PlacaPickerModal, LicenciaPickerModal } from "../modal/TrEncomiendaModalPickers";
import { gremTableStyles } from "./gremStyles";
import GremEncomiendaRow from "./GremEncomiendaRow";
import {
  coincideCodigoEscaneado,
  encomiendaKey,
  extraerCodigoEscaneado,
  normalizarFiltro,
  tieneGrem,
} from "./gremUtils";

const scrollSx = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(143,199,255,0.55) rgba(15,23,42,0.55)",
  "&::-webkit-scrollbar": { width: 8, height: 8 },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(15,23,42,0.55)",
    borderRadius: 8,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(143,199,255,0.45)",
    borderRadius: 8,
    border: "2px solid rgba(15,23,42,0.55)",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "rgba(143,199,255,0.72)",
  },
};

const primaryButtonSx = {
  backgroundColor: palette.accent,
  borderColor: palette.accent,
  color: palette.onAccent,
  fontWeight: 800,
  "&:hover": {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
    color: palette.onAccent,
  },
};

const secondaryButtonSx = {
  backgroundColor: palette.chip,
  borderColor: palette.border,
  color: palette.text,
};

const downloadButtonSx = {
  ...secondaryButtonSx,
  minWidth: 96,
  justifyContent: "center",
  fontWeight: 900,
};

const FixedChip = ({ label, value }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 1,
      width: "100%",
      minHeight: 31,
      px: 1.05,
      borderRadius: palette.radius.control,
      border: `1px solid ${palette.borderSoft}`,
      backgroundColor: palette.chip,
      boxSizing: "border-box",
    }}
  >
    <Typography sx={{ color: palette.muted, fontSize: 9, fontWeight: 900, lineHeight: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {label}
    </Typography>
    <Typography sx={{ color: palette.text, fontSize: 12, fontWeight: 900, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {value}
    </Typography>
  </Box>
);

const HeaderMeta = ({ label, value }) => (
  <Box
    sx={{
      minWidth: { xs: 96, sm: 108 },
      px: 1.1,
      py: 0.7,
      borderRadius: palette.radius.control,
      border: `1px solid ${palette.borderSoft}`,
      backgroundColor: "rgba(12,17,23,0.68)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    }}
  >
    <Typography sx={{ color: palette.muted, fontSize: 9, fontWeight: 900, lineHeight: 1, textTransform: "uppercase" }}>
      {label}
    </Typography>
    <Typography sx={{ color: palette.text, fontSize: 13, fontWeight: 900, lineHeight: 1.2, mt: 0.45, letterSpacing: 0 }}>
      {value || "-"}
    </Typography>
  </Box>
);

const cleanText = (value) => String(value || "").trim();

const normalizarSerieGrem = (value) => {
  const serie = cleanText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const serieRemitente = serie.match(/^T(\d{3})$/);
  if (serieRemitente) return `V${serieRemitente[1]}`;
  return /^V\d{3}$/.test(serie) ? serie : "V001";
};

const detalleToEncomienda = (detalle = {}, grem = {}) => ({
  r_cod: detalle.r_cod,
  r_serie: detalle.r_serie,
  r_numero: detalle.r_numero,
  elemento: detalle.elemento || 1,
  cliente: detalle.cliente || "",
  destinatario: detalle.destinatario || "",
  r_monto_total: detalle.r_monto_total,
  precio_neto: detalle.precio_neto,
  descripcion: "ENCOMIENDA",
  fecha: grem.fecha_traslado || "",
  nombre_ruta: `${grem.partida_agencia_nombre || grem.partida_ubigeo || ""} - ${grem.llegada_agencia_nombre || grem.llegada_ubigeo || ""}`,
  grem_cod: grem.cod || "31",
  grem_serie: grem.serie,
  grem_numero: grem.numero,
  grem_vfirmado: grem.vfirmado || "",
});

const agenciaLabel = (agencia) => {
  if (!agencia) return "";
  const nombre = cleanText(agencia.nombre || agencia.punto_venta_nombre);
  const codigo = cleanText(agencia.id_punto_venta);
  return [codigo, nombre].filter(Boolean).join(" - ");
};

const mergeAgencia = (map, agencia = {}) => {
  const id = cleanText(agencia.id_punto_venta);
  if (!id) return;

  const actual = map.get(id) || {};
  map.set(id, {
    ...actual,
    ...agencia,
    id_punto_venta: id,
    nombre: cleanText(agencia.nombre || agencia.punto_venta_nombre || actual.nombre || actual.punto_venta_nombre),
    direccion: cleanText(agencia.direccion || actual.direccion),
    ubigeo: cleanText(agencia.ubigeo || agencia.id_ubigeo || actual.ubigeo || actual.id_ubigeo),
  });
};

function AgenciaField({ value, placeholder, inputRef, onOpen, nextRef, fixed = false, readOnly = false }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
      <CaptureInput
        inputRef={inputRef}
        value={value}
        readOnly
        placeholder={placeholder}
        onChange={() => {}}
        onEmptyEnter={fixed || readOnly ? undefined : onOpen}
        onPlus={fixed || readOnly ? undefined : onOpen}
        nextRef={nextRef}
      />
      {!fixed && !readOnly && (
        <IconButton
          size="small"
          onClick={onOpen}
          sx={{ color: palette.accent, p: 0.35, ml: 0.35, flexShrink: 0 }}
          title={placeholder}
        >
          <Search size={14} />
        </IconButton>
      )}
    </Box>
  );
}

const defaultForm = ({ grem, primera, cantidad, agenciaOrigen, agenciaDestino }) => ({
  serie: normalizarSerieGrem(grem?.serie || primera?.grem_serie),
  numero: grem?.numero || "",
  fecha_traslado: grem?.fecha_traslado || (primera?.r_fecemi || "").slice(0, 10),
  motivo_traslado_id: "13",
  modalidad_traslado_id: "01",
  partida_agencia_id: grem?.partida_agencia_id || grem?.id_punto_venta || agenciaOrigen?.id_punto_venta || primera?.id_punto_venta || "",
  partida_agencia_nombre: grem?.partida_agencia_nombre || agenciaOrigen?.nombre || primera?.punto_venta_nombre || "",
  partida_ubigeo: grem?.partida_ubigeo || agenciaOrigen?.ubigeo || agenciaOrigen?.id_ubigeo || primera?.punto_venta_ubigeo || "",
  partida_direccion: grem?.partida_direccion || agenciaOrigen?.direccion || primera?.punto_venta_direccion || primera?.remitente_direccion || primera?.cliente_direccion || "",
  llegada_agencia_id: grem?.llegada_agencia_id || grem?.id_punto_venta_dest || agenciaDestino?.id_punto_venta || primera?.id_punto_venta_dest || "",
  llegada_agencia_nombre: grem?.llegada_agencia_nombre || agenciaDestino?.nombre || primera?.punto_venta_dest_nombre || primera?.punto_venta_destino_nombre || primera?.destino_nombre || "",
  llegada_ubigeo: grem?.llegada_ubigeo || agenciaDestino?.ubigeo || agenciaDestino?.id_ubigeo || primera?.punto_venta_dest_ubigeo || "",
  llegada_direccion: grem?.llegada_direccion || agenciaDestino?.direccion || primera?.punto_venta_dest_direccion || primera?.destinatario_direccion || "",
  placa: grem?.vehiculo_placa || "",
  licencia: grem?.conductor_licencia || "",
  conductor_dni: grem?.conductor_dni || "",
  conductor_nombres: grem?.conductor_nombres || "",
  conductor_apellidos: grem?.conductor_apellidos || "",
  peso_total: String(grem?.peso_total || Math.max(cantidad, 1)),
  numero_bultos: String(Math.max(cantidad, 1)),
  observacion: grem?.glosa || "ENCOMIENDAS",
});

const construirRutasDescargaGrem = (backHost, grem = {}) => {
  const gremData = grem || {};
  const ruc = cleanText(gremData.documento_id);
  const cod = cleanText(gremData.cod || "31");
  const serie = cleanText(gremData.serie);
  const numero = cleanText(gremData.numero);

  if (!backHost || !ruc || !cod || !serie || !numero) {
    return {
      ruta_xml: null,
      ruta_cdr: null,
      ruta_pdf: null,
    };
  }

  const baseHost = String(backHost).replace(/\/$/, "");
  const nombre = `${ruc}-${cod}-${serie}-${numero}`;
  const base = `${baseHost}/descargas/${ruc}`;

  return {
    ruta_xml: `${base}/${nombre}.xml`,
    ruta_cdr: `${base}/R-${nombre}.xml`,
    ruta_pdf: `${base}/${nombre}.pdf`,
  };
};

let ubigeosGremCache = null;
let ubigeosGremPromise = null;

export const cargarUbigeosGrem = (backHost) => {
  if (ubigeosGremCache) return Promise.resolve(ubigeosGremCache);
  if (ubigeosGremPromise) return ubigeosGremPromise;

  ubigeosGremPromise = axios
    .get(`${backHost}/mve_transventa/grem/ubigeos/listado`)
    .then((response) => {
      ubigeosGremCache = Array.isArray(response.data) ? response.data : [];
      return ubigeosGremCache;
    })
    .finally(() => {
      ubigeosGremPromise = null;
    });

  return ubigeosGremPromise;
};

export default function GremEditorDialog({
  open,
  onClose,
  onSaved,
  backHost,
  periodoTrabajo,
  documentoId,
  idAnfitrion,
  idInvitado,
  encomiendas,
  puntoVentaTrabajo = "",
  rutasDisponibles = [],
  puntosVentaAsignados = [],
  placasDisponibles = [],
  licenciasDisponibles = [],
  initialGrem,
  ubigeosPrecargados = [],
  ubigeosPrecargando = false,
}) {
  const { confirmDialog } = useDialog();
  const filtroInputRef = useRef(null);
  const partidaUbigeoRef = useRef(null);
  const partidaDireccionRef = useRef(null);
  const llegadaUbigeoRef = useRef(null);
  const llegadaDireccionRef = useRef(null);
  const fechaTrasladoRef = useRef(null);
  const origenAgenciaRef = useRef(null);
  const destinoAgenciaRef = useRef(null);
  const placaRef = useRef(null);
  const licenciaRef = useRef(null);
  const conductorDocumentoRef = useRef(null);
  const conductorNombresRef = useRef(null);
  const conductorApellidosRef = useRef(null);
  const pesoTotalRef = useRef(null);
  const numeroBultosRef = useRef(null);
  const agenciaFiltroRef = useRef(null);
  const ubigeoFiltroRef = useRef(null);
  const [modoCarga, setModoCarga] = useState("listado");
  const [filtro, setFiltro] = useState("");
  const [seleccionKeys, setSeleccionKeys] = useState([]);
  const [scannerKeys, setScannerKeys] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState(defaultForm({ cantidad: 1 }));
  const [loading, setLoading] = useState(false);
  const [cabeceraOpen, setCabeceraOpen] = useState(false);
  const [ubigeosBase, setUbigeosBase] = useState(() => (
    Array.isArray(ubigeosPrecargados) ? ubigeosPrecargados : []
  ));
  const [ubigeosLoading, setUbigeosLoading] = useState(ubigeosPrecargando);
  const [ubigeoModal, setUbigeoModal] = useState(null);
  const [ubigeoFiltro, setUbigeoFiltro] = useState("");
  const [agenciaPicker, setAgenciaPicker] = useState(null);
  const [agenciaFiltro, setAgenciaFiltro] = useState("");
  const [agenciaSelectedIndex, setAgenciaSelectedIndex] = useState(0);
  const agenciaSelectedRef = useRef(null);
  const [placaPickerOpen, setPlacaPickerOpen] = useState(false);
  const [licenciaPickerOpen, setLicenciaPickerOpen] = useState(false);
  const [sunatResult, setSunatResult] = useState(null);
  const [payloadPreview, setPayloadPreview] = useState("");
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [enviandoWhatsapp, setEnviandoWhatsapp] = useState(false);
  const gremFirmada = Boolean(initialGrem?.vfirmado);
  const modoConsulta = gremFirmada;
  const gremEnviada = gremFirmada || Boolean(sunatResult?.codigo_hash);
  const pdfGenerado = Boolean(sunatResult?.pdf_generado && sunatResult?.ruta_pdf && sunatResult?.ruta_pdf !== "error");
  const tieneDescargas = Boolean(sunatResult?.ruta_xml || sunatResult?.ruta_cdr || sunatResult?.ruta_pdf);

  const initialKeys = useMemo(() => {
    if (!initialGrem?.detalles) return [];
    return initialGrem.detalles
      .map((detalle) => encomiendaKey(detalle))
      .filter(Boolean);
  }, [initialGrem]);

  const detallesIniciales = useMemo(() => (
    Array.isArray(initialGrem?.detalles)
      ? initialGrem.detalles.map((detalle) => detalleToEncomienda(detalle, initialGrem))
      : []
  ), [initialGrem]);

  const disponiblesBase = useMemo(() => {
    const map = new Map();
    detallesIniciales.forEach((item) => {
      const key = encomiendaKey(item);
      if (key) map.set(key, item);
    });

    encomiendas.filter((item) => (
      !item.entregada &&
      (!tieneGrem(item) || initialKeys.includes(encomiendaKey(item)))
    )).forEach((item) => {
      map.set(encomiendaKey(item), item);
    });

    return Array.from(map.values());
  }, [detallesIniciales, encomiendas, initialKeys]);

  const seleccionSet = useMemo(() => new Set(seleccionKeys), [seleccionKeys]);
  const scannerSet = useMemo(() => new Set(scannerKeys), [scannerKeys]);
  const seleccionadas = useMemo(() => (
    disponiblesBase.filter((item) => seleccionSet.has(encomiendaKey(item)))
  ), [disponiblesBase, seleccionSet]);
  const escaneadas = useMemo(() => (
    disponiblesBase.filter((item) => scannerSet.has(encomiendaKey(item)))
  ), [disponiblesBase, scannerSet]);
  const seleccionEmision = modoCarga === "scanner" ? escaneadas : seleccionadas;

  const disponibles = useMemo(() => {
    const term = normalizarFiltro(filtro);
    if (!term || modoCarga === "scanner") return disponiblesBase;
    return disponiblesBase.filter((item) => (
      normalizarFiltro(item.descripcion).includes(term) ||
      normalizarFiltro(item.cliente).includes(term) ||
      normalizarFiltro(item.destinatario).includes(term) ||
      normalizarFiltro([item.r_cod_ref || item.r_cod, item.r_serie_ref || item.r_serie, item.r_numero_ref || item.r_numero].filter(Boolean).join("-")).includes(term)
    ));
  }, [disponiblesBase, filtro, modoCarga]);

  const agenciasDisponibles = useMemo(() => {
    const map = new Map();

    puntosVentaAsignados.forEach((punto) => {
      mergeAgencia(map, {
        id_punto_venta: punto.id_punto_venta,
        nombre: punto.nombre || punto.punto_venta_nombre,
        direccion: punto.direccion,
        ubigeo: punto.ubigeo || punto.id_ubigeo,
      });
    });

    rutasDisponibles.forEach((ruta) => {
      mergeAgencia(map, {
        id_punto_venta: ruta.id_punto_venta,
        nombre: ruta.punto_venta_nombre,
        direccion: ruta.punto_venta_direccion,
        ubigeo: ruta.punto_venta_ubigeo,
      });
      mergeAgencia(map, {
        id_punto_venta: ruta.id_punto_venta_dest,
        nombre: ruta.punto_venta_dest_nombre || ruta.punto_venta_destino_nombre || ruta.destino_nombre,
        direccion: ruta.punto_venta_dest_direccion,
        ubigeo: ruta.punto_venta_dest_ubigeo,
      });
    });

    encomiendas.forEach((item) => {
      mergeAgencia(map, {
        id_punto_venta: item.id_punto_venta,
        nombre: item.punto_venta_nombre,
        direccion: item.punto_venta_direccion,
        ubigeo: item.punto_venta_ubigeo,
      });
      mergeAgencia(map, {
        id_punto_venta: item.id_punto_venta_dest,
        nombre: item.punto_venta_dest_nombre || item.punto_venta_destino_nombre || item.destino_nombre,
        direccion: item.punto_venta_dest_direccion,
        ubigeo: item.punto_venta_dest_ubigeo,
      });
    });

    return Array.from(map.values()).sort((a, b) => agenciaLabel(a).localeCompare(agenciaLabel(b)));
  }, [encomiendas, puntosVentaAsignados, rutasDisponibles]);

  const agenciasFiltradas = useMemo(() => {
    const term = normalizarFiltro(agenciaFiltro);
    if (!term) return agenciasDisponibles;

    return agenciasDisponibles.filter((agencia) => (
      normalizarFiltro(agencia.id_punto_venta).includes(term) ||
      normalizarFiltro(agencia.nombre).includes(term) ||
      normalizarFiltro(agencia.direccion).includes(term) ||
      normalizarFiltro(agencia.ubigeo).includes(term)
    ));
  }, [agenciaFiltro, agenciasDisponibles]);

  const ubigeosFiltrados = useMemo(() => {
    const term = normalizarFiltro(ubigeoFiltro);
    if (!term) return ubigeosBase;

    return ubigeosBase.filter((item) => (
      normalizarFiltro(item.codigo).includes(term) ||
      normalizarFiltro(item.descripcion).includes(term)
    ));
  }, [ubigeoFiltro, ubigeosBase]);

  const agenciaOrigenTrabajo = useMemo(() => (
    agenciasDisponibles.find((item) => item.id_punto_venta === puntoVentaTrabajo)
  ), [agenciasDisponibles, puntoVentaTrabajo]);

  const formIncompleto = !form.serie ||
    !form.fecha_traslado ||
    !form.motivo_traslado_id ||
    !form.modalidad_traslado_id ||
    !form.partida_ubigeo ||
    !form.partida_direccion ||
    !form.llegada_ubigeo ||
    !form.llegada_direccion ||
    !form.peso_total ||
    Number(form.peso_total) <= 0 ||
    !form.numero_bultos ||
    Number(form.numero_bultos) <= 0 ||
    !form.placa ||
    !form.licencia ||
    !form.conductor_dni ||
    !form.conductor_nombres ||
    !form.conductor_apellidos ||
    seleccionEmision.length === 0;

  useEffect(() => {
    if (!open) return;
    const baseSeleccion = initialKeys.length ? initialKeys : [];
    const seleccionInicial = disponiblesBase.filter((item) => baseSeleccion.includes(encomiendaKey(item)));
    setSeleccionKeys(baseSeleccion);
    setScannerKeys([]);
    setModoCarga("listado");
    setFiltro("");
    setFeedback(null);
    const rutasDescarga = construirRutasDescargaGrem(backHost, initialGrem);
    setSunatResult(initialGrem?.vfirmado ? {
      codigo_hash: initialGrem.vfirmado,
      ruta_xml: initialGrem.ruta_xml || rutasDescarga.ruta_xml,
      ruta_cdr: initialGrem.ruta_cdr || rutasDescarga.ruta_cdr,
      ruta_pdf: initialGrem.ruta_pdf || rutasDescarga.ruta_pdf,
    } : null);
    setAgenciaPicker(null);
    setAgenciaFiltro("");
    setCabeceraOpen(Boolean(initialGrem));
    const primera = seleccionInicial[0] || disponiblesBase[0];
    const agenciaDestino = agenciasDisponibles.find((item) => (
      item.id_punto_venta === cleanText(initialGrem?.llegada_agencia_id || initialGrem?.id_punto_venta_dest || primera?.id_punto_venta_dest)
    ));
    setForm(defaultForm({
      grem: initialGrem,
      primera,
      cantidad: Math.max(seleccionInicial.length || 1, 1),
      agenciaOrigen: agenciaOrigenTrabajo,
      agenciaDestino,
    }));
  }, [agenciaOrigenTrabajo, agenciasDisponibles, backHost, disponiblesBase, initialGrem, initialKeys, open]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeout = setTimeout(() => setFeedback(null), 2600);
    return () => clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (!Array.isArray(ubigeosPrecargados) || ubigeosPrecargados.length === 0) return;
    setUbigeosBase(ubigeosPrecargados);
  }, [ubigeosPrecargados]);

  useEffect(() => {
    setUbigeosLoading(ubigeosPrecargando && ubigeosBase.length === 0);
  }, [ubigeosBase.length, ubigeosPrecargando]);

  useEffect(() => {
    if (!open || ubigeosBase.length > 0 || ubigeosPrecargando) return undefined;

    let active = true;
    setUbigeosLoading(true);
    cargarUbigeosGrem(backHost)
      .then((data) => {
        if (active) setUbigeosBase(data);
      })
      .catch((error) => {
        console.log("No se pudo cargar ubigeos GREM:", error);
        if (active) setUbigeosBase([]);
      })
      .finally(() => {
        if (active) setUbigeosLoading(false);
      });

    return () => {
      active = false;
    };
  }, [backHost, open, ubigeosBase.length, ubigeosPrecargando]);

  useEffect(() => {
    if (!open || !cabeceraOpen) return undefined;

    const timeout = setTimeout(() => {
      destinoAgenciaRef.current?.focus();
      destinoAgenciaRef.current?.select?.();
    }, 80);

    return () => clearTimeout(timeout);
  }, [cabeceraOpen, open]);

  useEffect(() => {
    if (!ubigeoModal) return undefined;

    const timeout = setTimeout(() => {
      ubigeoFiltroRef.current?.focus();
      ubigeoFiltroRef.current?.select?.();
    }, 80);

    return () => clearTimeout(timeout);
  }, [ubigeoModal]);

  useEffect(() => {
    if (!agenciaPicker) return undefined;

    const timeout = setTimeout(() => {
      agenciaFiltroRef.current?.focus();
      agenciaFiltroRef.current?.select?.();
    }, 80);

    return () => clearTimeout(timeout);
  }, [agenciaPicker]);

  useEffect(() => {
    setAgenciaSelectedIndex(0);
  }, [agenciaFiltro, agenciaPicker]);

  useEffect(() => {
    if (agenciaSelectedIndex >= agenciasFiltradas.length) {
      setAgenciaSelectedIndex(Math.max(0, agenciasFiltradas.length - 1));
    }
  }, [agenciaSelectedIndex, agenciasFiltradas.length]);

  useEffect(() => {
    agenciaSelectedRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [agenciaSelectedIndex]);

  useEffect(() => {
    if (modoCarga !== "scanner") return;
    const codigo = extraerCodigoEscaneado(filtro);
    if (!codigo) return;

    const encontrada = encomiendas.find((item) => coincideCodigoEscaneado(item, codigo));
    if (!encontrada) {
      setFeedback({ severity: "error", message: `No se encontro ${codigo.serie}-${codigo.numero}.` });
    } else if (encontrada.entregada) {
      setFeedback({ severity: "warning", message: `La encomienda ${codigo.serie}-${codigo.numero} ya fue entregada.` });
    } else if (tieneGrem(encontrada) && !initialKeys.includes(encomiendaKey(encontrada))) {
      setFeedback({ severity: "warning", message: `La encomienda ${codigo.serie}-${codigo.numero} ya tiene GREM.` });
    } else {
      const key = encomiendaKey(encontrada);
      if (scannerSet.has(key)) {
        setFeedback({ severity: "info", message: `La encomienda ${codigo.serie}-${codigo.numero} ya estaba en la bandeja.` });
      } else {
        setScannerKeys((prev) => [...prev, key]);
        setFeedback({ severity: "success", message: `Agregada ${codigo.serie}-${codigo.numero}.` });
      }
    }

    setFiltro("");
    setTimeout(() => filtroInputRef.current?.focus(), 40);
  }, [encomiendas, filtro, initialKeys, modoCarga, scannerSet]);

  const requestBody = (soloPayload = false) => ({
    periodo: periodoTrabajo,
    id_usuario: idAnfitrion,
    documento_id: documentoId,
    id_invitado: idInvitado,
    ctrl_mod_us: idInvitado,
    solo_payload: soloPayload,
    guia: {
      ...form,
      serie: normalizarSerieGrem(form.serie),
      codigo: "31",
      id_punto_venta: form.partida_agencia_id,
      id_punto_venta_dest: form.llegada_agencia_id,
      motivo_traslado_id: "13",
      modalidad_traslado_id: "01",
    },
    encomiendas: seleccionEmision.map((item) => ({
      r_cod: item.r_cod,
      r_serie: item.r_serie,
      r_numero: item.r_numero,
      elemento: item.elemento || 1,
    })),
  });

  const toggleSeleccion = (row) => {
    if (tieneGrem(row) && !initialKeys.includes(encomiendaKey(row))) return;
    const key = encomiendaKey(row);
    const setter = modoCarga === "scanner" ? setScannerKeys : setSeleccionKeys;
    setter((prev) => (
      prev.includes(key)
        ? prev.filter((item) => item !== key)
        : [...prev, key]
    ));
  };

  const seleccionarVisibles = () => {
    setSeleccionKeys(disponibles.map(encomiendaKey));
  };

  const abrirAgenciaPicker = (tipo) => {
    setAgenciaFiltro("");
    setAgenciaSelectedIndex(0);
    setAgenciaPicker(tipo);
  };

  const seleccionarAgencia = (tipo, agencia) => {
    if (!tipo || !agencia?.id_punto_venta) return;

    const prefix = tipo === "origen" ? "partida" : "llegada";
    const nextRef = tipo === "origen" ? destinoAgenciaRef : placaRef;
    setForm((prev) => ({
      ...prev,
      [`${prefix}_agencia_id`]: agencia.id_punto_venta,
      [`${prefix}_agencia_nombre`]: agencia.nombre || agencia.punto_venta_nombre || "",
      [`${prefix}_ubigeo`]: agencia.ubigeo || agencia.id_ubigeo || prev[`${prefix}_ubigeo`],
      [`${prefix}_direccion`]: agencia.direccion || prev[`${prefix}_direccion`],
    }));
    setAgenciaPicker(null);
    setTimeout(() => {
      nextRef.current?.focus();
      nextRef.current?.select?.();
    }, 60);
  };

  const handleAgenciaKeyDown = (event) => {
    if (event.key === "ArrowDown" && agenciasFiltradas.length > 0) {
      event.preventDefault();
      setAgenciaSelectedIndex((prev) => Math.min(prev + 1, agenciasFiltradas.length - 1));
      return;
    }

    if (event.key === "ArrowUp" && agenciasFiltradas.length > 0) {
      event.preventDefault();
      setAgenciaSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      seleccionarAgencia(agenciaPicker, agenciasFiltradas[agenciaSelectedIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setAgenciaPicker(null);
    }
  };

  const abrirUbigeoModal = (tipo) => {
    setUbigeoFiltro("");
    setUbigeoModal(tipo);

    if (ubigeosBase.length === 0 && !ubigeosLoading && !ubigeosPrecargando) {
      setUbigeosLoading(true);
      cargarUbigeosGrem(backHost)
        .then(setUbigeosBase)
        .catch((error) => {
          console.log("No se pudo cargar ubigeos GREM:", error);
          setUbigeosBase([]);
        })
        .finally(() => setUbigeosLoading(false));
    }
  };

  const seleccionarUbigeo = (tipo, row) => {
    if (!tipo || !row?.codigo) return;

    const codigoKey = tipo === "partida" ? "partida_ubigeo" : "llegada_ubigeo";
    const nombreKey = tipo === "partida" ? "partida_ubigeo_nombre" : "llegada_ubigeo_nombre";

    setForm((prev) => ({
      ...prev,
      [codigoKey]: row.codigo,
      [nombreKey]: row.descripcion,
    }));
    setUbigeoModal(null);
    setTimeout(() => {
      const nextRef = tipo === "partida" ? partidaDireccionRef : llegadaDireccionRef;
      nextRef.current?.focus();
      nextRef.current?.select?.();
    }, 60);
  };

  const seleccionarPlaca = (item) => {
    setForm((prev) => ({
      ...prev,
      placa: item?.placa || "",
    }));
    setPlacaPickerOpen(false);
    setTimeout(() => {
      licenciaRef.current?.focus();
      licenciaRef.current?.select?.();
    }, 60);
  };

  const seleccionarLicencia = (item) => {
    setForm((prev) => ({
      ...prev,
      licencia: item?.licencia || "",
      conductor_dni: item?.dni || prev.conductor_dni,
      conductor_nombres: item?.nombres ? String(item.nombres).toUpperCase() : prev.conductor_nombres,
      conductor_apellidos: item?.apellidos ? String(item.apellidos).toUpperCase() : prev.conductor_apellidos,
    }));
    setLicenciaPickerOpen(false);
    setTimeout(() => {
      conductorDocumentoRef.current?.focus();
      conductorDocumentoRef.current?.select?.();
    }, 60);
  };

  const handleUbigeoKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      seleccionarUbigeo(ubigeoModal, ubigeosFiltrados[0]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setUbigeoModal(null);
    }
  };

  const mostrarError = async (error, title) => {
    const data = error?.response?.data || {};
    await confirmDialog({
      title,
      message: data.mensaje_usuario || data.message || "No se pudo procesar la GREM.",
      icon: "error",
      confirmText: "ACEPTAR",
    });
  };

  const abrirDescarga = (url) => {
    if (!url || url === "error") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const normalizarTelefonoWhatsapp = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("51") && digits.length >= 11) return digits;
    if (digits.length === 9) return `51${digits}`;
    return digits;
  };

  const obtenerLinksGremWhatsapp = () => ([
    ["PDF", sunatResult?.ruta_pdf],
    ["XML", sunatResult?.ruta_xml],
    ["CDR", sunatResult?.ruta_cdr],
  ]).filter(([, url]) => url && url !== "error");

  const crearMensajeWhatsappGrem = () => {
    const comprobante = [form.serie, form.numero].filter(Boolean).join("-");
    const links = obtenerLinksGremWhatsapp()
      .map(([label, url]) => `${label}: ${url}`)
      .join("\n");

    return [
      "expertcont.pe",
      `Compartimos la Guia de Remision Electronica Transportista${comprobante ? ` ${comprobante}` : ""}.`,
      form.placa ? `Placa: ${form.placa}` : "",
      form.conductor_nombres || form.conductor_apellidos ? `Conductor: ${[form.conductor_nombres, form.conductor_apellidos].filter(Boolean).join(" ")}` : "",
      "",
      links,
      "",
      "Puede abrir estos enlaces desde el navegador para la verificacion en ruta.",
    ].filter((line) => line !== null && line !== undefined).join("\n").trim();
  };

  const cerrarFlujoWhatsapp = () => {
    if (enviandoWhatsapp) return;
    setWhatsappModalOpen(false);
    setWhatsappNumero("");
  };

  const abrirEnvioWhatsapp = () => {
    setWhatsappNumero("");
    setWhatsappModalOpen(true);
  };

  const enviarGremPorWhatsapp = async () => {
    const telefono = normalizarTelefonoWhatsapp(whatsappNumero);

    if (!telefono) {
      await confirmDialog({
        title: "Indica celular",
        message: "Necesitamos el numero del chofer o auditor para enviar la GREM por WhatsApp.",
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      return;
    }

    const links = obtenerLinksGremWhatsapp();
    if (!links.length) {
      await confirmDialog({
        title: "Sin enlaces disponibles",
        message: "Primero genera o envia la GREM para tener los links de PDF, XML o CDR.",
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      return;
    }

    setEnviandoWhatsapp(true);
    try {
      const mensaje = crearMensajeWhatsappGrem();
      const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setWhatsappModalOpen(false);
      setWhatsappNumero("");
    } finally {
      setEnviandoWhatsapp(false);
    }
  };

  const verPayloadPrevio = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${backHost}/mve_transventa/grem/payload`, requestBody(true));
      setPayloadPreview(JSON.stringify(response.data?.payload || response.data, null, 2));
    } catch (error) {
      await mostrarError(error, "No se pudo generar payload");
    } finally {
      setLoading(false);
    }
  };

  const ejecutarAccion = async (tipo) => {
    const endpoint = tipo === "sunat" ? "sunat" : tipo === "pdf" ? "pdf" : "grabar";
    const title = tipo === "sunat" ? "Enviar GREM a SUNAT?" : tipo === "pdf" ? "Generar PDF de GREM?" : "Grabar GREM?";
    const result = await confirmDialog({
      title,
      message: `${seleccionEmision.length} encomienda(s) seleccionada(s).`,
      icon: "success",
      confirmText: tipo === "sunat" ? "ENVIAR" : tipo === "pdf" ? "GENERAR PDF" : "GRABAR",
      cancelText: "CANCELAR",
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      console.log(`${backHost}/mve_transventa/grem/${endpoint}  ... `, requestBody(false));
      const response = await axios.post(`${backHost}/mve_transventa/grem/${endpoint}`, requestBody(false));
      if (tipo === "sunat") {
        setSunatResult({
          codigo_hash: response.data?.codigo_hash || null,
          ruta_xml: response.data?.ruta_xml || null,
          ruta_cdr: response.data?.ruta_cdr || null,
          ruta_pdf: response.data?.ruta_pdf || null,
        });
        setForm((prev) => ({
          ...prev,
          serie: response.data?.grem_serie || prev.serie,
          numero: response.data?.grem_numero || prev.numero,
        }));
      } else if (tipo === "pdf") {
        setSunatResult((prev) => ({
          ...prev,
          pdf_generado: true,
          ruta_pdf: response.data?.ruta_pdf || null,
        }));
        setForm((prev) => ({
          ...prev,
          serie: response.data?.grem_serie || prev.serie,
          numero: response.data?.grem_numero || prev.numero,
        }));
      }
      await confirmDialog({
        title: response.data?.titulo_usuario || "GREM procesada",
        message: response.data?.persistencia_advertencia || response.data?.mensaje_usuario || "Operacion completada.",
        icon: response.data?.persistencia_advertencia ? "warning" : "success",
        confirmText: "ACEPTAR",
      });
      if (tipo !== "pdf") onSaved?.();
      if (tipo === "grabar") onClose?.();
    } catch (error) {
      await mostrarError(error, tipo === "sunat" ? "No se pudo enviar a SUNAT" : tipo === "pdf" ? "No se pudo generar el PDF" : "No se pudo grabar la GREM");
    } finally {
      setLoading(false);
    }
  };

  const abrirCabecera = () => {
    if (seleccionEmision.length === 0) return;

    const primera = seleccionEmision[0];
    const agenciaDestino = agenciasDisponibles.find((item) => (
      item.id_punto_venta === cleanText(primera?.id_punto_venta_dest)
    ));

    setForm((prev) => defaultForm({
      grem: {
        ...initialGrem,
        ...prev,
        guia_motivo_id: "13",
        guia_modalidad_id: prev.modalidad_traslado_id,
        vehiculo_placa: prev.placa,
        conductor_dni: prev.conductor_dni,
        conductor_licencia: prev.licencia,
        glosa: prev.observacion,
      },
      primera,
      cantidad: seleccionEmision.length,
      agenciaOrigen: agenciaOrigenTrabajo,
      agenciaDestino,
    }));
    setCabeceraOpen(true);
  };

  const columns = [
    {
      name: "",
      grow: 1,
      cell: (row) => (
        <GremEncomiendaRow
          row={row}
          checked={modoCarga === "scanner" ? scannerSet.has(encomiendaKey(row)) : seleccionSet.has(encomiendaKey(row))}
          onToggle={toggleSeleccion}
          disponible={!tieneGrem(row) || initialKeys.includes(encomiendaKey(row))}
        />
      ),
    },
  ];

  const dataTabla = modoCarga === "scanner" ? escaneadas : disponibles;
  const origenAgenciaSeleccionada = agenciasDisponibles.find((item) => item.id_punto_venta === form.partida_agencia_id);
  const destinoAgenciaSeleccionada = agenciasDisponibles.find((item) => item.id_punto_venta === form.llegada_agencia_id);
  const origenAgenciaTexto = agenciaLabel(origenAgenciaSeleccionada) || agenciaLabel({
    id_punto_venta: form.partida_agencia_id,
    nombre: form.partida_agencia_nombre,
  });
  const destinoAgenciaTexto = agenciaLabel(destinoAgenciaSeleccionada) || agenciaLabel({
    id_punto_venta: form.llegada_agencia_id,
    nombre: form.llegada_agencia_nombre,
  });
  const ubigeoTitulo = ubigeoModal === "partida" ? "Ubigeo de partida" : "Ubigeo de llegada";
  const agenciaTitulo = agenciaPicker === "origen" ? "Origen" : "Destino";
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: "min(860px, 94vw)",
          maxWidth: "96vw",
          maxHeight: "92vh",
          backgroundColor: palette.bg,
          border: `1px solid ${palette.borderSoft}`,
          borderRadius: palette.radius.modal,
          boxShadow: palette.shadowSoft,
          color: palette.text,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ p: { xs: 1.4, sm: 2 }, borderBottom: `1px solid ${palette.borderSoft}`, backgroundColor: palette.surface }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.4, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0, flex: "1 1 auto" }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: palette.radius.control,
                display: "grid",
                placeItems: "center",
                backgroundColor: palette.accentSoft,
                color: palette.accent,
                flexShrink: 0,
              }}
            >
              <FilePlus2 size={18} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: palette.text }}>
                {initialGrem ? `Editar GREM ${initialGrem.serie}-${initialGrem.numero}` : "Nueva GREM"}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: palette.muted, mt: 0.25 }}>
                {cabeceraOpen
                  ? (modoConsulta ? "Consulta la cabecera y descarga los archivos." : "Completa la cabecera y confirma la grabacion.")
                  : "Selecciona encomiendas por listado o QR."}
              </Typography>
            </Box>
          </Box>
          {cabeceraOpen && (
            <Box
              sx={{
                display: "flex",
                gap: 0.75,
                flexWrap: "wrap",
                justifyContent: { xs: "flex-start", sm: "flex-end" },
                width: { xs: "100%", sm: "auto" },
                flexShrink: 0,
              }}
            >
              <HeaderMeta label="Serie" value={form.serie} />
              <HeaderMeta label="Numero" value={form.numero || "Automatico"} />
            </Box>
          )}
        </Box>
      </DialogTitle>

      <Box sx={{ p: 2, display: "grid", gap: 1.2, overflow: "auto", ...scrollSx }}>
        {cabeceraOpen ? (
          <Box sx={{ display: "grid", gap: 0.65, pointerEvents: modoConsulta ? "none" : "auto", opacity: modoConsulta ? 0.92 : 1 }}>
            <SectionHeader icon={<FilePlus2 size={15} />} title="1. Traslado" />
            <Box sx={{ ...sectionSx, py: 1 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm={4} md={2.4}>
                  <Field label="Traslado">
                    <CaptureInput inputRef={fechaTrasladoRef} nextRef={pesoTotalRef} type="date" value={form.fecha_traslado} onChange={(value) => setForm((prev) => ({ ...prev, fecha_traslado: value }))} align="center" />
                  </Field>
                </Grid>
                <Grid item xs={6} sm={4} md={1.5}>
                  <Field label="KGM">
                    <CaptureInput inputRef={pesoTotalRef} nextRef={numeroBultosRef} value={form.peso_total} onChange={(value) => setForm((prev) => ({ ...prev, peso_total: value }))} inputMode="decimal" align="right" />
                  </Field>
                </Grid>
                <Grid item xs={6} sm={4} md={1.2}>
                  <Field label="Bultos">
                    <CaptureInput inputRef={numeroBultosRef} nextRef={destinoAgenciaRef} value={form.numero_bultos} onChange={(value) => setForm((prev) => ({ ...prev, numero_bultos: value }))} inputMode="numeric" align="right" />
                  </Field>
                </Grid>
                <Grid item xs={12} sm={4} md={2.3}>
                  <FixedChip label="Transp." value="01 - PUBLICO" />
                </Grid>
                <Grid item xs={12} sm={4} md={2.2}>
                  <FixedChip label="Motivo" value="13 - OTROS" />
                </Grid>
                <Grid item xs={12} sm={4} md={2.3}>
                  <FixedChip label="Obs." value="ENCOMIENDAS" />
                </Grid>
              </Grid>
            </Box>

            <SectionHeader icon={<MapPin size={15} />} title="2. Partida y llegada" />
            <Box sx={sectionSx}>
              <Grid container spacing={1}>
                <Grid item xs={12} md={4}>
                  <Field label="Origen">
                    <AgenciaField
                      inputRef={origenAgenciaRef}
                      value={origenAgenciaTexto}
                      placeholder="Origen"
                      fixed
                      nextRef={destinoAgenciaRef}
                    />
                  </Field>
                </Grid>
                <Grid item xs={12} sm={4} md={2.2}>
                  <Field label="Ubigeo">
                    <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
                      <CaptureInput
                        inputRef={partidaUbigeoRef}
                        value={form.partida_ubigeo}
                        nextRef={partidaDireccionRef}
                        onChange={(value) => setForm((prev) => ({ ...prev, partida_ubigeo: value }))}
                        onEmptyEnter={() => abrirUbigeoModal("partida")}
                        onEnter={() => {
                          partidaDireccionRef.current?.focus();
                          partidaDireccionRef.current?.select?.();
                        }}
                        onPlus={() => abrirUbigeoModal("partida")}
                        align="right"
                      />
                      <IconButton
                        size="small"
                        onClick={() => abrirUbigeoModal("partida")}
                        sx={{ color: palette.accent, p: 0.35, ml: 0.35, flexShrink: 0 }}
                        title="Buscar ubigeo de partida"
                      >
                        <Search size={14} />
                      </IconButton>
                    </Box>
                  </Field>
                </Grid>
                <Grid item xs={12} sm={8} md={5.8}>
                  <Field label="Direccion">
                    <CaptureInput inputRef={partidaDireccionRef} nextRef={llegadaUbigeoRef} value={form.partida_direccion} onChange={(value) => setForm((prev) => ({ ...prev, partida_direccion: String(value || "").toUpperCase() }))} placeholder="Direccion de partida" />
                  </Field>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Field label="Destino">
                    <AgenciaField
                      inputRef={destinoAgenciaRef}
                      value={destinoAgenciaTexto}
                      placeholder="Escoger destino"
                      onOpen={() => abrirAgenciaPicker("destino")}
                      nextRef={llegadaUbigeoRef}
                    />
                  </Field>
                </Grid>
                <Grid item xs={12} sm={4} md={2.2}>
                  <Field label="Ubigeo">
                    <Box sx={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0 }}>
                      <CaptureInput
                        inputRef={llegadaUbigeoRef}
                        value={form.llegada_ubigeo}
                        nextRef={llegadaDireccionRef}
                        onChange={(value) => setForm((prev) => ({ ...prev, llegada_ubigeo: value }))}
                        onEmptyEnter={() => abrirUbigeoModal("llegada")}
                        onEnter={() => {
                          llegadaDireccionRef.current?.focus();
                          llegadaDireccionRef.current?.select?.();
                        }}
                        onPlus={() => abrirUbigeoModal("llegada")}
                        align="right"
                      />
                      <IconButton
                        size="small"
                        onClick={() => abrirUbigeoModal("llegada")}
                        sx={{ color: palette.accent, p: 0.35, ml: 0.35, flexShrink: 0 }}
                        title="Buscar ubigeo de llegada"
                      >
                        <Search size={14} />
                      </IconButton>
                    </Box>
                  </Field>
                </Grid>
                <Grid item xs={12} sm={8} md={5.8}>
                  <Field label="Direccion">
                    <CaptureInput inputRef={llegadaDireccionRef} nextRef={placaRef} value={form.llegada_direccion} onChange={(value) => setForm((prev) => ({ ...prev, llegada_direccion: String(value || "").toUpperCase() }))} placeholder="Direccion de llegada" />
                  </Field>
                </Grid>
              </Grid>
            </Box>

            <SectionHeader icon={<Truck size={15} />} title="3. Vehiculo y conductor" />
            <Box sx={sectionSx}>
              <Grid container spacing={1}>
                <Grid item xs={12} md={3}>
                  <Field label="" labelWidth={0}>
                    <PlacaField
                      value={form.placa}
                      onChange={(value) => setForm((prev) => ({ ...prev, placa: String(value || "").toUpperCase() }))}
                      onOpen={() => setPlacaPickerOpen(true)}
                      inputRef={placaRef}
                      nextRef={licenciaRef}
                    />
                  </Field>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Field label="" labelWidth={0}>
                    <LicenciaField
                      value={form.licencia}
                      onChange={(value) => setForm((prev) => ({ ...prev, licencia: String(value || "").toUpperCase() }))}
                      onOpen={() => setLicenciaPickerOpen(true)}
                      inputRef={licenciaRef}
                      nextRef={conductorDocumentoRef}
                    />
                  </Field>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Field label="DNI">
                    <CaptureInput inputRef={conductorDocumentoRef} nextRef={conductorNombresRef} value={form.conductor_dni} onChange={(value) => setForm((prev) => ({ ...prev, conductor_dni: value }))} inputMode="numeric" pattern="[0-9]*" align="right" />
                  </Field>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Nombres">
                    <CaptureInput inputRef={conductorNombresRef} nextRef={conductorApellidosRef} value={form.conductor_nombres} onChange={(value) => setForm((prev) => ({ ...prev, conductor_nombres: String(value || "").toUpperCase() }))} />
                  </Field>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Apellidos">
                    <CaptureInput inputRef={conductorApellidosRef} nextRef={pesoTotalRef} value={form.conductor_apellidos} onChange={(value) => setForm((prev) => ({ ...prev, conductor_apellidos: String(value || "").toUpperCase() }))} />
                  </Field>
                </Grid>
              </Grid>
            </Box>
          </Box>
        ) : (
          <Box sx={{ minWidth: 0, display: "grid", gap: 1 }}>
            <Box sx={{ p: 0.5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5, border: `1px solid ${palette.borderSoft}`, borderRadius: palette.radius.control, backgroundColor: palette.surface }}>
              {[
                { value: "listado", label: "Escoger de listado" },
                { value: "scanner", label: "Escanear QR" },
              ].map((item) => {
                const activo = modoCarga === item.value;
                return (
                  <Box
                    key={item.value}
                    onClick={() => {
                      setModoCarga(item.value);
                      setFiltro("");
                      if (item.value === "scanner") setTimeout(() => filtroInputRef.current?.focus(), 80);
                    }}
                    sx={{
                      minHeight: 42,
                      borderRadius: palette.radius.control,
                      border: `1px solid ${activo ? palette.accent : "transparent"}`,
                      backgroundColor: activo ? palette.accentSoft : "transparent",
                      color: activo ? palette.text : palette.muted,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all .18s ease",
                      "&:hover": {
                        backgroundColor: activo ? palette.accentSoft : palette.chip,
                        color: palette.text,
                      },
                    }}
                  >
                    {item.label}
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <AppSearch
                placeholder={modoCarga === "listado" ? "Buscar encomienda..." : "Escanear QR..."}
                value={filtro}
                onChange={(event) => setFiltro(event.target.value)}
                inputRef={filtroInputRef}
                width="min(360px, 100%)"
              />
              <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                <AppButton sx={secondaryButtonSx} onClick={seleccionarVisibles} disabled={modoCarga !== "listado" || disponibles.length === 0}>
                  Seleccionar visibles
                </AppButton>
                <AppButton
                  icon={<RotateCcw size={16} />}
                  sx={secondaryButtonSx}
                  onClick={() => (modoCarga === "scanner" ? setScannerKeys([]) : setSeleccionKeys([]))}
                  disabled={seleccionEmision.length === 0}
                >
                  Limpiar
                </AppButton>
                <AppButton icon={<CheckCircle2 size={16} />} sx={primaryButtonSx} onClick={abrirCabecera} disabled={seleccionEmision.length === 0}>
                  Grabar GRE
                </AppButton>
              </Box>
            </Box>

            <Collapse in={Boolean(feedback)} timeout={180}>
              <Alert severity={feedback?.severity || "info"} variant="outlined" sx={{ borderRadius: palette.radius.control, backgroundColor: "rgba(15,23,42,0.76)", color: palette.text }}>
                {feedback?.message}
              </Alert>
            </Collapse>

            <Typography sx={{ color: palette.text, fontSize: 13, fontWeight: 900 }}>
              Seleccionadas: {seleccionEmision.length}
            </Typography>

            <DataTable
              theme="transportesDark"
              columns={columns}
              data={dataTabla}
              pagination
              paginationPerPage={5}
              highlightOnHover
              responsive
              customStyles={gremTableStyles}
              noDataComponent={
                <Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}>
                  <Search size={16} />
                  Sin encomiendas disponibles
                </Box>
              }
            />
          </Box>
        )}

        {cabeceraOpen && (gremEnviada || pdfGenerado) && (
          <Alert
            severity={tieneDescargas ? "success" : "info"}
            variant="outlined"
            sx={{ borderRadius: palette.radius.control, backgroundColor: "rgba(15,23,42,0.76)", color: palette.text }}
          >
            {gremEnviada ? "GRE enviada a SUNAT" : "PDF de GRE generado"}{form.serie && form.numero ? `: ${form.serie}-${form.numero}` : ""}.
          </Alert>
        )}

        {cabeceraOpen && tieneDescargas && (
          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <AppButton
              icon={<Code2 size={16} />}
              sx={downloadButtonSx}
              onClick={() => abrirDescarga(sunatResult?.ruta_xml)}
              disabled={!sunatResult?.ruta_xml || sunatResult?.ruta_xml === "error"}
            >
              XML
            </AppButton>
            <AppButton
              icon={<FileCheck2 size={16} />}
              sx={downloadButtonSx}
              onClick={() => abrirDescarga(sunatResult?.ruta_cdr)}
              disabled={!sunatResult?.ruta_cdr || sunatResult?.ruta_cdr === "error"}
            >
              CDR
            </AppButton>
            <AppButton
              icon={<FileText size={16} />}
              sx={downloadButtonSx}
              onClick={() => abrirDescarga(sunatResult?.ruta_pdf)}
              disabled={!sunatResult?.ruta_pdf || sunatResult?.ruta_pdf === "error"}
            >
              PDF
            </AppButton>
            <AppButton
              icon={<MessageCircle size={16} />}
              sx={{ ...downloadButtonSx, backgroundColor: "#128c7e", borderColor: "#128c7e", color: "#ffffff" }}
              onClick={abrirEnvioWhatsapp}
              disabled={loading || enviandoWhatsapp || obtenerLinksGremWhatsapp().length === 0}
            >
              Enviar WhatsApp
            </AppButton>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap", pt: 0.2 }}>
          {cabeceraOpen ? (
            <>
              {modoConsulta ? (
                <AppButton icon={<X size={16} />} sx={secondaryButtonSx} onClick={onClose}>Cerrar</AppButton>
              ) : (
                <>
                  <AppButton icon={<ArrowLeft size={16} />} sx={secondaryButtonSx} onClick={() => setCabeceraOpen(false)}>Volver</AppButton>
                  <AppButton icon={<Code2 size={16} />} sx={secondaryButtonSx} onClick={verPayloadPrevio} disabled={loading || formIncompleto}>
                    Payload
                  </AppButton>
                  <AppButton icon={<CheckCircle2 size={16} />} sx={secondaryButtonSx} onClick={() => ejecutarAccion("grabar")} disabled={loading || formIncompleto || gremEnviada}>
                    Grabar GRE
                  </AppButton>
                  <AppButton icon={<FileText size={16} />} sx={secondaryButtonSx} onClick={() => ejecutarAccion("pdf")} disabled={loading || formIncompleto}>
                    Generar PDF
                  </AppButton>
                  <AppButton icon={<Send size={16} />} sx={primaryButtonSx} onClick={() => ejecutarAccion("sunat")} disabled={loading || formIncompleto || gremEnviada}>
                    Enviar SUNAT
                  </AppButton>
                </>
              )}
            </>
          ) : (
            <>
              <AppButton icon={<X size={16} />} sx={secondaryButtonSx} onClick={onClose}>Cerrar</AppButton>
            </>
          )}
        </Box>
      </Box>
      <Dialog
        open={whatsappModalOpen}
        onClose={cerrarFlujoWhatsapp}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: palette.radius.panel,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, pb: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: palette.radius.control,
                display: "grid",
                placeItems: "center",
                backgroundColor: "rgba(18,140,126,0.14)",
                border: "1px solid rgba(18,140,126,0.32)",
                color: "#7ddbd3",
              }}
            >
              <MessageCircle size={16} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 900, lineHeight: 1.15 }}>
                Enviar GREM
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: 11, mt: 0.2 }}>
                WhatsApp del chofer o auditor
              </Typography>
            </Box>
          </Box>
          <IconButton disabled={enviandoWhatsapp} onClick={cerrarFlujoWhatsapp} size="small" sx={{ color: palette.muted }}>
            <X size={17} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.1 }}>
          <InputBase
            autoFocus
            value={whatsappNumero}
            onChange={(event) => setWhatsappNumero(event.target.value)}
            placeholder="Celular"
            disabled={enviandoWhatsapp}
            fullWidth
            sx={{
              border: `1px solid ${palette.border}`,
              borderRadius: palette.radius.control,
              px: 1.2,
              py: 0.6,
              color: palette.text,
              backgroundColor: palette.surfaceAlt,
              fontSize: 13,
              "& input": { color: palette.text },
            }}
          />
          <Typography sx={{ color: palette.muted, fontSize: 11, mt: 0.8 }}>
            Si no tiene codigo de pais, se asumira Peru (+51).
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: 11, mt: 0.4 }}>
            Se compartiran los links disponibles de PDF, XML y CDR.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.8, mt: 1.6, flexWrap: "wrap" }}>
            <AppButton disabled={enviandoWhatsapp} sx={secondaryButtonSx} onClick={cerrarFlujoWhatsapp}>
              Cancelar
            </AppButton>
            <AppButton
              icon={<MessageCircle size={15} />}
              disabled={enviandoWhatsapp}
              onClick={enviarGremPorWhatsapp}
              sx={{ backgroundColor: "#128c7e", borderColor: "#128c7e", color: "#ffffff", fontWeight: 800 }}
            >
              {enviandoWhatsapp ? "Preparando..." : "Enviar WhatsApp"}
            </AppButton>
          </Box>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(agenciaPicker)}
        onClose={() => setAgenciaPicker(null)}
        PaperProps={{
          sx: {
            width: "min(580px, 92vw)",
            maxWidth: "92vw",
            backgroundColor: palette.bg,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: palette.radius.modal,
            boxShadow: palette.shadowSoft,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ p: 1.4, borderBottom: `1px solid ${palette.borderSoft}` }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Box sx={{ width: 30, height: 30, borderRadius: palette.radius.control, display: "grid", placeItems: "center", backgroundColor: palette.accentSoft, color: palette.accent }}>
                <MapPin size={16} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: palette.text, fontSize: 15, fontWeight: 900, lineHeight: 1.1 }}>
                  {agenciaTitulo}
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: 11, lineHeight: 1.25 }}>
                  {agenciasFiltradas.length} agencias encontradas
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setAgenciaPicker(null)} size="small" sx={{ color: palette.muted }}>
              <X size={17} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 1.4, backgroundColor: palette.bg }}>
          <Box sx={{ display: "grid", gap: 1.2 }}>
            <AppSearch
              placeholder="Buscar agencia..."
              value={agenciaFiltro}
              onChange={(event) => setAgenciaFiltro(event.target.value)}
              onKeyDown={handleAgenciaKeyDown}
              inputRef={agenciaFiltroRef}
              width="100%"
            />
            <Box
              sx={{
                border: `1px solid ${palette.borderSoft}`,
                borderRadius: palette.radius.control,
                overflow: "hidden",
                backgroundColor: palette.surface,
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "82px 1fr 82px",
                  gap: 1,
                  px: 1.2,
                  py: 0.42,
                  borderBottom: `1px solid ${palette.borderSoft}`,
                  color: palette.muted,
                  fontSize: 9,
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                <span>Codigo</span>
                <span>Agencia</span>
                <span>Ubigeo</span>
              </Box>
              <Box sx={{ maxHeight: "min(320px, 44vh)", overflow: "auto", ...scrollSx }}>
                {agenciasFiltradas.length > 0 ? (
                  agenciasFiltradas.map((agencia, index) => {
                    const selected = index === agenciaSelectedIndex;
                    return (
                      <Box
                        key={agencia.id_punto_venta}
                        ref={selected ? agenciaSelectedRef : null}
                        onClick={() => seleccionarAgencia(agenciaPicker, agencia)}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "82px 1fr 82px",
                          gap: 1,
                          alignItems: "center",
                          minHeight: 30,
                          px: 1.2,
                          py: 0.35,
                          borderBottom: `1px solid ${palette.borderSoft}`,
                          cursor: "pointer",
                          transition: "background-color .15s ease",
                          backgroundColor: selected ? palette.accentSoft : "transparent",
                          outline: selected ? `1px solid ${palette.accent}` : "none",
                          outlineOffset: -1,
                          "&:hover": {
                            backgroundColor: selected ? palette.accentSoft : palette.surfaceAlt,
                          },
                        }}
                      >
                        <Typography sx={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, lineHeight: 1 }}>
                          {agencia.id_punto_venta}
                        </Typography>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: palette.text, fontSize: 11, fontWeight: 800, lineHeight: 1.1 }} noWrap>
                            {agencia.nombre || "-"}
                          </Typography>
                          <Typography sx={{ color: palette.muted, fontSize: 10, fontWeight: 600, lineHeight: 1.2 }} noWrap>
                            {agencia.direccion || "Sin direccion registrada"}
                          </Typography>
                        </Box>
                        <Typography sx={{ color: palette.text, fontSize: 10.5, fontWeight: 800, lineHeight: 1 }}>
                          {agencia.ubigeo || "-"}
                        </Typography>
                      </Box>
                    );
                  })
                ) : (
                  <Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <Search size={16} />
                    Sin agencias para el filtro actual
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(payloadPreview)}
        onClose={() => setPayloadPreview("")}
        PaperProps={{
          sx: {
            width: "min(860px, 94vw)",
            maxWidth: "94vw",
            borderRadius: palette.radius.panel,
            backgroundColor: palette.bg,
            border: `1px solid ${palette.border}`,
          },
        }}
      >
        <DialogTitle sx={{ p: 1.3, borderBottom: `1px solid ${palette.border}` }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Code2 size={18} color={palette.accent} />
              <Typography sx={{ color: palette.text, fontSize: 14, fontWeight: 900 }}>
                Payload previo
              </Typography>
            </Box>
            <IconButton onClick={() => setPayloadPreview("")} size="small" sx={{ color: palette.muted }}>
              <X size={17} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 1.4, backgroundColor: palette.bg }}>
          <Box
            component="pre"
            sx={{
              m: 0,
              maxHeight: "min(620px, 70vh)",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              lineHeight: 1.45,
              color: palette.text,
              backgroundColor: "rgba(15,23,42,0.88)",
              border: `1px solid ${palette.border}`,
              borderRadius: palette.radius.control,
              p: 1.4,
              ...scrollSx,
            }}
          >
            {payloadPreview}
          </Box>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(ubigeoModal)}
        onClose={() => setUbigeoModal(null)}
        PaperProps={{
          sx: {
            width: "min(520px, 92vw)",
            maxWidth: "92vw",
            backgroundColor: palette.bg,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: palette.radius.modal,
            boxShadow: palette.shadowSoft,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ p: 1.4, borderBottom: `1px solid ${palette.borderSoft}` }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Box sx={{ width: 30, height: 30, borderRadius: palette.radius.control, display: "grid", placeItems: "center", backgroundColor: palette.accentSoft, color: palette.accent }}>
                <MapPin size={16} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: palette.text, fontSize: 15, fontWeight: 900, lineHeight: 1.1 }}>
                  {ubigeoTitulo}
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: 11, lineHeight: 1.25 }}>
                  {ubigeosLoading ? "Cargando ubigeos..." : `${ubigeosFiltrados.length} ubicaciones encontradas`}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setUbigeoModal(null)} size="small" sx={{ color: palette.muted }}>
              <X size={17} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 1.4, backgroundColor: palette.bg }}>
          <Box sx={{ display: "grid", gap: 1.2 }}>
            <AppSearch
              placeholder="Buscar por codigo o distrito..."
              value={ubigeoFiltro}
              onChange={(event) => setUbigeoFiltro(event.target.value)}
              onKeyDown={handleUbigeoKeyDown}
              inputRef={ubigeoFiltroRef}
              width="100%"
            />
            <Box
              sx={{
                border: `1px solid ${palette.borderSoft}`,
                borderRadius: palette.radius.control,
                overflow: "hidden",
                backgroundColor: palette.surface,
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "78px 1fr",
                  gap: 1,
                  px: 1.2,
                  py: 0.42,
                  borderBottom: `1px solid ${palette.borderSoft}`,
                  color: palette.muted,
                  fontSize: 9,
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                <span>Codigo</span>
                <span>Descripcion</span>
              </Box>
              <Box sx={{ maxHeight: "min(300px, 42vh)", overflow: "auto", ...scrollSx }}>
                {ubigeosFiltrados.length > 0 ? (
                  ubigeosFiltrados.map((row) => (
                    <Box
                      key={row.codigo}
                      onClick={() => seleccionarUbigeo(ubigeoModal, row)}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "78px 1fr",
                        gap: 1,
                        alignItems: "center",
                        minHeight: 24,
                        px: 1.2,
                        py: 0.16,
                        borderBottom: `1px solid ${palette.borderSoft}`,
                        cursor: "pointer",
                        transition: "background-color .15s ease",
                        "&:hover": {
                          backgroundColor: palette.surfaceAlt,
                        },
                      }}
                    >
                      <Typography sx={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, lineHeight: 1 }}>
                        {row.codigo}
                      </Typography>
                      <Typography sx={{ color: palette.text, fontSize: 10.5, fontWeight: 700, lineHeight: 1 }}>
                        {row.descripcion}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <Search size={16} />
                    {ubigeosLoading ? "Cargando ubigeos..." : "Sin ubigeos para el filtro actual"}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
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
