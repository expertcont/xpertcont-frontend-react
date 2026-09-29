import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import palette from "../../../theme/palette";

const RUBRO_DEFAULT = "TRANSPORTE";
const boolValue = (value) => value === true || value === "true" || value === "1" || value === 1 || value === "S";
const permisoChar = (value) => (value ? "S" : "N");

const cardSx = {
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  borderRadius: palette.radius.listCard,
  boxShadow: palette.shadowSoft,
};

const controlSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: palette.radius.control,
    backgroundColor: palette.bg,
    color: palette.text,
    "& fieldset": {
      borderColor: palette.border,
    },
    "&:hover fieldset": {
      borderColor: palette.accent,
    },
    "&.Mui-focused fieldset": {
      borderColor: palette.accent,
    },
  },
  "& .MuiInputLabel-root": {
    color: palette.muted,
    fontWeight: 700,
    "&.Mui-focused": {
      color: palette.accent,
    },
  },
  "& .MuiInputBase-input": {
    color: palette.text,
    fontWeight: 700,
  },
  "& .MuiSelect-select": {
    color: palette.text,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
  },
  "& .MuiSelect-icon": {
    color: palette.muted,
  },
};

const selectMenuProps = {
  PaperProps: {
    sx: {
      mt: 0.6,
      minWidth: 460,
      backgroundColor: palette.surface,
      color: palette.text,
      border: `1px solid ${palette.border}`,
      borderRadius: palette.radius.content,
      boxShadow: palette.shadowSoft,
      "& .MuiMenuItem-root": {
        color: palette.text,
        fontSize: 12,
        fontWeight: 800,
        minHeight: 38,
        "&:hover": {
          backgroundColor: palette.accentSoft,
        },
        "&.Mui-selected": {
          backgroundColor: palette.accentSoft,
          color: palette.accent,
        },
        "&.Mui-selected:hover": {
          backgroundColor: palette.accentSoft,
        },
      },
    },
  },
};

const buttonSx = {
  borderRadius: palette.radius.control,
  boxShadow: "none",
  fontWeight: 900,
  textTransform: "none",
  minHeight: 34,
  "&:hover": { boxShadow: "none" },
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

const checkboxSx = {
  color: palette.muted,
  "&.Mui-checked": {
    color: palette.accent,
  },
  "& .MuiSvgIcon-root": {
    borderRadius: 0.75,
    backgroundColor: palette.bg,
  },
};

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

function construirArbol(items) {
  const ordenados = [...items].sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || String(a.id_item).localeCompare(String(b.id_item)));
  const porPadre = new Map();

  ordenados.forEach((item) => {
    const padre = item.id_padre || "__root__";
    porPadre.set(padre, [...(porPadre.get(padre) || []), item]);
  });

  const caminar = (padre, nivel = 0) => (porPadre.get(padre) || []).flatMap((item) => [
    { ...item, _nivel: nivel },
    ...caminar(item.id_item, nivel + 1),
  ]);

  return caminar("__root__");
}

export default function AdminMenuPermisosList({ super: esSuper = false }) {
  const params = useParams();
  const backHost = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const puedeConfigurar = params.id_anfitrion === params.id_invitado || esSuper === true || String(esSuper) === "1";
  const [usuarios, setUsuarios] = useState([]);
  const [items, setItems] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [usuarioCopiarDesde, setUsuarioCopiarDesde] = useState("");
  const [itemPermisos, setItemPermisos] = useState({});
  const [accionPermisos, setAccionPermisos] = useState({});
  const [snapshot, setSnapshot] = useState("");
  const [permisosCopiados, setPermisosCopiados] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  const itemsArbol = useMemo(() => construirArbol(items), [items]);
  const accionesPorItem = useMemo(() => {
    const map = new Map();
    acciones.forEach((accion) => {
      map.set(accion.id_item, [...(map.get(accion.id_item) || []), accion]);
    });
    return map;
  }, [acciones]);

  const snapshotActual = useMemo(() => JSON.stringify({ itemPermisos, accionPermisos }), [itemPermisos, accionPermisos]);
  const cambiosPendientes = Boolean(usuarioSeleccionado) && (permisosCopiados || (snapshot && snapshot !== snapshotActual));
  const usuarioActual = usuarios.find((usuario) => usuario.id_invitado === usuarioSeleccionado);

  const cargarCatalogo = useCallback(async () => {
    if (!puedeConfigurar) return;
    setMensaje("");

    try {
      const query = new URLSearchParams({ rubro: RUBRO_DEFAULT }).toString();
      const [usuariosRes, itemsRes, accionesRes] = await Promise.all([
        fetch(`${backHost}/mad_menu_permiso/usuarios/${params.id_anfitrion}/${params.id_invitado}`),
        fetch(`${backHost}/mad_menu_item/${params.id_anfitrion}/${params.id_invitado}?${query}`),
        fetch(`${backHost}/mad_menu_accion/${params.id_anfitrion}/${params.id_invitado}`),
      ]);
      const [usuariosJson, itemsJson, accionesJson] = await Promise.all([usuariosRes.json(), itemsRes.json(), accionesRes.json()]);

      if (!usuariosRes.ok || !usuariosJson.success) throw new Error(usuariosJson.message || "No se pudo cargar usuarios.");
      if (!itemsRes.ok || !itemsJson.success) throw new Error(itemsJson.message || "No se pudo cargar items.");
      if (!accionesRes.ok || !accionesJson.success) throw new Error(accionesJson.message || "No se pudo cargar acciones.");

      const usuariosData = Array.isArray(usuariosJson.data) ? usuariosJson.data : [];
      setUsuarios(usuariosData);
      setItems((Array.isArray(itemsJson.data) ? itemsJson.data : []).filter((item) => boolValue(item.activo)));
      setAcciones((Array.isArray(accionesJson.data) ? accionesJson.data : []).filter((accion) => boolValue(accion.activo)));

      setUsuarioSeleccionado((actual) => actual || usuariosData[0]?.id_invitado || "");
    } catch (error) {
      setMensaje(error.message);
    }
  }, [backHost, params.id_anfitrion, params.id_invitado, puedeConfigurar]);

  const cargarPermisos = useCallback(async (idInvitadoPermiso) => {
    if (!idInvitadoPermiso || !puedeConfigurar) return;
    setMensaje("");

    try {
      const response = await fetch(`${backHost}/mad_menu_permiso/${params.id_anfitrion}/${params.id_invitado}/${encodeURIComponent(idInvitadoPermiso)}`);
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || "No se pudo cargar permisos.");

      const nextItems = {};
      const nextAcciones = {};
      (json.data?.items || []).forEach((item) => {
        nextItems[item.id_item] = item.permitido === "S";
      });
      (json.data?.acciones || []).forEach((accion) => {
        nextAcciones[accion.id_accion] = accion.permitido === "S";
      });

      setItemPermisos(nextItems);
      setAccionPermisos(nextAcciones);
      setSnapshot(JSON.stringify({ itemPermisos: nextItems, accionPermisos: nextAcciones }));
      setPermisosCopiados(false);
    } catch (error) {
      setMensaje(error.message);
    }
  }, [backHost, params.id_anfitrion, params.id_invitado, puedeConfigurar]);

  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  useEffect(() => {
    cargarPermisos(usuarioSeleccionado);
  }, [cargarPermisos, usuarioSeleccionado]);

  const setItemPermitido = (idItem, permitido) => {
    setItemPermisos((prev) => ({ ...prev, [idItem]: permitido }));
    if (!permitido) {
      const accionesItem = accionesPorItem.get(idItem) || [];
      setAccionPermisos((prev) => {
        const next = { ...prev };
        accionesItem.forEach((accion) => {
          next[accion.id_accion] = false;
        });
        return next;
      });
    }
  };

  const setAccionPermitida = (accion, permitido) => {
    setAccionPermisos((prev) => ({ ...prev, [accion.id_accion]: permitido }));
    if (permitido) {
      setItemPermisos((prev) => ({ ...prev, [accion.id_item]: true }));
    }
  };

  const guardar = async () => {
    if (!usuarioSeleccionado) return;
    setGuardando(true);
    setMensaje("");

    try {
      const response = await fetch(`${backHost}/mad_menu_permiso`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_anfitrion: params.id_anfitrion,
          id_invitado: params.id_invitado,
          id_invitado_permiso: usuarioSeleccionado,
          usuario_registro: params.id_invitado,
          items: items.map((item) => ({ id_item: item.id_item, permitido: permisoChar(Boolean(itemPermisos[item.id_item])) })),
          acciones: acciones.map((accion) => ({ id_accion: accion.id_accion, permitido: permisoChar(Boolean(accionPermisos[accion.id_accion])) })),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || "No se pudo guardar permisos.");
      setSnapshot(snapshotActual);
      setPermisosCopiados(false);
      setUsuarios((prev) => prev.map((usuario) => (
        usuario.id_invitado === usuarioSeleccionado
          ? {
              ...usuario,
              permisos_items: Object.values(itemPermisos).filter(Boolean).length,
              permisos_acciones: Object.values(accionPermisos).filter(Boolean).length,
              permisos_total: Object.values(itemPermisos).filter(Boolean).length + Object.values(accionPermisos).filter(Boolean).length,
            }
          : usuario
      )));
      setMensaje("Permisos guardados.");
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const copiarDesde = async (idOrigen) => {
    if (!idOrigen || idOrigen === usuarioSeleccionado) return;
    setUsuarioCopiarDesde(idOrigen);
    await cargarPermisos(idOrigen);
    setMensaje(`Permisos copiados desde ${idOrigen}. Revisa y guarda para aplicarlos.`);
    setPermisosCopiados(true);
    setUsuarioCopiarDesde("");
  };

  if (!puedeConfigurar) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 900, color: palette.text, fontSize: 18 }}>Permisos de menu</Typography>
        <Typography sx={{ color: palette.muted, mt: 1 }}>Solo el usuario anfitrion o un super usuario puede abrir esta pantalla.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 }, background: palette.navBg, borderRadius: palette.radius.listCard, minHeight: "100%", overflow: "hidden" }}>
      <Box sx={{ maxWidth: 1480, mx: "auto", display: "grid", gap: 1.5, p: { xs: 0.75, md: 1 }, borderRadius: { xs: 2, md: 3 }, backgroundColor: palette.navBg, boxShadow: palette.shadowSoft }}>
        <Box sx={{ ...cardSx, p: { xs: 1.4, md: 1.8 }, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) auto" }, gap: 1.5, alignItems: "end" }}>
          <Box sx={{ display: "grid", gap: 0.7 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
              <SecurityIcon sx={{ color: palette.accent }} />
              <Typography sx={{ color: palette.text, fontWeight: 950, fontSize: { xs: 20, md: 24 }, lineHeight: 1 }}>Permisos de menu</Typography>
              <Badge color={palette.accent} background={palette.accentSoft}>{cambiosPendientes ? "Cambios pendientes" : "Sin cambios"}</Badge>
            </Box>
            <Typography sx={{ color: palette.muted, fontSize: 12.5, fontWeight: 700, maxWidth: 760 }}>
              Asigna acceso por usuario invitado a pantallas y comandos del catalogo configurado.
            </Typography>
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 300 }, ...controlSx }}>
              <InputLabel>Usuario</InputLabel>
              <Select
                label="Usuario"
                value={usuarioSeleccionado}
                onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                MenuProps={selectMenuProps}
                startAdornment={<SearchIcon sx={{ color: palette.accent, mr: 0.7 }} fontSize="small" />}
                renderValue={(selected) => {
                  const usuario = usuarios.find((item) => item.id_invitado === selected);
                  return usuario ? (
                    <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 1, alignItems: "center", minWidth: 0 }}>
                      <Box component="span" sx={{ color: palette.text, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {usuario.nombres || usuario.id_invitado}
                      </Box>
                      <Box component="span" sx={{ color: palette.muted, fontWeight: 800, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 210 }}>
                        {usuario.id_invitado}
                      </Box>
                    </Box>
                  ) : "Selecciona usuario";
                }}
              >
                {usuarios.map((usuario) => (
                  <MenuItem key={usuario.id_invitado} value={usuario.id_invitado}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(180px, 0.9fr)", gap: 1.5, alignItems: "center", width: "100%", minWidth: 0 }}>
                      <Typography sx={{ color: palette.text, fontSize: 12, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {usuario.nombres || usuario.id_invitado}
                      </Typography>
                      <Typography sx={{ color: palette.muted, fontSize: 11, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                        {usuario.id_invitado}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", justifyContent: { xs: "flex-start", lg: "flex-end" } }}>
            <Tooltip title="Recargar">
              <IconButton onClick={cargarCatalogo} sx={iconButtonSx}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<SaveIcon />} sx={buttonSx} disabled={!cambiosPendientes || guardando} onClick={guardar}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </Box>
        </Box>

        {mensaje && (
          <Box sx={{ p: 1.1, border: `1px solid ${mensaje.includes("guardados") || mensaje.includes("copiados") ? palette.successSoft : palette.dangerSoft}`, color: mensaje.includes("guardados") || mensaje.includes("copiados") ? palette.success : palette.danger, background: palette.surface, borderRadius: palette.radius.content, fontSize: 12, fontWeight: 800 }}>
            {mensaje}
          </Box>
        )}

        <Box sx={{ display: "grid", gap: 1.5, alignItems: "start" }}>
          <Box sx={{ ...cardSx, overflow: "hidden" }}>
            <Box sx={{ p: 1.4, borderBottom: `1px solid ${palette.border}`, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) auto" }, gap: 1, alignItems: "center" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: palette.text, fontWeight: 950, fontSize: 17 }} noWrap>{usuarioActual?.nombres || "Selecciona un usuario"}</Typography>
                <Typography sx={{ color: palette.muted, fontSize: 11.5, fontWeight: 700 }} noWrap>{usuarioActual ? `Permisos para ${usuarioActual.id_invitado}` : "La matriz aparece al elegir un invitado."}</Typography>
                {usuarioActual && (
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.7 }}>
                    <Badge color={boolValue(usuarioActual.activo) ? palette.success : palette.danger} background={boolValue(usuarioActual.activo) ? palette.successSoft : palette.dangerSoft}>{boolValue(usuarioActual.activo) ? "Activo" : "Inactivo"}</Badge>
                    {(String(usuarioActual.supervisor || "").trim().toUpperCase() === "SI" || String(usuarioActual.supervisor || "").trim() === "1") && <Badge color={palette.accent} background={palette.accentSoft}>Supervisor</Badge>}
                    <Badge>{Number(usuarioActual.permisos_total || 0)} permisos</Badge>
                  </Box>
                )}
              </Box>
              <FormControl size="small" sx={{ minWidth: 220, ...controlSx }}>
                <InputLabel>Copiar desde</InputLabel>
                <Select
                  label="Copiar desde"
                  value={usuarioCopiarDesde}
                  onChange={(e) => copiarDesde(e.target.value)}
                  displayEmpty
                  renderValue={(selected) => {
                    const usuario = usuarios.find((item) => item.id_invitado === selected);
                    return (
                      <Box component="span" sx={{ color: selected ? palette.text : palette.muted, fontWeight: 900 }}>
                        {selected ? (usuario?.nombres || selected) : "Copiar desde"}
                      </Box>
                    );
                  }}
                  startAdornment={<ContentCopyIcon sx={{ color: palette.accent, mr: 0.7 }} fontSize="small" />}
                  MenuProps={selectMenuProps}
                  sx={{
                    minWidth: 220,
                    "& .MuiSelect-select": {
                      pl: 0.5,
                    },
                  }}
                >
                  {usuarios.filter((usuario) => usuario.id_invitado !== usuarioSeleccionado).map((usuario) => (
                    <MenuItem key={usuario.id_invitado} value={usuario.id_invitado}>{usuario.nombres || usuario.id_invitado}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 760 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "minmax(260px,1fr) 84px minmax(280px,1.15fr)", gap: 0, px: 1.2, py: 0.9, borderBottom: `1px solid ${palette.border}`, background: palette.bg }}>
                  <Typography sx={{ color: palette.muted, fontSize: 11, fontWeight: 950, textTransform: "uppercase" }}>Pantalla</Typography>
                  <Typography sx={{ color: palette.muted, fontSize: 11, fontWeight: 950, textTransform: "uppercase", textAlign: "center" }}>Ver</Typography>
                  <Typography sx={{ color: palette.muted, fontSize: 11, fontWeight: 950, textTransform: "uppercase" }}>Comandos</Typography>
                </Box>

                <Box sx={{ display: "grid" }}>
                  {itemsArbol.map((item) => {
                    const accionesItem = accionesPorItem.get(item.id_item) || [];
                    const esAgrupador = item.tipo === "MENU" || item.tipo === "GRUPO";
                    const nivel = Number(item._nivel || 0);
                    return (
                      <Box key={item.id_item} sx={{ display: "grid", gridTemplateColumns: "minmax(260px,1fr) 84px minmax(280px,1.15fr)", gap: 0, alignItems: "center", px: 1.2, py: 0.75, borderBottom: `1px solid ${palette.borderSoft}`, background: esAgrupador ? palette.surface : palette.bg }}>
                        <Box sx={{ minWidth: 0, pl: Math.min(nivel * 2, 6), display: "grid", gap: 0.25 }}>
                          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", minWidth: 0 }}>
                            <Typography sx={{ color: palette.text, fontSize: esAgrupador ? 13.5 : 12.5, fontWeight: esAgrupador ? 950 : 850 }} noWrap>{item.nombre}</Typography>
                            <Badge>{item.tipo}</Badge>
                          </Box>
                          <Typography sx={{ color: palette.muted, fontSize: 10.5, fontWeight: 700 }} noWrap>{item.descripcion || item.ruta || item.id_item}</Typography>
                        </Box>
                        <Box sx={{ display: "grid", placeItems: "center" }}>
                          {!esAgrupador && (
                            <Checkbox size="small" checked={Boolean(itemPermisos[item.id_item])} onChange={(event) => setItemPermitido(item.id_item, event.target.checked)} sx={checkboxSx} />
                          )}
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.55, flexWrap: "wrap", alignItems: "center" }}>
                          {accionesItem.length === 0 && <Typography sx={{ color: palette.muted, fontSize: 11, fontWeight: 800 }}>Sin comandos</Typography>}
                          {accionesItem.map((accion) => (
                            <Box key={accion.id_accion} component="label" sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, border: `1px solid ${accionPermisos[accion.id_accion] ? palette.accent : palette.borderSoft}`, background: accionPermisos[accion.id_accion] ? palette.accentSoft : palette.surface, color: palette.text, borderRadius: palette.radius.control, px: 0.55, height: 28, cursor: "pointer" }}>
                              <Checkbox size="small" checked={Boolean(accionPermisos[accion.id_accion])} onChange={(event) => setAccionPermitida(accion, event.target.checked)} sx={{ ...checkboxSx, p: 0.2 }} />
                              <Typography sx={{ fontSize: 11, fontWeight: 850 }} noWrap>{accion.nombre}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                  {itemsArbol.length === 0 && <Box sx={{ p: 2, color: palette.muted, fontSize: 12, fontWeight: 800, textAlign: "center" }}>No hay items de menu activos para este rubro.</Box>}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
