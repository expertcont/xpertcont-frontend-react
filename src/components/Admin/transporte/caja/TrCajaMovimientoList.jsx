import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable, { createTheme } from "react-data-table-component";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, InputBase, MenuItem, Select, Typography } from "@mui/material";
import { Edit3, Printer, Search, Trash2, WalletCards, X } from "lucide-react";
import swal2 from "sweetalert2";

import DaySelector from "../../AdminDias";
import { useDialog } from "../../AdminConfirmDialogProvider";
import palette from "../../../../theme/palette";
import AppButton from "../../../ui/AppButton";
import TrHeader from "../common/components/TrHeader";
import TrFiltros from "../common/components/TrFiltros";
import TrHeaderMenuPicker from "../common/components/TrHeaderMenuPicker";
import useTrCatalogos from "../common/hooks/useTrCatalogos";
import crearCierreCajaMovimientoPdf from "./TrCajaMovimientoCierrePdf";

createTheme(
  "transportesDark",
  {
    text: { primary: palette.text, secondary: palette.accent },
    background: { default: "transparent" },
    context: { background: palette.accent, text: palette.onAccent },
    divider: { default: palette.borderSoft },
    action: {
      button: palette.muted,
      hover: palette.accentSoft,
      disabled: palette.border,
    },
  },
  "dark",
);

const fechaHoyLima = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
  //new version
};

const resolverUsuarioTrabajo = ({ rows, usuarioActual, permiteTodos }) => {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const usuarioValido = rows.some((item) => item.id_usuario === usuarioActual);

  if (permiteTodos) {
    return usuarioValido ? usuarioActual : "";
  }

  return usuarioValido ? usuarioActual : rows[0]?.id_usuario || "";
};

const money = (value) => Number(value || 0).toLocaleString("es-PE", {
  style: "currency",
  currency: "PEN",
});

const fieldSx = {
  height: 38,
  px: 1.15,
  borderRadius: palette.radius.control,
  border: `1px solid ${palette.border}`,
  backgroundColor: palette.overlaySoft,
  color: palette.text,
  fontSize: "13px",
  width: "100%",
  "& input": { p: 0, color: palette.text, fontSize: "13px" },
  "& textarea": { p: 0, color: palette.text, fontSize: "13px" },
};

const selectSx = {
  ...fieldSx,
  ".MuiSelect-select": { p: 0, display: "flex", alignItems: "center", minHeight: 0 },
  ".MuiSelect-icon": { color: palette.muted },
};

const menuItemSx = { fontSize: "13px" };

const emptyDraft = {
  fecha: "",
  id_punto_venta: "",
  id_motivo: "",
  descripcion: "",
  importe: "",
  id_forma_pago: "",
  nro_operacion: "",
  beneficiario: "",
  documento_beneficiario: "",
};

function FieldLabel({ children }) {
  return (
    <Typography sx={{ color: palette.muted, fontSize: "11px", fontWeight: 800, mb: 0.5 }}>
      {children}
    </Typography>
  );
}

function ResumenCard({ label, value, tone, onClick, actionIcon, hideActionIcon = false, watermark, watermarkIcon }) {
  const color = tone === "danger" ? palette.danger : tone === "success" ? palette.success : palette.accent;
  const clickable = Boolean(onClick);
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.5,
        minHeight: 78,
        borderRadius: palette.radius.listCard,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surface,
        cursor: clickable ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        transition: "border-color .18s ease, background-color .18s ease",
        "&:hover": clickable ? {
          borderColor: "rgba(77,163,255,0.46)",
          backgroundColor: palette.overlaySoft,
        } : undefined,
        "@keyframes ingreso-detail-vibe": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-1px)" },
          "40%": { transform: "translateX(1px)" },
          "60%": { transform: "translateX(-1px)" },
          "80%": { transform: "translateX(1px)" },
        },
      }}
    >
      {watermark && (
        <Box
          sx={{
            position: "absolute",
            right: 9,
            bottom: 7,
            color: palette.accent,
            fontSize: "12px",
            fontWeight: 900,
            letterSpacing: 0.8,
            lineHeight: 0.95,
            opacity: 0.22,
            textAlign: "right",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {String(watermark).split(" ").map((line) => (
            <Box key={line}>{line}</Box>
          ))}
        </Box>
      )}
      {watermarkIcon && (
        <Box
          sx={{
            position: "absolute",
            right: 8,
            top: 10,
            color: palette.accent,
            opacity: 0.09,
            transform: "rotate(-12deg)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {watermarkIcon}
        </Box>
      )}
      <Typography sx={{ color, fontWeight: 900, fontSize: "21px", lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.45, color: palette.muted, mt: 0.75 }}>
        {clickable && !hideActionIcon && (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              color: palette.accent,
              animation: "ingreso-detail-vibe 1.8s ease-in-out infinite",
            }}
          >
            {actionIcon || <Search size={14} />}
          </Box>
        )}
        <Typography sx={{ fontSize: "11px", fontWeight: 800 }}>{label}</Typography>
      </Box>
    </Box>
  );
}

function IngresosModal({ open, ingresos, loading, onClose }) {
  const tipoLabel = (row) => {
    if (row.tipo_ingreso === "ORIGEN") return "Origen";
    if (row.tipo_ingreso === "ORIGEN_POR_COBRAR_REFERENCIA") return "Por Cobrar";
    if (row.tipo_ingreso === "DESTINO_POR_COBRAR_PENDIENTE") return "Por cobrar destino";
    return "Cobrado en destino";
  };
  const ingresoContabiliza = (row) => row.contabiliza !== false && Number(row.registrado ?? 1) === 1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { width: { xs: "calc(100% - 24px)", sm: 560 }, borderRadius: palette.radius.modal, backgroundColor: palette.surface, border: `1px solid ${palette.border}` } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: palette.text, fontSize: "15px", fontWeight: 500, pb: 1 }}>
        Ingresos por encomiendas
        <IconButton onClick={onClose} size="small" sx={{ color: palette.muted }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          sx={{
            maxHeight: { xs: "64vh", md: "68vh" },
            overflow: "auto",
            borderRadius: palette.radius.listCard,
            border: `1px solid ${palette.borderSoft}`,
            backgroundColor: palette.surface,
            scrollbarWidth: "thin",
            scrollbarColor: `${palette.border} transparent`,
            "&::-webkit-scrollbar": {
              width: 8,
              height: 8,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: palette.border,
              borderRadius: 8,
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: palette.accentSoft,
            },
          }}
        >
          {loading && (
            <Typography sx={{ color: palette.muted, fontSize: "11px", px: 1.2, py: 2 }}>
              Cargando ingresos...
            </Typography>
          )}

          {!loading && ingresos.length === 0 && (
            <Box sx={{ py: 4, px: 1.2, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}>
              <Search size={16} />
              Sin ingresos por encomiendas para el filtro actual
            </Box>
          )}

          {!loading && ingresos.map((row) => (
            (() => {
              const contabiliza = ingresoContabiliza(row);
              const anulado = Number(row.registrado ?? 1) === 0;
              const noAplica = row.tipo_ingreso === "ORIGEN_POR_COBRAR_REFERENCIA" || row.tipo_ingreso === "DESTINO_POR_COBRAR_PENDIENTE";
              const importeTexto = anulado ? "Anulado" : noAplica ? "Por Cobrar" : money(row.r_monto_total);
              const tipoTexto = anulado ? "Anulado" : tipoLabel(row);
              const estadoColor = anulado || noAplica ? palette.danger : contabiliza ? palette.success : palette.warning || palette.accent;
              const estadoBg = anulado || noAplica ? palette.dangerSoft : contabiliza ? palette.successSoft : palette.warningSoft || palette.accentSoft;
              const operador = row.id_operador_caja || "-";
              return (
            <Box
              key={`${row.tipo_ingreso}-${row.r_cod}-${row.r_serie}-${row.r_numero}-${row.elemento}`}
              sx={{
                p: { xs: 1, md: 1.15 },
                borderBottom: `1px solid ${palette.borderSoft}`,
                display: "grid",
                gap: 0.85,
                backgroundColor: "transparent",
                "&:last-of-type": {
                  borderBottom: 0,
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, minWidth: 0 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 600, lineHeight: 1.2 }} noWrap>
                    {row.r_serie || ""}-{row.r_numero || ""}
                  </Typography>
                  <Typography sx={{ color: palette.muted, fontSize: "10.5px", mt: 0.2 }} noWrap>
                    Grabacion: {String(row.fecha_caja || "").slice(0, 16).replace("T", " ")}
                  </Typography>
                  <Typography sx={{ color: palette.accent, fontSize: "10.5px", mt: 0.2, fontWeight: 800 }} noWrap>
                    Usuario: {operador}
                  </Typography>
                </Box>
                <Box sx={{ display: "grid", justifyItems: "end", gap: 0.35 }}>
                  <Typography sx={{ color: contabiliza ? palette.success : palette.muted, fontSize: "13px", fontWeight: 800, lineHeight: 1.1, whiteSpace: "nowrap", textDecoration: anulado ? "line-through" : "none" }}>
                    {importeTexto}
                  </Typography>
                  <Box sx={{ px: 0.7, py: 0.25, borderRadius: palette.radius.control, color: estadoColor, backgroundColor: estadoBg, fontSize: "9.5px", fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap" }}>
                    {tipoTexto}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.65, flexWrap: "wrap" }}>
                {row.observacion_caja && (
                  <Box sx={{ px: 0.7, py: 0.25, borderRadius: palette.radius.control, color: estadoColor, backgroundColor: estadoBg, fontSize: "9.5px", fontWeight: 800, lineHeight: 1.2 }}>
                    Obs: {row.observacion_caja}
                  </Box>
                )}
                <Typography sx={{ color: palette.muted, fontSize: "10.5px" }}>
                  {row.punto_venta_origen_nombre || row.id_punto_venta_origen || "-"} - {row.punto_venta_dest_nombre || row.id_punto_venta_dest || "-"}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 0.35 }}>
                <Typography sx={{ color: palette.muted, fontSize: "10.8px" }} noWrap>
                  Rem: {row.cliente || "-"}
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: "10.8px" }} noWrap>
                  Dest: {row.destinatario || "-"}
                </Typography>
              </Box>
            </Box>
              );
            })()
          ))}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
          <AppButton
            onClick={onClose}
            sx={{
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: 120 },
              justifyContent: "center",
              fontWeight: 800,
            }}
          >
            Cerrar
          </AppButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function TrCajaMovimientoModal({
  open,
  draft,
  setDraft,
  motivos,
  formasPago,
  puntosVenta,
  guardando,
  esEdicion,
  onClose,
  onSubmit,
}) {
  const update = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: palette.radius.modal, backgroundColor: palette.surface, border: `1px solid ${palette.border}` } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: palette.text, fontWeight: 800, pb: 1 }}>
        {esEdicion ? "Editar salida de dinero" : "Registrar salida de dinero"}
        <IconButton onClick={onClose} size="small" sx={{ color: palette.muted }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.4 }}>
          <Box>
            <FieldLabel>Fecha</FieldLabel>
            <InputBase type="datetime-local" value={draft.fecha} onChange={(event) => update("fecha", event.target.value)} sx={fieldSx} />
          </Box>

          <Box>
            <FieldLabel>Punto de venta</FieldLabel>
            <Select value={draft.id_punto_venta} onChange={(event) => update("id_punto_venta", event.target.value)} sx={selectSx} fullWidth displayEmpty>
              <MenuItem value="" sx={menuItemSx}>Selecciona</MenuItem>
              {puntosVenta.map((item) => (
                <MenuItem key={item.id_punto_venta} value={item.id_punto_venta} sx={menuItemSx}>
                  {item.id_punto_venta} - {item.nombre}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <FieldLabel>Motivo</FieldLabel>
            <Select value={draft.id_motivo} onChange={(event) => update("id_motivo", event.target.value)} sx={selectSx} fullWidth displayEmpty>
              <MenuItem value="" sx={menuItemSx}>Selecciona</MenuItem>
              {motivos.map((item) => (
                <MenuItem key={item.id_motivo} value={item.id_motivo} sx={menuItemSx}>
                  {item.nombre}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <FieldLabel>Importe</FieldLabel>
            <InputBase type="number" inputProps={{ min: 0, step: "0.01" }} value={draft.importe} onChange={(event) => update("importe", event.target.value)} sx={fieldSx} />
          </Box>

          <Box>
            <FieldLabel>Forma de pago</FieldLabel>
            <Select value={draft.id_forma_pago} onChange={(event) => update("id_forma_pago", event.target.value)} sx={selectSx} fullWidth displayEmpty>
              <MenuItem value="" sx={menuItemSx}>Selecciona</MenuItem>
              {formasPago.map((item) => (
                <MenuItem key={item.id_forma_pago} value={item.id_forma_pago} sx={menuItemSx}>
                  {item.id_forma_pago} - {item.nombre}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <FieldLabel>Nro. operacion</FieldLabel>
            <InputBase value={draft.nro_operacion} onChange={(event) => update("nro_operacion", event.target.value)} sx={fieldSx} />
          </Box>

          <Box sx={{ gridColumn: { xs: "auto", md: "span 3" } }}>
            <FieldLabel>Descripcion</FieldLabel>
            <InputBase value={draft.descripcion} onChange={(event) => update("descripcion", event.target.value)} sx={{ ...fieldSx, minHeight: 66, alignItems: "flex-start", py: 1 }} multiline rows={2} />
          </Box>

          <Box>
            <FieldLabel>Beneficiario</FieldLabel>
            <InputBase value={draft.beneficiario} onChange={(event) => update("beneficiario", event.target.value)} sx={fieldSx} />
          </Box>

          <Box>
            <FieldLabel>Documento beneficiario</FieldLabel>
            <InputBase value={draft.documento_beneficiario} onChange={(event) => update("documento_beneficiario", event.target.value)} sx={fieldSx} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
          <AppButton onClick={onClose}>Cancelar</AppButton>
          <AppButton onClick={onSubmit} disabled={guardando} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.onAccent, fontWeight: 900 }}>
            {guardando ? "Guardando..." : "Guardar salida"}
          </AppButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function TrCajaMovimientoList() {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const params = useParams();
  const navigate = useNavigate();
  const { confirmDialog } = useDialog();

  const [periodoTrabajo, setPeriodoTrabajo] = useState("");
  const [contabilidadTrabajo, setContabilidadTrabajo] = useState("");
  const [puntoVentaTrabajo, setPuntoVentaTrabajo] = useState("");
  const [diaSel, setDiaSel] = useState("*");
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [valorBusqueda, setValorBusqueda] = useState("");
  const [motivos, setMotivos] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [motivoFiltro, setMotivoFiltro] = useState("");
  const [formaPagoFiltro, setFormaPagoFiltro] = useState("");
  const [usuariosTrabajo, setUsuariosTrabajo] = useState([]);
  const [usuarioTrabajo, setUsuarioTrabajo] = useState("");
  const [resumen, setResumen] = useState({ total_ingresos: 0, total_salidas: 0, neto: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [ingresosModalOpen, setIngresosModalOpen] = useState(false);
  const [ingresosDetalle, setIngresosDetalle] = useState([]);
  const [loadingIngresos, setLoadingIngresos] = useState(false);
  const [editando, setEditando] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [guardando, setGuardando] = useState(false);
  const [imprimiendoCierre, setImprimiendoCierre] = useState(false);
  const guardandoRef = useRef(false);

  const {
    periodoSelect,
    contabilidadSelect,
    puntosVentaAsignados,
    setPuntosVentaAsignados,
    cargarPeriodos,
    cargarContabilidades,
    cargarPuntosVentaAsignados,
  } = useTrCatalogos({
    back_host,
    params,
    contabilidadTrabajo,
    tipoOperacionFijo: "S",
    puntoVentaTrabajo,
    setPuntoVentaTrabajo,
  });

  const superUsuario = sessionStorage.getItem("super") || "0";
  const accesoTotalCaja = params.id_anfitrion === params.id_invitado || superUsuario === "1";
  const usuarioTieneVariasAgencias = puntosVentaAsignados.length > 1;
  const usuarioPuedeVerTodosCorreos = accesoTotalCaja && usuarioTieneVariasAgencias;

  const fechaFiltro = useMemo(() => (
    diaSel && diaSel !== "*" && periodoTrabajo ? `${periodoTrabajo}-${String(diaSel).padStart(2, "0")}` : ""
  ), [diaSel, periodoTrabajo]);

  const fechaInicialModal = useMemo(() => {
    const base = fechaFiltro || (fechaHoyLima().startsWith(periodoTrabajo) ? fechaHoyLima() : `${periodoTrabajo || params.periodo}-01`);
    return `${base}T${new Date().toTimeString().slice(0, 5)}`;
  }, [fechaFiltro, params.periodo, periodoTrabajo]);

  const cargarMotivos = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setMotivos([]);
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transmotivo/${params.id_anfitrion}/${contabilidadTrabajo}?tipo_movimiento=S&activo=1`);
      const result = await response.json();
      setMotivos(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.log("Error cargando motivos de caja:", error);
      setMotivos([]);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion]);

  const cargarFormasPago = useCallback(async () => {
    try {
      const response = await fetch(`${back_host}/mve_transcaja/formas-pago`);
      const result = await response.json();
      setFormasPago(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.log("Error cargando formas de pago de caja:", error);
      setFormasPago([]);
    }
  }, [back_host]);

  const cargarUsuariosTrabajo = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || !params.id_anfitrion || !params.id_invitado || !accesoTotalCaja) {
      setUsuariosTrabajo([]);
      setUsuarioTrabajo("");
      return;
    }

    try {
      const query = new URLSearchParams();
      query.set("id_invitado", params.id_invitado || "");
      query.set("super_usuario", superUsuario);
      if (puntoVentaTrabajo) query.set("id_punto_venta", puntoVentaTrabajo);
      if (fechaFiltro) query.set("fecha", fechaFiltro);

      const response = await fetch(`${back_host}/mve_transventa/dashboard/usuarios/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query.toString()}`);
      const result = await response.json();
      const rows = Array.isArray(result?.data) ? result.data : [];
      const sessionKey = `usuario_caja_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
      const usuarioGuardado = sessionStorage.getItem(sessionKey) || "";
      const usuarioFinal = resolverUsuarioTrabajo({
        rows,
        usuarioActual: usuarioGuardado,
        permiteTodos: usuarioPuedeVerTodosCorreos,
      });

      setUsuariosTrabajo(rows);
      setUsuarioTrabajo(usuarioFinal);
    } catch (error) {
      console.log("Error cargando usuarios de caja:", error);
      setUsuariosTrabajo([]);
      setUsuarioTrabajo("");
    }
  }, [accesoTotalCaja, back_host, contabilidadTrabajo, fechaFiltro, params.id_anfitrion, params.id_invitado, periodoTrabajo, puntoVentaTrabajo, superUsuario, usuarioPuedeVerTodosCorreos]);

  const armarQuery = useCallback(() => {
    const query = new URLSearchParams();
    query.set("tipo_movimiento", "S");
    query.set("id_invitado", params.id_invitado);
    query.set("super_usuario", superUsuario);
    if (puntoVentaTrabajo) query.set("id_punto_venta", puntoVentaTrabajo);
    if (usuarioTrabajo) query.set("id_usuario_trabajo", usuarioTrabajo);
    if (fechaFiltro) {
      query.set("fecha_desde", fechaFiltro);
      query.set("fecha_hasta", fechaFiltro);
    }
    if (motivoFiltro) query.set("id_motivo", motivoFiltro);
    if (formaPagoFiltro) query.set("id_forma_pago", formaPagoFiltro);
    return query.toString();
  }, [fechaFiltro, formaPagoFiltro, motivoFiltro, params.id_invitado, puntoVentaTrabajo, superUsuario, usuarioTrabajo]);

  const cargarCaja = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo) {
      setMovimientos([]);
      setResumen({ total_ingresos: 0, total_salidas: 0, neto: 0 });
      return;
    }

    setLoading(true);
    try {
      const query = armarQuery();
      const [movimientosResponse, resumenResponse] = await Promise.all([
        fetch(`${back_host}/mve_transcaja/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query}`),
        fetch(`${back_host}/mve_transcaja/consolidado/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query}`),
      ]);
      const movimientosResult = await movimientosResponse.json();
      const resumenResult = await resumenResponse.json();

      setMovimientos(Array.isArray(movimientosResult?.data) ? movimientosResult.data : []);
      setResumen(resumenResult?.data || { total_ingresos: 0, total_salidas: 0, neto: 0 });
    } catch (error) {
      console.log("Error cargando caja de transporte:", error);
      setMovimientos([]);
      setResumen({ total_ingresos: 0, total_salidas: 0, neto: 0 });
    } finally {
      setLoading(false);
    }
  }, [armarQuery, back_host, contabilidadTrabajo, params.id_anfitrion, periodoTrabajo]);

  const abrirDetalleIngresos = async () => {
    if (!periodoTrabajo || !contabilidadTrabajo) {
      return;
    }

    setIngresosModalOpen(true);
    setLoadingIngresos(true);
    try {
      const query = armarQuery();
      const response = await fetch(`${back_host}/mve_transcaja/ingresos/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo cargar el detalle de ingresos.");
      }
      setIngresosDetalle(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      setIngresosDetalle([]);
      swal2.fire({ title: "No se pudo cargar", text: error.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    } finally {
      setLoadingIngresos(false);
    }
  };

  const obtenerIngresosCaja = async () => {
    const query = armarQuery();
    const response = await fetch(`${back_host}/mve_transcaja/ingresos/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "No se pudo cargar los ingresos de caja.");
    }
    return Array.isArray(result.data) ? result.data : [];
  };

  const imprimirCierreCaja = async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || imprimiendoCierre) {
      return;
    }

    const cierreWindow = window.open("about:blank", "_blank");
    setImprimiendoCierre(true);

    try {
      cierreWindow?.document?.write(`<p style="font-family:Arial,sans-serif;color:#111827">Generando cierre de caja...</p>`);
      const ingresos = await obtenerIngresosCaja();
      const agencia = puntoVentaTrabajo
        ? puntosVentaAsignados.find((item) => item.id_punto_venta === puntoVentaTrabajo)?.nombre || puntoVentaTrabajo
        : "Todas";
      const pdfUrl = await crearCierreCajaMovimientoPdf({
        ingresos,
        salidas: movimientos,
        generadoPor: params.id_invitado,
        filtros: {
          periodo: periodoTrabajo,
          fecha: fechaFiltro,
          agencia,
        },
      });

      if (cierreWindow) {
        cierreWindow.location.href = pdfUrl;
      } else {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      cierreWindow?.close();
      swal2.fire({
        title: "No se pudo generar el cierre",
        text: error.message || "Revisa los datos de caja e intenta nuevamente.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
      });
    } finally {
      setImprimiendoCierre(false);
    }
  };

  useEffect(() => {
    const periodoHistorial = sessionStorage.getItem("periodo_trabajo") || params.periodo;
    const contabilidadHistorial = sessionStorage.getItem("contabilidad_trabajo") || params.documento_id;
    cargarPeriodos(periodoHistorial, setPeriodoTrabajo);
    cargarContabilidades(contabilidadHistorial, setContabilidadTrabajo);
  }, [cargarContabilidades, cargarPeriodos, params.documento_id, params.periodo]);

  useEffect(() => {
    cargarPuntosVentaAsignados();
  }, [cargarPuntosVentaAsignados]);

  useEffect(() => {
    cargarMotivos();
  }, [cargarMotivos]);

  useEffect(() => {
    cargarFormasPago();
  }, [cargarFormasPago]);

  useEffect(() => {
    cargarUsuariosTrabajo();
  }, [cargarUsuariosTrabajo]);

  useEffect(() => {
    cargarCaja();
  }, [cargarCaja]);

  const dataFiltrada = useMemo(() => {
    const term = valorBusqueda.trim().toLowerCase();
    if (!term) return movimientos;
    return movimientos.filter((item) => [
      item.motivo_nombre,
      item.descripcion,
      item.beneficiario,
      item.forma_pago_nombre,
      item.nro_operacion,
      item.punto_venta_nombre,
      item.id_invitado,
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [movimientos, valorBusqueda]);

  const handlePeriodoSelect = (periodo) => {
    setPeriodoTrabajo(periodo);
    sessionStorage.setItem("periodo_trabajo", periodo);
    setDiaSel("*");
    setUsuarioTrabajo("");
  };

  const handleContabilidadSelect = (documentoId) => {
    if (documentoId === contabilidadTrabajo) return;
    setContabilidadTrabajo(documentoId);
    setPuntosVentaAsignados([]);
    setPuntoVentaTrabajo("");
    setMotivoFiltro("");
    setUsuarioTrabajo("");
    sessionStorage.setItem("contabilidad_trabajo", documentoId);
    navigate(`/ad_transportecaja/${params.id_anfitrion}/${params.id_invitado}/${periodoTrabajo}/${documentoId}`);
  };

  const handlePuntoVentaSelect = (puntoVenta) => {
    setPuntoVentaTrabajo(puntoVenta);
    setUsuarioTrabajo("");
  };

  const handleUsuarioSelect = (usuario) => {
    const sessionKey = `usuario_caja_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
    setUsuarioTrabajo(usuario);
    if (usuario) {
      sessionStorage.setItem(sessionKey, usuario);
    } else {
      sessionStorage.removeItem(sessionKey);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setDraft({
      ...emptyDraft,
      fecha: fechaInicialModal,
      id_punto_venta: puntoVentaTrabajo || puntosVentaAsignados[0]?.id_punto_venta || "",
      id_forma_pago: formasPago[0]?.id_forma_pago || "",
    });
    setModalOpen(true);
  };

  const abrirEdicion = (row) => {
    if (Number(row.registrado) !== 1) return;
    setEditando(row);
    setDraft({
      fecha: String(row.fecha || "").slice(0, 16),
      id_punto_venta: row.id_punto_venta || "",
      id_motivo: row.id_motivo || "",
      descripcion: row.descripcion || "",
      importe: row.importe || "",
      id_forma_pago: row.id_forma_pago || "",
      nro_operacion: row.nro_operacion || "",
      beneficiario: row.beneficiario || "",
      documento_beneficiario: row.documento_beneficiario || "",
    });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    if (guardandoRef.current) return;
    setModalOpen(false);
    setEditando(null);
  };

  const validarDraft = () => {
    if (!draft.fecha || !draft.id_punto_venta || !draft.id_motivo || !draft.id_forma_pago) {
      return "Completa fecha, punto, motivo y forma de pago.";
    }
    if (Number(draft.importe) <= 0) {
      return "El importe debe ser mayor a cero.";
    }
    return "";
  };

  const guardarCajaMovimiento = async () => {
    if (guardandoRef.current) return;
    const error = validarDraft();
    if (error) {
      swal2.fire({ title: "Revisa la salida", text: error, icon: "warning", confirmButtonText: "ACEPTAR" });
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);
    const payload = {
      ...draft,
      tipo_movimiento: "S",
      id_usuario: params.id_anfitrion,
      id_anfitrion: params.id_anfitrion,
      id_invitado: params.id_invitado,
      documento_id: contabilidadTrabajo,
      periodo: periodoTrabajo,
      importe: Number(draft.importe),
    };

    try {
      const url = editando
        ? `${back_host}/mve_transcaja/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${editando.id_movimiento}`
        : `${back_host}/mve_transcaja`;
      const response = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo guardar la salida.");
      }

      setModalOpen(false);
      setEditando(null);
      cargarCaja();
    } catch (err) {
      swal2.fire({ title: "No se pudo guardar", text: err.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  const anularCajaMovimiento = async (row) => {
    const result = await confirmDialog({
      title: "Anular salida?",
      message: "Desea anular esta salida de dinero?",
      icon: "warning",
      confirmText: "ANULAR",
      cancelText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${back_host}/mve_transcaja/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${row.id_movimiento}/anular?id_invitado=${encodeURIComponent(params.id_invitado)}`, {
        method: "PATCH",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "No se pudo anular la salida.");
      cargarCaja();
    } catch (err) {
      swal2.fire({ title: "No se pudo anular", text: err.message || "Error interno.", icon: "error", confirmButtonText: "ACEPTAR" });
    }
  };

  const mostrarUsuarioEnSalidas = usuarioPuedeVerTodosCorreos && !usuarioTrabajo;
  const columns = [
    {
      name: "Fecha",
      selector: (row) => String(row.fecha || "").slice(0, 16).replace("T", " "),
      sortable: true,
      width: "142px",
    },
    {
      name: "Motivo",
      selector: (row) => row.motivo_nombre || row.id_motivo,
      sortable: true,
      grow: 1.1,
    },
    {
      name: "Descripcion",
      selector: (row) => row.descripcion || "-",
      grow: 1.5,
    },
    ...(mostrarUsuarioEnSalidas ? [{
      name: "Usuario",
      selector: (row) => row.id_invitado || "-",
      sortable: true,
      grow: 1.1,
    }] : []),
    {
      name: "Importe",
      selector: (row) => money(row.importe),
      right: true,
      sortable: true,
      width: "118px",
    },
    {
      name: "Estado",
      cell: (row) => (
        <Box sx={{ px: 0.9, py: 0.35, borderRadius: palette.radius.control, color: Number(row.registrado) === 1 ? palette.success : palette.danger, backgroundColor: Number(row.registrado) === 1 ? palette.successSoft : palette.dangerSoft, fontSize: "11px", fontWeight: 900 }}>
          {Number(row.registrado) === 1 ? "ACTIVO" : "ANULADO"}
        </Box>
      ),
      width: "104px",
    },
    {
      name: "Acciones",
      cell: (row) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton size="small" disabled={Number(row.registrado) !== 1} onClick={() => abrirEdicion(row)} sx={{ color: palette.accent }}>
            <Edit3 size={16} />
          </IconButton>
          <IconButton size="small" disabled={Number(row.registrado) !== 1} onClick={() => anularCajaMovimiento(row)} sx={{ color: palette.danger }}>
            <Trash2 size={16} />
          </IconButton>
        </Box>
      ),
      width: "104px",
      ignoreRowClick: true,
    },
  ];

  const customStyles = {
    table: { style: { backgroundColor: "transparent" } },
    headRow: { style: { backgroundColor: palette.surface, borderBottomColor: palette.border, minHeight: "42px" } },
    headCells: { style: { color: palette.muted, fontSize: "11px", fontWeight: 800, textTransform: "uppercase" } },
    rows: { style: { backgroundColor: "transparent", borderBottomColor: palette.borderSoft, minHeight: "52px" } },
    cells: { style: { color: palette.text, fontSize: "12.5px" } },
    pagination: { style: { backgroundColor: "transparent", color: palette.muted, borderTopColor: palette.border } },
  };

  return (
    <Box sx={{ minHeight: "100%", backgroundColor: "transparent", p: { xs: 1, md: 4 } }}>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <TrHeader
          titulo="Salidas de dinero"
          contador={dataFiltrada.length}
          contadorTexto="salidas registradas"
          nuevoTexto="Nueva salida"
          buscarTexto="Buscar salida..."
          valorBusqueda={valorBusqueda}
          nuevoDeshabilitado={!puntoVentaTrabajo && puntosVentaAsignados.length === 0}
          onNuevo={abrirNuevo}
          onBuscar={(event) => setValorBusqueda(event.target.value)}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(160px, 220px))" }, justifyContent: { md: "start" }, gap: 1, mb: 1.5 }}>
          <ResumenCard
            label="INGRESOS"
            value={money(resumen.total_ingresos)}
            tone="success"
            onClick={abrirDetalleIngresos}
            hideActionIcon
            watermark="VER DETALLES"
            watermarkIcon={<Search size={46} />}
          />
          <ResumenCard label="SALIDAS" value={money(resumen.total_salidas)} tone="danger" />
          <ResumenCard
            label="NETO"
            value={money(resumen.neto)}
            tone={Number(resumen.neto) >= 0 ? "success" : "danger"}
            onClick={imprimirCierreCaja}
            hideActionIcon
            watermark="IMPRIMIR CIERRE"
            watermarkIcon={<Printer size={46} />}
          />
        </Box>

        <TrFiltros
          periodoTrabajo={periodoTrabajo}
          periodoSelect={periodoSelect}
          contabilidadTrabajo={contabilidadTrabajo}
          contabilidadSelect={contabilidadSelect}
          puntosVentaAsignados={puntosVentaAsignados}
          puntoVentaTrabajo={puntoVentaTrabajo}
          onPeriodoSelect={handlePeriodoSelect}
          onContabilidadSelect={handleContabilidadSelect}
          onPuntoVentaSelect={handlePuntoVentaSelect}
          filtroDerechaPuntoVenta={usuarioPuedeVerTodosCorreos && usuariosTrabajo.length > 0 ? (
            <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%" }}>
              <TrHeaderMenuPicker
                label="Usuario"
                value={usuarioTrabajo}
                displayValue={
                  usuarioTrabajo
                    ? usuariosTrabajo.find((item) => item.id_usuario === usuarioTrabajo)?.nombre || usuarioTrabajo
                    : "Todos"
                }
                minWidth="100%"
                options={[
                  { value: "", label: "Todos" },
                  ...usuariosTrabajo.map((item) => ({ value: item.id_usuario, label: item.nombre || item.id_usuario })),
                ]}
                onSelect={handleUsuarioSelect}
              />
            </Box>
          ) : null}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 260px) minmax(220px, 260px)" }, gap: 1, mb: 1.25 }}>
          <TrHeaderMenuPicker
            label="Motivo"
            value={motivoFiltro}
            displayValue={motivos.find((item) => item.id_motivo === motivoFiltro)?.nombre || "Todos"}
            minWidth="100%"
            options={[{ value: "", label: "Todos" }, ...motivos.map((item) => ({ value: item.id_motivo, label: item.nombre }))]}
            onSelect={setMotivoFiltro}
          />
          <TrHeaderMenuPicker
            label="Forma de pago"
            value={formaPagoFiltro}
            displayValue={formasPago.find((item) => item.id_forma_pago === formaPagoFiltro)?.nombre || "Todas"}
            minWidth="100%"
            options={[{ value: "", label: "Todas" }, ...formasPago.map((item) => ({ value: item.id_forma_pago, label: item.nombre }))]}
            onSelect={setFormaPagoFiltro}
          />
        </Box>

        <DaySelector
          period={periodoTrabajo || params.periodo}
          onDaySelect={(day) => {
            setDiaSel(day === "*" ? "*" : String(day).padStart(2, "0"));
            setUsuarioTrabajo("");
          }}
        />

        <DataTable
          theme="transportesDark"
          columns={columns}
          data={dataFiltrada}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          highlightOnHover
          responsive
          customStyles={customStyles}
          noDataComponent={
            <Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}>
              <Search size={16} />
              Sin salidas para el filtro actual
            </Box>
          }
        />

        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, color: palette.muted, fontSize: "12px" }}>
          <WalletCards size={14} />
          Salidas manuales registradas en mve_transcaja.
        </Box>
      </Box>

      <TrCajaMovimientoModal
        open={modalOpen}
        draft={draft}
        setDraft={setDraft}
        motivos={motivos}
        formasPago={formasPago}
        puntosVenta={puntosVentaAsignados}
        guardando={guardando}
        esEdicion={Boolean(editando)}
        onClose={cerrarModal}
        onSubmit={guardarCajaMovimiento}
      />

      <IngresosModal
        open={ingresosModalOpen}
        ingresos={ingresosDetalle}
        loading={loadingIngresos}
        onClose={() => setIngresosModalOpen(false)}
      />
    </Box>
  );
}
