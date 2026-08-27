"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable, { createTheme } from "react-data-table-component";
import { Box, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import {
  BadgeCheck,
  Bus,
  Calendar,
  ChevronDown,
  MapPin,
  Package,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  Truck,
  UserPen,
} from "lucide-react";
import swal2 from "sweetalert2";

import DaySelector from "../AdminDias";
import { useDialog } from "../AdminConfirmDialogProvider";
import AppButton from "../../ui/AppButton";
import AppChip from "../../ui/AppChip";
import AppSearch from "../../ui/AppSearch";
import palette from "../../../theme/palette";
import TransportesBoletoModal from "./TransportesBoletoModal";
import TransportesEncomiendaModal from "./TransportesEncomiendaModal";

createTheme(
  "transportesDark",
  {
    text: { primary: palette.text, secondary: palette.accent },
    background: { default: "transparent" },
    context: { background: palette.accent, text: "#FFFFFF" },
    divider: { default: palette.borderSoft },
    action: {
      button: "rgba(255,255,255,.54)",
      hover: "rgba(42,161,152,0.06)",
      disabled: "rgba(255,255,255,.12)",
    },
  },
  "dark",
);

const formatMoney = (value) => `PEN ${Number(value || 0).toLocaleString("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatFecha = (fecha) => {
  const fechaTexto = String(fecha || "").slice(0, 10);
  if (!fechaTexto) {
    return "";
  }
  return fechaTexto.split("-").reverse().join("/");
};

const numeroOperacion = (item) => [
  item.r_cod,
  item.r_serie,
  item.r_numero,
].filter(Boolean).join("-");

const tipoOperacion = (item) => item.tipo_operacion === "E" ? "Encomienda" : "Boleto";

const normalizarTextoBusqueda = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

const crearIndiceBusqueda = (item) => [
  numeroOperacion(item),
  item.cliente,
  item.cliente_documento,
  item.cliente_documento_id,
  item.destinatario,
  item.destinatario_documento,
  item.destinatario_documento_id,
  item.descripcion,
  item.placa,
  item.licencia,
].map(normalizarTextoBusqueda).join(" ");

const normalizarOperacion = (item) => ({
  ...item,
  numero: numeroOperacion(item),
  fecha: formatFecha(item.r_fecemi),
  tipoLabel: tipoOperacion(item),
  clienteLabel: item.cliente || "Sin cliente",
  rutaLabel: item.nombre_ruta || item.id_ruta || "Sin ruta",
  servicioLabel: item.descripcion || item.id_ruta || "Servicio de transporte",
  autor: item.ctrl_crea_us || "Sin autor",
  total: Number(item.r_monto_total || item.precio_neto || 0),
  entregada: Boolean(item.entrega_fecha),
});

const customStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: { style: { display: "none" } },
  rows: {
    style: {
      backgroundColor: palette.surface,
      color: palette.text,
      minHeight: "112px",
      marginBottom: "10px",
      borderRadius: "12px",
      border: `1px solid ${palette.borderSoft}`,
      paddingLeft: "16px",
      paddingRight: "16px",
      transition: "border-color .18s ease, background-color .18s ease",
      "&:hover": {
        backgroundColor: palette.surfaceAlt,
        borderColor: palette.border,
      },
    },
  },
  pagination: {
    style: {
      backgroundColor: "transparent",
      color: palette.muted,
      borderTop: `1px solid ${palette.borderSoft}`,
      marginTop: "8px",
    },
    pageButtonsStyle: {
      color: palette.muted,
      fill: palette.muted,
      "&:hover:not(:disabled)": { backgroundColor: palette.accentSoft },
      "&:disabled": { color: palette.border, fill: palette.border },
    },
  },
};

const actionButtonSx = (danger = false) => ({
  width: { xs: 42, sm: 30 },
  height: { xs: 42, sm: 30 },
  borderRadius: { xs: 2, sm: 1.5 },
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: palette.chip,
  border: `1px solid ${palette.border}`,
  color: palette.muted,
  cursor: "pointer",
  transition: "all .18s ease",
  boxShadow: { xs: "0 8px 18px rgba(0,0,0,.16)", sm: "none" },
  "& svg": {
    width: { xs: 20, sm: 14 },
    height: { xs: 20, sm: 14 },
  },
  "&:hover": {
    backgroundColor: danger ? "#c2410c" : palette.accent,
    borderColor: danger ? "#c2410c" : palette.accent,
    color: "#ffffff",
  },
});

const headerFieldSx = {
  height: { xs: 32, md: 42 },
  px: { xs: 0.5, md: 1.5 },
  display: "flex",
  alignItems: "center",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  color: palette.text,
  fontSize: { xs: "12px", md: "13px" },
};

function HeaderInlineLabel({ children }) {
  return (
    <Typography
      component="span"
      sx={{
        color: palette.muted,
            fontSize: { xs: "9px", md: "10px" },
            fontWeight: 800,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            mr: { xs: 0.5, md: 1 },
            flexShrink: 0,
      }}
    >
      {children}
    </Typography>
  );
}

function HeaderMenuPicker({ label, value, displayValue, options, onSelect, minWidth = 140 }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const menuMinWidth = anchorEl?.offsetWidth || (typeof minWidth === "number" ? minWidth : 180);
  const isFullWidth = minWidth === "100%" || minWidth?.xs === "100%";

  return (
    <>
      <Box
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          ...headerFieldSx,
          minWidth: { xs: 0, md: minWidth === "100%" ? 0 : minWidth },
          width: { xs: "100%", md: isFullWidth ? "100%" : "auto" },
          maxWidth: "100%",
          boxSizing: "border-box",
          cursor: "pointer",
          transition: "all .18s ease",
          gap: { xs: 0.5, md: 1 },
          "&:hover": {
            borderColor: palette.accent,
            backgroundColor: palette.surfaceAlt,
          },
        }}
      >
        <HeaderInlineLabel>{label}</HeaderInlineLabel>
        <Box
          component="span"
          sx={{
            minWidth: 0,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: palette.text,
            fontWeight: 700,
          }}
        >
          {displayValue || value || "SELECCIONA"}
        </Box>
        <ChevronDown size={14} color={palette.muted} style={{ flexShrink: 0 }} />
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 0.75,
            bgcolor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            minWidth: menuMinWidth,
            maxWidth: { xs: "calc(100vw - 32px)", md: 520 },
            "& .MuiMenuItem-root": {
              fontSize: "13px",
              maxWidth: { xs: "calc(100vw - 48px)", md: 500 },
              whiteSpace: "normal",
              "&:hover": {
                backgroundColor: palette.accent,
                color: palette.surface,
              },
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === value}
            onClick={() => {
              onSelect(option.value);
              setAnchorEl(null);
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

const createColumns = ({ onEdit, onDelete, onEntrega }) => [
  {
    name: "",
    grow: 1,
    cell: (row) => (
      <Box sx={{ width: "100%", py: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: { xs: "wrap", sm: "nowrap" },
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flexWrap: "wrap" }}>
            <Box
              sx={{
                width: { xs: 40, sm: 30 },
                height: { xs: 40, sm: 30 },
                borderRadius: { xs: 2, sm: 1.5 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.accentSoft,
                color: palette.accent,
                flexShrink: 0,
              }}
            >
              {row.tipo_operacion === "E" ? <Package size={16} /> : <Bus size={16} />}
            </Box>

            <Typography sx={{ color: palette.text, fontWeight: 700, fontSize: "15px" }}>
              {row.numero}
            </Typography>

            <AppChip>{row.tipoLabel}</AppChip>

            {row.tipo_operacion === "E" && (
              <AppChip>{row.entregada ? "Entregada" : "Pendiente entrega"}</AppChip>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: { xs: 0.85, sm: 1 },
              width: { xs: "100%", sm: "auto" },
              mt: { xs: 0.75, sm: 0 },
            }}
          >
            {row.tipo_operacion === "E" && (
              <Tooltip title="Registrar entrega" arrow>
                <Box onClick={() => onEntrega(row)} sx={actionButtonSx(false)}>
                  <BadgeCheck size={14} />
                </Box>
              </Tooltip>
            )}

            <Tooltip title="Editar operacion" arrow>
              <Box onClick={() => onEdit(row)} sx={actionButtonSx(false)}>
                <Pencil size={14} />
              </Box>
            </Tooltip>

            <Tooltip title="Eliminar operacion" arrow>
              <Box onClick={() => onDelete(row)} sx={actionButtonSx(true)}>
                <Trash2 size={14} />
              </Box>
            </Tooltip>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: palette.accent,
                fontWeight: 600,
                fontSize: "12.5px",
                height: { xs: 42, sm: "auto" },
              }}
            >
              <Calendar size={13} />
              {row.fecha}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 1,
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 0.75,
            color: palette.muted,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
            <ReceiptText size={13} style={{ flexShrink: 0 }} />
            <Typography sx={{ fontSize: "13px", color: palette.muted }} noWrap>
              {row.clienteLabel}
              {row.cliente_documento ? ` - ${row.cliente_documento}` : ""}
            </Typography>
          </Box>
          <Typography sx={{ color: palette.text, fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap", ml: { xs: 2.5, sm: 1 } }}>
            {formatMoney(row.total)}
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 1.75,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0.75,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, minWidth: 0, flex: "1 1 260px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: palette.muted, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", mr: 0.5 }}>
              <MapPin size={13} />
              {row.rutaLabel}
            </Box>
            <AppChip>{row.servicioLabel}</AppChip>
            {row.placa && <AppChip>{row.placa}</AppChip>}
            {row.tipo_operacion === "B" && row.asiento && <AppChip>Asiento {row.asiento}</AppChip>}
            {row.tipo_operacion === "E" && row.destinatario && <AppChip>Destino: {row.destinatario}</AppChip>}
          </Box>

          <Box
            sx={{
              ml: { xs: 0, sm: "auto" },
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              minWidth: 0,
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "100%", sm: "36%" },
              color: palette.muted,
            }}
          >
            <UserPen size={14} style={{ flexShrink: 0 }} />
            <Typography sx={{ color: palette.muted, fontSize: "12.5px", minWidth: 0 }} noWrap>
              {row.autor}
            </Typography>
          </Box>
        </Box>
      </Box>
    ),
  },
];

export function TransportesModuloBase({
  tipoOperacionFijo = "E",
  titulo = "Control de Encomiendas",
  contadorTexto = "encomiendas registradas",
  nuevoTexto = "Nueva encomienda",
  buscarTexto = "Buscar encomienda...",
  modalNuevoTitulo = "Nueva encomienda",
  modalEditarTitulo = "Editar encomienda",
  sinDatosTexto = "Sin encomiendas para el filtro actual",
  footerTexto = "Encomiendas de transporte registradas en mve_transventa.",
  basePath = "/ad_transportesencomienda",
}) {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const params = useParams();
  const navigate = useNavigate();
  const { confirmDialog } = useDialog();

  const [registros, setRegistros] = useState([]);
  const [tablaBase, setTablaBase] = useState([]);
  const [valorBusqueda, setValorBusqueda] = useState("");
  const [diaSel, setDiaSel] = useState("*");
  const [periodoTrabajo, setPeriodoTrabajo] = useState("");
  const [periodoSelect, setPeriodoSelect] = useState([]);
  const [contabilidadTrabajo, setContabilidadTrabajo] = useState("");
  const [contabilidadSelect, setContabilidadSelect] = useState([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOperacionOpen, setModalOperacionOpen] = useState(false);
  const [operacionEditando, setOperacionEditando] = useState(null);
  const [rutasDisponibles, setRutasDisponibles] = useState([]);
  // Catalogo de placas para el selector del formulario de encomiendas.
  const [placasDisponibles, setPlacasDisponibles] = useState([]);
  // Catalogo de licencias para el selector del campo Chofer/licencia.
  const [licenciasDisponibles, setLicenciasDisponibles] = useState([]);
  // Catalogo de zonas para filtrar por origen y destino dentro del formulario.
  const [zonasDisponibles, setZonasDisponibles] = useState([]);
  const [puntosVentaAsignados, setPuntosVentaAsignados] = useState([]);
  const [puntoVentaTrabajo, setPuntoVentaTrabajo] = useState("");

  const data = useMemo(() => registros.map(normalizarOperacion), [registros]);
  const fechaOperacion = useMemo(() => {
    if (!periodoTrabajo) {
      return "";
    }

    if (diaSel !== "*") {
      return `${periodoTrabajo}-${diaSel}`;
    }

    const hoy = new Date().toISOString().slice(0, 10);
    return hoy.startsWith(periodoTrabajo) ? hoy : `${periodoTrabajo}-01`;
  }, [diaSel, periodoTrabajo]);

  const filtrarPorPuntoVenta = useCallback((rows, puntoVenta) => {
    if (!puntoVenta) {
      return rows;
    }

    return rows.filter((item) => (
      item.id_punto_venta === puntoVenta ||
      item.id_punto_venta_dest === puntoVenta
    ));
  }, []);

  const filtrarPorTexto = useCallback((rows, texto) => {
    const busqueda = normalizarTextoBusqueda(texto).trim();

    if (!busqueda) {
      return rows;
    }

    return rows.filter((item) => item._textoBusqueda?.includes(busqueda));
  }, []);

  const cargarPeriodos = useCallback(async (periodoPreferido) => {
    try {
      const response = await fetch(`${back_host}/usuario/periodos/${params.id_anfitrion}`);
      const result = await response.json();
      const periodos = Array.isArray(result) ? result : [];
      const periodoFinal = periodoPreferido || periodos[0]?.periodo || params.periodo || "";

      setPeriodoSelect(periodos);
      setPeriodoTrabajo(periodoFinal);
      if (periodoFinal) {
        sessionStorage.setItem("periodo_trabajo", periodoFinal);
      }
    } catch (error) {
      console.log("Error cargando periodos transporte:", error);
      setPeriodoTrabajo(periodoPreferido || params.periodo || "");
    }
  }, [back_host, params.id_anfitrion, params.periodo]);

  const cargarContabilidades = useCallback(async (documentoPreferido) => {
    try {
      const response = await fetch(`${back_host}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`);
      const result = await response.json();
      const contabilidades = Array.isArray(result) ? result : [];
      const documentoFinal = documentoPreferido || contabilidades[0]?.documento_id || params.documento_id || "";

      setContabilidadSelect(contabilidades);
      setContabilidadTrabajo(documentoFinal);
      if (documentoFinal) {
        sessionStorage.setItem("contabilidad_trabajo", documentoFinal);
        const seleccionada = contabilidades.find(item => item.documento_id === documentoFinal);
        if (seleccionada?.razon_social) {
          sessionStorage.setItem("contabilidad_nombre", seleccionada.razon_social);
        }
      }
    } catch (error) {
      console.log("Error cargando contabilidades transporte:", error);
      setContabilidadTrabajo(documentoPreferido || params.documento_id || "");
    }
  }, [back_host, params.id_anfitrion, params.id_invitado, params.documento_id]);

  const cargarPuntosVentaAsignados = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setPuntosVentaAsignados([]);
      setPuntoVentaTrabajo("");
      return;
    }

    try {
      const response = await fetch(`${back_host}/mad_punto_venta_usuario/${params.id_anfitrion}/${contabilidadTrabajo}/${params.id_invitado}`);
      const result = await response.json();
      const rows = Array.isArray(result?.data) ? result.data : [];
      const sessionKey = `punto_venta_trabajo_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
      const puntoGuardado = sessionStorage.getItem(sessionKey);
      const puntoFinal = rows.some((item) => item.id_punto_venta === puntoGuardado)
        ? puntoGuardado
        : rows[0]?.id_punto_venta || "";

      setPuntosVentaAsignados(rows);
      setPuntoVentaTrabajo(puntoFinal);
      if (puntoFinal) {
        sessionStorage.setItem(sessionKey, puntoFinal);
      }
    } catch (error) {
      console.log("Error cargando puntos de venta asignados:", error);
      setPuntosVentaAsignados([]);
      setPuntoVentaTrabajo("");
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion, params.id_invitado]);

  const cargarRutas = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setRutasDisponibles([]);
      return;
    }

    try {
      const rutasUrl = tipoOperacionFijo === "B"
        ? `${back_host}/mve_transruta/${params.id_anfitrion}/${contabilidadTrabajo}?solo_pasaje=true`
        : `${back_host}/mve_transruta/encomiendas/${params.id_anfitrion}/${contabilidadTrabajo}`;
      const response = await fetch(rutasUrl);
      const result = await response.json();
      const rows = Array.isArray(result?.data)
        ? result.data.filter((item) => (
          item.activo !== false &&
          (!puntoVentaTrabajo || item.id_punto_venta === puntoVentaTrabajo)
        ))
        : [];
      setRutasDisponibles(rows);
    } catch (error) {
      console.log("Error cargando rutas disponibles:", error);
      setRutasDisponibles([]);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion, puntoVentaTrabajo, tipoOperacionFijo]);

  // Carga todas las placas de la empresa actual; no depende del punto de venta operativo.
  const cargarPlacas = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setPlacasDisponibles([]);
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transplaca/${params.id_anfitrion}/${contabilidadTrabajo}`);
      const result = await response.json();
      setPlacasDisponibles(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.log("Error cargando placas disponibles:", error);
      setPlacasDisponibles([]);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion]);

  // Carga todas las licencias de la empresa actual desde listarLicenciasTransporte.
  const cargarLicencias = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setLicenciasDisponibles([]);
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_translicencia/${params.id_anfitrion}/${contabilidadTrabajo}`);
      const result = await response.json();
      setLicenciasDisponibles(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.log("Error cargando licencias disponibles:", error);
      setLicenciasDisponibles([]);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion]);

  // Carga todas las zonas de la empresa; el modal filtra por id_punto_venta.
  const cargarZonas = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setZonasDisponibles([]);
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transzona/${params.id_anfitrion}/${contabilidadTrabajo}`);
      const result = await response.json();
      setZonasDisponibles(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.log("Error cargando zonas disponibles:", error);
      setZonasDisponibles([]);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion]);

  const cargarRegistros = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo) {
      setRegistros([]);
      setTablaBase([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${back_host}/mve_transventa/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${diaSel}`);
      const result = await response.json();
      const rows = (Array.isArray(result?.data) ? result.data : [])
        .filter((item) => item.tipo_operacion === tipoOperacionFijo);
      const rowsPorPunto = filtrarPorPuntoVenta(rows, puntoVentaTrabajo)
        .map((item) => ({
          ...item,
          _textoBusqueda: crearIndiceBusqueda(item),
        }));
      setTablaBase(rowsPorPunto);
      setRegistros(rowsPorPunto);
    } catch (error) {
      console.log("Error cargando operaciones de transporte:", error);
      setRegistros([]);
      setTablaBase([]);
    } finally {
      setLoading(false);
    }
  }, [back_host, contabilidadTrabajo, diaSel, filtrarPorPuntoVenta, params.id_anfitrion, periodoTrabajo, puntoVentaTrabajo, tipoOperacionFijo]);

  useEffect(() => {
    const periodoHistorial = sessionStorage.getItem("periodo_trabajo") || params.periodo;
    const contabilidadHistorial = sessionStorage.getItem("contabilidad_trabajo") || params.documento_id;

    cargarPeriodos(periodoHistorial);
    cargarContabilidades(contabilidadHistorial);
  }, [cargarContabilidades, cargarPeriodos, params.documento_id, params.periodo]);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros, updateTrigger]);

  useEffect(() => {
    setRegistros(filtrarPorTexto(tablaBase, valorBusqueda));
  }, [filtrarPorTexto, tablaBase, valorBusqueda]);

  useEffect(() => {
    cargarPuntosVentaAsignados();
  }, [cargarPuntosVentaAsignados]);

  useEffect(() => {
    cargarRutas();
  }, [cargarRutas]);

  useEffect(() => {
    cargarPlacas();
  }, [cargarPlacas]);

  useEffect(() => {
    cargarLicencias();
  }, [cargarLicencias]);

  useEffect(() => {
    cargarZonas();
  }, [cargarZonas]);

  const actualizaValorFiltro = (event) => {
    setValorBusqueda(event.target.value);
  };

  const handleDayFilter = (selectedDay) => {
    const dia = selectedDay === "*" ? "*" : selectedDay.toString().padStart(2, "0");
    setDiaSel(dia);
  };

  const handlePeriodoSelect = (periodo) => {
    setPeriodoTrabajo(periodo);
    sessionStorage.setItem("periodo_trabajo", periodo);
    setDiaSel("*");
  };

  const handleContabilidadSelect = (documentoId) => {
    if (documentoId === contabilidadTrabajo) {
      return;
    }

    setContabilidadTrabajo(documentoId);
    setPuntosVentaAsignados([]);
    setPuntoVentaTrabajo("");
    sessionStorage.setItem("contabilidad_trabajo", documentoId);
    const seleccionada = contabilidadSelect.find(item => item.documento_id === documentoId);
    if (seleccionada?.razon_social) {
      sessionStorage.setItem("contabilidad_nombre", seleccionada.razon_social);
    }
    navigate(`${basePath}/${params.id_anfitrion}/${params.id_invitado}/${periodoTrabajo}/${documentoId}`);
  };

  const handlePuntoVentaSelect = (puntoVenta) => {
    setPuntoVentaTrabajo(puntoVenta);
    const sessionKey = `punto_venta_trabajo_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
    if (puntoVenta) {
      sessionStorage.setItem(sessionKey, puntoVenta);
    }
  };

  const solicitarOperacion = (operacion = null) => {
    if (!operacion && tipoOperacionFijo === "E" && !puntoVentaTrabajo) {
      swal2.fire({
        title: "Selecciona punto de venta",
        text: "Para emitir una encomienda primero selecciona un punto de venta.",
        icon: "warning",
        confirmButtonText: "ACEPTAR",
      });
      return;
    }

    setOperacionEditando(operacion);
    setModalOperacionOpen(true);
  };

  const cerrarModalOperacion = () => {
    setModalOperacionOpen(false);
    setOperacionEditando(null);
  };

  const guardarOperacion = async (datosOperacion) => {
    const esEdicion = Boolean(operacionEditando);

    if (tipoOperacionFijo === "E" && !puntoVentaTrabajo) {
      swal2.fire({
        title: "Selecciona punto de venta",
        text: "Para guardar una encomienda primero selecciona un punto de venta.",
        icon: "warning",
        confirmButtonText: "ACEPTAR",
      });
      return;
    }

    const payload = {
      ...datosOperacion,
      id_usuario: params.id_anfitrion,
      id_anfitrion: params.id_anfitrion,
      id_invitado: params.id_invitado,
      documento_id: contabilidadTrabajo,
      periodo: periodoTrabajo,
      r_cod: esEdicion ? operacionEditando.r_cod : datosOperacion.r_cod,
      r_serie: esEdicion ? operacionEditando.r_serie : datosOperacion.r_serie,
      r_numero: esEdicion ? operacionEditando.r_numero : datosOperacion.r_numero,
      elemento: operacionEditando?.elemento || 1,
      cantidad: 1,
      ctrl_crea_us: params.id_invitado,
      ctrl_mod_us: params.id_invitado,
    };

    try {
      const response = await fetch(`${back_host}/mve_transventa`, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const dataResponse = await response.json();

      if (!response.ok || !dataResponse.success) {
        throw new Error(dataResponse.message || "No se pudo guardar la encomienda.");
      }

      cerrarModalOperacion();
      setUpdateTrigger(Date.now());
    } catch (error) {
      swal2.fire({
        title: "No se pudo guardar",
        text: error.message || "Error interno.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
      });
    }
  };

  const handleDelete = async (operacion) => {
    const result = await confirmDialog({
      title: "Eliminar operacion?",
      message: `${operacion.numero} - ${operacion.clienteLabel}`,
      icon: "warning",
      confirmText: "ELIMINAR",
      cancelText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transventa/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${operacion.r_cod}/${operacion.r_serie}/${operacion.r_numero}/${operacion.elemento || 1}`, {
        method: "DELETE",
      });
      const dataResponse = await response.json();

      if (!response.ok || !dataResponse.success) {
        throw new Error(dataResponse.message || "No se pudo eliminar la operacion.");
      }

      setRegistros(prev => prev.filter(item => !(
        item.r_cod === operacion.r_cod &&
        item.r_serie === operacion.r_serie &&
        item.r_numero === operacion.r_numero &&
        Number(item.elemento || 1) === Number(operacion.elemento || 1)
      )));
      setTablaBase(prev => prev.filter(item => !(
        item.r_cod === operacion.r_cod &&
        item.r_serie === operacion.r_serie &&
        item.r_numero === operacion.r_numero &&
        Number(item.elemento || 1) === Number(operacion.elemento || 1)
      )));
    } catch (error) {
      swal2.fire({
        title: "No se pudo eliminar",
        text: error.message || "Error interno.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
      });
    }
  };

  const handleEntrega = async (operacion) => {
    const fechaDefault = new Date().toISOString().slice(0, 10);
    const result = await swal2.fire({
      title: "Registrar entrega",
      color: palette.text,
      background: palette.surface,
      confirmButtonText: "REGISTRAR",
      cancelButtonText: "CANCELAR",
      showCancelButton: true,
      html: `
        <input id="entrega_fecha" type="date" class="swal2-input" value="${String(operacion.entrega_fecha || fechaDefault).slice(0, 10)}" />
        <input id="entrega_documento" class="swal2-input" placeholder="Documento recibe" value="${operacion.entrega_documento || ""}" />
        <input id="entrega_nombres" class="swal2-input" placeholder="Nombres recibe" value="${operacion.entrega_nombres || ""}" />
      `,
      preConfirm: () => {
        const entrega_fecha = document.getElementById("entrega_fecha")?.value;
        const entrega_documento = document.getElementById("entrega_documento")?.value?.trim();
        const entrega_nombres = document.getElementById("entrega_nombres")?.value?.trim();

        if (!entrega_fecha || !entrega_documento || !entrega_nombres) {
          swal2.showValidationMessage("Completa fecha, documento y nombres.");
          return false;
        }

        return { entrega_fecha, entrega_documento, entrega_nombres };
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transventa/entrega`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodo: periodoTrabajo,
          id_usuario: params.id_anfitrion,
          id_anfitrion: params.id_anfitrion,
          id_invitado: params.id_invitado,
          documento_id: contabilidadTrabajo,
          r_cod: operacion.r_cod,
          r_serie: operacion.r_serie,
          r_numero: operacion.r_numero,
          elemento: operacion.elemento || 1,
          entrega_ctrl_us: params.id_invitado,
          ...result.value,
        }),
      });
      const dataResponse = await response.json();

      if (!response.ok || !dataResponse.success) {
        throw new Error(dataResponse.message || "No se pudo registrar la entrega.");
      }

      setUpdateTrigger(Date.now());
    } catch (error) {
      swal2.fire({
        title: "No se pudo registrar",
        text: error.message || "Error interno.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
      });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.bg, p: { xs: 1, md: 4 } }}>
      <Box sx={{ maxWidth: 980, mx: "auto" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 1, sm: 2 },
            mb: { xs: 1.25, md: 3 },
          }}
        >
          <Box>
            <Typography sx={{ color: palette.text, fontWeight: 700, fontSize: "22px", lineHeight: 1.2 }}>
              {titulo}
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: "13px", mt: 0.5 }}>
              {data.length} {contadorTexto}
            </Typography>
          </Box>

          <AppButton
            icon={<Plus size={18} />}
            onClick={() => solicitarOperacion()}
            disabled={tipoOperacionFijo === "E" && !puntoVentaTrabajo}
            sx={{
              backgroundColor: tipoOperacionFijo === "E" && !puntoVentaTrabajo ? palette.chip : palette.accent,
              borderColor: tipoOperacionFijo === "E" && !puntoVentaTrabajo ? palette.border : palette.accent,
              color: tipoOperacionFijo === "E" && !puntoVentaTrabajo ? palette.muted : palette.surface,
              fontWeight: 800,
              "&:hover": {
                backgroundColor: tipoOperacionFijo === "E" && !puntoVentaTrabajo ? palette.chip : palette.accent,
                borderColor: tipoOperacionFijo === "E" && !puntoVentaTrabajo ? palette.border : palette.accent,
                color: tipoOperacionFijo === "E" && !puntoVentaTrabajo ? palette.muted : palette.surface,
              },
            }}
          >
            {nuevoTexto}
          </AppButton>

          <AppSearch
            placeholder={buscarTexto}
            value={valorBusqueda}
            onChange={actualizaValorFiltro}
          />
        </Box>

        <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: puntosVentaAsignados.length > 0
                ? "180px minmax(280px, 420px) 260px"
                : "180px minmax(280px, 460px)",
            },
            gap: { xs: 0.5, md: 2 },
            alignItems: "end",
            justifyContent: "flex-start",
            mb: { xs: 1, md: 2 },
            p: { xs: 0.75, md: 2 },
            borderRadius: 3,
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
          }}
        >
          <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
            <HeaderMenuPicker
              label="Periodo"
              value={periodoTrabajo}
              displayValue={periodoTrabajo}
              minWidth="100%"
              options={[
                { value: "default", label: "SELECCIONA" },
                ...periodoSelect.map((item) => ({
                  value: item.periodo,
                  label: item.periodo,
                })),
              ]}
              onSelect={handlePeriodoSelect}
            />
          </Box>

          <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
            <HeaderMenuPicker
              label="Empresa"
              value={contabilidadTrabajo}
              displayValue={contabilidadSelect.find((item) => item.documento_id === contabilidadTrabajo)?.razon_social || contabilidadTrabajo}
              minWidth="100%"
              options={[
                { value: "default", label: "SELECCIONA" },
                ...contabilidadSelect.map((item) => ({
                  value: item.documento_id,
                  label: item.razon_social,
                })),
              ]}
              onSelect={handleContabilidadSelect}
            />
          </Box>

          {puntosVentaAsignados.length > 0 && (
            <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
              <HeaderMenuPicker
                label="Punto venta"
                value={puntoVentaTrabajo}
                displayValue={puntosVentaAsignados.find((item) => item.id_punto_venta === puntoVentaTrabajo)?.nombre || puntoVentaTrabajo}
                minWidth="100%"
                options={puntosVentaAsignados.map((item) => ({
                  value: item.id_punto_venta,
                  label: `${item.id_punto_venta} - ${item.nombre}`,
                }))}
                onSelect={handlePuntoVentaSelect}
              />
            </Box>
          )}
        </Box>

        <DaySelector period={periodoTrabajo || params.periodo} onDaySelect={handleDayFilter} />

        <DataTable
          theme="transportesDark"
          columns={createColumns({
            onEdit: solicitarOperacion,
            onDelete: handleDelete,
            onEntrega: handleEntrega,
          })}
          data={data}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          highlightOnHover
          responsive
          customStyles={customStyles}
          noDataComponent={
            <Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}>
              <Search size={16} />
              {sinDatosTexto}
            </Box>
          }
        />

        {tipoOperacionFijo === "E" && (
          <TransportesEncomiendaModal
            open={modalOperacionOpen}
            back_host={back_host}
            operacion={operacionEditando}
            periodoTrabajo={periodoTrabajo}
            fechaOperacion={fechaOperacion}
            rutasDisponibles={rutasDisponibles}
            puntoVentaOrigen={puntoVentaTrabajo}
            puntoVentaOrigenNombre={puntosVentaAsignados.find((item) => item.id_punto_venta === puntoVentaTrabajo)?.nombre || puntoVentaTrabajo}
            zonasDisponibles={zonasDisponibles}
            // Se usa en el campo Placa: tecla + o click en el icono del camion.
            placasDisponibles={placasDisponibles}
            // Se usa en Chofer/licencia: tecla + o click en el icono del usuario.
            licenciasDisponibles={licenciasDisponibles}
            modalNuevoTitulo={modalNuevoTitulo}
            modalEditarTitulo={modalEditarTitulo}
            onClose={cerrarModalOperacion}
            onSubmit={guardarOperacion}
          />
        )}

        {tipoOperacionFijo === "B" && (
          <TransportesBoletoModal
            open={modalOperacionOpen}
            operacion={operacionEditando}
            periodoTrabajo={periodoTrabajo}
            fechaOperacion={fechaOperacion}
            rutasDisponibles={rutasDisponibles}
            modalNuevoTitulo={modalNuevoTitulo}
            modalEditarTitulo={modalEditarTitulo}
            onClose={cerrarModalOperacion}
            onSubmit={guardarOperacion}
          />
        )}

        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, color: palette.muted, fontSize: "12px" }}>
          <Truck size={14} />
          {footerTexto}
        </Box>
      </Box>
    </Box>
  );
}

export default function TrEncomiendaList() {
  return (
    <TransportesModuloBase
      tipoOperacionFijo="E"
      titulo="Control de Encomiendas"
      contadorTexto="encomiendas registradas"
      nuevoTexto="Nueva encomienda"
      buscarTexto="Buscar encomienda..."
      modalNuevoTitulo="Nueva encomienda"
      modalEditarTitulo="Editar encomienda"
      sinDatosTexto="Sin encomiendas para el filtro actual"
      footerTexto="Envio de encomiendas registrado en mve_transventa."
      basePath="/ad_transportesencomienda"
    />
  );
}
