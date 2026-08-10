import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Dialog, Grid, IconButton, InputBase, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Calendar, CheckCircle, ChevronDown, ChevronUp, FileText, FileSearch, MapPin, PackageSearch, Pencil, Phone, Plus, Save, Search, Trash2, UserRound, X } from "lucide-react";
import AppButton from "../../ui/AppButton";
import AppIconBox from "../../ui/AppIconBox";
import palette from "../../../theme/palette";
import {
  costoRecurso as calcularCostoRecurso,
  detalleRecurso as obtenerDetalleRecurso,
  getPresupuestoDemo,
  resumenTributarioServicio as calcularResumenTributarioServicio,
  subtotalPresupuesto as calcularSubtotalPresupuesto,
  totalCosteadoTrabajo as calcularTotalCosteadoTrabajo,
  presupuestoNuevoDemo,
  totalRecursosTrabajo as calcularTotalRecursosTrabajo,
  totalPresupuesto as calcularTotalPresupuesto,
  totalTrabajo as calcularTotalTrabajo,
  utilidadTrabajo as calcularUtilidadTrabajo,
} from "./AdminVentaPresupuestoDemoData";
import createPresupuestoPdf from "./AdminVentaPresupuestoPdf";
import ProductoSelectorModal from "./modals/ProductoSelectorModal";
import TrabajoFormModal from "./modals/TrabajoFormModal";

const fieldSx = {
  height: 42,
  px: 1.5,
  display: "flex",
  alignItems: "center",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  color: palette.text,
  fontSize: "13px",
};

const headerFieldSx = {
  ...fieldSx,
  height: { xs: 38, md: 42 },
};

const headerInputSx = {
  color: palette.text,
  fontSize: "13px",
  width: "100%",
  "& input::placeholder": {
    color: palette.muted,
    opacity: 1,
  },
};

const compactNumberFieldSx = {
  ...fieldSx,
  gap: 0.75,
  px: 1,
};

function DemoField({ label, children, compactMobile = false }) {
  return (
    <Box>
      <Typography
        sx={{
          color: palette.muted,
          display: compactMobile ? { xs: "none", md: "block" } : "block",
          fontSize: "11px",
          mb: 0.75,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function HeaderInlineLabel({ children }) {
  return (
    <Typography
      component="span"
      sx={{
        color: palette.muted,
        fontSize: "10px",
        fontWeight: 800,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        mr: 1,
      }}
    >
      {children}
    </Typography>
  );
}

function NumberStepperInput({ value, onChange, min = 0, step = 1, placeholder = "0", minWidth = 96, suffix = "" }) {
  const updateValue = (delta) => {
    const current = Number(value || 0);
    const precision = String(step).includes(".") ? String(step).split(".")[1].length : 0;
    const next = Math.max(min, current + delta);
    const formatted = precision > 0 ? next.toFixed(precision).replace(/\.?0+$/, "") : String(next);
    onChange(formatted);
  };

  const buttonSx = {
    height: 20,
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
        ...compactNumberFieldSx,
        p: 0,
        width: "100%",
        minWidth: { md: minWidth },
        overflow: "hidden",
        backgroundColor: palette.surface,
        borderColor: palette.borderSoft,
      }}
    >
      <InputBase
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          color: palette.text,
          fontSize: "14px",
          fontWeight: 800,
          flex: 1,
          minWidth: 0,
          px: 0.75,
          "& input": {
            textAlign: "right",
            MozAppearance: "textfield",
          },
          "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
            WebkitAppearance: "none",
            margin: 0,
          },
        }}
      />
      {suffix && (
        <Typography sx={{ color: palette.muted, fontSize: "12px", fontWeight: 800, pr: 0.5 }}>
          {suffix}
        </Typography>
      )}
      <Box
        sx={{
          width: 28,
          alignSelf: "stretch",
          display: "grid",
          gridTemplateRows: "1fr 1fr",
          borderLeft: `1px solid ${palette.border}`,
          backgroundColor: palette.bg,
        }}
      >
        <Box onClick={() => updateValue(step)} sx={{ ...buttonSx, borderBottom: `1px solid ${palette.borderSoft}` }}>
          <ChevronUp size={15} />
        </Box>
        <Box onClick={() => updateValue(-step)} sx={buttonSx}>
          <ChevronDown size={15} />
        </Box>
      </Box>
    </Box>
  );
}

function Money({ value }) {
  return Number(value || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const costoRecurso = (recurso) => {
  if (recurso.tipo === "MANO_OBRA" || recurso.tipo === "OPERARIO") {
    return calcularCostoRecurso(recurso);
  }
  if (recurso.tipo === "SERVICIO") {
    return calcularCostoRecurso(recurso);
  }
  return calcularCostoRecurso(recurso);
};

const detalleRecurso = (recurso) => {
  return obtenerDetalleRecurso(recurso, (value) => Money({ value }));
};

const totalRecursosTrabajo = (trabajo) => calcularTotalRecursosTrabajo(trabajo);

const utilidadTrabajo = (trabajo) => calcularUtilidadTrabajo(trabajo);

const totalCosteadoTrabajo = (trabajo) => calcularTotalCosteadoTrabajo(trabajo);

const totalTrabajo = (trabajo) => calcularTotalTrabajo(trabajo);

const normalizarTextoBusqueda = (value = "") => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim()
  .toUpperCase();

const textoProductoTipo = (producto) => producto.descripcion_busqueda || normalizarTextoBusqueda(producto.descripcion);

const inferirTipoProducto = (producto) => {
  const texto = textoProductoTipo(producto);
  if (texto.includes("OPERARIO")) {
    return "OPERARIO";
  }
  if (texto.includes("SERVICIO")) {
    return "SERVICIO";
  }
  return "MATERIAL";
};

const parseAuxiliarProducto = (auxiliar = "") => {
  const [precioCompra = 0, contUnd = "", porcIgv = "", idAnfitrion = "", documentoId = ""] = String(auxiliar).split("-");
  return {
    precio_compra: Number(precioCompra || 0),
    cont_und: contUnd,
    porc_igv: porcIgv,
    id_anfitrion: idAnfitrion,
    documento_id: documentoId,
  };
};

const normalizarProductoApi = (producto) => ({
  ...parseAuxiliarProducto(producto.auxiliar),
  codigo: producto.codigo || producto.id_producto || "",
  descripcion: producto.descripcion || producto.nombre || "",
  descripcion_busqueda: normalizarTextoBusqueda(producto.descripcion || producto.nombre || ""),
  auxiliar: producto.auxiliar || "",
  tipo: String(producto.tipo || inferirTipoProducto(producto)).trim().toUpperCase(),
});

const extraerRegistrosProductoApi = (data) => {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  if (Array.isArray(data?.rows)) {
    return data.rows;
  }
  if (Array.isArray(data?.recordset)) {
    return data.recordset;
  }
  if (Array.isArray(data?.productos)) {
    return data.productos;
  }
  if (Array.isArray(data?.data?.rows)) {
    return data.data.rows;
  }
  return [];
};

const filtrarProductosCatalogo = (catalogo, tipoRecurso, busqueda) => {
  const tipoFiltro = normalizarTextoBusqueda(tipoRecurso);
  const busquedaNormalizada = normalizarTextoBusqueda(busqueda);

  return catalogo.filter(producto => {
    const descripcion = textoProductoTipo(producto);
    const textoFila = normalizarTextoBusqueda(`${producto.codigo} ${producto.descripcion} ${producto.tipo} ${producto.cont_und}`);
    let coincideTipo = true;

    if (tipoFiltro === "MATERIAL") {
      coincideTipo = !descripcion.includes("OPERARIO") && !descripcion.includes("SERVICIO");
    } else if (tipoFiltro === "OPERARIO" || tipoFiltro === "SERVICIO") {
      coincideTipo = descripcion.includes(tipoFiltro);
    }

    const coincideBusqueda = !busquedaNormalizada || textoFila.includes(busquedaNormalizada);
    return coincideTipo && coincideBusqueda;
  });
};

const numeroPresupuesto = (presupuesto) => [
  presupuesto.r_cod,
  presupuesto.r_serie,
  presupuesto.r_numero,
].filter(Boolean).join("-");

const completarResumenServicio = (trabajo, r_moneda) => ({
  ...trabajo,
  ...calcularResumenTributarioServicio(trabajo, r_moneda),
});

const normalizarFechaInput = (value) => String(value || "").slice(0, 10);

const normalizarDetalleApi = (detalle) => ({
  ...detalle,
  id: detalle.item,
  tipo: inferirTipoProducto(detalle),
});

const normalizarServicioApi = (servicio, r_moneda) => completarResumenServicio({
  ...servicio,
  id: servicio.servicio,
  materiales: (servicio.detalles || []).map(normalizarDetalleApi),
}, r_moneda);

export default function AdminVentaPresupuestoNuevoForm() {
  const navigate = useNavigate();
  const params = useParams();
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const editando = Boolean(params.comprobante);
  const presupuestoInicial = getPresupuestoDemo(params.comprobante) || presupuestoNuevoDemo;
  const [presupuesto, setPresupuesto] = useState({
    ...presupuestoInicial,
    r_cod: presupuestoInicial.r_cod === "NP" ? "NV" : presupuestoInicial.r_cod || "NV",
    r_serie: presupuestoInicial.r_serie || "0001",
    r_numero: params.comprobante || presupuestoInicial.r_numero || "",
    elemento: presupuestoInicial.elemento || 1,
    r_id_doc: presupuestoInicial.r_id_doc || "6",
    r_fecvcto: presupuestoInicial.r_fecvcto || presupuestoInicial.r_fecemi,
    r_tc: presupuestoInicial.r_tc || 1,
    estado: presupuestoInicial.estado || "P",
    r_moneda: presupuestoInicial.r_moneda || "PEN",
  });
  const [trabajoMateriales, setTrabajoMateriales] = useState(null);
  const [trabajoModalOpen, setTrabajoModalOpen] = useState(false);
  const [trabajoEditId, setTrabajoEditId] = useState(null);
  const [trabajoDraft, setTrabajoDraft] = useState({
    descripcion: "",
    especificacion: "",
    cantidad: 1,
    utilidad: 30,
    r_monto_total: 0,
  });
  const [recursoNuevo, setRecursoNuevo] = useState({
    tipo: "MATERIAL",
    id_producto: "",
    descripcion: "",
    cantidad: 1,
    cont_und: "UND",
    precio_unitario: 0,
    precio_neto: 0,
    porc_igv: 18,
    horas: 1,
    largo: 1,
    ancho: 1,
    dias: 0,
  });
  const [recursoEditId, setRecursoEditId] = useState(null);
  const [productoModalOpen, setProductoModalOpen] = useState(false);
  const [productoBusqueda, setProductoBusqueda] = useState("");
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [productosListado, setProductosListado] = useState([]);
  const [productosCargando, setProductosCargando] = useState(false);
  const [productosError, setProductosError] = useState("");
  const [productoResetPagina, setProductoResetPagina] = useState(false);
  const [clienteBuscando, setClienteBuscando] = useState(false);
  const productoBusquedaRef = useRef(null);

  useEffect(() => {
    const cargarPresupuesto = async () => {
      try {
        const response = await fetch(`${back_host}/ad_presupuesto/full/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/NV/0001/${params.comprobante}/1`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "No se pudo cargar el presupuesto.");
        }

        const presupuestoApi = data.data;
        const rMoneda = presupuestoApi.r_moneda || "PEN";

        setPresupuesto(prev => ({
          ...prev,
          ...presupuestoApi,
          r_fecemi: normalizarFechaInput(presupuestoApi.r_fecemi),
          r_fecvcto: normalizarFechaInput(presupuestoApi.r_fecvcto || presupuestoApi.r_fecemi),
          r_cod: presupuestoApi.r_cod || "NV",
          r_serie: presupuestoApi.r_serie || "0001",
          r_numero: presupuestoApi.r_numero || params.comprobante || "",
          elemento: presupuestoApi.elemento || 1,
          r_id_doc: presupuestoApi.r_id_doc || "6",
          r_moneda: rMoneda,
          r_tc: presupuestoApi.r_tc || 1,
          estado: presupuestoApi.estado || "P",
          trabajos: (presupuestoApi.servicios || []).map(servicio => normalizarServicioApi(servicio, rMoneda)),
        }));
      } catch (error) {
        console.log("Error cargando presupuesto completo:", error);
      }
    };

    if (params.comprobante && params.periodo && params.id_anfitrion && params.documento_id) {
      cargarPresupuesto();
    }
  }, [back_host, params.comprobante, params.documento_id, params.id_anfitrion, params.periodo]);

  useEffect(() => {
    const cargarProductos = async () => {
      setProductosCargando(true);
      setProductosError("");

      try {
        const response = await fetch(`${back_host}/ad_productopopupalmacen/${params.id_anfitrion}/${params.documento_id}`);
        const data = await response.json();
        const registros = extraerRegistrosProductoApi(data);
        const productosNormalizados = registros.map(normalizarProductoApi);
        setProductosCatalogo(productosNormalizados);
      } catch (error) {
        console.log("Error cargando productos para presupuesto:", error);
        setProductosCatalogo([]);
        setProductosError("No se pudieron cargar los productos.");
      } finally {
        setProductosCargando(false);
      }
    };

    if (params.id_anfitrion && params.documento_id) {
      cargarProductos();
    }
  }, [back_host, params.documento_id, params.id_anfitrion]);

  useEffect(() => {
    if (!productoModalOpen) {
      return;
    }

    const timer = setTimeout(() => {
      productoBusquedaRef.current?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, [productoModalOpen]);

  useEffect(() => {
    setProductosListado(filtrarProductosCatalogo(productosCatalogo, recursoNuevo.tipo, productoBusqueda));
    setProductoResetPagina(prev => !prev);
  }, [productoBusqueda, productosCatalogo, recursoNuevo.tipo]);

  const subtotal = calcularSubtotalPresupuesto(presupuesto);
  const total = calcularTotalPresupuesto(presupuesto);
  const igv = total - subtotal;
  const esNotaVentaInterna = presupuesto.r_cod === "NV";
  const tipoPresupuesto = esNotaVentaInterna ? "Interno" : "Comprobante tributario";
  const presupuestoPendiente = (presupuesto.estado || "P") === "P";
  const estadoPresupuestoLabel = presupuestoPendiente ? "Pendiente" : "Cerrado";

  const handleCabeceraChange = (name, value) => {
    setPresupuesto(prev => ({
      ...prev,
      [name]: value,
      ...(name === "r_fecemi" ? { r_fecvcto: value } : {}),
    }));
  };

  const buscarClientePorDocumento = async () => {
    const documentoCliente = String(presupuesto.r_documento_id || "").trim();

    if (!documentoCliente) {
      alert("Ingresa un RUC/DNI para buscar.");
      return;
    }

    setClienteBuscando(true);

    try {
      const response = await fetch(`${back_host}/correntistagenera`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruc: documentoCliente }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo consultar el documento.");
      }

      setPresupuesto(prev => ({
        ...prev,
        r_id_doc: data.r_id_doc || prev.r_id_doc || "6",
        r_razon_social: data.nombre_o_razon_social || prev.r_razon_social || "",
        r_direccion: data.direccion_completa || prev.r_direccion || "-",
      }));
    } catch (error) {
      console.log("Error buscando cliente:", error);
      alert(error.message || "No se pudo buscar el cliente.");
    } finally {
      setClienteBuscando(false);
    }
  };

  const createTrabajoDraft = (index) => ({
    descripcion: `SERVICIO ${String(index + 1).padStart(3, "0")}`,
    especificacion: "Detalle del trabajo, medidas y condiciones",
    cantidad: 1,
    utilidad: 30,
    r_monto_total: 0,
  });

  const handleOpenAddTrabajo = () => {
    setTrabajoEditId(null);
    setTrabajoDraft(createTrabajoDraft(presupuesto.trabajos.length));
    setTrabajoModalOpen(true);
  };

  const handleOpenEditTrabajo = (trabajo) => {
    setTrabajoEditId(trabajo.id);
    setTrabajoDraft({
      descripcion: trabajo.descripcion || "",
      especificacion: trabajo.especificacion || trabajo.descripcion || "",
      cantidad: trabajo.cantidad || 1,
      utilidad: trabajo.utilidad ?? trabajo.utilidad_pct ?? 30,
      r_monto_total: trabajo.r_monto_total || 0,
    });
    setTrabajoModalOpen(true);
  };

  const handleTrabajoDraftChange = (name, value) => {
    setTrabajoDraft(prev => ({ ...prev, [name]: value }));
  };

  const handleCloseTrabajoModal = () => {
    setTrabajoModalOpen(false);
    setTrabajoEditId(null);
  };

  const handleSaveTrabajo = async () => {
    const trabajoActual = presupuesto.trabajos.find(item => item.id === trabajoEditId);

    if (trabajoEditId && trabajoActual?.servicio) {
      const trabajoActualizado = completarResumenServicio({
        ...trabajoActual,
        descripcion: trabajoDraft.descripcion,
        especificacion: trabajoDraft.especificacion,
        cantidad: trabajoDraft.cantidad,
        utilidad: trabajoDraft.utilidad,
        r_monto_total: trabajoDraft.r_monto_total,
      }, presupuesto.r_moneda);

      const payload = {
        periodo: params.periodo,
        id_anfitrion: params.id_anfitrion,
        documento_id: params.documento_id,
        r_cod: presupuesto.r_cod || "NV",
        r_serie: presupuesto.r_serie || "0001",
        r_numero: presupuesto.r_numero,
        elemento: presupuesto.elemento || 1,
        servicio: trabajoActual.servicio,
        id_producto: trabajoActual.id_producto || null,
        descripcion: trabajoActualizado.descripcion,
        especificacion: trabajoActualizado.especificacion,
        cont_und: trabajoActualizado.cont_und || "ZZ",
        cantidad: Number(trabajoActualizado.cantidad || 0),
        precio_unitario: null,
        precio_neto: null,
        porc_igv: Number(trabajoActualizado.porc_igv || 18),
        utilidad: Number(trabajoActualizado.utilidad ?? trabajoActualizado.utilidad_pct ?? 0),
        r_monto_total: Number(trabajoActualizado.r_monto_total || 0),
        r_fecemi: presupuesto.r_fecemi,
        r_fecvcto: presupuesto.r_fecvcto || presupuesto.r_fecemi,
        r_moneda: presupuesto.r_moneda || "PEN",
        r_tc: Number(presupuesto.r_tc || 1),
        ctrl_mod_us: params.id_invitado,
      };

      try {
        const response = await fetch(`${back_host}/ad_presupuestoserv`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "No se pudo actualizar el servicio.");
        }

        setPresupuesto(prev => ({
          ...prev,
          trabajos: prev.trabajos.map(item => (
            item.id === trabajoEditId
              ? {
                ...item,
                ...data.data,
                id: item.id,
                materiales: item.materiales || [],
              }
              : item
          )),
        }));
        handleCloseTrabajoModal();
      } catch (error) {
        console.log("Error actualizando servicio de presupuesto:", error);
        alert(error.message || "No se pudo actualizar el servicio.");
      }
      return;
    }

    if (!trabajoEditId && presupuesto.r_numero) {
      try {
        const crearPayload = {
          id_anfitrion: params.id_anfitrion,
          documento_id: params.documento_id,
          periodo: params.periodo,
          r_cod: presupuesto.r_cod || "NV",
          r_serie: presupuesto.r_serie || "0001",
          r_numero: presupuesto.r_numero,
          elemento: presupuesto.elemento || 1,
          id_invitado: params.id_invitado,
          fecha: presupuesto.r_fecemi,
        };

        const crearResponse = await fetch(`${back_host}/ad_presupuestoserv`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(crearPayload),
        });
        const crearData = await crearResponse.json();

        if (!crearResponse.ok || !crearData.success) {
          throw new Error(crearData.message || "No se pudo crear el servicio.");
        }

        const trabajoCreado = completarResumenServicio({
          id: Date.now(),
          servicio: crearData.servicio,
          descripcion: trabajoDraft.descripcion,
          especificacion: trabajoDraft.especificacion,
          cantidad: trabajoDraft.cantidad,
          cont_und: "ZZ",
          r_monto_total: trabajoDraft.r_monto_total,
          utilidad: Number(trabajoDraft.utilidad || 0),
          materiales: [],
        }, presupuesto.r_moneda);

        const actualizarPayload = {
          periodo: params.periodo,
          id_anfitrion: params.id_anfitrion,
          documento_id: params.documento_id,
          r_cod: presupuesto.r_cod || "NV",
          r_serie: presupuesto.r_serie || "0001",
          r_numero: presupuesto.r_numero,
          elemento: presupuesto.elemento || 1,
          servicio: crearData.servicio,
          id_producto: null,
          descripcion: trabajoCreado.descripcion,
          especificacion: trabajoCreado.especificacion,
          cont_und: trabajoCreado.cont_und || "ZZ",
          cantidad: Number(trabajoCreado.cantidad || 0),
          precio_unitario: null,
          precio_neto: null,
          porc_igv: Number(trabajoCreado.porc_igv || 18),
          utilidad: Number(trabajoCreado.utilidad ?? trabajoDraft.utilidad ?? 30),
          r_monto_total: Number(trabajoCreado.r_monto_total || 0),
          r_fecemi: presupuesto.r_fecemi,
          r_fecvcto: presupuesto.r_fecvcto || presupuesto.r_fecemi,
          r_moneda: presupuesto.r_moneda || "PEN",
          r_tc: Number(presupuesto.r_tc || 1),
          ctrl_mod_us: params.id_invitado,
        };

        const actualizarResponse = await fetch(`${back_host}/ad_presupuestoserv`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(actualizarPayload),
        });
        const actualizarData = await actualizarResponse.json();

        if (!actualizarResponse.ok || !actualizarData.success) {
          throw new Error(actualizarData.message || "No se pudo actualizar el servicio creado.");
        }

        setPresupuesto(prev => ({
          ...prev,
          trabajos: [
            ...prev.trabajos,
            {
              ...trabajoCreado,
              ...actualizarData.data,
              id: trabajoCreado.id,
              materiales: [],
            },
          ],
        }));
        handleCloseTrabajoModal();
      } catch (error) {
        console.log("Error creando servicio de presupuesto:", error);
        alert(error.message || "No se pudo crear el servicio.");
      }
      return;
    }

    setPresupuesto(prev => ({
      ...prev,
      trabajos: trabajoEditId
        ? prev.trabajos.map(item => (
          item.id === trabajoEditId
            ? {
              ...item,
              descripcion: trabajoDraft.descripcion,
              especificacion: trabajoDraft.especificacion,
              cantidad: trabajoDraft.cantidad,
              utilidad: trabajoDraft.utilidad,
              r_monto_total: trabajoDraft.r_monto_total,
              ...completarResumenServicio({
                ...item,
                descripcion: trabajoDraft.descripcion,
                especificacion: trabajoDraft.especificacion,
                cantidad: trabajoDraft.cantidad,
                utilidad: trabajoDraft.utilidad,
                r_monto_total: trabajoDraft.r_monto_total,
              }, prev.r_moneda),
            }
            : item
        ))
        : [
          ...prev.trabajos,
          completarResumenServicio({
            id: Date.now(),
            servicio: prev.trabajos.length + 1,
            descripcion: trabajoDraft.descripcion,
            especificacion: trabajoDraft.especificacion,
            cantidad: trabajoDraft.cantidad,
            cont_und: "ZZ",
            r_monto_total: trabajoDraft.r_monto_total,
            utilidad: Number(trabajoDraft.utilidad || 0),
            materiales: [],
          }, prev.r_moneda),
        ],
    }));
    handleCloseTrabajoModal();
  };

  const handleDeleteTrabajo = async (id) => {
    const trabajo = presupuesto.trabajos.find(item => item.id === id);

    if (trabajo?.servicio && presupuesto.r_numero) {
      const confirmar = window.confirm(`Eliminar servicio ${trabajo.descripcion || trabajo.servicio}?`);
      if (!confirmar) {
        return;
      }

      try {
        const response = await fetch(`${back_host}/ad_presupuestoserv/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${presupuesto.r_cod || "NV"}/${presupuesto.r_serie || "0001"}/${presupuesto.r_numero}/${presupuesto.elemento || 1}/${trabajo.servicio}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "No se pudo eliminar el servicio.");
        }
      } catch (error) {
        console.log("Error eliminando servicio de presupuesto:", error);
        alert(error.message || "No se pudo eliminar el servicio.");
        return;
      }
    }

    setPresupuesto(prev => ({
      ...prev,
      trabajos: prev.trabajos.filter(item => item.id !== id),
    }));
  };

  const trabajoSeleccionado = useMemo(
    () => presupuesto.trabajos.find(item => item.id === trabajoMateriales?.id) || null,
    [presupuesto.trabajos, trabajoMateriales],
  );

  const handleRecursoNuevoChange = (name, value) => {
    setRecursoNuevo(prev => ({ ...prev, [name]: value }));
  };

  const resetRecursoNuevo = () => {
    setRecursoNuevo(prev => ({
      ...prev,
      id_producto: "",
      descripcion: "",
      cantidad: 1,
      precio_unitario: 0,
      precio_neto: 0,
      porc_igv: 18,
      horas: 1,
      largo: 1,
      ancho: 1,
      dias: 0,
    }));
    setRecursoEditId(null);
  };

  const handleAddRecurso = async () => {
    if (!trabajoSeleccionado || !recursoNuevo.descripcion) {
      return;
    }

    const precioNeto = costoRecurso(recursoNuevo);
    const utilidadDetalle = precioNeto * (Number(trabajoSeleccionado.utilidad ?? trabajoSeleccionado.utilidad_pct ?? 0) / 100);
    const recurso = {
      id: Date.now(),
      tipo: recursoNuevo.tipo,
      id_producto: recursoNuevo.id_producto || `${recursoNuevo.tipo.substring(0, 3)}-${Date.now().toString().slice(-4)}`,
      descripcion: recursoNuevo.descripcion,
      cantidad: recursoNuevo.cantidad,
      cont_und: recursoNuevo.cont_und,
      precio_unitario: recursoNuevo.precio_unitario,
      precio_neto: precioNeto,
      porc_igv: recursoNuevo.porc_igv,
      utilidad: utilidadDetalle,
      moneda: presupuesto.r_moneda,
    };

    if (recursoNuevo.tipo === "MANO_OBRA" || recursoNuevo.tipo === "OPERARIO") {
      recurso.horas = recursoNuevo.horas;
      recurso.dias = recursoNuevo.dias;
    } else if (recursoNuevo.tipo === "SERVICIO") {
      recurso.largo = recursoNuevo.largo;
      recurso.ancho = recursoNuevo.ancho;
      recurso.cont_und = "M2";
    }

    const recursoEditado = (trabajoSeleccionado.materiales || []).find(item => item.id === recursoEditId || item.item === recursoEditId);

    if (trabajoSeleccionado.servicio && recursoEditado?.item && presupuesto.r_numero) {
      const payload = {
        r_fecemi: presupuesto.r_fecemi,
        id_producto: recurso.id_producto,
        descripcion: recurso.descripcion,
        cantidad: Number(recurso.cantidad || 0),
        precio_unitario: Number(recurso.precio_unitario || 0),
        precio_neto: Number(recurso.precio_neto || 0),
        porc_igv: Number(recurso.porc_igv || 0),
        cont_und: recurso.cont_und,
        largo: recurso.largo ?? null,
        ancho: recurso.ancho ?? null,
        utilidad: Number(recurso.utilidad || 0),
        horas: recurso.horas ?? null,
        dias: recurso.dias ?? null,
      };

      try {
        const response = await fetch(`${back_host}/ad_presupuestoservdet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${presupuesto.r_cod || "NV"}/${presupuesto.r_serie || "0001"}/${presupuesto.r_numero}/${presupuesto.elemento || 1}/${trabajoSeleccionado.servicio}/${recursoEditado.item}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "No se pudo actualizar el detalle del servicio.");
        }

        setPresupuesto(prev => ({
          ...prev,
          trabajos: prev.trabajos.map(item => (
            item.id === trabajoSeleccionado.id
              ? completarResumenServicio({
                ...item,
                materiales: (item.materiales || []).map(detalle => (
                  detalle.id === recursoEditId || detalle.item === recursoEditId
                    ? {
                      ...detalle,
                      ...recurso,
                      ...data.data,
                      id: data.data?.item || detalle.id,
                      tipo: recurso.tipo,
                    }
                    : detalle
                )),
              }, prev.r_moneda)
              : item
          )),
        }));
        resetRecursoNuevo();
      } catch (error) {
        console.log("Error actualizando detalle de presupuesto:", error);
        alert(error.message || "No se pudo actualizar el detalle del servicio.");
      }
      return;
    }

    if (trabajoSeleccionado.servicio && presupuesto.r_numero) {
      const payload = {
        id_anfitrion: params.id_anfitrion,
        documento_id: params.documento_id,
        periodo: params.periodo,
        r_cod: presupuesto.r_cod || "NV",
        r_serie: presupuesto.r_serie || "0001",
        r_numero: presupuesto.r_numero,
        elemento: presupuesto.elemento || 1,
        servicio: trabajoSeleccionado.servicio,
        r_fecemi: presupuesto.r_fecemi,
        id_producto: recurso.id_producto,
        descripcion: recurso.descripcion,
        cantidad: Number(recurso.cantidad || 0),
        precio_unitario: Number(recurso.precio_unitario || 0),
        precio_neto: Number(recurso.precio_neto || 0),
        porc_igv: Number(recurso.porc_igv || 0),
        cont_und: recurso.cont_und,
        largo: recurso.largo ?? null,
        ancho: recurso.ancho ?? null,
        utilidad: Number(recurso.utilidad || 0),
        horas: recurso.horas ?? null,
        dias: recurso.dias ?? null,
      };

      try {
        const response = await fetch(`${back_host}/ad_presupuestoservdet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "No se pudo insertar el detalle del servicio.");
        }

        const detallesResponse = await fetch(`${back_host}/ad_presupuestoservdet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${presupuesto.r_cod || "NV"}/${presupuesto.r_serie || "0001"}/${presupuesto.r_numero}/${presupuesto.elemento || 1}/${trabajoSeleccionado.servicio}`);
        const detallesData = await detallesResponse.json();
        const detalles = Array.isArray(detallesData?.data) ? detallesData.data : [];
        const detalleInsertado = detalles[detalles.length - 1] || {};

        setPresupuesto(prev => ({
          ...prev,
          trabajos: prev.trabajos.map(item => (
            item.id === trabajoSeleccionado.id
              ? completarResumenServicio({
                ...item,
                materiales: [
                  ...(item.materiales || []),
                  {
                    ...recurso,
                    ...detalleInsertado,
                    id: detalleInsertado.item || recurso.id,
                    tipo: recurso.tipo,
                  },
                ],
              }, prev.r_moneda)
              : item
          )),
        }));
        resetRecursoNuevo();
      } catch (error) {
        console.log("Error insertando detalle de presupuesto:", error);
        alert(error.message || "No se pudo insertar el detalle del servicio.");
      }
      return;
    }

    setPresupuesto(prev => ({
      ...prev,
      trabajos: prev.trabajos.map(item => (
        item.id === trabajoSeleccionado.id
          ? completarResumenServicio({ ...item, materiales: [...(item.materiales || []), recurso] }, prev.r_moneda)
          : item
      )),
    }));

    resetRecursoNuevo();
  };

  const productosResumen = useMemo(() => ({
    total: productosCatalogo.length,
    operario: productosCatalogo.filter(producto => producto.descripcion_busqueda.includes("OPERARIO")).length,
    servicio: productosCatalogo.filter(producto => producto.descripcion_busqueda.includes("SERVICIO")).length,
    mostrados: productosListado.length,
  }), [productosCatalogo, productosListado.length]);

  const handleOpenProductoModal = () => {
    setProductoBusqueda("");
    setProductoResetPagina(prev => !prev);
    setProductoModalOpen(true);
  };

  const handleSelectProducto = (producto) => {
    setRecursoNuevo(prev => {
      const next = {
        ...prev,
        id_producto: producto.codigo,
        descripcion: producto.descripcion,
        cont_und: producto.tipo === "SERVICIO" ? "M2" : producto.cont_und || prev.cont_und,
        precio_unitario: producto.precio_compra,
      };

      return next;
    });
    setProductoModalOpen(false);
  };

  const handleOpenEditRecurso = (recurso) => {
    setRecursoEditId(recurso.item || recurso.id);
    setRecursoNuevo({
      tipo: recurso.tipo || inferirTipoProducto(recurso),
      id_producto: recurso.id_producto || recurso.codigo || "",
      descripcion: recurso.descripcion || "",
      cantidad: recurso.cantidad || 1,
      cont_und: recurso.cont_und || recurso.unidad || "UND",
      precio_unitario: recurso.precio_unitario || 0,
      precio_neto: recurso.precio_neto || 0,
      porc_igv: recurso.porc_igv ?? 18,
      horas: recurso.horas || 1,
      largo: recurso.largo || 1,
      ancho: recurso.ancho || 1,
      dias: recurso.dias || 0,
    });
  };

  const handleDeleteRecurso = async (idRecurso) => {
    if (!trabajoSeleccionado) {
      return;
    }

    const recurso = (trabajoSeleccionado.materiales || []).find(item => item.id === idRecurso || item.item === idRecurso);

    if (trabajoSeleccionado.servicio && recurso?.item && presupuesto.r_numero) {
      try {
        const response = await fetch(`${back_host}/ad_presupuestoservdet/${params.periodo}/${params.id_anfitrion}/${params.documento_id}/${presupuesto.r_cod || "NV"}/${presupuesto.r_serie || "0001"}/${presupuesto.r_numero}/${presupuesto.elemento || 1}/${trabajoSeleccionado.servicio}/${recurso.item}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "No se pudo eliminar el detalle del servicio.");
        }
      } catch (error) {
        console.log("Error eliminando detalle de presupuesto:", error);
        alert(error.message || "No se pudo eliminar el detalle del servicio.");
        return;
      }
    }

    setPresupuesto(prev => ({
      ...prev,
      trabajos: prev.trabajos.map(item => (
        item.id === trabajoSeleccionado.id
          ? completarResumenServicio({
            ...item,
            materiales: (item.materiales || []).filter(detalle => detalle.id !== idRecurso && detalle.item !== idRecurso),
          }, prev.r_moneda)
          : item
      )),
    }));
  };

  const handleSavePresupuesto = async () => {
    if (!presupuesto.r_numero) {
      alert("Primero genera el presupuesto antes de grabar cambios.");
      return;
    }

    const payload = crearPayloadPresupuesto();

    try {
      const response = await fetch(`${back_host}/ad_presupuesto`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudo grabar el presupuesto.");
      }

      setPresupuesto(prev => ({
        ...prev,
        ...data.data,
        trabajos: prev.trabajos,
      }));
      alert("Presupuesto grabado correctamente.");
    } catch (error) {
      console.log("Error grabando presupuesto:", error);
      alert(error.message || "No se pudo grabar el presupuesto.");
    }
  };

  const crearPayloadPresupuesto = (overrides = {}) => ({
      periodo: params.periodo,
      id_anfitrion: params.id_anfitrion,
      documento_id: params.documento_id,
      r_cod: presupuesto.r_cod || "NV",
      r_serie: presupuesto.r_serie || "0001",
      r_numero: presupuesto.r_numero,
      elemento: presupuesto.elemento || 1,
      r_fecemi: presupuesto.r_fecemi,
      r_fecvcto: presupuesto.r_fecvcto || presupuesto.r_fecemi,
      r_id_doc: presupuesto.r_id_doc || "6",
      r_documento_id: presupuesto.r_documento_id,
      r_razon_social: presupuesto.r_razon_social,
      r_direccion: presupuesto.r_direccion,
      contacto_nombre: presupuesto.contacto_nombre,
      contacto_celular: presupuesto.contacto_celular,
      glosa: presupuesto.glosa,
      r_moneda: presupuesto.r_moneda || "PEN",
      r_tc: Number(presupuesto.r_tc || 1),
      r_forma_pago_id: presupuesto.r_forma_pago_id,
      estado: presupuesto.estado || "P",
      ctrl_mod_us: params.id_invitado,
      ...overrides,
  });

  const handleCerrarPresupuesto = async () => {
    if (!presupuesto.r_numero) {
      alert("Primero genera el presupuesto antes de cerrarlo.");
      return;
    }

    if ((presupuesto.estado || "P") !== "P") {
      alert("El presupuesto ya se encuentra cerrado.");
      return;
    }

    const confirmar = window.confirm("Cerrar presupuesto? Luego quedara marcado como cerrado.");
    if (!confirmar) {
      return;
    }

    const payload = crearPayloadPresupuesto({ estado: "C" });

    try {
      const response = await fetch(`${back_host}/ad_presupuesto`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudo cerrar el presupuesto.");
      }

      setPresupuesto(prev => ({
        ...prev,
        ...data.data,
        trabajos: prev.trabajos,
      }));
      alert("Presupuesto cerrado correctamente.");
    } catch (error) {
      console.log("Error cerrando presupuesto:", error);
      alert(error.message || "No se pudo cerrar el presupuesto.");
    }
  };

  const handleGenerarCpe = () => {
    alert("Pendiente: abrir flujo para generar Factura, Nota de Credito o Nota de Debito desde este presupuesto.");
  };

  const handlePrevioPdf = async () => {
    const url = await createPresupuestoPdf(presupuesto);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePdfCliente = async () => {
    const url = await createPresupuestoPdf(presupuesto, { modo: "cliente" });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const totalMateriales = (trabajoSeleccionado?.materiales || []).reduce(
    (acc, item) => acc + costoRecurso(item),
    0,
  );
  const porcentajeUtilidadTrabajo = Number(trabajoSeleccionado?.utilidad ?? trabajoSeleccionado?.utilidad_pct ?? 0);
  const montoUtilidadTrabajo = trabajoSeleccionado ? utilidadTrabajo(trabajoSeleccionado) : 0;
  const totalCosteadoTrabajoSeleccionado = trabajoSeleccionado ? totalCosteadoTrabajo(trabajoSeleccionado) : 0;
  const resumenTrabajoDraft = calcularResumenTributarioServicio({
    ...trabajoDraft,
    materiales: [],
  }, presupuesto.r_moneda);
  const costoRecursoNuevo = costoRecurso(recursoNuevo);
  const textoGuiaRecurso = {
    MATERIAL: "Cantidad x costo unitario",
    OPERARIO: "Horas x costo por hora",
    SERVICIO: "Largo x ancho x costo por m2",
  }[recursoNuevo.tipo];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: palette.bg,
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              onClick={() => navigate(`/ad_ventapresupuesto/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}`)}
              title="Anterior"
              sx={{
                color: palette.muted,
                border: `1px solid ${palette.border}`,
                backgroundColor: palette.surface,
                width: 36,
                height: 36,
              }}
            >
              <ArrowLeft size={18} />
            </IconButton>
            <AppIconBox>
              <FileText size={16} />
            </AppIconBox>
            <Box>
              <Typography sx={{ color: palette.text, fontWeight: 700, fontSize: "22px", lineHeight: 1.2 }}>
                Presupuesto
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
                <Typography sx={{ color: palette.muted, fontSize: "13px" }}>
                  {editando ? `${numeroPresupuesto(presupuesto)} · ${tipoPresupuesto}` : tipoPresupuesto}
                </Typography>
                <Box
                  sx={{
                    px: 1,
                    py: 0.35,
                    borderRadius: 1.5,
                    border: `1px solid ${presupuestoPendiente ? palette.border : palette.accent}`,
                    backgroundColor: presupuestoPendiente ? palette.surfaceAlt : palette.accentSoft,
                    color: presupuestoPendiente ? palette.muted : palette.accent,
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  {estadoPresupuestoLabel}
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: { xs: "flex-end", md: "flex-start" } }}>
            <AppButton icon={<Save size={17} />} onClick={handleSavePresupuesto}>
              Grabar Presupuesto
            </AppButton>
            {presupuestoPendiente && (
              <AppButton icon={<CheckCircle size={17} />} onClick={handleCerrarPresupuesto}>
                Cerrar presupuesto
              </AppButton>
            )}
            {esNotaVentaInterna && (
              <AppButton icon={<FileText size={17} />} onClick={handleGenerarCpe}>
                Generar CPE
              </AppButton>
            )}
            <IconButton
              onClick={handlePrevioPdf}
              title="Previo PDF"
              sx={{
                color: palette.muted,
                border: `1px solid ${palette.border}`,
                backgroundColor: palette.surface,
                width: 38,
                height: 38,
                "&:hover": { color: palette.accent, backgroundColor: palette.accentSoft },
              }}
            >
              <FileSearch size={18} />
            </IconButton>
            <IconButton
              onClick={handlePdfCliente}
              title="PDF cliente"
              sx={{
                color: palette.muted,
                border: `1px solid ${palette.border}`,
                backgroundColor: palette.surface,
                width: 38,
                height: 38,
                "&:hover": { color: palette.accent, backgroundColor: palette.accentSoft },
              }}
            >
              <FileText size={18} />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
          }}
        >
          <Grid container spacing={{ xs: 1, md: 2 }}>
            <Grid item xs={12} md={3}>
              <Box sx={headerFieldSx}>
                <FileText size={15} color={palette.muted} />
                <HeaderInlineLabel>Numero</HeaderInlineLabel>
                <InputBase
                  placeholder="NP-0001-0000001"
                  value={numeroPresupuesto(presupuesto)}
                  readOnly
                  sx={{ ...headerInputSx, ml: 1, "& input": { cursor: "default" } }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={headerFieldSx}>
                <Calendar size={15} color={palette.muted} />
                <HeaderInlineLabel>Fecha</HeaderInlineLabel>
                <InputBase
                  type="date"
                  value={presupuesto.r_fecemi}
                  onChange={(e) => handleCabeceraChange("r_fecemi", e.target.value)}
                  sx={{ ...headerInputSx, ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Select
                fullWidth
                size="small"
                value={presupuesto.r_moneda}
                onChange={(e) => handleCabeceraChange("r_moneda", e.target.value)}
                renderValue={(value) => (
                  <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                    <HeaderInlineLabel>Moneda</HeaderInlineLabel>
                    {value}
                  </Box>
                )}
                sx={{ ...headerFieldSx, ".MuiSelect-select": { p: 0, display: "flex", alignItems: "center" }, ".MuiSelect-icon": { color: palette.muted } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: palette.surface, color: palette.text } } }}
              >
                <MenuItem value="PEN">Soles</MenuItem>
                <MenuItem value="USD">Dolares</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} md={3}>
              <Select
                fullWidth
                size="small"
                value={presupuesto.r_forma_pago_id}
                onChange={(e) => handleCabeceraChange("r_forma_pago_id", e.target.value)}
                renderValue={(value) => (
                  <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                    <HeaderInlineLabel>Pago</HeaderInlineLabel>
                    {value}
                  </Box>
                )}
                sx={{ ...headerFieldSx, ".MuiSelect-select": { p: 0, display: "flex", alignItems: "center" }, ".MuiSelect-icon": { color: palette.muted } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: palette.surface, color: palette.text } } }}
              >
                <MenuItem value="Contado">Contado</MenuItem>
                <MenuItem value="Credito">Credito</MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box sx={{ ...headerFieldSx, position: "relative", pr: 4.5 }}>
                <Building2 size={15} color={palette.muted} />
                <HeaderInlineLabel>Doc.</HeaderInlineLabel>
                <InputBase
                  placeholder="Documento cliente"
                  value={presupuesto.r_documento_id}
                  onChange={(e) => handleCabeceraChange("r_documento_id", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      buscarClientePorDocumento();
                    }
                  }}
                  sx={{ ...headerInputSx, ml: 1, pr: 0.5 }}
                />
                <Tooltip title="Buscar RUC/DNI">
                  <span>
                    <IconButton
                      size="small"
                      onClick={buscarClientePorDocumento}
                      disabled={clienteBuscando}
                      sx={{
                        color: palette.accent,
                        bgcolor: palette.accentSoft,
                        border: `1px solid ${palette.border}`,
                        position: "absolute",
                        top: "50%",
                        right: 6,
                        transform: "translateY(-50%)",
                        width: 32,
                        height: 32,
                        zIndex: 2,
                        "&:hover": {
                          color: palette.text,
                          bgcolor: palette.accent,
                        },
                      }}
                    >
                      <Search size={16} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={headerFieldSx}>
                <Building2 size={15} color={palette.muted} />
                <HeaderInlineLabel>Cliente</HeaderInlineLabel>
                <InputBase
                  placeholder="Cliente"
                  value={presupuesto.r_razon_social}
                  onChange={(e) => handleCabeceraChange("r_razon_social", e.target.value)}
                  sx={{ ...headerInputSx, ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={headerFieldSx}>
                <UserRound size={15} color={palette.muted} />
                <HeaderInlineLabel>Contacto</HeaderInlineLabel>
                <InputBase
                  placeholder="Contacto"
                  value={presupuesto.contacto_nombre}
                  onChange={(e) => handleCabeceraChange("contacto_nombre", e.target.value)}
                  sx={{ ...headerInputSx, ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={headerFieldSx}>
                <Phone size={15} color={palette.muted} />
                <HeaderInlineLabel>Celular</HeaderInlineLabel>
                <InputBase
                  placeholder="Celular"
                  value={presupuesto.contacto_celular}
                  onChange={(e) => handleCabeceraChange("contacto_celular", e.target.value)}
                  sx={{ ...headerInputSx, ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={headerFieldSx}>
                <MapPin size={15} color={palette.muted} />
                <HeaderInlineLabel>Direccion</HeaderInlineLabel>
                <InputBase
                  placeholder="Direccion"
                  value={presupuesto.r_direccion}
                  onChange={(e) => handleCabeceraChange("r_direccion", e.target.value)}
                  sx={{ ...headerInputSx, ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={headerFieldSx}>
                <HeaderInlineLabel>CampaÃ±a</HeaderInlineLabel>
                <InputBase
                  placeholder="CampaÃ±a"
                  value={presupuesto.glosa}
                  onChange={(e) => handleCabeceraChange("glosa", e.target.value)}
                  sx={headerInputSx}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 1.5 }}>
            <Typography sx={{ color: palette.text, fontWeight: 700, fontSize: "15px" }}>
              Trabajos
            </Typography>
            <AppButton icon={<Plus size={16} />} onClick={handleOpenAddTrabajo}>
              Agregar trabajo
            </AppButton>
          </Box>

          <Grid
            container
            spacing={1}
            sx={{
              display: { xs: "none", md: "flex" },
              color: palette.muted,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              pb: 0.75,
            }}
          >
            <Grid item md={1.6}>Producto</Grid>
            <Grid item md={5.2}>Especificacion</Grid>
            <Grid item md={1}>Cant. ref.</Grid>
            <Grid item md={1.4}>Costo interno</Grid>
            <Grid item md={1.4}>Total</Grid>
            <Grid item md={1.4}></Grid>
          </Grid>

          {presupuesto.trabajos.map((item) => {
            const resumenServicio = calcularResumenTributarioServicio(item, presupuesto.r_moneda);
            const totalDetallado = totalRecursosTrabajo(item);
            const tieneDetalle = (item.materiales || []).length > 0;

            return (
              <Grid
                container
                spacing={1}
                key={item.id}
                sx={{
                  py: 1,
                  borderTop: `1px solid ${palette.borderSoft}`,
                  alignItems: "center",
                }}
              >
                <Grid item xs={12} md={1.6}>
                  <Typography sx={{ color: palette.accent, fontSize: "13px", fontWeight: 800 }}>
                    {item.descripcion || `Servicio ${item.servicio || ""}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={5.2}>
                  <Typography
                    sx={{
                      color: palette.text,
                      fontSize: "13px",
                      lineHeight: 1.45,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.especificacion || "Sin especificacion"}
                  </Typography>
                </Grid>
                <Grid item xs={4} md={1}>
                  <Typography sx={{ color: palette.text, fontSize: "13px", textAlign: { xs: "left", md: "right" } }}>
                    {item.cantidad}
                  </Typography>
                </Grid>
                <Grid item xs={4} md={1.4}>
                  <Typography sx={{ color: palette.text, fontSize: "13px", textAlign: "right" }}>
                    {tieneDetalle ? Money({ value: totalDetallado }) : "-"}
                  </Typography>
                  {tieneDetalle && (
                    <Typography sx={{ color: palette.muted, fontSize: "11px", textAlign: "right", mt: 0.25 }}>
                      Antes de IGV
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={4} md={1.4}>
                  <Box sx={{ color: palette.accent, fontSize: "13px", fontWeight: 800, textAlign: "right" }}>
                    {Money({ value: resumenServicio.precio_neto })}
                  </Box>
                  {tieneDetalle && (
                    <Typography sx={{ color: palette.muted, fontSize: "11px", textAlign: "right", mt: 0.25 }}>
                      IGV {Money({ value: resumenServicio.igv })}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={1.4}>
                  <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, gap: 0.5 }}>
                    <IconButton onClick={() => handleOpenEditTrabajo(item)} sx={{ color: palette.muted }}>
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton onClick={() => setTrabajoMateriales(item)} sx={{ color: palette.muted }}>
                      <PackageSearch size={17} />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteTrabajo(item.id)} sx={{ color: palette.muted }}>
                      <Trash2 size={17} />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            );
          })}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Box sx={{ width: { xs: "100%", sm: 280 }, color: palette.text }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, color: palette.muted }}>
                <span>Subtotal</span>
                <span>{presupuesto.r_moneda} {Money({ value: subtotal })}</span>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, color: palette.muted }}>
                <span>IGV 18%</span>
                <span>{presupuesto.r_moneda} {Money({ value: igv })}</span>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 1,
                  pt: 1,
                  borderTop: `1px solid ${palette.border}`,
                  color: palette.accent,
                  fontSize: "18px",
                  fontWeight: 800,
                }}
              >
                <span>Total</span>
                <span>{presupuesto.r_moneda} {Money({ value: total })}</span>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <TrabajoFormModal
        open={trabajoModalOpen}
        editId={trabajoEditId}
        draft={trabajoDraft}
        moneda={presupuesto.r_moneda}
        summary={resumenTrabajoDraft}
        onClose={handleCloseTrabajoModal}
        onDraftChange={handleTrabajoDraftChange}
        NumberStepper={NumberStepperInput}
        onSave={handleSaveTrabajo}
      />

      <Dialog
        open={Boolean(trabajoSeleccionado)}
        onClose={() => setTrabajoMateriales(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            width: { md: 1080 },
            maxWidth: "calc(100% - 32px)",
            backgroundColor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: 3,
          },
        }}
      >
        <Box sx={{ p: 2.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
              <AppIconBox>
                <PackageSearch size={16} />
              </AppIconBox>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "17px" }}>
                  Materiales, operarios y servicios
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: "13px" }} noWrap>
                  {trabajoSeleccionado?.descripcion} - {trabajoSeleccionado?.especificacion || "Sin especificacion"}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setTrabajoMateriales(null)} sx={{ color: palette.muted }}>
              <X size={18} />
            </IconButton>
          </Box>

          <Grid container spacing={1.25} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  backgroundColor: palette.bg,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <Typography sx={{ color: palette.muted, fontSize: "11px", textTransform: "uppercase" }}>
                  Costo base
                </Typography>
                <Typography sx={{ color: palette.text, fontSize: "18px", fontWeight: 800, mt: 0.25 }}>
                  {presupuesto.r_moneda} {Money({ value: totalMateriales })}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  backgroundColor: palette.bg,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <Typography sx={{ color: palette.muted, fontSize: "11px", textTransform: "uppercase" }}>
                  Total trabajo sin IGV
                </Typography>
                <Typography
                  sx={{
                    color: palette.accent,
                    fontSize: "18px",
                    fontWeight: 800,
                    mt: 0.25,
                  }}
                >
                  {presupuesto.r_moneda} {Money({ value: totalCosteadoTrabajoSeleccionado })}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box
                sx={{
                  px: 1.25,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: totalMateriales > 0 ? "rgba(102,187,106,0.08)" : "rgba(255,138,101,0.08)",
                  border: `1px solid ${totalMateriales > 0 ? "rgba(102,187,106,0.35)" : "rgba(255,138,101,0.35)"}`,
                }}
              >
                <Typography sx={{ color: totalMateriales > 0 ? "#81c784" : "#ffab91", fontSize: "12px", fontWeight: 700 }}>
                  {totalMateriales > 0
                    ? ""
                    : "Falta costear detalles: agrega materiales, operarios o servicios para completar el proceso interno."}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 2,
              backgroundColor: palette.bg,
              border: `1px solid ${palette.border}`,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1.25, flexWrap: "wrap" }}>
              <Typography sx={{ color: palette.muted, fontSize: "12px", fontWeight: 700 }}>
                {textoGuiaRecurso}
              </Typography>
              <Typography sx={{ color: palette.accent, fontSize: "12px", fontWeight: 800 }}>
                Costo calculado: {presupuesto.r_moneda} {Money({ value: costoRecursoNuevo })}
              </Typography>
            </Box>
            <Grid container spacing={1} sx={{ alignItems: "center" }}>
              <Grid item xs={12} md={2}>
                <DemoField label="Tipo" compactMobile>
                <Select
                  fullWidth
                  size="small"
                  value={recursoNuevo.tipo}
                  onChange={(e) => {
                    handleRecursoNuevoChange("tipo", e.target.value);
                    setProductoBusqueda("");
                    setProductoResetPagina(prev => !prev);
                  }}
                  sx={{ ...fieldSx, ".MuiSelect-select": { p: 0 }, ".MuiSelect-icon": { color: palette.muted } }}
                  MenuProps={{ PaperProps: { sx: { bgcolor: palette.surface, color: palette.text } } }}
                >
                  <MenuItem value="MATERIAL">Material</MenuItem>
                  <MenuItem value="OPERARIO">Operario</MenuItem>
                  <MenuItem value="SERVICIO">Servicio</MenuItem>
                </Select>
                </DemoField>
              </Grid>
              <Grid item xs={12} md={1.6}>
                <DemoField label="Codigo" compactMobile>
                <Box onClick={handleOpenProductoModal} sx={{ ...fieldSx, cursor: "pointer" }}>
                  <Search size={15} color={palette.muted} />
                  <InputBase
                    placeholder="Codigo"
                    value={recursoNuevo.id_producto}
                    readOnly
                    sx={{ ml: 1, color: palette.text, fontSize: "13px", width: "100%", "& input": { cursor: "pointer" } }}
                  />
                </Box>
                </DemoField>
              </Grid>
              <Grid item xs={12} md={3.4}>
                <DemoField label="Descripcion" compactMobile>
                <InputBase
                  placeholder={
                    recursoNuevo.tipo === "OPERARIO"
                      ? "Operario vinilista"
                      : recursoNuevo.tipo === "SERVICIO"
                        ? "Impresion de vinil"
                        : "Material utilizado"
                  }
                  value={recursoNuevo.descripcion}
                  onChange={(e) => handleRecursoNuevoChange("descripcion", e.target.value)}
                  sx={fieldSx}
                />
                </DemoField>
              </Grid>

              {recursoNuevo.tipo === "MATERIAL" && (
                <>
                  <Grid item xs={5} md={1.4}>
                    <DemoField label="Cantidad" compactMobile>
                    <NumberStepperInput
                      value={recursoNuevo.cantidad}
                      onChange={(value) => handleRecursoNuevoChange("cantidad", value)}
                      min={0}
                      step={1}
                      minWidth={102}
                    />
                    </DemoField>
                  </Grid>
                  <Grid item xs={3} md={0.9}>
                    <DemoField label="Unidad" compactMobile>
                    <Box sx={compactNumberFieldSx}>
                      <InputBase
                        placeholder="-"
                        value={recursoNuevo.cont_und}
                        onChange={(e) => handleRecursoNuevoChange("cont_und", e.target.value)}
                        sx={{ color: palette.text, fontSize: "13px", width: "100%" }}
                      />
                    </Box>
                    </DemoField>
                  </Grid>
                  <Grid item xs={4} md={1.3}>
                    <DemoField label="Costo unit." compactMobile>
                    <Box sx={compactNumberFieldSx}>
                      <InputBase
                        type="number"
                        placeholder="0.00"
                        value={recursoNuevo.precio_unitario}
                        onChange={(e) => handleRecursoNuevoChange("precio_unitario", e.target.value)}
                        sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                      />
                    </Box>
                    </DemoField>
                  </Grid>
                </>
              )}

              {recursoNuevo.tipo === "OPERARIO" && (
                <>
                  <Grid item xs={6} md={1.2}>
                    <DemoField label="Horas" compactMobile>
                    <NumberStepperInput
                      value={recursoNuevo.horas}
                      onChange={(value) => handleRecursoNuevoChange("horas", value)}
                      min={0}
                      step={1}
                      minWidth={92}
                    />
                    </DemoField>
                  </Grid>
                  <Grid item xs={6} md={1.4}>
                    <DemoField label="Costo hora" compactMobile>
                    <NumberStepperInput
                      value={recursoNuevo.precio_unitario}
                      onChange={(value) => handleRecursoNuevoChange("precio_unitario", value)}
                      min={0}
                      step={1}
                      placeholder="0.00"
                      minWidth={102}
                    />
                    </DemoField>
                  </Grid>
                </>
              )}

              {recursoNuevo.tipo === "SERVICIO" && (
                <>
                  <Grid item xs={4} md={1.2}>
                    <DemoField label="Largo" compactMobile>
                    <NumberStepperInput
                      value={recursoNuevo.largo}
                      onChange={(value) => handleRecursoNuevoChange("largo", value)}
                      min={0}
                      step={0.1}
                      minWidth={92}
                    />
                    </DemoField>
                  </Grid>
                  <Grid item xs={4} md={1.2}>
                    <DemoField label="Ancho" compactMobile>
                    <NumberStepperInput
                      value={recursoNuevo.ancho}
                      onChange={(value) => handleRecursoNuevoChange("ancho", value)}
                      min={0}
                      step={0.1}
                      minWidth={92}
                    />
                    </DemoField>
                  </Grid>
                  <Grid item xs={4} md={1.4}>
                    <DemoField label="Costo m2" compactMobile>
                    <NumberStepperInput
                      value={recursoNuevo.precio_unitario}
                      onChange={(value) => handleRecursoNuevoChange("precio_unitario", value)}
                      min={0}
                      step={1}
                      placeholder="0.00"
                      minWidth={102}
                    />
                    </DemoField>
                  </Grid>
                </>
              )}

              <Grid item xs={12} md={1.2}>
                <Box sx={{ pt: { xs: 0, md: 2.4 }, display: "flex", justifyContent: "center", ml: { xs: 0, md: 1.25 } }}>
                <AppButton fullWidth icon={<Plus size={16} />} onClick={handleAddRecurso}>
                  {recursoEditId ? "Modificar" : "Agregar"}
                </AppButton>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Grid
            container
            spacing={1}
            sx={{
              display: { xs: "none", md: "flex" },
              color: palette.muted,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              pb: 0.75,
              borderBottom: `1px solid ${palette.borderSoft}`,
            }}
          >
            <Grid item md={7.2}>Descripcion</Grid>
            <Grid item md={2.6}>Detalle calculo</Grid>
            <Grid item md={1.6} sx={{ textAlign: "right" }}>Costo</Grid>
            <Grid item md={0.6}></Grid>
          </Grid>

          <Box>
            {(trabajoSeleccionado?.materiales || []).map((material) => {
              const importe = costoRecurso(material);

              return (
                <Grid
                  container
                  spacing={{ xs: 0.2, md: 0.75 }}
                  key={material.id}
                  sx={{
                    p: { xs: 0.15, md: 0 },
                    py: { xs: 0.22, md: 0.7 },
                    mb: 0,
                    border: "none",
                    borderBottom: `1px solid ${palette.borderSoft}`,
                    borderRadius: 0,
                    backgroundColor: "transparent",
                    alignItems: "center",
                  }}
                >
                  <Grid item xs={10} sx={{ display: { xs: "block", md: "none" } }}>
                    <Tooltip title={`Tipo: ${material.tipo} Â· Codigo: ${material.id_producto || material.codigo}`} arrow placement="top-start">
                      <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 700, lineHeight: 1.12 }}>
                        {material.descripcion}
                      </Typography>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={2} sx={{ display: { xs: "block", md: "none" } }}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                      <Box
                        onClick={() => handleOpenEditRecurso(material)}
                        sx={{
                          display: "flex",
                          color: palette.muted,
                          cursor: "pointer",
                          "&:hover": { color: palette.accent },
                        }}
                      >
                        <Pencil size={18} />
                      </Box>
                      <Box
                        onClick={() => handleDeleteRecurso(material.id)}
                        sx={{
                          display: "flex",
                          color: palette.muted,
                          cursor: "pointer",
                          "&:hover": { color: "#ff8a65" },
                        }}
                      >
                        <Trash2 size={19} />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={7} sx={{ display: { xs: "block", md: "none" } }}>
                    <Typography sx={{ color: palette.muted, fontSize: "11px", lineHeight: 1.12 }}>
                      {detalleRecurso(material)}
                    </Typography>
                  </Grid>
                  <Grid item xs={5} sx={{ display: { xs: "block", md: "none" } }}>
                    <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 800, textAlign: "right" }}>
                      {Money({ value: importe })}
                    </Typography>
                  </Grid>
                  <Grid item md={7.2} sx={{ display: { xs: "none", md: "block" } }}>
                    <Tooltip title={`Tipo: ${material.tipo} Â· Codigo: ${material.id_producto || material.codigo}`} arrow placement="top-start">
                      <Typography sx={{ color: palette.text, fontSize: "13px", lineHeight: 1.35 }}>
                        {material.descripcion}
                      </Typography>
                    </Tooltip>
                  </Grid>
                  <Grid item md={2.6} sx={{ display: { xs: "none", md: "block" } }}>
                    <Typography sx={{ color: palette.muted, fontSize: "12px", lineHeight: 1.35 }}>
                      {detalleRecurso(material)}
                    </Typography>
                  </Grid>
                  <Grid item md={1.6} sx={{ display: { xs: "none", md: "block" } }}>
                    <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 800, textAlign: "right" }}>
                      {Money({ value: importe })}
                    </Typography>
                  </Grid>
                  <Grid item md={0.6} sx={{ display: { xs: "none", md: "block" } }}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                      <Box
                        onClick={() => handleOpenEditRecurso(material)}
                        sx={{
                          display: "flex",
                          color: palette.muted,
                          cursor: "pointer",
                          "&:hover": { color: palette.accent },
                        }}
                      >
                        <Pencil size={17} />
                      </Box>
                      <Box
                        onClick={() => handleDeleteRecurso(material.id)}
                        sx={{
                          display: "flex",
                          color: palette.muted,
                          cursor: "pointer",
                          "&:hover": { color: "#ff8a65" },
                        }}
                      >
                        <Trash2 size={18} />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              );
            })}
          </Box>

          {(trabajoSeleccionado?.materiales || []).length === 0 && (
            <Typography sx={{ color: palette.muted, fontSize: "13px", py: 3, textAlign: "center" }}>
              Sin recursos registrados para este trabajo.
            </Typography>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Box
              sx={{
                width: { xs: "100%", sm: 360 },
                color: palette.accent,
                fontWeight: 800,
                borderTop: `1px solid ${palette.border}`,
                pt: 1,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <span>Total trabajo</span>
                <span>{Money({ value: totalCosteadoTrabajoSeleccionado })}</span>
              </Box>
              <Typography sx={{ color: palette.muted, fontSize: "11px", textAlign: "right", mt: 0.65 }}>
                Base {Money({ value: totalMateriales })} + utilidad {porcentajeUtilidadTrabajo}% ({Money({ value: montoUtilidadTrabajo })})
              </Typography>
            </Box>
          </Box>
        </Box>
      </Dialog>

      <ProductoSelectorModal
        open={productoModalOpen}
        tipo={recursoNuevo.tipo}
        busqueda={productoBusqueda}
        busquedaRef={productoBusquedaRef}
        resumen={productosResumen}
        listado={productosListado}
        cargando={productosCargando}
        error={productosError}
        resetPagina={productoResetPagina}
        onClose={() => setProductoModalOpen(false)}
        onBusquedaChange={(value) => {
          setProductoBusqueda(value);
          setProductoResetPagina(prev => !prev);
        }}
        onSelect={handleSelectProducto}
      />
    </Box>
  );
}

