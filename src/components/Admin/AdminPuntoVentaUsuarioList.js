import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable, { createTheme } from "react-data-table-component";
import { Box, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { ChevronDown, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import swal2 from "sweetalert2";

import { useDialog } from "./AdminConfirmDialogProvider";
import AppButton from "../ui/AppButton";
import AppSearch from "../ui/AppSearch";
import palette from "../../theme/palette";

createTheme(
  "transportesDark",
  {
    text: { primary: palette.text, secondary: palette.accent },
    background: { default: "transparent" },
    divider: { default: palette.borderSoft },
    action: { hover: "rgba(42,161,152,0.06)" },
  },
  "dark",
);

const encodePath = (value) => encodeURIComponent(value || "");
const formatBoolean = (value) => value ? "SI" : "NO";
const formatTime = (value) => value ? String(value).substring(0, 5) : "--";
const formatDateTime = (value) => value ? String(value).replace("T", " ").substring(0, 16) : "--";

const fieldSx = {
  height: { xs: 32, md: 36 },
  px: { xs: 0.75, md: 1.15 },
  display: "flex",
  alignItems: "center",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  color: palette.text,
};

function HeaderInlineLabel({ children }) {
  return (
    <Typography
      component="span"
      sx={{
        color: palette.muted,
        fontSize: { xs: "8.5px", md: "9px" },
        fontWeight: 800,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        mr: 1,
        flexShrink: 0,
      }}
    >
      {children}
    </Typography>
  );
}

function HeaderMenuPicker({ label, value, displayValue, options, onSelect }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Box
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          ...fieldSx,
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          cursor: "pointer",
          gap: 1,
          "&:hover": {
            borderColor: palette.accent,
            backgroundColor: palette.surfaceAlt,
          },
        }}
      >
        <HeaderInlineLabel>{label}</HeaderInlineLabel>
        <Box component="span" sx={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: palette.text, fontSize: { xs: "12px", md: "12.5px" }, fontWeight: 650 }}>
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
            minWidth: anchorEl?.offsetWidth || 220,
            maxWidth: { xs: "calc(100vw - 32px)", md: 560 },
            "& .MuiMenuItem-root": {
              fontSize: "12px",
              whiteSpace: "normal",
              "&:hover": { backgroundColor: palette.accent, color: palette.surface },
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

const customStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: { style: { backgroundColor: palette.surfaceAlt, color: palette.muted, borderBottom: `1px solid ${palette.borderSoft}` } },
  headCells: { style: { color: palette.muted, fontSize: "11px", fontWeight: 800, textTransform: "uppercase" } },
  rows: {
    style: {
      backgroundColor: palette.surface,
      color: palette.text,
      borderBottom: `1px solid ${palette.borderSoft}`,
      minHeight: "64px",
      "&:hover": { backgroundColor: palette.surfaceAlt },
    },
  },
  pagination: { style: { backgroundColor: "transparent", color: palette.muted, borderTop: `1px solid ${palette.borderSoft}` } },
};

const actionButtonSx = (danger = false) => ({
  width: 30,
  height: 30,
  borderRadius: 1.5,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: palette.chip,
  border: `1px solid ${palette.border}`,
  color: palette.muted,
  cursor: "pointer",
  "&:hover": { backgroundColor: danger ? "#c2410c" : palette.accent, borderColor: danger ? "#c2410c" : palette.accent, color: "#fff" },
});

const stickyActionColumnSx = {
  position: "sticky",
  right: 0,
  zIndex: 2,
  backgroundColor: palette.surface,
  boxShadow: "-10px 0 16px rgba(0,0,0,.16)",
};

function EstadoChip({ active, trueLabel = "SI", falseLabel = "NO" }) {
  return (
    <Box
      sx={{
        minWidth: 58,
        height: 22,
        px: 0.75,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 1,
        border: `1px solid ${active ? "rgba(89, 154, 144, .38)" : "rgba(171, 128, 98, .42)"}`,
        backgroundColor: active ? "rgba(89, 154, 144, .10)" : "rgba(171, 128, 98, .10)",
        color: active ? "#8fc7bd" : "#c7a083",
        fontSize: "10px",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0,
      }}
    >
      {active ? trueLabel : falseLabel}
    </Box>
  );
}

export default function AdminPuntoVentaUsuarioList() {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const params = useParams();
  const navigate = useNavigate();
  const { confirmDialog } = useDialog();

  const [rows, setRows] = useState([]);
  const [baseRows, setBaseRows] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [contabilidades, setContabilidades] = useState([]);
  const [documentoTrabajo, setDocumentoTrabajo] = useState("");
  const rubroTrabajo = String(sessionStorage.getItem("rubro_trabajo") || "").trim().toUpperCase();
  const esRubroTransporte = rubroTrabajo === "TRANSPORTE" || rubroTrabajo === "TRANSPORTES";
  const etiquetaPunto = esRubroTransporte ? "Agencia" : "Punto venta";
  const etiquetaPuntoLower = esRubroTransporte ? "agencia" : "punto de venta";

  const cargarContabilidades = useCallback(async () => {
    try {
      const response = await fetch(`${back_host}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`);
      const result = await response.json();
      const data = Array.isArray(result) ? result : [];
      const documentoGuardado = sessionStorage.getItem("contabilidad_trabajo");
      const documentoFinal = data.some((item) => item.documento_id === documentoGuardado)
        ? documentoGuardado
        : params.documento_id || data[0]?.documento_id || "";

      setContabilidades(data);
      setDocumentoTrabajo(documentoFinal);
      if (documentoFinal) {
        sessionStorage.setItem("contabilidad_trabajo", documentoFinal);
      }
    } catch (error) {
      console.log("Error cargando contabilidades para usuarios turnos:", error);
      setDocumentoTrabajo(params.documento_id || "");
    }
  }, [back_host, params.id_anfitrion, params.id_invitado, params.documento_id]);

  const cargarDatos = useCallback(async () => {
    if (!documentoTrabajo) {
      setRows([]);
      setBaseRows([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${back_host}/mad_punto_venta_usuario/${params.id_anfitrion}/${documentoTrabajo}`);
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      setRows(data);
      setBaseRows(data);
    } catch (error) {
      console.log("Error cargando usuarios turnos:", error);
      setRows([]);
      setBaseRows([]);
    } finally {
      setLoading(false);
    }
  }, [back_host, documentoTrabajo, params.id_anfitrion]);

  useEffect(() => {
    cargarContabilidades();
  }, [cargarContabilidades]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const filtrar = (texto) => {
    const value = texto.toLowerCase();
    setRows(baseRows.filter((item) => [
      item.id_invitado,
      item.nombres,
      item.documento_id,
      item.id_punto_venta,
      item.punto_venta_nombre,
    ].some((field) => String(field || "").toLowerCase().includes(value))));
  };

  const handleDocumentoSelect = (documentoId) => {
    setDocumentoTrabajo(documentoId);
    sessionStorage.setItem("contabilidad_trabajo", documentoId);
  };

  const editar = (row) => {
    navigate(`/ad_puntoventausuario/${params.id_anfitrion}/${params.id_invitado}/${encodePath(row.documento_id)}/${encodePath(row.id_punto_venta)}/${encodePath(row.id_invitado)}/edit`);
  };

  const eliminar = async (row) => {
    const result = await confirmDialog({
      title: "Eliminar acceso?",
      message: `${row.id_invitado} - ${row.id_punto_venta}`,
      icon: "warning",
      confirmText: "ELIMINAR",
      cancelText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`${back_host}/mad_punto_venta_usuario/${encodePath(params.id_anfitrion)}/${encodePath(row.documento_id)}/${encodePath(row.id_punto_venta)}/${encodePath(row.id_invitado)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudo eliminar el acceso.");
      }
      cargarDatos();
    } catch (error) {
      swal2.fire({ title: "No se pudo eliminar", text: error.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    }
  };

  const columns = [
    {
      name: "Usuario",
      grow: 1.7,
      cell: row => (
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 800 }} noWrap>
            {row.nombres || "Sin nombre"}
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: "12px" }} noWrap>
            {row.id_invitado}
          </Typography>
        </Box>
      ),
    },
    { name: etiquetaPunto, selector: row => `${row.id_punto_venta} - ${row.punto_venta_nombre || ""}`, grow: 1.2 },
    { name: "Activo", width: "92px", cell: row => <EstadoChip active={row.activo} trueLabel="Activo" falseLabel="Inactivo" /> },
    { name: "Libre", width: "86px", cell: row => <EstadoChip active={row.sin_restriccion} trueLabel="Libre" falseLabel="Turno" /> },
    { name: "Turno 1", selector: row => `${formatTime(row.turno1_inicio)} - ${formatTime(row.turno1_fin)}`, width: "145px" },
    { name: "Turno 2", selector: row => `${formatTime(row.turno2_inicio)} - ${formatTime(row.turno2_fin)}`, width: "145px" },
    { name: "Turno 3", selector: row => `${formatTime(row.turno3_inicio)} - ${formatTime(row.turno3_fin)}`, width: "145px" },
    { name: "Ingreso", selector: row => formatDateTime(row.fecha_ingreso), width: "150px" },
    {
      name: "",
      width: "96px",
      right: true,
      style: stickyActionColumnSx,
      cell: row => (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.7, width: "100%" }}>
          <Tooltip title="Editar turnos" arrow><Box sx={actionButtonSx()} onClick={() => editar(row)}><Pencil size={14} /></Box></Tooltip>
          <Tooltip title="Eliminar acceso" arrow><Box sx={actionButtonSx(true)} onClick={() => eliminar(row)}><Trash2 size={14} /></Box></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.bg, p: { xs: 1, md: 4 } }}>
      <Box sx={{ maxWidth: 1180, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", gap: 1.2, mb: 2, flexDirection: { xs: "column", sm: "row" } }}>
          <Box>
            <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "22px", lineHeight: 1.2 }}>Usuarios turnos</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "13px", mt: 0.5 }}>{rows.length} accesos por {etiquetaPuntoLower}</Typography>
          </Box>
          <AppSearch placeholder={`Buscar usuario o ${etiquetaPuntoLower}...`} value={busqueda} onChange={(event) => { setBusqueda(event.target.value); filtrar(event.target.value); }} />
          <AppButton
            icon={<Plus size={18} />}
            onClick={() => navigate(`/ad_puntoventausuario/${params.id_anfitrion}/${params.id_invitado}/new`)}
            sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}
          >
            Nuevo acceso
          </AppButton>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(320px, 520px)" },
            gap: 1,
            mb: 2,
            p: { xs: 0.7, md: 1.2 },
            borderRadius: 3,
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
          }}
        >
          <HeaderMenuPicker
            label="Empresa"
            value={documentoTrabajo}
            displayValue={contabilidades.find((item) => item.documento_id === documentoTrabajo)?.razon_social || documentoTrabajo}
            options={contabilidades.map((item) => ({ value: item.documento_id, label: item.razon_social || item.documento_id }))}
            onSelect={handleDocumentoSelect}
          />
        </Box>

        <DataTable
          theme="transportesDark"
          columns={columns}
          data={rows}
          progressPending={loading}
          pagination
          paginationPerPage={12}
          customStyles={customStyles}
          noDataComponent={<Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}><Search size={16} />Sin accesos configurados</Box>}
        />

        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, color: palette.muted, fontSize: "12px" }}>
          <ShieldCheck size={14} />
          Accesos registrados en mad_punto_venta_usuario.
        </Box>
      </Box>
    </Box>
  );
}
