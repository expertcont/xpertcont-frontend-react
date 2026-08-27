"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DataTable, { createTheme } from "react-data-table-component";
import { Box, Dialog, Grid, IconButton, InputBase, Tooltip, Typography } from "@mui/material";
import { Building2, Check, Hash, MapPin, Pencil, Phone, Plus, Save, Search, Trash2, X } from "lucide-react";
import swal2 from "sweetalert2";

import { useDialog } from "./AdminConfirmDialogProvider";
import AppButton from "../ui/AppButton";
import AppChip from "../ui/AppChip";
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

function Field({ label, icon, children, helper }) {
  return (
    <Box>
      <Typography
        sx={{
          color: palette.muted,
          fontSize: "10.5px",
          fontWeight: 800,
          textTransform: "uppercase",
          mb: 0.4,
        }}
      >
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
      {helper && (
        <Typography sx={{ color: palette.muted, fontSize: "10.5px", mt: 0.35 }}>
          {helper}
        </Typography>
      )}
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

function PuntoVentaModal({ open, punto, etiquetas, onClose, onSubmit }) {
  const [draft, setDraft] = useState({
    id_punto_venta: "",
    nombre: "",
    direccion: "",
    ubigeo: "",
    pais: "PE",
    telefono: "",
    serie: "",
    activo: true,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDraft({
        id_punto_venta: punto?.id_punto_venta || "",
        nombre: punto?.nombre || "",
        direccion: punto?.direccion || "",
        ubigeo: punto?.ubigeo || "",
        pais: punto?.pais || "PE",
        telefono: punto?.telefono || "",
        serie: punto?.serie || "",
        activo: punto?.activo !== false,
      });
      setError("");
    }
  }, [open, punto]);

  const updateDraft = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = () => {
    if (!draft.id_punto_venta || !draft.nombre) {
      setError(`Completa codigo y nombre de ${etiquetas.articuloSingular}.`);
      return;
    }
    onSubmit(draft);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: 3,
        },
      }}
    >
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5, mb: 1.6 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.accentSoft,
                color: palette.accent,
                flexShrink: 0,
              }}
            >
              <Building2 size={18} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: "16px", md: "17px" }, lineHeight: 1.2 }}>
                {punto ? etiquetas.editarLabel : etiquetas.nuevoLabel}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11.5px", mt: 0.25 }}>
                {etiquetas.descripcion}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted, mt: -0.5 }}><X size={18} /></IconButton>
        </Box>

        <Typography sx={{ color: palette.text, fontSize: "12.5px", fontWeight: 800, mb: 0.85 }}>
          Datos principales
        </Typography>
        <Grid container spacing={1.15}>
          <Grid item xs={12} md={3}>
            <Field label="Codigo" icon={<Hash size={15} />}>
              <CaptureInput value={draft.id_punto_venta} onChange={(value) => updateDraft("id_punto_venta", value)} placeholder="1001" readOnly={Boolean(punto)} />
            </Field>
          </Grid>
          <Grid item xs={12} md={6}>
            <Field label="Nombre de oficina" icon={<Building2 size={15} />}>
              <CaptureInput value={draft.nombre} onChange={(value) => updateDraft("nombre", value)} placeholder="PEDREGAL" />
            </Field>
          </Grid>
          <Grid item xs={12} md={3}>
            <Field label="Serie" icon={<Hash size={15} />}>
              <CaptureInput value={draft.serie} onChange={(value) => updateDraft("serie", value.toUpperCase())} placeholder="B001" />
            </Field>
          </Grid>
          <Grid item xs={12} md={8}>
            <Field label="Direccion" icon={<MapPin size={15} />}>
              <CaptureInput value={draft.direccion} onChange={(value) => updateDraft("direccion", value)} placeholder="Direccion de oficina" />
            </Field>
          </Grid>
          <Grid item xs={12} md={4}>
            <Field label="Telefono" icon={<Phone size={15} />}>
              <CaptureInput value={draft.telefono} onChange={(value) => updateDraft("telefono", value)} placeholder="Telefono / celular" />
            </Field>
          </Grid>
        </Grid>

        <Typography sx={{ color: palette.text, fontSize: "12.5px", fontWeight: 800, mt: 1.65, mb: 0.85 }}>
          Ubicacion y estado
        </Typography>
        <Grid container spacing={1.15}>
          <Grid item xs={12} md={4}>
            <Field label="Ubigeo">
              <CaptureInput value={draft.ubigeo} onChange={(value) => updateDraft("ubigeo", value)} placeholder="040101" />
            </Field>
          </Grid>
          <Grid item xs={12} md={3}>
            <Field label="Pais">
              <CaptureInput value={draft.pais} onChange={(value) => updateDraft("pais", value)} placeholder="PE" />
            </Field>
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography sx={{ color: palette.muted, fontSize: "10.5px", fontWeight: 800, textTransform: "uppercase", mb: 0.55 }}>
              Estado
            </Typography>
            <Box
              onClick={() => updateDraft("activo", !draft.activo)}
              sx={{
                ...fieldSx,
                minHeight: 40,
                cursor: "pointer",
                justifyContent: "space-between",
                color: draft.activo ? palette.accent : palette.muted,
                fontWeight: 800,
                fontSize: "12.5px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Check size={15} />
                {draft.activo ? "Activo para operaciones" : "Inactivo"}
              </Box>
              <Typography sx={{ color: palette.muted, fontSize: "11px" }}>
                Cambiar
              </Typography>
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
  "&:hover": { backgroundColor: danger ? "#c2410c" : palette.accent, borderColor: danger ? "#c2410c" : palette.accent, color: "#fff" },
});

const stickyActionColumnSx = {
  position: "sticky",
  right: 0,
  zIndex: 2,
  backgroundColor: palette.surface,
  boxShadow: "-10px 0 16px rgba(0,0,0,.16)",
};

export default function AdminPuntoVentaList() {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const params = useParams();
  const { confirmDialog } = useDialog();
  const rubroTrabajo = String(sessionStorage.getItem("rubro_trabajo") || "").trim().toUpperCase();
  const esRubroTransporte = rubroTrabajo === "TRANSPORTE" || rubroTrabajo === "TRANSPORTES";
  const etiquetas = useMemo(() => esRubroTransporte
    ? {
      singular: "agencia",
      plural: "Agencias",
      pluralLower: "agencias",
      articuloSingular: "la agencia",
      nuevoLabel: "Nueva agencia",
      editarLabel: "Editar agencia",
      contadorTexto: "agencias registradas",
      sinDatosTexto: "Sin agencias registradas",
      descripcion: "Agencias operativas, series y datos de contacto.",
    }
    : {
      singular: "punto de venta",
      plural: "Puntos de Venta",
      pluralLower: "puntos de venta",
      articuloSingular: "el punto de venta",
      nuevoLabel: "Nuevo punto de venta",
      editarLabel: "Editar punto de venta",
      contadorTexto: "puntos de venta registrados",
      sinDatosTexto: "Sin puntos de venta registrados",
      descripcion: "Puntos de venta, series y datos de contacto.",
    }, [esRubroTransporte]);

  const [rows, setRows] = useState([]);
  const [baseRows, setBaseRows] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${back_host}/mad_punto_venta/${params.id_anfitrion}/${params.documento_id}`);
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      setRows(data);
      setBaseRows(data);
    } catch (error) {
      console.log(`Error cargando ${etiquetas.pluralLower}:`, error);
      setRows([]);
      setBaseRows([]);
    } finally {
      setLoading(false);
    }
  }, [back_host, params.id_anfitrion, params.documento_id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const filtrar = (texto) => {
    const value = texto.toLowerCase();
    setRows(baseRows.filter((item) => [
      item.id_punto_venta,
      item.nombre,
      item.direccion,
      item.ubigeo,
      item.pais,
      item.telefono,
      item.serie,
    ].some((field) => String(field || "").toLowerCase().includes(value))));
  };

  const guardar = async (draft) => {
    const esEdicion = Boolean(editando);
    try {
      const response = await fetch(`${back_host}/mad_punto_venta`, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          id_anfitrion: params.id_anfitrion,
          documento_id: params.documento_id,
          ctrl_crea_us: params.id_invitado,
          ctrl_mod_us: params.id_invitado,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || `No se pudo guardar ${etiquetas.articuloSingular}.`);
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
      title: `Eliminar ${etiquetas.singular}?`,
      message: `${row.id_punto_venta} - ${row.nombre}`,
      icon: "warning",
      confirmText: "ELIMINAR",
      cancelText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${back_host}/mad_punto_venta/${params.id_anfitrion}/${params.documento_id}/${row.id_punto_venta}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `No se pudo eliminar ${etiquetas.articuloSingular}.`);
      }
      cargarDatos();
    } catch (error) {
      swal2.fire({ title: "No se pudo eliminar", text: error.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    }
  };

  const columns = useMemo(() => [
    { name: "Codigo", selector: row => row.id_punto_venta, width: "110px" },
    { name: etiquetas.plural, selector: row => row.nombre, grow: 1.2 },
    { name: "Direccion", selector: row => row.direccion || "-", grow: 1.4 },
    { name: "Telefono", selector: row => row.telefono || "-", width: "130px" },
    { name: "Serie", selector: row => row.serie || "-", width: "90px" },
    { name: "Estado", width: "120px", cell: row => <AppChip>{row.activo !== false ? "Activo" : "Inactivo"}</AppChip> },
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
  ], [etiquetas.plural]);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.bg, p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1080, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", gap: 1.2, mb: 2, flexDirection: { xs: "column", sm: "row" } }}>
          <Box>
            <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "22px", lineHeight: 1.2 }}>{etiquetas.plural}</Typography>
            <Typography sx={{ color: palette.muted, fontSize: "13px", mt: 0.5 }}>{rows.length} {etiquetas.contadorTexto}</Typography>
          </Box>
          <AppSearch placeholder={`Buscar ${etiquetas.singular}...`} value={busqueda} onChange={(event) => { setBusqueda(event.target.value); filtrar(event.target.value); }} />
          <AppButton icon={<Plus size={18} />} onClick={() => { setEditando(null); setModalOpen(true); }} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
            {etiquetas.nuevoLabel}
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
          noDataComponent={<Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}><Search size={16} />{etiquetas.sinDatosTexto}</Box>}
        />
      </Box>

      <PuntoVentaModal open={modalOpen} punto={editando} etiquetas={etiquetas} onClose={() => { setModalOpen(false); setEditando(null); }} onSubmit={guardar} />
    </Box>
  );
}
