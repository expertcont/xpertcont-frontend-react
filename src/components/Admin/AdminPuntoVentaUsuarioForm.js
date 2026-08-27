import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Checkbox, FormControlLabel, Grid, InputBase, MenuItem, Select, Typography } from "@mui/material";
import { Clock, Minus, Plus, Save, ShieldCheck, UserRound } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import swal2 from "sweetalert2";

import AppButton from "../ui/AppButton";
import AppIconBox from "../ui/AppIconBox";
import palette from "../../theme/palette";

const decodePath = (value) => decodeURIComponent(value || "");

const normalizaFecha = (value) => {
  if (!value) {
    return "";
  }
  return String(value).replace("T", " ").substring(0, 16).replace(" ", "T");
};

const normalizaHora = (value) => value ? String(value).substring(0, 5) : "";

const limpiarVacios = (registro) => ({
  ...registro,
  fecha_ingreso: registro.fecha_ingreso || null,
  ultimo_login: registro.ultimo_login || null,
  turno1_inicio: registro.turno1_inicio || null,
  turno1_fin: registro.turno1_fin || null,
  turno2_inicio: registro.turno2_inicio || null,
  turno2_fin: registro.turno2_fin || null,
  turno3_inicio: registro.turno3_inicio || null,
  turno3_fin: registro.turno3_fin || null,
});

const fieldSx = {
  minHeight: 42,
  px: 1.2,
  py: 0.55,
  display: "flex",
  alignItems: "flex-start",
  flexDirection: "column",
  justifyContent: "center",
  gap: 0.35,
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
};

const inputSx = {
  color: palette.text,
  fontSize: "13px",
  width: "100%",
  "& input::placeholder": { color: palette.muted, opacity: 1 },
};

function Field({ label, children, tall = false }) {
  return (
    <Box sx={{ ...fieldSx, minHeight: tall ? 64 : fieldSx.minHeight }}>
      <Typography component="span" sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1 }}>
        {label}
      </Typography>
      <Box sx={{ width: "100%", minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

function CaptureInput({ value, onChange, placeholder, type = "text", readOnly = false }) {
  return (
    <InputBase
      type={type}
      value={value || ""}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      sx={inputSx}
    />
  );
}

const normalizarMinutos = (value) => {
  const [hoursText, minutesText] = String(value || "00:00").split(":");
  const hours = Number(hoursText || 0);
  const minutes = Number(minutesText || 0);
  return ((hours * 60) + minutes + 1440) % 1440;
};

const formatMinutesAsTime = (totalMinutes) => {
  const normalized = (Number(totalMinutes || 0) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

function TimeStepper({ value, onChange, placeholder = "--:--", step = 15 }) {
  const updateTime = (delta) => {
    const base = value ? normalizarMinutos(value) : 8 * 60;
    onChange(formatMinutesAsTime(base + delta));
  };

  const buttonSx = {
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: palette.muted,
    cursor: "pointer",
    transition: "all .16s ease",
    "&:hover": {
      backgroundColor: palette.accentSoft,
      color: palette.accent,
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        width: "100%",
        minHeight: 34,
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: palette.surface,
        border: `1px solid ${palette.borderSoft}`,
      }}
    >
      <InputBase
        type="time"
        value={value || ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          ...inputSx,
          flex: 1,
          minWidth: 0,
          px: 1,
          "& input": {
            fontWeight: 800,
            letterSpacing: 0,
          },
        }}
      />
      <Box
        sx={{
          width: 30,
          flexShrink: 0,
          display: "grid",
          gridTemplateRows: "1fr 1fr",
          borderLeft: `1px solid ${palette.borderSoft}`,
          backgroundColor: palette.bg,
        }}
      >
        <Box onClick={() => updateTime(step)} sx={{ ...buttonSx, borderBottom: `1px solid ${palette.borderSoft}` }}>
          <Plus size={13} />
        </Box>
        <Box onClick={() => updateTime(-step)} sx={buttonSx}>
          <Minus size={13} />
        </Box>
      </Box>
    </Box>
  );
}

function DarkSelect({ value, onChange, options, placeholder = "Selecciona" }) {
  return (
    <Select
      variant="standard"
      disableUnderline
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      sx={{
        color: palette.text,
        fontSize: "13px",
        width: "100%",
        "& .MuiSelect-icon": { color: palette.muted },
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            bgcolor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            "& .MuiMenuItem-root": { fontSize: "12.5px" },
          },
        },
      }}
    >
      <MenuItem value="">{placeholder}</MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
      ))}
    </Select>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.9, mb: 0.5 }}>
      <Box sx={{ color: palette.accent, display: "flex" }}>{icon}</Box>
      <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 800 }}>{title}</Typography>
    </Box>
  );
}

export default function AdminPuntoVentaUsuarioForm() {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const params = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth0();

  const esEdicion = Boolean(params.documento_id && params.id_punto_venta && params.id_invitado_grupo);
  const documentoParam = decodePath(params.documento_id);
  const puntoParam = decodePath(params.id_punto_venta);
  const invitadoParam = decodePath(params.id_invitado_grupo);
  const rubroTrabajo = String(sessionStorage.getItem("rubro_trabajo") || "").trim().toUpperCase();
  const esRubroTransporte = rubroTrabajo === "TRANSPORTE" || rubroTrabajo === "TRANSPORTES";
  const etiquetaPunto = esRubroTransporte ? "Agencia" : "Punto";
  const etiquetaPuntoLower = esRubroTransporte ? "agencia" : "punto de venta";
  const etiquetaPuntoPluralLower = esRubroTransporte ? "agencias" : "puntos de venta";

  const [contabilidades, setContabilidades] = useState([]);
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [cargandoPuntos, setCargandoPuntos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    documento_id: documentoParam || sessionStorage.getItem("contabilidad_trabajo") || "",
    id_punto_venta: puntoParam || "",
    punto_venta_nombre: "",
    id_invitado: invitadoParam || "",
    nombres: "",
    fecha_ingreso: "",
    ultimo_login: "",
    activo: true,
    sin_restriccion: false,
    turno1_inicio: "",
    turno1_fin: "",
    turno2_inicio: "",
    turno2_fin: "",
    turno3_inicio: "",
    turno3_fin: "",
  });

  const updateDraft = (name, value) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const cargarContabilidades = useCallback(async () => {
    try {
      const response = await fetch(`${back_host}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`);
      const result = await response.json();
      const data = Array.isArray(result) ? result : [];
      const documentoFinal = documentoParam || draft.documento_id || data[0]?.documento_id || "";

      setContabilidades(data);
      setDraft((prev) => ({ ...prev, documento_id: documentoFinal }));
    } catch (error) {
      console.log("Error cargando contabilidades usuarios turnos:", error);
    }
  }, [back_host, documentoParam, draft.documento_id, params.id_anfitrion, params.id_invitado]);

  const cargarPuntosVenta = useCallback(async () => {
    const documentoConsulta = documentoParam || draft.documento_id;

    if (!documentoConsulta) {
      setPuntosVenta([]);
      return;
    }

    try {
      setCargandoPuntos(true);
      const response = await fetch(`${back_host}/mad_punto_venta/${params.id_anfitrion}/${documentoConsulta}`);
      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];
      setPuntosVenta(data);
    } catch (error) {
      console.log("Error cargando puntos venta usuarios turnos:", error);
      setPuntosVenta([]);
    } finally {
      setCargandoPuntos(false);
    }
  }, [back_host, documentoParam, draft.documento_id, params.id_anfitrion]);

  const cargarRegistro = useCallback(async () => {
    if (!esEdicion) {
      return;
    }

    try {
      const response = await fetch(`${back_host}/mad_punto_venta_usuario/${params.id_anfitrion}/${encodeURIComponent(documentoParam)}/${encodeURIComponent(puntoParam)}/${encodeURIComponent(invitadoParam)}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo cargar el acceso.");
      }

      const data = result.data || {};
      setDraft({
        documento_id: data.documento_id || documentoParam,
        id_punto_venta: data.id_punto_venta || puntoParam,
        punto_venta_nombre: data.punto_venta_nombre || "",
        id_invitado: data.id_invitado || invitadoParam,
        nombres: data.nombres || "",
        fecha_ingreso: normalizaFecha(data.fecha_ingreso),
        ultimo_login: normalizaFecha(data.ultimo_login),
        activo: data.activo ?? true,
        sin_restriccion: data.sin_restriccion ?? false,
        turno1_inicio: normalizaHora(data.turno1_inicio),
        turno1_fin: normalizaHora(data.turno1_fin),
        turno2_inicio: normalizaHora(data.turno2_inicio),
        turno2_fin: normalizaHora(data.turno2_fin),
        turno3_inicio: normalizaHora(data.turno3_inicio),
        turno3_fin: normalizaHora(data.turno3_fin),
      });
    } catch (error) {
      setError(error.message || "No se pudo cargar el acceso.");
    }
  }, [back_host, documentoParam, esEdicion, invitadoParam, params.id_anfitrion, puntoParam]);

  useEffect(() => {
    cargarContabilidades();
  }, [cargarContabilidades]);

  useEffect(() => {
    cargarPuntosVenta();
  }, [cargarPuntosVenta]);

  useEffect(() => {
    cargarRegistro();
  }, [cargarRegistro]);

  useEffect(() => {
    const emailGoogle = String(user?.email || "").toLowerCase();
    const invitado = String(draft.id_invitado || "").toLowerCase();

    if (isAuthenticated && emailGoogle && invitado && emailGoogle === invitado && user?.name && !draft.nombres) {
      updateDraft("nombres", user.name);
    }
  }, [draft.id_invitado, draft.nombres, isAuthenticated, user]);

  const contabilidadOptions = useMemo(() => contabilidades.map((item) => ({
    value: item.documento_id,
    label: item.razon_social || item.documento_id,
  })), [contabilidades]);

  const puntoOptions = useMemo(() => {
    const options = puntosVenta.map((item) => ({
      value: item.id_punto_venta,
      label: `${item.id_punto_venta} - ${item.nombre}${item.activo === false ? " (inactivo)" : ""}`,
    }));

    if (draft.id_punto_venta && !options.some((item) => item.value === draft.id_punto_venta)) {
      options.unshift({
        value: draft.id_punto_venta,
        label: `${draft.id_punto_venta} - ${draft.punto_venta_nombre || "Punto actual"}`,
      });
    }

    return options;
  }, [draft.id_punto_venta, draft.punto_venta_nombre, puntosVenta]);

  const validar = () => {
    if (!draft.documento_id || !draft.id_punto_venta || !draft.id_invitado) {
      setError(`Selecciona empresa, ${etiquetaPuntoLower} e invitado.`);
      return false;
    }

    setError("");
    return true;
  };

  const guardar = async () => {
    if (!validar()) {
      return;
    }

    setGuardando(true);
    try {
      const payload = limpiarVacios({
        ...draft,
        id_anfitrion: params.id_anfitrion,
      });

      const response = await fetch(`${back_host}/mad_punto_venta_usuario`, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo guardar el acceso.");
      }

      navigate(`/ad_puntoventausuario/${params.id_anfitrion}/${params.id_invitado}`);
    } catch (error) {
      swal2.fire({ title: "No se pudo guardar", text: error.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.bg, p: { xs: 1.25, md: 3 } }}>
      <Box sx={{ maxWidth: 940, mx: "auto", backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 3, p: { xs: 1.35, md: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.15, mb: 1.5 }}>
          <AppIconBox><ShieldCheck size={16} /></AppIconBox>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "17px", lineHeight: 1.15 }}>
              {esEdicion ? "Editar usuario turnos" : "Nuevo usuario turnos"}
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: "11.5px", mt: 0.3 }} noWrap>
              Acceso por {etiquetaPuntoLower} y horario operativo
            </Typography>
          </Box>
        </Box>

        <SectionHeader icon={<UserRound size={15} />} title={`1. Usuario y ${etiquetaPuntoLower}`} />
        <Grid container spacing={1.15}>
          <Grid item xs={12} md={6}>
            <Field label="Empresa">
              <DarkSelect
                value={draft.documento_id}
                onChange={(value) => {
                  updateDraft("documento_id", value);
                  updateDraft("id_punto_venta", "");
                }}
                options={contabilidadOptions}
              />
            </Field>
          </Grid>
          <Grid item xs={12} md={6}>
            <Field label={etiquetaPunto}>
              <DarkSelect value={draft.id_punto_venta} onChange={(value) => updateDraft("id_punto_venta", value)} options={puntoOptions} />
            </Field>
            <Typography sx={{ color: palette.muted, fontSize: "10.5px", mt: 0.45 }}>
              {cargandoPuntos
                ? `Cargando ${etiquetaPuntoPluralLower} desde mad_punto_venta...`
                : `${puntosVenta.length} ${etiquetaPuntoPluralLower} cargados desde mad_punto_venta`}
            </Typography>
          </Grid>
          <Grid item xs={12} md={8}>
            <Field label="Invitado">
              <CaptureInput value={draft.id_invitado} onChange={(value) => updateDraft("id_invitado", value)} placeholder="correo@empresa.com" readOnly={esEdicion} />
            </Field>
          </Grid>
          <Grid item xs={12} md={4}>
            <Field label="Nombres">
              <CaptureInput value={draft.nombres} onChange={(value) => updateDraft("nombres", value)} placeholder="Nombre del usuario" />
            </Field>
          </Grid>
          <Grid item xs={12} md={4}>
            <Field label="Fecha alta">
              <CaptureInput value={draft.fecha_ingreso} onChange={(value) => updateDraft("fecha_ingreso", value)} type="datetime-local" />
            </Field>
          </Grid>
          <Grid item xs={12} md={4}>
            <Field label="Ult. login">
              <CaptureInput value={draft.ultimo_login} onChange={(value) => updateDraft("ultimo_login", value)} type="datetime-local" />
            </Field>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ ...fieldSx, alignItems: "center", justifyContent: "center" }}>
              <FormControlLabel
                sx={{ color: palette.text, m: 0, "& .MuiFormControlLabel-label": { fontSize: "12.5px", fontWeight: 800 } }}
                control={<Checkbox size="small" checked={draft.activo} onChange={(event) => updateDraft("activo", event.target.checked)} sx={{ color: palette.muted, "&.Mui-checked": { color: palette.accent } }} />}
                label="Activo"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ ...fieldSx, alignItems: "center", justifyContent: "center" }}>
              <FormControlLabel
                sx={{ color: palette.text, m: 0, "& .MuiFormControlLabel-label": { fontSize: "12.5px", fontWeight: 800 } }}
                control={<Checkbox size="small" checked={draft.sin_restriccion} onChange={(event) => updateDraft("sin_restriccion", event.target.checked)} sx={{ color: palette.muted, "&.Mui-checked": { color: palette.accent } }} />}
                label="Sin restriccion"
              />
            </Box>
          </Grid>
        </Grid>

        <SectionHeader icon={<Clock size={15} />} title="2. Turnos de acceso" />
        <Grid container spacing={1.15}>
          <Grid item xs={12} md={4}>
            <Field label="Turno 1" tall>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.85, width: "100%" }}>
                <TimeStepper value={draft.turno1_inicio} onChange={(value) => updateDraft("turno1_inicio", value)} />
                <TimeStepper value={draft.turno1_fin} onChange={(value) => updateDraft("turno1_fin", value)} />
              </Box>
            </Field>
          </Grid>
          <Grid item xs={12} md={4}>
            <Field label="Turno 2" tall>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.85, width: "100%" }}>
                <TimeStepper value={draft.turno2_inicio} onChange={(value) => updateDraft("turno2_inicio", value)} />
                <TimeStepper value={draft.turno2_fin} onChange={(value) => updateDraft("turno2_fin", value)} />
              </Box>
            </Field>
          </Grid>
          <Grid item xs={12} md={4}>
            <Field label="Turno 3" tall>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.85, width: "100%" }}>
                <TimeStepper value={draft.turno3_inicio} onChange={(value) => updateDraft("turno3_inicio", value)} />
                <TimeStepper value={draft.turno3_fin} onChange={(value) => updateDraft("turno3_fin", value)} />
              </Box>
            </Field>
          </Grid>
        </Grid>

        {error && <Typography sx={{ color: "#ff8a65", fontSize: "12px", mt: 1 }}>{error}</Typography>}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.8, mt: 1.8, flexWrap: "wrap" }}>
          <AppButton onClick={() => navigate(-1)}>Cancelar</AppButton>
          <AppButton icon={<Save size={16} />} onClick={guardar} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
            {guardando ? "Guardando..." : "Guardar acceso"}
          </AppButton>
        </Box>
      </Box>
    </Box>
  );
}
