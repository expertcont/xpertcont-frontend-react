"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DataTable, { createTheme } from "react-data-table-component";
import { Box, Dialog, Grid, IconButton, InputBase, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import { Building2, Hash, MapPin, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import swal2 from "sweetalert2";

import { useDialog } from "../AdminConfirmDialogProvider";
import AppButton from "../../ui/AppButton";
import AppSearch from "../../ui/AppSearch";
import palette from "../../../theme/palette";

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

const fieldSx = {
  minHeight: 40,
  px: 1.15,
  display: "flex",
  alignItems: "center",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  transition: "border-color .18s ease, background-color .18s ease",
  "&:focus-within": {
    borderColor: palette.accent,
    backgroundColor: palette.surfaceAlt,
  },
};

const inputSx = {
  color: palette.text,
  fontSize: "13px",
  width: "100%",
  "& input::placeholder": { color: palette.muted, opacity: 1 },
};

const customStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: { style: { backgroundColor: palette.surfaceAlt, color: palette.muted, borderBottom: `1px solid ${palette.borderSoft}` } },
  headCells: { style: { color: palette.muted, fontSize: "11px", fontWeight: 800, textTransform: "uppercase" } },
  rows: { style: { backgroundColor: palette.surface, color: palette.text, borderBottom: `1px solid ${palette.borderSoft}` } },
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
  "&:hover": {
    backgroundColor: danger ? "#c2410c" : palette.accent,
    borderColor: danger ? "#c2410c" : palette.accent,
    color: "#fff",
  },
});

const stickyActionColumnSx = {
  position: "sticky",
  right: 0,
  zIndex: 2,
  backgroundColor: palette.surface,
  boxShadow: "-10px 0 16px rgba(0,0,0,.16)",
};

function Field({ label, icon, children }) {
  return (
    <Box>
      <Typography sx={{ color: palette.muted, fontSize: "10.5px", fontWeight: 800, textTransform: "uppercase", mb: 0.4 }}>
        {label}
      </Typography>
      <Box sx={fieldSx}>
        {icon && (
          <Box sx={{ color: palette.muted, display: "flex", alignItems: "center", mr: 0.8, flexShrink: 0 }}>
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>
    </Box>
  );
}

function CaptureInput({ value, onChange, placeholder, readOnly = false }) {
  return (
    <InputBase
      value={value || ""}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      sx={inputSx}
    />
  );
}

function PuntoSelect({ value, onChange, puntos, readOnly = false }) {
  return (
    <Select
      variant="standard"
      disableUnderline
      value={value || ""}
      disabled={readOnly}
      onChange={(event) => onChange(event.target.value)}
      sx={{
        color: palette.text,
        fontSize: "13px",
        width: "100%",
        "& .MuiSelect-icon": { color: palette.muted },
        "&.Mui-disabled": {
          color: palette.text,
          WebkitTextFillColor: palette.text,
        },
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            bgcolor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            "& .MuiMenuItem-root": { fontSize: "13px" },
          },
        },
      }}
    >
      <MenuItem value="">Selecciona punto</MenuItem>
      {puntos.map((punto) => (
        <MenuItem key={punto.id_punto_venta} value={punto.id_punto_venta}>
          {punto.id_punto_venta} - {punto.nombre}
        </MenuItem>
      ))}
    </Select>
  );
}

function ZonaModal({ open, zona, puntos, onClose, onSubmit }) {
  const [draft, setDraft] = useState({
    id_punto_venta: "",
    id_zona: "",
    nombre: "",
    descripcion: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDraft({
        id_punto_venta: zona?.id_punto_venta || "",
        id_zona: zona?.id_zona || "",
        nombre: zona?.nombre || "",
        descripcion: zona?.descripcion || "",
      });
      setError("");
    }
  }, [open, zona]);

  const updateDraft = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = () => {
    if (!draft.id_punto_venta || !draft.id_zona || !draft.nombre || !draft.descripcion) {
      setError("Completa punto de venta, codigo, nombre y descripcion.");
      return;
    }
    onSubmit({
      ...draft,
      id_punto_venta: String(draft.id_punto_venta || "").trim().toUpperCase(),
      id_zona: String(draft.id_zona || "").trim().toUpperCase(),
      nombre: String(draft.nombre || "").trim().toUpperCase(),
      descripcion: String(draft.descripcion || "").trim(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 3 } }}>
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5, mb: 1.6 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: palette.accentSoft, color: palette.accent, flexShrink: 0 }}>
              <MapPin size={18} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: "16px", md: "17px" }, lineHeight: 1.2 }}>
                {zona ? "Editar zona" : "Nueva zona"}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11.5px", mt: 0.25 }}>
                Zonas generales por punto de venta o agencia.
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted, mt: -0.5 }}><X size={18} /></IconButton>
        </Box>

        <Grid container spacing={1.15}>
          <Grid item xs={12} md={5}>
            <Field label="Punto de venta" icon={<Building2 size={15} />}>
              <PuntoSelect value={draft.id_punto_venta} onChange={(value) => updateDraft("id_punto_venta", value)} puntos={puntos} readOnly={Boolean(zona)} />
            </Field>
          </Grid>
          <Grid item xs={12} md={3}>
            <Field label="Zona" icon={<Hash size={15} />}>
              <CaptureInput value={draft.id_zona} onChange={(value) => updateDraft("id_zona", value.toUpperCase())} placeholder="Z001" readOnly={Boolean(zona)} />
            </Field>
          </Grid>
          <Grid item xs={12} md={4}>
            <Field label="Nombre" icon={<MapPin size={15} />}>
              <CaptureInput value={draft.nombre} onChange={(value) => updateDraft("nombre", value.toUpperCase())} placeholder="CENTRO" />
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="Descripcion">
              <CaptureInput value={draft.descripcion} onChange={(value) => updateDraft("descripcion", value)} placeholder="Detalle o referencia de la zona" />
            </Field>
          </Grid>
        </Grid>

        {error && <Typography sx={{ color: "#ff8a65", fontSize: "12px", mt: 1 }}>{error}</Typography>}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.8, mt: 1.8, flexWrap: "wrap" }}>
          <AppButton onClick={onClose}>Cancelar</AppButton>
          <AppButton icon={<Save size={16} />} onClick={handleSubmit} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
            Guardar
          </AppButton>
        </Box>
      </Box>
    </Dialog>
  );
}

export default function TrZonaList() {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const params = useParams();
  const { confirmDialog } = useDialog();
  const [rows, setRows] = useState([]);
  const [baseRows, setBaseRows] = useState([]);
  const [puntos, setPuntos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  const cargarPuntos = useCallback(async () => {
    try {
      const response = await fetch(`${back_host}/mad_punto_venta/${params.id_anfitrion}/${params.documento_id}`);
      const result = await response.json();
      setPuntos(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.log("Error cargando puntos para zonas:", error);
      setPuntos([]);
    }
  }, [back_host, params.id_anfitrion, params.documento_id]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${back_host}/mve_transzona/${params.id_anfitrion}/${params.documento_id}`);
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      setRows(data);
      setBaseRows(data);
    } catch (error) {
      console.log("Error cargando zonas:", error);
      setRows([]);
      setBaseRows([]);
    } finally {
      setLoading(false);
    }
  }, [back_host, params.id_anfitrion, params.documento_id]);

  useEffect(() => {
    cargarPuntos();
    cargarDatos();
  }, [cargarPuntos, cargarDatos]);

  const filtrar = (texto) => {
    const value = texto.toLowerCase();
    setRows(baseRows.filter((item) => [
      item.id_punto_venta,
      item.punto_venta_nombre,
      item.id_zona,
      item.nombre,
      item.descripcion,
    ].some((field) => String(field || "").toLowerCase().includes(value))));
  };

  const guardar = async (draft) => {
    const esEdicion = Boolean(editando);
    try {
      const response = await fetch(`${back_host}/mve_transzona`, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          id_anfitrion: params.id_anfitrion,
          documento_id: params.documento_id,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo guardar la zona.");
      }
      setModalOpen(false);
      setEditando(null);
      cargarDatos();
    } catch (error) {
      swal2.fire({ title: "No se pudo guardar", text: error.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    }
  };

  const eliminar = async (row) => {
    const result = await confirmDialog({
      title: "Eliminar zona?",
      message: `${row.id_punto_venta} / ${row.id_zona} - ${row.nombre}`,
      icon: "warning",
      confirmText: "ELIMINAR",
      cancelText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${back_host}/mve_transzona/${params.id_anfitrion}/${params.documento_id}/${row.id_punto_venta}/${row.id_zona}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudo eliminar la zona.");
      }
      cargarDatos();
    } catch (error) {
      swal2.fire({ title: "No se pudo eliminar", text: error.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    }
  };

  const columns = useMemo(() => [
    { name: "Punto", selector: row => row.punto_venta_nombre || row.id_punto_venta, grow: 1 },
    { name: "Cod. zona", selector: row => row.id_zona, width: "130px" },
    {
      name: "Zona",
      selector: row => row.nombre,
      grow: 1,
      cell: row => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.85, fontWeight: 800 }}>
          <MapPin size={15} color={palette.accent} />
          {row.nombre}
        </Box>
      ),
    },
    { name: "Descripcion", selector: row => row.descripcion || "-", grow: 1.2 },
    {
      name: "",
      width: "90px",
      right: true,
      style: stickyActionColumnSx,
      cell: row => (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.7, width: "100%" }}>
          <Tooltip title="Editar" arrow><Box sx={actionButtonSx()} onClick={() => { setEditando(row); setModalOpen(true); }}><Pencil size={14} /></Box></Tooltip>
          <Tooltip title="Eliminar" arrow><Box sx={actionButtonSx(true)} onClick={() => eliminar(row)}><Trash2 size={14} /></Box></Tooltip>
        </Box>
      ),
    },
  ], []);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.bg, p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1120, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", gap: 1.2, mb: 2, flexDirection: { xs: "column", sm: "row" } }}>
          <Box>
            <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "22px", lineHeight: 1.2 }}>Zonas</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "13px", mt: 0.5 }}>{rows.length} zonas registradas</Typography>
          </Box>
          <AppSearch placeholder="Buscar zona..." value={busqueda} onChange={(event) => { setBusqueda(event.target.value); filtrar(event.target.value); }} />
          <AppButton icon={<Plus size={18} />} onClick={() => { setEditando(null); setModalOpen(true); }} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
            Nueva zona
          </AppButton>
        </Box>

        <DataTable
          theme="transportesDark"
          columns={columns}
          data={rows}
          progressPending={loading}
          pagination
          paginationPerPage={12}
          customStyles={customStyles}
          noDataComponent={<Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}><Search size={16} />Sin zonas registradas</Box>}
        />
      </Box>

      <ZonaModal open={modalOpen} zona={editando} puntos={puntos} onClose={() => { setModalOpen(false); setEditando(null); }} onSubmit={guardar} />
    </Box>
  );
}
