import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, InputBase, MenuItem, Select, Tooltip, Typography, useMediaQuery } from "@mui/material";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import CloudSyncIcon from "@mui/icons-material/CloudSync";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReplayIcon from "@mui/icons-material/Replay";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SummarizeIcon from "@mui/icons-material/Summarize";
import Datatable from "react-data-table-component";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useDialog } from "../../AdminConfirmDialogProvider";
import { ensureAdminVentaTableTheme } from "../common/adminVentaTableTheme";
import palette from "../../../../theme/palette";

const backHost = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";

const estadoSx = {
  ACEPTADO: { color: palette.success, backgroundColor: palette.successSoft },
  ENVIADO: { color: palette.accent, backgroundColor: palette.accentSoft },
  PENDIENTE: { color: palette.warning, backgroundColor: palette.warningSoft },
  GENERADO: { color: palette.warning, backgroundColor: palette.warningSoft },
  ERROR: { color: palette.danger, backgroundColor: palette.dangerSoft },
  INCIERTO: { color: palette.warning, backgroundColor: palette.warningSoft },
  RECHAZADO: { color: palette.danger, backgroundColor: palette.dangerSoft },
};

const selectSx = {
  width: "100%",
  height: 42,
  color: palette.text,
  backgroundColor: palette.chip,
  border: `1px solid ${palette.border}`,
  borderRadius: 1,
  fontSize: "13px",
  ".MuiSelect-select": {
    py: 1,
    display: "flex",
    alignItems: "center",
  },
  "& .MuiOutlinedInput-notchedOutline": { border: 0 },
  "& .MuiSelect-icon": { color: palette.muted },
};

const selectMenuProps = {
  PaperProps: {
    sx: {
      backgroundColor: palette.surface,
      color: palette.text,
      border: `1px solid ${palette.border}`,
      "& .MuiMenuItem-root": { fontSize: "13px" },
    },
  },
};

const tableStyles = {
  table: { style: { backgroundColor: "#1c252c" } },
  tableWrapper: { style: { backgroundColor: "#1c252c" } },
  responsiveWrapper: { style: { backgroundColor: "#1c252c" } },
  headRow: { style: { backgroundColor: "#202a32", borderBottomColor: "transparent" } },
  headCells: { style: { backgroundColor: "#202a32", color: palette.muted } },
  rows: {
    style: { backgroundColor: "#1c252c", borderBottomColor: "transparent" },
    highlightOnHoverStyle: {
      backgroundColor: "rgba(139,154,165,0.07)",
      borderBottomColor: "transparent",
      outline: "none",
    },
  },
  cells: { style: { backgroundColor: "transparent" } },
  pagination: { style: { backgroundColor: "#1c252c", borderTopColor: "transparent" } },
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return String(value).replace("T", " ").substring(0, 19);
};

const getResponseMessage = (response) => (
  response?.data?.mensaje_usuario ||
  response?.data?.respuesta_sunat_descripcion ||
  response?.data?.message ||
  response?.mensaje_usuario ||
  response?.message ||
  "Operacion procesada."
);

export default function AdminVentaResumenSunatList() {
  ensureAdminVentaTableTheme();

  const params = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth0();
  const { confirmDialog } = useDialog();
  const isSmallScreen = useMediaQuery("(max-width: 600px)");

  const [periodoTrabajo, setPeriodoTrabajo] = useState(params.periodo || "");
  const [contabilidadTrabajo, setContabilidadTrabajo] = useState(params.documento_id || "");
  const [periodos, setPeriodos] = useState([]);
  const [contabilidades, setContabilidades] = useState([]);
  const [resumenes, setResumenes] = useState([]);
  const [tablaBase, setTablaBase] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState("");

  const contabilidadNombre = useMemo(() => {
    const seleccion = contabilidades.find((item) => String(item.documento_id) === String(contabilidadTrabajo));
    return seleccion?.razon_social || sessionStorage.getItem("contabilidad_nombre") || contabilidadTrabajo;
  }, [contabilidades, contabilidadTrabajo]);

  const cargarCombos = useCallback(async () => {
    const [periodosResponse, contabilidadesResponse] = await Promise.all([
      axios.get(`${backHost}/usuario/periodos/${params.id_anfitrion}`),
      axios.get(`${backHost}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`),
    ]);

    setPeriodos(periodosResponse.data || []);
    setContabilidades(contabilidadesResponse.data || []);

    if (!periodoTrabajo && periodosResponse.data?.[0]?.periodo) {
      setPeriodoTrabajo(periodosResponse.data[0].periodo);
    }

    if ((!contabilidadTrabajo || contabilidadTrabajo === "-") && contabilidadesResponse.data?.[0]?.documento_id) {
      setContabilidadTrabajo(contabilidadesResponse.data[0].documento_id);
    }
  }, [contabilidadTrabajo, params.id_anfitrion, params.id_invitado, periodoTrabajo]);

  const cargarResumenes = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || contabilidadTrabajo === "-") return;

    setCargando(true);
    try {
      const response = await axios.get(
        `${backHost}/ad_ventacpe/resumen/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}`,
        { params: { origen: "VENTA_COMERCIAL" } }
      );
      const data = response.data?.data || [];
      setResumenes(data);
      setTablaBase(data);
    } catch (error) {
      await confirmDialog({
        title: "No se pudo cargar RDI",
        message: error?.response?.data?.message || "No se pudo obtener el historial de Resumenes SUNAT.",
        icon: "error",
        confirmText: "ACEPTAR",
      });
    } finally {
      setCargando(false);
    }
  }, [confirmDialog, contabilidadTrabajo, params.id_anfitrion, periodoTrabajo]);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    cargarCombos();
  }, [cargarCombos, isAuthenticated, user]);

  useEffect(() => {
    cargarResumenes();
  }, [cargarResumenes]);

  const filtrar = (value) => {
    const filtro = value.trim().toLowerCase();
    setBusqueda(value);

    if (!filtro) {
      setResumenes(tablaBase);
      return;
    }

    setResumenes(
      tablaBase.filter((item) => [
        item.fecha,
        item.numero_rdi,
        item.origen,
        item.estado,
        item.ticket,
        item.respuesta_codigo,
        item.respuesta_desc,
      ].some((campo) => String(campo || "").toLowerCase().includes(filtro)))
    );
  };

  const handlePeriodoChange = (event) => {
    const value = event.target.value;
    setPeriodoTrabajo(value);
    sessionStorage.setItem("periodo_trabajo", value);
    navigate(`/ad_ventaresumensunat/${params.id_anfitrion}/${params.id_invitado}/${value}/${contabilidadTrabajo}`);
  };

  const handleContabilidadChange = (event) => {
    const value = event.target.value;
    setContabilidadTrabajo(value);
    sessionStorage.setItem("contabilidad_trabajo", value);
    const seleccion = contabilidades.find((item) => String(item.documento_id) === String(value));
    if (seleccion?.razon_social) sessionStorage.setItem("contabilidad_nombre", seleccion.razon_social);
    navigate(`/ad_ventaresumensunat/${params.id_anfitrion}/${params.id_invitado}/${periodoTrabajo}/${value}`);
  };

  const consultarTicket = async (row) => {
    setProcesando(row.numero_rdi);
    try {
      const response = await axios.post(`${backHost}/ad_ventacpe/resumen/ticket`, {
        periodo: periodoTrabajo,
        id_anfitrion: params.id_anfitrion,
        id_invitado: params.id_invitado,
        documento_id: contabilidadTrabajo,
        numero_rdi: row.numero_rdi,
      });

      await confirmDialog({
        title: response.data?.estado === "ACEPTADO" ? "Resumen aceptado" : "Consulta SUNAT",
        message: getResponseMessage(response),
        icon: response.data?.estado === "RECHAZADO" ? "warning" : "success",
        confirmText: "ACEPTAR",
      });
      cargarResumenes();
    } catch (error) {
      await confirmDialog({
        title: "No se pudo consultar",
        message: error?.response?.data?.mensaje_usuario || error?.response?.data?.message || "No se pudo consultar el ticket SUNAT.",
        icon: "error",
        confirmText: "ACEPTAR",
      });
    } finally {
      setProcesando("");
    }
  };

  const reenviarResumen = async (row) => {
    const result = await confirmDialog({
      title: "Reintentar envio?",
      message: `${row.numero_rdi}\nFecha: ${row.fecha}`,
      icon: "warning",
      confirmText: "REENVIAR",
      cancelText: "CANCELAR",
    });

    if (!result.isConfirmed) return;

    setProcesando(row.numero_rdi);
    try {
      const response = await axios.post(`${backHost}/ad_ventacpe/resumen`, {
        periodo: periodoTrabajo,
        id_anfitrion: params.id_anfitrion,
        id_invitado: params.id_invitado,
        documento_id: contabilidadTrabajo,
        numero_rdi: row.numero_rdi,
        fecha_documentos: row.fecha,
        origen: "VENTA_COMERCIAL",
        solo_payload: false,
      });

      await confirmDialog({
        title: response.data?.success ? "Resumen enviado" : "SUNAT requiere revision",
        message: getResponseMessage(response),
        icon: response.data?.success ? "success" : "warning",
        confirmText: "ACEPTAR",
      });
      cargarResumenes();
    } catch (error) {
      await confirmDialog({
        title: "No se pudo reenviar",
        message: error?.response?.data?.mensaje_usuario || error?.response?.data?.message || "No se pudo reintentar el envio SUNAT.",
        icon: "error",
        confirmText: "ACEPTAR",
      });
    } finally {
      setProcesando("");
    }
  };

  const abrirRuta = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const mostrarDetalle = async (row) => {
    await confirmDialog({
      title: `${row.estado || "PENDIENTE"} - ${row.numero_rdi}`,
      message: [
        row.respuesta_codigo ? `Codigo: ${row.respuesta_codigo}` : null,
        row.ticket ? `Ticket: ${row.ticket}` : "Sin ticket registrado",
        row.intentos !== undefined ? `Intentos: ${row.intentos || 0}` : null,
        row.ultimo_intento ? `Ultimo intento: ${formatDateTime(row.ultimo_intento)}` : null,
        row.respuesta_desc || "Sin detalle SUNAT registrado.",
      ].filter(Boolean).join("\n"),
      icon: ["ERROR", "INCIERTO", "RECHAZADO"].includes(String(row.estado || "").toUpperCase()) ? "warning" : "info",
      confirmText: "ACEPTAR",
    });
  };

  const columns = [
    {
      name: "Fecha",
      selector: (row) => row.fecha,
      sortable: true,
      width: "110px",
    },
    {
      name: "Numero RDI",
      selector: (row) => row.numero_rdi,
      sortable: true,
      minWidth: "170px",
    },
    {
      name: "Estado",
      selector: (row) => row.estado,
      sortable: true,
      width: "130px",
      cell: (row) => {
        const sx = estadoSx[row.estado] || estadoSx.PENDIENTE;
        return (
          <Box sx={{ px: 1, py: 0.35, borderRadius: 1, fontSize: "11px", fontWeight: 800, ...sx }}>
            {row.estado || "PENDIENTE"}
          </Box>
        );
      },
    },
    {
      name: "Boletas",
      selector: (row) => row.cantidad_boletas,
      sortable: true,
      width: "95px",
      right: true,
    },
    {
      name: "Ticket",
      selector: (row) => row.ticket,
      sortable: true,
      minWidth: "160px",
      cell: (row) => <Typography sx={{ fontSize: 12, color: palette.text }}>{row.ticket || "-"}</Typography>,
    },
    {
      name: "Codigo",
      selector: (row) => row.respuesta_codigo,
      sortable: true,
      width: "100px",
    },
    {
      name: "Respuesta SUNAT",
      selector: (row) => row.respuesta_desc,
      sortable: true,
      minWidth: "280px",
      wrap: true,
      cell: (row) => <Typography sx={{ fontSize: 12, color: palette.muted }}>{row.respuesta_desc || "-"}</Typography>,
    },
    {
      name: "Ultimo intento",
      selector: (row) => row.ultimo_intento || row.ctrl_actualiza,
      sortable: true,
      minWidth: "150px",
      cell: (row) => formatDateTime(row.ultimo_intento || row.ctrl_actualiza),
    },
    {
      name: "Acciones",
      width: "138px",
      cell: (row) => {
        const estado = String(row.estado || "").toUpperCase();
        const estaProcesando = procesando === row.numero_rdi;
        const puedeReenviar = ["PENDIENTE", "GENERADO", "ERROR", "INCIERTO"].includes(estado) && !row.ticket;
        const puedeConsultar = Boolean(row.ticket) && !["RECHAZADO"].includes(estado);
        const puedeAbrirCdr = Boolean(row.ruta_cdr) && estado === "ACEPTADO";

        return (
          <Box sx={{ display: "flex", gap: 0.35 }}>
            <Tooltip title="Ver detalle">
              <IconButton size="small" onClick={() => mostrarDetalle(row)} sx={{ color: palette.muted }}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {puedeReenviar && (
              <Tooltip title={estado === "INCIERTO" ? "Reintentar con cuidado" : "Reintentar envio"}>
                <IconButton size="small" disabled={estaProcesando} onClick={() => reenviarResumen(row)} sx={{ color: palette.warning }}>
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {puedeConsultar && (
              <Tooltip title={estado === "ACEPTADO" ? "Actualizar estado SUNAT" : "Consultar CDR"}>
                <IconButton size="small" disabled={estaProcesando} onClick={() => consultarTicket(row)} sx={{ color: palette.accent }}>
                  <CloudSyncIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {puedeAbrirCdr && (
              <Tooltip title="Abrir CDR">
                <IconButton size="small" onClick={() => abrirRuta(row.ruta_cdr)} sx={{ color: palette.success }}>
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ width: "100%", display: "grid", gap: 1.15 }}>
      <Box
        sx={{
          backgroundColor: "#1c252c",
          borderRadius: 1,
          px: { xs: 1, md: 1.5 },
          py: { xs: 1, md: 1.25 },
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 1,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: palette.text, fontSize: "22px", fontWeight: 500, lineHeight: 1.2 }}>
            Resumenes SUNAT
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: "12px", mt: 0.35 }}>
            {`${resumenes.length} RDI visibles - ${contabilidadNombre}`}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "150px minmax(220px, 1fr) auto" },
            gap: 1,
            width: { xs: "100%", md: "auto" },
            alignItems: "center",
          }}
        >
          <Select size="small" value={periodoTrabajo} onChange={handlePeriodoChange} sx={{ ...selectSx, color: palette.accent }} MenuProps={selectMenuProps}>
            <MenuItem value="default">SELECCIONA</MenuItem>
            {periodos.map((item) => (
              <MenuItem key={item.periodo} value={item.periodo}>{item.periodo}</MenuItem>
            ))}
          </Select>

          <Select size="small" value={contabilidadTrabajo} onChange={handleContabilidadChange} sx={selectSx} MenuProps={selectMenuProps}>
            <MenuItem value="default">SELECCIONA</MenuItem>
            {contabilidades.map((item) => (
              <MenuItem key={item.documento_id} value={item.documento_id}>{item.razon_social}</MenuItem>
            ))}
          </Select>

          <Button
            variant="contained"
            onClick={cargarResumenes}
            disabled={cargando}
            sx={{ height: 42, borderRadius: 1, textTransform: "none", fontSize: "12px", fontWeight: 800 }}
          >
            <RefreshIcon sx={{ fontSize: 17, mr: isSmallScreen ? 0.5 : 0.75 }} />
            Actualizar
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          backgroundColor: "#1c252c",
          borderRadius: 1,
          px: { xs: 1, md: 1.5 },
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box
          sx={{
            flex: "1 1 280px",
            minWidth: { xs: "100%", sm: 280 },
            height: 42,
            px: 1.15,
            display: "flex",
            alignItems: "center",
            gap: 0.85,
            backgroundColor: palette.bg,
            border: "1px solid rgba(139,154,165,0.14)",
            borderRadius: 1,
          }}
        >
          <SearchRoundedIcon sx={{ color: palette.muted, fontSize: 19 }} />
          <InputBase
            value={busqueda}
            placeholder="Filtrar RDI, estado, ticket o respuesta"
            onChange={(event) => filtrar(event.target.value)}
            sx={{ width: "100%", color: palette.text, fontSize: "13px" }}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: palette.muted }}>
          <SummarizeIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 12 }}>VENTA_COMERCIAL</Typography>
        </Box>
      </Box>

      <Box
        sx={{
          overflow: "hidden",
          borderRadius: 1,
          backgroundColor: "#1c252c",
          px: { xs: 0.25, md: 0.75 },
          py: { xs: 0.25, md: 0.75 },
          "& .rdt_Table": {
            minWidth: { xs: 1180, md: "100%" },
          },
        }}
      >
        <Datatable
          theme="solarized"
          columns={columns}
          data={resumenes}
          customStyles={tableStyles}
          pagination
          paginationPerPage={15}
          paginationRowsPerPageOptions={[15, 50, 100]}
          progressPending={cargando}
          sortIcon={<ArrowDownward />}
          dense
          highlightOnHover
        />
      </Box>
    </Box>
  );
}
