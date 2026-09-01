import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Dialog,
  Grid,
  IconButton,
  InputBase,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import DataTable, { createTheme } from "react-data-table-component";
import { FileText, Hash, MapPin, Pencil, Plus, Save, Search, Trash2, UserRound, X } from "lucide-react";

import { useDialog } from "../../AdminConfirmDialogProvider";
import AppButton from "../../../ui/AppButton";
import AppSearch from "../../../ui/AppSearch";
import palette from "../../../../theme/palette";

createTheme(
  "clientesHabitualesDark",
  {
    text: { primary: palette.text, secondary: palette.accent },
    background: { default: "transparent" },
    divider: { default: palette.borderSoft },
    action: { hover: "rgba(42,161,152,0.06)" },
  },
  "dark",
);

const backHost = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";

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

const normalizarDocumento = (value) => (value || "").replace(/\D/g, "").slice(0, 11);

const customStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: {
    style: {
      backgroundColor: palette.surfaceAlt,
      color: palette.muted,
      borderBottom: `1px solid ${palette.borderSoft}`,
      minHeight: "38px",
    },
  },
  headCells: {
    style: {
      color: palette.muted,
      fontSize: "11px",
      fontWeight: 800,
      textTransform: "uppercase",
    },
  },
  rows: {
    style: {
      backgroundColor: palette.surface,
      color: palette.text,
      borderBottom: `1px solid ${palette.borderSoft}`,
      minHeight: "42px",
    },
    highlightOnHoverStyle: {
      backgroundColor: palette.surfaceAlt,
      color: palette.text,
      borderBottomColor: palette.border,
    },
  },
  cells: {
    style: {
      color: palette.text,
      fontSize: "12.5px",
      minWidth: 0,
    },
  },
  pagination: {
    style: {
      backgroundColor: "transparent",
      color: palette.muted,
      borderTop: `1px solid ${palette.borderSoft}`,
    },
  },
};

function CellText({ children, muted = false, strong = false }) {
  return (
    <Typography
      title={String(children || "")}
      sx={{
        color: muted ? palette.muted : palette.text,
        fontSize: "12.5px",
        fontWeight: strong ? 800 : 500,
        lineHeight: 1.25,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        width: "100%",
      }}
    >
      {children || "-"}
    </Typography>
  );
}

function Field({ label, icon, children }) {
  return (
    <Box>
      <Typography sx={{ color: palette.muted, fontSize: "10.5px", fontWeight: 800, textTransform: "uppercase", mb: 0.4 }}>
        {label}
      </Typography>
      <Box sx={fieldSx}>
        {icon && <Box sx={{ color: palette.muted, display: "flex", alignItems: "center", mr: 0.8 }}>{icon}</Box>}
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

function HabitualModal({ open, cliente, onClose, onSubmit, onLookup, saving = false }) {
  const [draft, setDraft] = useState({
    hab_documento_id: "",
    hab_razon_social: "",
    hab_id_doc: "6",
    hab_direccion: "",
  });
  const [error, setError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft({
        hab_documento_id: cliente?.hab_documento_id || "",
        hab_razon_social: cliente?.hab_razon_social || "",
        hab_id_doc: cliente?.hab_id_doc || "6",
        hab_direccion: cliente?.hab_direccion || "",
      });
      setError("");
    }
  }, [open, cliente]);

  const updateDraft = (name, value) => {
    setDraft((prev) => ({
      ...prev,
      [name]: name === "hab_documento_id" ? normalizarDocumento(value) : value,
    }));
  };

  const handleLookup = async () => {
    const documento = normalizarDocumento(draft.hab_documento_id);

    if (![8, 11].includes(documento.length)) {
      setError("Ingresa un DNI de 8 digitos o un RUC de 11 digitos.");
      return;
    }

    setLookingUp(true);
    setError("");

    try {
      const clienteEncontrado = await onLookup(documento);
      setDraft((prev) => ({
        ...prev,
        hab_documento_id: documento,
        hab_id_doc: clienteEncontrado.hab_id_doc,
        hab_razon_social: clienteEncontrado.hab_razon_social,
        hab_direccion: clienteEncontrado.hab_direccion,
      }));
    } catch (lookupError) {
      setError(lookupError.message || "No se pudo consultar el documento.");
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = () => {
    const documento = normalizarDocumento(draft.hab_documento_id);

    if (!documento || !draft.hab_razon_social || !draft.hab_id_doc) {
      setError("Completa documento, tipo y razon social.");
      return;
    }

    if (draft.hab_id_doc === "6" && documento.length !== 11) {
      setError("El RUC debe tener 11 digitos.");
      return;
    }

    if (draft.hab_id_doc === "1" && documento.length !== 8) {
      setError("El DNI debe tener 8 digitos.");
      return;
    }

    onSubmit({
      ...draft,
      hab_documento_id: documento,
      hab_razon_social: draft.hab_razon_social.trim(),
      hab_direccion: draft.hab_direccion.trim(),
    });
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
              <UserRound size={18} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: "16px", md: "17px" }, lineHeight: 1.2 }}>
                {cliente ? "Editar cliente habitual" : "Nuevo cliente habitual"}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "11.5px", mt: 0.25 }}>
                Clientes frecuentes para emision de comprobantes.
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted, mt: -0.5 }}>
            <X size={18} />
          </IconButton>
        </Box>

        <Grid container spacing={1.15}>
          <Grid item xs={12} md={4}>
            <Field label="RUC/DNI" icon={<Hash size={15} />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CaptureInput
                  value={draft.hab_documento_id}
                  readOnly={Boolean(cliente)}
                  onChange={(value) => updateDraft("hab_documento_id", value)}
                  placeholder="RUC / DNI"
                />
                {!cliente && (
                  <Tooltip title="Buscar RUC/DNI">
                    <IconButton
                      size="small"
                      onClick={handleLookup}
                      disabled={lookingUp}
                      sx={{ color: palette.accent, p: 0.35 }}
                    >
                      <Search size={15} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Field>
          </Grid>
          <Grid item xs={12} md={3}>
            <Field label="Tipo doc" icon={<FileText size={15} />}>
              <Select
                value={draft.hab_id_doc}
                onChange={(event) => updateDraft("hab_id_doc", event.target.value)}
                variant="standard"
                disableUnderline
                sx={{ ...inputSx, "& .MuiSelect-icon": { color: palette.muted } }}
              >
                <MenuItem value="6">RUC</MenuItem>
                <MenuItem value="1">DNI</MenuItem>
              </Select>
            </Field>
          </Grid>
          <Grid item xs={12} md={5}>
            <Field label="Razon social" icon={<UserRound size={15} />}>
              <CaptureInput
                value={draft.hab_razon_social}
                onChange={(value) => updateDraft("hab_razon_social", value)}
                placeholder="Cliente"
              />
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="Direccion" icon={<MapPin size={15} />}>
              <CaptureInput
                value={draft.hab_direccion}
                onChange={(value) => updateDraft("hab_direccion", value)}
                placeholder="Direccion fiscal"
              />
            </Field>
          </Grid>
        </Grid>

        {error && <Typography sx={{ color: "#ffb199", fontSize: "12px", mt: 1.2 }}>{error}</Typography>}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
          <AppButton onClick={onClose}>Cancelar</AppButton>
          <AppButton
            icon={<Save size={15} />}
            onClick={saving ? undefined : handleSubmit}
            sx={{
              backgroundColor: palette.accent,
              color: palette.surface,
              opacity: saving ? 0.68 : 1,
              pointerEvents: saving ? "none" : "auto",
            }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </AppButton>
        </Box>
      </Box>
    </Dialog>
  );
}

export default function AdminCorrentistaHabitualList() {
  const params = useParams();
  const { confirmDialog } = useDialog();
  const [clientes, setClientes] = useState([]);
  const [contabilidades, setContabilidades] = useState([]);
  const [contabilidadTrabajo, setContabilidadTrabajo] = useState(
    sessionStorage.getItem("contabilidad_trabajo") || params.documento_id || "",
  );
  const [contabilidadNombre, setContabilidadNombre] = useState(sessionStorage.getItem("contabilidad_nombre") || "");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);

  const cargarContabilidades = useCallback(async () => {
    try {
      const response = await fetch(`${backHost}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`);
      const data = await response.json();
      const opciones = Array.isArray(data) ? data : [];
      setContabilidades(opciones);

      const historialDocumento = sessionStorage.getItem("contabilidad_trabajo") || params.documento_id;
      const historialNombre = sessionStorage.getItem("contabilidad_nombre");
      const opcionHistorial = opciones.find((opcion) => opcion.documento_id === historialDocumento);
      const opcionInicial = opcionHistorial || opciones[0];
      const documento = opcionInicial?.documento_id || historialDocumento || "";
      const nombre = opcionInicial?.razon_social || historialNombre || "";

      if (documento) {
        setContabilidadTrabajo(documento);
        setContabilidadNombre(nombre);
        sessionStorage.setItem("contabilidad_trabajo", documento);
        if (nombre) {
          sessionStorage.setItem("contabilidad_nombre", nombre);
        }
      }
    } catch (error) {
      console.log("Error cargando contabilidades:", error);
      setContabilidades([]);
    }
  }, [params.id_anfitrion, params.id_invitado, params.documento_id]);

  const cargarClientes = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setClientes([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backHost}/correntistahabitual/${params.id_anfitrion}/${contabilidadTrabajo}`);
      const data = await response.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Error cargando clientes habituales:", error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, [params.id_anfitrion, contabilidadTrabajo]);

  useEffect(() => {
    cargarContabilidades();
  }, [cargarContabilidades]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const clientesFiltrados = useMemo(() => {
    const filtro = search.trim().toLowerCase();
    if (!filtro) return clientes;
    return clientes.filter((cliente) => {
      const documento = cliente.hab_documento_id?.toString().toLowerCase() || "";
      const razonSocial = cliente.hab_razon_social?.toString().toLowerCase() || "";
      const direccion = cliente.hab_direccion?.toString().toLowerCase() || "";
      return documento.includes(filtro) || razonSocial.includes(filtro) || direccion.includes(filtro);
    });
  }, [clientes, search]);

  const abrirNuevo = () => {
    if (!contabilidadTrabajo) {
      confirmDialog({
        title: "Selecciona una empresa",
        message: "Elige una razon social antes de registrar clientes habituales.",
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      return;
    }

    setClienteEditando(null);
    setModalOpen(true);
  };

  const abrirEditar = (cliente) => {
    setClienteEditando(cliente);
    setModalOpen(true);
  };

  const cambiarContabilidad = (event) => {
    const documento = event.target.value;
    const opcionSeleccionada = contabilidades.find((opcion) => opcion.documento_id === documento);
    const nombre = opcionSeleccionada?.razon_social || "";

    setContabilidadTrabajo(documento);
    setContabilidadNombre(nombre);
    setClienteEditando(null);
    setModalOpen(false);
    sessionStorage.setItem("contabilidad_trabajo", documento);
    if (nombre) {
      sessionStorage.setItem("contabilidad_nombre", nombre);
    }
  };

  const buscarCliente = async (documento) => {
    const response = await fetch(`${backHost}/correntistagenera`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruc: documento }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || "No se pudo consultar el documento.");
    }

    const data = await response.json();
    const razonSocial = data.nombre_o_razon_social || data.razon_social || "";

    if (!razonSocial) {
      throw new Error("No se encontraron datos para el documento ingresado.");
    }

    return {
      hab_documento_id: documento,
      hab_id_doc: data.r_id_doc || (documento.length === 11 ? "6" : "1"),
      hab_razon_social: razonSocial,
      hab_direccion: data.direccion || data.direccion_completa || "-",
    };
  };

  const guardarCliente = async (draft) => {
    const payload = {
      id_usuario: params.id_anfitrion,
      documento_id: contabilidadTrabajo,
      ...draft,
    };
    const editando = Boolean(clienteEditando);
    const url = editando
      ? `${backHost}/correntistahabitual/${params.id_anfitrion}/${contabilidadTrabajo}/${clienteEditando.hab_documento_id}`
      : `${backHost}/correntistahabitual`;

    if (!contabilidadTrabajo) {
      confirmDialog({
        title: "Selecciona una empresa",
        message: "Elige una razon social antes de guardar clientes habituales.",
        icon: "warning",
        confirmText: "ACEPTAR",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo guardar el cliente habitual.");
      }

      setModalOpen(false);
      await cargarClientes();
    } catch (error) {
      confirmDialog({
        title: "No se pudo guardar",
        message: error.message,
        icon: "error",
        confirmText: "ACEPTAR",
      });
    } finally {
      setSaving(false);
    }
  };

  const eliminarCliente = async (cliente) => {
    if (!contabilidadTrabajo) return;

    const result = await confirmDialog({
      title: "Eliminar cliente habitual?",
      message: `${cliente.hab_documento_id} - ${cliente.hab_razon_social || ""}`,
      icon: "warning",
      confirmText: "ELIMINAR",
      cancelText: "CANCELAR",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${backHost}/correntistahabitual/${params.id_anfitrion}/${contabilidadTrabajo}/${cliente.hab_documento_id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo eliminar el cliente habitual.");
      }

      await cargarClientes();
    } catch (error) {
      confirmDialog({
        title: "No se pudo eliminar",
        message: error.message,
        icon: "error",
        confirmText: "ACEPTAR",
      });
    }
  };

  const columns = [
    {
      name: "",
      width: "96px",
      button: true,
      cell: (row) => (
        <Box sx={{ display: "flex", gap: 0.4 }}>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => abrirEditar(row)} sx={{ color: palette.accent }}>
              <Pencil size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" onClick={() => eliminarCliente(row)} sx={{ color: "#ff9f7a" }}>
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      name: "RUC/DNI",
      selector: (row) => row.hab_documento_id,
      sortable: true,
      width: "150px",
      cell: (row) => <CellText strong>{row.hab_documento_id}</CellText>,
    },
    {
      name: "Tipo",
      selector: (row) => row.hab_id_doc,
      sortable: true,
      width: "90px",
      cell: (row) => <CellText muted>{row.hab_id_doc === "6" ? "RUC" : row.hab_id_doc === "1" ? "DNI" : row.hab_id_doc}</CellText>,
    },
    {
      name: "Razon social",
      selector: (row) => row.hab_razon_social,
      sortable: true,
      grow: 2,
      cell: (row) => <CellText>{row.hab_razon_social}</CellText>,
    },
    {
      name: "Direccion",
      selector: (row) => row.hab_direccion,
      sortable: true,
      grow: 2,
      cell: (row) => <CellText muted>{row.hab_direccion}</CellText>,
    },
  ];

  return (
    <Box sx={{ color: palette.text, pt: 1 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 1.2, mb: 1.4 }}>
        <Box>
          <Typography sx={{ fontSize: "20px", fontWeight: 800, lineHeight: 1.1 }}>
            Clientes habituales
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: "12px", mt: 0.35 }}>
            {contabilidadNombre || "Mantenimiento de clientes frecuentes por empresa."}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Select
            value={contabilidadTrabajo || ""}
            onChange={cambiarContabilidad}
            size="small"
            displayEmpty
            sx={{
              minWidth: { xs: "100%", sm: 260 },
              maxWidth: { xs: "100%", sm: 360 },
              height: 42,
              color: palette.text,
              backgroundColor: palette.chip,
              border: `1px solid ${palette.border}`,
              borderRadius: 2,
              fontSize: "13px",
              "& .MuiOutlinedInput-notchedOutline": { border: 0 },
              "& .MuiSelect-icon": { color: palette.muted },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: palette.surface,
                  color: palette.text,
                  border: `1px solid ${palette.border}`,
                  "& .MuiMenuItem-root": { fontSize: "13px" },
                },
              },
            }}
          >
            <MenuItem value="">Selecciona razon social</MenuItem>
            {contabilidades.map((elemento) => (
              <MenuItem key={elemento.documento_id} value={elemento.documento_id}>
                {elemento.razon_social}
              </MenuItem>
            ))}
          </Select>
          <AppSearch
            placeholder="Buscar cliente"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            width={{ xs: "100%", sm: 280 }}
          />
          <AppButton icon={<Plus size={16} />} onClick={abrirNuevo}>
            Nuevo
          </AppButton>
        </Box>
      </Box>

      <Box
        sx={{
          backgroundColor: palette.surface,
          border: `1px solid ${palette.borderSoft}`,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <DataTable
          columns={columns}
          data={clientesFiltrados}
          progressPending={loading}
          theme="clientesHabitualesDark"
          dense
          pagination
          highlightOnHover
          customStyles={customStyles}
          noDataComponent="Sin clientes habituales"
        />
      </Box>

      <HabitualModal
        open={modalOpen}
        cliente={clienteEditando}
        onClose={() => setModalOpen(false)}
        onSubmit={guardarCliente}
        onLookup={buscarCliente}
        saving={saving}
      />
    </Box>
  );
}
