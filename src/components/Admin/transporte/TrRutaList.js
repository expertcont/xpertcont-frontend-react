"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DataTable, { createTheme } from "react-data-table-component";
import { Box, Dialog, Grid, IconButton, InputBase, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import { MapPinned, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import swal2 from "sweetalert2";

import { useDialog } from "../AdminConfirmDialogProvider";
import AppButton from "../../ui/AppButton";
import AppChip from "../../ui/AppChip";
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

function Field({ label, children }) {
  return (
    <Box>
      <Typography sx={{ color: palette.muted, fontSize: "10.5px", fontWeight: 800, textTransform: "uppercase", mb: 0.4 }}>
        {label}
      </Typography>
      <Box sx={fieldSx}>{children}</Box>
    </Box>
  );
}

function CaptureInput({ value, onChange, placeholder, readOnly = false, type = "text", align = "left" }) {
  return (
    <InputBase
      type={type}
      value={value || ""}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      sx={{ ...inputSx, "& input": { textAlign: align } }}
    />
  );
}

function PuntoSelect({ value, onChange, puntos }) {
  return (
    <Select
      variant="standard"
      disableUnderline
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      sx={{ color: palette.text, fontSize: "13px", width: "100%", "& .MuiSelect-icon": { color: palette.muted } }}
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
      <MenuItem value="">Selecciona</MenuItem>
      {puntos.map((punto) => (
        <MenuItem key={punto.id_punto_venta} value={punto.id_punto_venta}>
          {punto.id_punto_venta} - {punto.nombre}
        </MenuItem>
      ))}
    </Select>
  );
}

function RutaModal({ open, ruta, puntos, onClose, onSubmit }) {
  const [draft, setDraft] = useState({
    id_ruta: "",
    id_punto_venta: "",
    id_punto_venta_dest: "",
    nombre: "",
    precio_pasaje: "0",
    activo: true,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDraft({
        id_ruta: ruta?.id_ruta || "",
        id_punto_venta: ruta?.id_punto_venta || "",
        id_punto_venta_dest: ruta?.id_punto_venta_dest || "",
        nombre: ruta?.nombre || "",
        precio_pasaje: ruta?.precio_pasaje ?? "0",
        activo: ruta?.activo !== false,
      });
      setError("");
    }
  }, [open, ruta]);

  const updateDraft = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = () => {
    if (!draft.id_ruta || !draft.id_punto_venta || !draft.id_punto_venta_dest || !draft.nombre) {
      setError("Completa codigo, origen, destino y nombre.");
      return;
    }
    onSubmit(draft);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 3 } }}>
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: palette.accentSoft, color: palette.accent }}>
              <MapPinned size={18} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "17px" }}>{ruta ? "Editar ruta" : "Nueva ruta"}</Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11.5px" }}>Trayecto entre agencias de transporte.</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}><X size={18} /></IconButton>
        </Box>

        <Grid container spacing={1.15}>
          <Grid item xs={12} md={3}>
            <Field label="Ruta">
              <CaptureInput value={draft.id_ruta} onChange={(value) => updateDraft("id_ruta", value.toUpperCase())} placeholder="AQP-PED" readOnly={Boolean(ruta)} />
            </Field>
          </Grid>
          <Grid item xs={12} md={4.5}>
            <Field label="Origen">
              <PuntoSelect value={draft.id_punto_venta} onChange={(value) => updateDraft("id_punto_venta", value)} puntos={puntos} />
            </Field>
          </Grid>
          <Grid item xs={12} md={4.5}>
            <Field label="Destino">
              <PuntoSelect value={draft.id_punto_venta_dest} onChange={(value) => updateDraft("id_punto_venta_dest", value)} puntos={puntos} />
            </Field>
          </Grid>
          <Grid item xs={12} md={7}>
            <Field label="Nombre">
              <CaptureInput value={draft.nombre} onChange={(value) => updateDraft("nombre", value.toUpperCase())} placeholder="AREQUIPA - PEDREGAL" />
            </Field>
          </Grid>
          <Grid item xs={12} md={3}>
            <Field label="Pasaje">
              <CaptureInput value={draft.precio_pasaje} onChange={(value) => updateDraft("precio_pasaje", value)} type="number" align="right" placeholder="0.00" />
            </Field>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box onClick={() => updateDraft("activo", !draft.activo)} sx={{ ...fieldSx, cursor: "pointer", justifyContent: "center", color: draft.activo ? palette.accent : palette.muted, fontWeight: 800, fontSize: "12.5px" }}>
              {draft.activo ? "ACTIVO" : "INACTIVO"}
            </Box>
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

const formatMoney = (value) => `S/ ${Number(value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function TrRutaList() {
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
      setPuntos(Array.isArray(result?.data) ? result.data.filter((item) => item.activo !== false) : []);
    } catch (error) {
      console.log("Error cargando agencias para rutas:", error);
      setPuntos([]);
    }
  }, [back_host, params.id_anfitrion, params.documento_id]);

  const cargarRutas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${back_host}/mve_transruta/${params.id_anfitrion}/${params.documento_id}`);
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      setRows(data);
      setBaseRows(data);
    } catch (error) {
      console.log("Error cargando rutas:", error);
      setRows([]);
      setBaseRows([]);
    } finally {
      setLoading(false);
    }
  }, [back_host, params.id_anfitrion, params.documento_id]);

  useEffect(() => {
    cargarPuntos();
    cargarRutas();
  }, [cargarPuntos, cargarRutas]);

  const filtrar = (texto) => {
    const value = texto.toLowerCase();
    setRows(baseRows.filter((item) => [
      item.id_ruta,
      item.nombre,
      item.id_punto_venta,
      item.id_punto_venta_dest,
      item.punto_venta_nombre,
      item.punto_venta_dest_nombre,
    ].some((field) => String(field || "").toLowerCase().includes(value))));
  };

  const guardar = async (draft) => {
    const esEdicion = Boolean(editando);
    try {
      const response = await fetch(`${back_host}/mve_transruta`, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          precio_pasaje: Number(draft.precio_pasaje || 0),
          id_anfitrion: params.id_anfitrion,
          documento_id: params.documento_id,
          ctrl_crea_us: params.id_invitado,
          ctrl_mod_us: params.id_invitado,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo guardar la ruta.");
      }
      setModalOpen(false);
      setEditando(null);
      cargarRutas();
    } catch (error) {
      swal2.fire({ title: "No se pudo guardar", text: error.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    }
  };

  const eliminar = async (row) => {
    const result = await confirmDialog({
      title: "Eliminar ruta?",
      message: `${row.id_ruta} - ${row.nombre}`,
      icon: "warning",
      confirmText: "ELIMINAR",
      cancelText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${back_host}/mve_transruta/${params.id_anfitrion}/${params.documento_id}/${row.id_ruta}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudo eliminar la ruta.");
      }
      cargarRutas();
    } catch (error) {
      swal2.fire({ title: "No se pudo eliminar", text: error.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    }
  };

  const columns = useMemo(() => [
    { name: "Ruta", selector: row => row.id_ruta, width: "140px" },
    { name: "Nombre", selector: row => row.nombre, grow: 1.2 },
    { name: "Origen", selector: row => row.punto_venta_nombre || row.id_punto_venta, grow: 1 },
    { name: "Destino", selector: row => row.punto_venta_dest_nombre || row.id_punto_venta_dest, grow: 1 },
    { name: "Pasaje", width: "110px", cell: row => <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 800 }}>{formatMoney(row.precio_pasaje)}</Typography> },
    { name: "Estado", width: "110px", cell: row => <AppChip>{row.activo !== false ? "Activo" : "Inactivo"}</AppChip> },
    {
      name: "",
      width: "90px",
      right: true,
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
            <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "22px", lineHeight: 1.2 }}>Rutas de Transporte</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "13px", mt: 0.5 }}>{rows.length} rutas registradas</Typography>
          </Box>
          <AppSearch placeholder="Buscar ruta..." value={busqueda} onChange={(event) => { setBusqueda(event.target.value); filtrar(event.target.value); }} />
          <AppButton icon={<Plus size={18} />} onClick={() => { setEditando(null); setModalOpen(true); }} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
            Nueva ruta
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
          noDataComponent={<Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}><Search size={16} />Sin rutas registradas</Box>}
        />
      </Box>

      <RutaModal open={modalOpen} ruta={editando} puntos={puntos} onClose={() => { setModalOpen(false); setEditando(null); }} onSubmit={guardar} />
    </Box>
  );
}
