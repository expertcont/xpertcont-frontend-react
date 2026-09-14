import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable, { createTheme } from "react-data-table-component";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, InputBase, MenuItem, Select, Typography } from "@mui/material";
import { Edit3, Search, Trash2, WalletCards, X } from "lucide-react";
import swal2 from "sweetalert2";

import DaySelector from "../../AdminDias";
import { useDialog } from "../../AdminConfirmDialogProvider";
import palette from "../../../../theme/palette";
import AppButton from "../../../ui/AppButton";
import TrHeader from "../common/components/TrHeader";
import TrFiltros from "../common/components/TrFiltros";
import TrHeaderMenuPicker from "../common/components/TrHeaderMenuPicker";
import useTrCatalogos from "../common/hooks/useTrCatalogos";

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

function ResumenCard({ label, value, tone }) {
  const color = tone === "danger" ? palette.danger : tone === "success" ? palette.success : palette.accent;
  return (
    <Box sx={{ p: 1.5, minHeight: 78, borderRadius: palette.radius.listCard, border: `1px solid ${palette.border}`, backgroundColor: palette.surface }}>
      <Typography sx={{ color: palette.muted, fontSize: "11px", fontWeight: 800 }}>{label}</Typography>
      <Typography sx={{ color, fontWeight: 900, fontSize: "21px", lineHeight: 1.25, mt: 0.8 }}>
        {value}
      </Typography>
    </Box>
  );
}

function SalidaModal({
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

export default function TrCajaSalidasList() {
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
  const [resumen, setResumen] = useState({ total_ingresos: 0, total_salidas: 0, neto: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [guardando, setGuardando] = useState(false);
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

  const armarQuery = useCallback(() => {
    const query = new URLSearchParams();
    query.set("tipo_movimiento", "S");
    query.set("id_invitado", params.id_invitado);
    if (puntoVentaTrabajo) query.set("id_punto_venta", puntoVentaTrabajo);
    if (fechaFiltro) {
      query.set("fecha_desde", fechaFiltro);
      query.set("fecha_hasta", fechaFiltro);
    }
    if (motivoFiltro) query.set("id_motivo", motivoFiltro);
    if (formaPagoFiltro) query.set("id_forma_pago", formaPagoFiltro);
    return query.toString();
  }, [fechaFiltro, formaPagoFiltro, motivoFiltro, params.id_invitado, puntoVentaTrabajo]);

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
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [movimientos, valorBusqueda]);

  const handlePeriodoSelect = (periodo) => {
    setPeriodoTrabajo(periodo);
    sessionStorage.setItem("periodo_trabajo", periodo);
    setDiaSel("*");
  };

  const handleContabilidadSelect = (documentoId) => {
    if (documentoId === contabilidadTrabajo) return;
    setContabilidadTrabajo(documentoId);
    setPuntosVentaAsignados([]);
    setPuntoVentaTrabajo("");
    setMotivoFiltro("");
    sessionStorage.setItem("contabilidad_trabajo", documentoId);
    navigate(`/ad_transportecaja/${params.id_anfitrion}/${params.id_invitado}/${periodoTrabajo}/${documentoId}`);
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

  const guardarSalida = async () => {
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

  const anularSalida = async (row) => {
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
    {
      name: "Beneficiario",
      selector: (row) => row.beneficiario || "-",
      grow: 1,
    },
    {
      name: "Forma pago",
      selector: (row) => row.forma_pago_nombre || row.id_forma_pago,
      grow: 0.9,
    },
    {
      name: "Operacion",
      selector: (row) => row.nro_operacion || "-",
      grow: 0.8,
    },
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
          <IconButton size="small" disabled={Number(row.registrado) !== 1} onClick={() => anularSalida(row)} sx={{ color: palette.danger }}>
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

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1, mb: 1.5 }}>
          <ResumenCard label="INGRESOS" value={money(resumen.total_ingresos)} tone="success" />
          <ResumenCard label="SALIDAS" value={money(resumen.total_salidas)} tone="danger" />
          <ResumenCard label="NETO" value={money(resumen.neto)} tone={Number(resumen.neto) >= 0 ? "success" : "danger"} />
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
          onPuntoVentaSelect={setPuntoVentaTrabajo}
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

        <DaySelector period={periodoTrabajo || params.periodo} onDaySelect={(day) => setDiaSel(day === "*" ? "*" : String(day).padStart(2, "0"))} />

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

      <SalidaModal
        open={modalOpen}
        draft={draft}
        setDraft={setDraft}
        motivos={motivos}
        formasPago={formasPago}
        puntosVenta={puntosVentaAsignados}
        guardando={guardando}
        esEdicion={Boolean(editando)}
        onClose={cerrarModal}
        onSubmit={guardarSalida}
      />
    </Box>
  );
}
