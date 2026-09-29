import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import palette from "../../../theme/palette";

const TIPOS_ITEM = ["MENU", "GRUPO", "PANTALLA", "REPORTE"];
const RUBRO_DEFAULT = "TRANSPORTE";
const TIPO_LABELS = {
  MENU: "Modulo",
  GRUPO: "Grupo",
  PANTALLA: "Pantalla",
  REPORTE: "Reporte",
};

const itemVacio = {
  id_item: "",
  id_padre: "",
  rubro: RUBRO_DEFAULT,
  tipo: "PANTALLA",
  nombre: "",
  descripcion: "",
  ruta: "",
  icono: "",
  orden: 0,
  requiere_admin: false,
  requiere_supervisor: false,
  activo: true,
};

const accionVacia = {
  id_accion: "",
  id_item: "",
  nombre: "",
  descripcion: "",
  orden: 0,
  requiere_admin: false,
  requiere_supervisor: false,
  activo: true,
};

const cardSx = {
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  borderRadius: palette.radius.listCard,
  boxShadow: palette.shadowSoft,
};

const softCardSx = {
  border: `1px solid ${palette.borderSoft}`,
  background: palette.bg,
  borderRadius: palette.radius.content,
};

const controlSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: palette.radius.control,
    backgroundColor: palette.bg,
  },
  "& .MuiInputLabel-root": {
    color: palette.muted,
    fontWeight: 700,
  },
  "& .MuiInputBase-input": {
    color: palette.text,
    fontWeight: 700,
  },
};

const primaryButtonSx = {
  borderRadius: palette.radius.control,
  boxShadow: "none",
  fontWeight: 900,
  textTransform: "none",
  minHeight: 34,
  "&:hover": { boxShadow: "none" },
};

const outlineButtonSx = {
  borderRadius: palette.radius.control,
  fontWeight: 900,
  textTransform: "none",
  minHeight: 34,
  borderColor: palette.border,
  color: palette.text,
  backgroundColor: palette.surface,
  "&:hover": {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
};

const iconButtonSx = {
  border: `1px solid ${palette.border}`,
  backgroundColor: palette.surface,
  color: palette.text,
  borderRadius: palette.radius.control,
  "&:hover": {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accent,
  },
};

const boolValue = (value) => value === true || value === "true" || value === "1" || value === 1;

function Badge({ children, color = palette.muted, background = palette.surfaceAlt }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        px: 0.8,
        borderRadius: 1,
        color,
        background,
        fontSize: 10,
        fontWeight: 900,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

function FieldCheck({ label, checked, onChange }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minHeight: 34 }}>
      <Checkbox size="small" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <Typography sx={{ color: palette.text, fontSize: 12, fontWeight: 800 }}>{label}</Typography>
    </Box>
  );
}

function ItemDialog({ open, value, padres, onClose, onSave }) {
  const [draft, setDraft] = useState(itemVacio);

  useEffect(() => {
    setDraft({ ...itemVacio, ...(value || {}) });
  }, [value, open]);

  const set = (field, fieldValue) => setDraft((prev) => ({ ...prev, [field]: fieldValue }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: palette.radius.modal, backgroundColor: palette.surface } }}>
      <DialogTitle sx={{ fontWeight: 900, color: palette.text }}>Item de menu</DialogTitle>
      <DialogContent dividers sx={{ display: "grid", gap: 1.5, pt: 2, borderColor: palette.border }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr .8fr .8fr" }, gap: 1.2 }}>
          <TextField size="small" label="ID item" value={draft.id_item} onChange={(e) => set("id_item", e.target.value)} sx={controlSx} />
          <TextField size="small" label="Rubro" value={draft.rubro} onChange={(e) => set("rubro", e.target.value.toUpperCase())} sx={controlSx} />
          <FormControl size="small" sx={controlSx}>
            <InputLabel>Tipo</InputLabel>
            <Select label="Tipo" value={draft.tipo} onChange={(e) => set("tipo", e.target.value)}>
              {TIPOS_ITEM.map((tipo) => <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.2 }}>
          <TextField size="small" label="Nombre" value={draft.nombre} onChange={(e) => set("nombre", e.target.value)} sx={controlSx} />
          <FormControl size="small" sx={controlSx}>
            <InputLabel>Padre</InputLabel>
            <Select label="Padre" value={draft.id_padre || ""} onChange={(e) => set("id_padre", e.target.value)}>
              <MenuItem value="">Sin padre</MenuItem>
              {padres.filter((item) => item.id_item !== draft.id_item).map((item) => (
                <MenuItem key={item.id_item} value={item.id_item}>{item.id_item} - {item.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <TextField size="small" label="Descripcion" value={draft.descripcion || ""} onChange={(e) => set("descripcion", e.target.value)} sx={controlSx} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.3fr .8fr .5fr" }, gap: 1.2 }}>
          <TextField size="small" label="Ruta" value={draft.ruta || ""} onChange={(e) => set("ruta", e.target.value)} sx={controlSx} />
          <TextField size="small" label="Icono" value={draft.icono || ""} onChange={(e) => set("icono", e.target.value)} sx={controlSx} />
          <TextField size="small" type="number" label="Orden" value={draft.orden || 0} onChange={(e) => set("orden", Number(e.target.value))} sx={controlSx} />
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2 }}>
          <FieldCheck label="Admin" checked={boolValue(draft.requiere_admin)} onChange={(checked) => set("requiere_admin", checked)} />
          <FieldCheck label="Supervisor" checked={boolValue(draft.requiere_supervisor)} onChange={(checked) => set("requiere_supervisor", checked)} />
          <FieldCheck label="Activo" checked={boolValue(draft.activo)} onChange={(checked) => set("activo", checked)} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={outlineButtonSx}>Cancelar</Button>
        <Button variant="contained" startIcon={<SaveIcon />} sx={primaryButtonSx} onClick={() => onSave(draft)}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

function AccionDialog({ open, value, items, itemSeleccionado, onClose, onSave }) {
  const [draft, setDraft] = useState(accionVacia);

  useEffect(() => {
    setDraft({ ...accionVacia, id_item: itemSeleccionado || "", ...(value || {}) });
  }, [value, open, itemSeleccionado]);

  const set = (field, fieldValue) => setDraft((prev) => ({ ...prev, [field]: fieldValue }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: palette.radius.modal, backgroundColor: palette.surface } }}>
      <DialogTitle sx={{ fontWeight: 900, color: palette.text }}>Accion</DialogTitle>
      <DialogContent dividers sx={{ display: "grid", gap: 1.5, pt: 2, borderColor: palette.border }}>
        <TextField size="small" label="ID accion" value={draft.id_accion} onChange={(e) => set("id_accion", e.target.value)} sx={controlSx} />
        <FormControl size="small" sx={controlSx}>
          <InputLabel>Item</InputLabel>
          <Select label="Item" value={draft.id_item || ""} onChange={(e) => set("id_item", e.target.value)}>
            {items.map((item) => <MenuItem key={item.id_item} value={item.id_item}>{item.id_item} - {item.nombre}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" label="Nombre" value={draft.nombre} onChange={(e) => set("nombre", e.target.value)} sx={controlSx} />
        <TextField size="small" label="Descripcion" value={draft.descripcion || ""} onChange={(e) => set("descripcion", e.target.value)} sx={controlSx} />
        <TextField size="small" type="number" label="Orden" value={draft.orden || 0} onChange={(e) => set("orden", Number(e.target.value))} sx={controlSx} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2 }}>
          <FieldCheck label="Admin" checked={boolValue(draft.requiere_admin)} onChange={(checked) => set("requiere_admin", checked)} />
          <FieldCheck label="Supervisor" checked={boolValue(draft.requiere_supervisor)} onChange={(checked) => set("requiere_supervisor", checked)} />
          <FieldCheck label="Activo" checked={boolValue(draft.activo)} onChange={(checked) => set("activo", checked)} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={outlineButtonSx}>Cancelar</Button>
        <Button variant="contained" startIcon={<SaveIcon />} sx={primaryButtonSx} onClick={() => onSave(draft)}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminMenuConfigList({ super: esSuper = false }) {
  const params = useParams();
  const backHost = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const puedeConfigurar = params.id_anfitrion === params.id_invitado || esSuper === true || String(esSuper) === "1";
  const [rubro, setRubro] = useState(RUBRO_DEFAULT);
  const [items, setItems] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [itemSeleccionado, setItemSeleccionado] = useState("");
  const [itemEditando, setItemEditando] = useState(null);
  const [accionEditando, setAccionEditando] = useState(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [accionDialogOpen, setAccionDialogOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const itemsOrdenados = useMemo(
    () => [...items].sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || String(a.id_item).localeCompare(String(b.id_item))),
    [items]
  );
  const itemsArbol = useMemo(() => {
    const porPadre = new Map();
    itemsOrdenados.forEach((item) => {
      const padre = item.id_padre || "__root__";
      porPadre.set(padre, [...(porPadre.get(padre) || []), item]);
    });

    const walk = (padre, nivel = 0) => (porPadre.get(padre) || []).flatMap((item) => [
      { ...item, _nivel: nivel },
      ...walk(item.id_item, nivel + 1),
    ]);

    return walk("__root__");
  }, [itemsOrdenados]);
  const accionesVisibles = useMemo(
    () => acciones.filter((accion) => !itemSeleccionado || accion.id_item === itemSeleccionado),
    [acciones, itemSeleccionado]
  );
  const itemActual = items.find((item) => item.id_item === itemSeleccionado);

  const cargar = useCallback(async () => {
    if (!puedeConfigurar) return;
    setMensaje("");
    const query = new URLSearchParams({ rubro }).toString();
    const [itemsResp, accionesResp] = await Promise.all([
      fetch(`${backHost}/mad_menu_item/${params.id_anfitrion}/${params.id_invitado}?${query}`),
      fetch(`${backHost}/mad_menu_accion/${params.id_anfitrion}/${params.id_invitado}`),
    ]);
    const itemsJson = await itemsResp.json();
    const accionesJson = await accionesResp.json();
    if (!itemsResp.ok || !itemsJson.success) throw new Error(itemsJson.message || "No se pudo cargar menu.");
    if (!accionesResp.ok || !accionesJson.success) throw new Error(accionesJson.message || "No se pudo cargar acciones.");
    setItems(itemsJson.data || []);
    setAcciones(accionesJson.data || []);
  }, [backHost, params.id_anfitrion, params.id_invitado, puedeConfigurar, rubro]);

  useEffect(() => {
    cargar().catch((error) => setMensaje(error.message || "Error cargando catalogo."));
  }, [cargar]);

  const guardarItem = async (draft) => {
    const response = await fetch(`${backHost}/mad_menu_item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, rubro, id_anfitrion: params.id_anfitrion, id_invitado: params.id_invitado }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || "No se pudo guardar item.");
    setItemDialogOpen(false);
    setItemEditando(null);
    await cargar();
  };

  const guardarAccion = async (draft) => {
    const response = await fetch(`${backHost}/mad_menu_accion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, id_anfitrion: params.id_anfitrion, id_invitado: params.id_invitado }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || "No se pudo guardar accion.");
    setAccionDialogOpen(false);
    setAccionEditando(null);
    await cargar();
  };

  const desactivarItem = async (idItem) => {
    const response = await fetch(`${backHost}/mad_menu_item/${params.id_anfitrion}/${params.id_invitado}/${encodeURIComponent(idItem)}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || "No se pudo desactivar item.");
    await cargar();
  };

  const desactivarAccion = async (idAccion) => {
    const response = await fetch(`${backHost}/mad_menu_accion/${params.id_anfitrion}/${params.id_invitado}/${encodeURIComponent(idAccion)}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || "No se pudo desactivar accion.");
    await cargar();
  };

  if (!puedeConfigurar) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 900, color: palette.text, fontSize: 18 }}>Configuracion de menus</Typography>
        <Typography sx={{ color: palette.muted, mt: 1 }}>Solo el usuario anfitrion o un super usuario puede abrir esta pantalla.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2.5 },
        background: palette.navBg,
        borderRadius: palette.radius.listCard,
        minHeight: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          maxWidth: 1420,
          mx: "auto",
          display: "grid",
          gap: 1.5,
          p: { xs: 0.75, md: 1 },
          borderRadius: { xs: 2, md: 3 },
          backgroundColor: palette.navBg,
          boxShadow: palette.shadowSoft,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
            gap: 1.4,
            alignItems: "end",
            ...cardSx,
            p: { xs: 1.4, md: 1.8 },
          }}
        >
          <Box sx={{ display: "grid", gap: 0.7 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
              <Typography sx={{ color: palette.text, fontWeight: 950, fontSize: { xs: 20, md: 24 }, lineHeight: 1 }}>
                Configuracion de menus
              </Typography>
              <Badge color={palette.accent} background={palette.accentSoft}>Vista previa</Badge>
            </Box>
            <Typography sx={{ color: palette.muted, fontSize: 12.5, fontWeight: 700, maxWidth: 720 }}>
              Organiza el arbol de navegacion y sus acciones. Esta pantalla solo administra el catalogo; el menu principal aun no se renderiza desde aqui.
            </Typography>
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mt: 0.2 }}>
              <Badge>{itemsOrdenados.length} opciones</Badge>
              <Badge>{acciones.length} acciones</Badge>
              <Badge>{rubro}</Badge>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
            <TextField size="small" label="Rubro" value={rubro} onChange={(e) => setRubro(e.target.value.toUpperCase())} sx={{ width: 170, ...controlSx }} />
            <Tooltip title="Recargar">
              <IconButton
                onClick={() => cargar().catch((error) => setMensaje(error.message))}
                sx={iconButtonSx}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} sx={primaryButtonSx} onClick={() => { setItemEditando({ ...itemVacio, rubro }); setItemDialogOpen(true); }}>Opcion</Button>
            <Button variant="outlined" startIcon={<AddIcon />} sx={outlineButtonSx} onClick={() => { setAccionEditando({ ...accionVacia, id_item: itemSeleccionado }); setAccionDialogOpen(true); }}>Accion</Button>
          </Box>
        </Box>

        {mensaje && (
          <Box sx={{ p: 1.1, border: `1px solid ${palette.dangerSoft}`, color: palette.danger, background: palette.surface, borderRadius: palette.radius.content, fontSize: 12, fontWeight: 800 }}>
            {mensaje}
          </Box>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(420px, .95fr) minmax(0, 1.35fr)" }, gap: 1.5, alignItems: "start" }}>
          <Box sx={{ ...cardSx, minHeight: 520, overflow: "hidden" }}>
            <Box sx={{ p: 1.4, borderBottom: `1px solid ${palette.border}`, display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
              <Box>
                <Typography sx={{ color: palette.text, fontWeight: 950, fontSize: 15 }}>Arbol del menu</Typography>
                <Typography sx={{ color: palette.muted, fontSize: 11.5, fontWeight: 700 }}>Estructura visible por rubro</Typography>
              </Box>
              <Badge>{itemsArbol.length}</Badge>
            </Box>

            <Box sx={{ p: 1.2, display: "grid", gap: 0.65 }}>
              {itemsArbol.map((item) => {
                const seleccionado = itemSeleccionado === item.id_item;
                const tipoLabel = TIPO_LABELS[item.tipo] || item.tipo;
                const puedeTenerAcciones = item.tipo === "PANTALLA" || item.tipo === "REPORTE";
                const nivel = Number(item._nivel || 0);

                return (
                  <Box
                    key={item.id_item}
                    onClick={() => setItemSeleccionado(item.id_item)}
                    sx={{
                      position: "relative",
                      display: "grid",
                      gridTemplateColumns: "26px minmax(0, 1fr) auto",
                      gap: 0.9,
                      alignItems: "center",
                      p: 0.85,
                      pl: 0.9,
                      ml: Math.min(nivel * 2.1, 6),
                      ...softCardSx,
                      borderColor: seleccionado ? palette.accent : palette.borderSoft,
                      background: seleccionado ? palette.accentSoft : palette.bg,
                      boxShadow: seleccionado ? `0 0 0 3px ${palette.accentSoft}` : "none",
                      cursor: "pointer",
                      minWidth: 0,
                      transition: "border-color 140ms ease, background-color 140ms ease, transform 140ms ease",
                      "&:hover": {
                        borderColor: seleccionado ? palette.accent : palette.border,
                        background: seleccionado ? palette.accentSoft : palette.surfaceAlt,
                        transform: "translateY(-1px)",
                      },
                      "&::before": nivel > 0 ? {
                        content: '""',
                        position: "absolute",
                        left: -12,
                        top: "50%",
                        width: 10,
                        borderTop: `1px solid ${palette.border}`,
                      } : undefined,
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        display: "grid",
                        placeItems: "center",
                        border: `1px solid ${seleccionado ? palette.accent : palette.border}`,
                        borderRadius: palette.radius.control,
                        background: item.tipo === "REPORTE" ? palette.porCobrarSoft : item.tipo === "PANTALLA" ? palette.successSoft : palette.surface,
                        color: item.tipo === "REPORTE" ? palette.porCobrar : item.tipo === "PANTALLA" ? palette.success : palette.accent,
                        fontSize: 10,
                        fontWeight: 950,
                      }}
                    >
                      {item.tipo === "MENU" ? "M" : item.tipo === "GRUPO" ? "G" : item.tipo === "REPORTE" ? "R" : "P"}
                    </Box>
                    <Box sx={{ display: "grid", gap: 0.2, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.55, minWidth: 0, flexWrap: "wrap" }}>
                        <Typography sx={{ color: palette.text, fontWeight: 950, fontSize: 13.2, lineHeight: 1.1 }}>
                          {item.nombre}
                        </Typography>
                        <Badge
                          color={item.tipo === "MENU" ? palette.accent : item.tipo === "GRUPO" ? palette.text : item.tipo === "REPORTE" ? palette.porCobrar : palette.success}
                          background={item.tipo === "MENU" ? palette.accentSoft : item.tipo === "GRUPO" ? palette.surfaceAlt : item.tipo === "REPORTE" ? palette.porCobrarSoft : palette.successSoft}
                        >
                          {tipoLabel}
                        </Badge>
                      </Box>
                      <Typography sx={{ color: palette.muted, fontSize: 10.8, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }} noWrap>
                        {item.descripcion || item.ruta || "Sin descripcion"}
                      </Typography>
                      <Typography sx={{ color: palette.muted, fontSize: 9.8, fontWeight: 800, opacity: 0.7 }} noWrap>
                        {item.id_item}{!puedeTenerAcciones ? "" : ` · ${acciones.filter((accion) => accion.id_item === item.id_item).length} accion(es)`}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.1 }}>
                      {!boolValue(item.activo) && <Badge color={palette.danger} background={palette.dangerSoft}>Off</Badge>}
                      {boolValue(item.requiere_supervisor) && <Badge>Sup</Badge>}
                      {boolValue(item.requiere_admin) && <Badge>Adm</Badge>}
                      <Tooltip title="Editar">
                        <IconButton size="small" sx={iconButtonSx} onClick={(event) => { event.stopPropagation(); setItemEditando(item); setItemDialogOpen(true); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Box sx={{ ...cardSx, p: 1.4 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) auto" }, gap: 1, alignItems: "center" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: palette.text, fontWeight: 950, fontSize: 18, lineHeight: 1.1 }}>
                    {itemActual?.nombre || "Selecciona una opcion del arbol"}
                  </Typography>
                  <Typography sx={{ color: palette.muted, fontSize: 12, fontWeight: 700, mt: 0.35 }} noWrap>
                    {itemActual ? (itemActual.descripcion || itemActual.ruta || itemActual.id_item) : "Aqui apareceran los permisos y acciones relacionados."}
                  </Typography>
                </Box>
                {itemActual && (
                  <Box sx={{ display: "flex", gap: 0.65, flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                    <Badge>{TIPO_LABELS[itemActual.tipo] || itemActual.tipo}</Badge>
                    {itemActual.ruta && <Badge>{itemActual.ruta}</Badge>}
                    {boolValue(itemActual.requiere_supervisor) && <Badge>Supervisor</Badge>}
                    {boolValue(itemActual.requiere_admin) && <Badge>Admin</Badge>}
                  </Box>
                )}
              </Box>
              {itemActual && (
                <Box sx={{ display: "flex", gap: 0.8, mt: 1.2, flexWrap: "wrap" }}>
                  <Button size="small" variant="outlined" sx={outlineButtonSx} startIcon={<EditIcon />} onClick={() => { setItemEditando(itemActual); setItemDialogOpen(true); }}>
                    Editar opcion
                  </Button>
                  <Button size="small" variant="text" color="error" sx={{ borderRadius: palette.radius.control, fontWeight: 900, textTransform: "none" }} startIcon={<PowerSettingsNewIcon />} onClick={() => desactivarItem(itemActual.id_item).catch((error) => setMensaje(error.message))}>
                    Desactivar
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ ...cardSx, overflow: "hidden" }}>
              <Box sx={{ p: 1.4, borderBottom: `1px solid ${palette.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                <Box>
                  <Typography sx={{ color: palette.text, fontWeight: 950, fontSize: 15 }}>Acciones permitidas</Typography>
                  <Typography sx={{ color: palette.muted, fontSize: 11.5, fontWeight: 700 }}>
                    {itemActual ? itemActual.nombre : "Todas las acciones"}
                  </Typography>
                </Box>
                <Button size="small" variant="contained" sx={primaryButtonSx} startIcon={<AddIcon />} onClick={() => { setAccionEditando({ ...accionVacia, id_item: itemSeleccionado }); setAccionDialogOpen(true); }}>
                  Agregar
                </Button>
              </Box>

              <Box sx={{ p: 1.2, display: "grid", gap: 0.85 }}>
                {accionesVisibles.length === 0 && (
                  <Box sx={{ p: 2, border: `1px dashed ${palette.border}`, background: palette.bg, borderRadius: palette.radius.content, color: palette.muted, fontSize: 12, fontWeight: 800, textAlign: "center" }}>
                    No hay acciones registradas para esta opcion.
                  </Box>
                )}
                {accionesVisibles.map((accion) => (
                  <Box
                    key={accion.id_accion}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0,1fr) auto",
                      gap: 1,
                      alignItems: "center",
                      p: 1,
                      ...softCardSx,
                      "&:hover": { background: palette.surfaceAlt, borderColor: palette.border },
                    }}
                  >
                    <Box sx={{ display: "grid", gap: 0.25, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.55, flexWrap: "wrap" }}>
                        <Typography sx={{ color: palette.text, fontWeight: 900, fontSize: 13 }}>
                          {accion.nombre}
                        </Typography>
                        {!boolValue(accion.activo) && <Badge color={palette.danger} background={palette.dangerSoft}>Inactivo</Badge>}
                        {boolValue(accion.requiere_supervisor) && <Badge>Supervisor</Badge>}
                        {boolValue(accion.requiere_admin) && <Badge>Admin</Badge>}
                      </Box>
                      <Typography sx={{ color: palette.muted, fontSize: 11, fontWeight: 700 }} noWrap>
                        {accion.descripcion || "Sin descripcion"}
                      </Typography>
                      <Typography sx={{ color: palette.muted, fontSize: 10, fontWeight: 800, opacity: 0.72 }} noWrap>
                        {accion.id_accion} · Orden {accion.orden}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.2 }}>
                      <Tooltip title="Editar accion">
                        <IconButton size="small" sx={iconButtonSx} onClick={() => { setAccionEditando(accion); setAccionDialogOpen(true); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Desactivar accion">
                        <IconButton size="small" sx={iconButtonSx} onClick={() => desactivarAccion(accion.id_accion).catch((error) => setMensaje(error.message))}>
                          <PowerSettingsNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <ItemDialog open={itemDialogOpen} value={itemEditando} padres={itemsOrdenados} onClose={() => setItemDialogOpen(false)} onSave={(draft) => guardarItem(draft).catch((error) => setMensaje(error.message))} />
      <AccionDialog open={accionDialogOpen} value={accionEditando} items={itemsOrdenados} itemSeleccionado={itemSeleccionado} onClose={() => setAccionDialogOpen(false)} onSave={(draft) => guardarAccion(draft).catch((error) => setMensaje(error.message))} />
    </Box>
  );
}
