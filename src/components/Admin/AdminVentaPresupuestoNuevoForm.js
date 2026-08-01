import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Dialog, Grid, IconButton, InputBase, MenuItem, Select, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { ArrowLeft, Building2, Calendar, FileText, FileSearch, MapPin, PackageSearch, Pencil, Phone, Plus, Save, Search, Trash2, UserRound, X } from "lucide-react";
import AppButton from "../ui/AppButton";
import AppIconBox from "../ui/AppIconBox";
import palette from "../../theme/palette";
import {
  costoRecurso as calcularCostoRecurso,
  detalleRecurso as obtenerDetalleRecurso,
  getPresupuestoDemo,
  totalCosteadoTrabajo as calcularTotalCosteadoTrabajo,
  presupuestoNuevoDemo,
  totalRecursosTrabajo as calcularTotalRecursosTrabajo,
  totalPresupuesto as calcularTotalPresupuesto,
  totalTrabajo as calcularTotalTrabajo,
  utilidadTrabajo as calcularUtilidadTrabajo,
} from "./AdminVentaPresupuestoDemoData";
import createPresupuestoPdf from "./AdminVentaPresupuestoPdf";

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

const multilineFieldSx = {
  ...fieldSx,
  height: "auto",
  minHeight: 150,
  alignItems: "flex-start",
  py: 1,
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

const productosTableStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: {
    style: {
      minHeight: 34,
      backgroundColor: palette.bg,
      borderBottom: `1px solid ${palette.borderSoft}`,
    },
  },
  headCells: {
    style: {
      color: palette.muted,
      fontSize: "11px",
      fontWeight: 800,
      textTransform: "uppercase",
      paddingLeft: "10px",
      paddingRight: "10px",
    },
  },
  rows: {
    style: {
      minHeight: 46,
      backgroundColor: palette.surface,
      color: palette.text,
      borderBottom: `1px solid ${palette.borderSoft}`,
      cursor: "pointer",
      "&:hover": {
        backgroundColor: palette.surfaceAlt,
        boxShadow: `inset 3px 0 0 ${palette.accent}`,
      },
    },
    highlightOnHoverStyle: {
      backgroundColor: palette.surfaceAlt,
      color: palette.text,
      boxShadow: `inset 3px 0 0 ${palette.accent}`,
      outline: "none",
    },
  },
  cells: {
    style: {
      paddingLeft: "10px",
      paddingRight: "10px",
      fontSize: "13px",
    },
  },
  pagination: {
    style: {
      backgroundColor: "transparent",
      color: palette.muted,
      borderTop: `1px solid ${palette.borderSoft}`,
    },
    pageButtonsStyle: {
      color: palette.muted,
      fill: palette.muted,
      "&:hover:not(:disabled)": { backgroundColor: palette.accentSoft },
      "&:disabled": { color: palette.border, fill: palette.border },
    },
  },
  progress: {
    style: {
      backgroundColor: "transparent",
      color: palette.muted,
    },
  },
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

export default function AdminVentaPresupuestoNuevoForm() {
  const navigate = useNavigate();
  const params = useParams();
  const productoModalSmall = useMediaQuery("(max-width:600px)");
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const editando = Boolean(params.comprobante);
  const presupuestoInicial = getPresupuestoDemo(params.comprobante) || presupuestoNuevoDemo;
  const [presupuesto, setPresupuesto] = useState({
    ...presupuestoInicial,
    numero: params.comprobante || presupuestoInicial.numero,
  });
  const [trabajoMateriales, setTrabajoMateriales] = useState(null);
  const [trabajoModalOpen, setTrabajoModalOpen] = useState(false);
  const [trabajoEditId, setTrabajoEditId] = useState(null);
  const [trabajoDraft, setTrabajoDraft] = useState({
    producto: "",
    descripcion: "",
    cantidad: 1,
    precio_unitario: 0,
  });
  const [recursoNuevo, setRecursoNuevo] = useState({
    tipo: "MATERIAL",
    codigo: "",
    descripcion: "",
    cantidad: 1,
    unidad: "UND",
    costo_unitario: 0,
    horas: 1,
    costo_hora: 0,
    largo: 1,
    ancho: 1,
    costo_m2: 0,
  });
  const [productoModalOpen, setProductoModalOpen] = useState(false);
  const [productoBusqueda, setProductoBusqueda] = useState("");
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [productosListado, setProductosListado] = useState([]);
  const [productosCargando, setProductosCargando] = useState(false);
  const [productosError, setProductosError] = useState("");
  const [productoResetPagina, setProductoResetPagina] = useState(false);
  const productoBusquedaRef = useRef(null);

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

  const subtotal = useMemo(
    () => presupuesto.trabajos.reduce((acc, item) => acc + totalTrabajo(item), 0),
    [presupuesto.trabajos],
  );
  const total = calcularTotalPresupuesto(presupuesto);
  const igv = total - subtotal;

  const handleCabeceraChange = (name, value) => {
    setPresupuesto(prev => ({ ...prev, [name]: value }));
  };

  const createTrabajoDraft = (index) => ({
    producto: `TR-${String(index + 1).padStart(3, "0")}`,
    descripcion: "",
    cantidad: 1,
    precio_unitario: 0,
  });

  const handleOpenAddTrabajo = () => {
    setTrabajoEditId(null);
    setTrabajoDraft(createTrabajoDraft(presupuesto.trabajos.length));
    setTrabajoModalOpen(true);
  };

  const handleOpenEditTrabajo = (trabajo) => {
    setTrabajoEditId(trabajo.id);
    setTrabajoDraft({
      producto: trabajo.producto || trabajo.codigo || "",
      descripcion: trabajo.descripcion || "",
      cantidad: trabajo.cantidad || 1,
      precio_unitario: trabajo.precio_unitario || 0,
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

  const handleSaveTrabajo = () => {
    setPresupuesto(prev => ({
      ...prev,
      trabajos: trabajoEditId
        ? prev.trabajos.map(item => (
          item.id === trabajoEditId
            ? {
              ...item,
              producto: trabajoDraft.producto,
              codigo: trabajoDraft.producto,
              numero: trabajoDraft.producto,
              descripcion: trabajoDraft.descripcion,
              cantidad: trabajoDraft.cantidad,
              precio_unitario: trabajoDraft.precio_unitario,
            }
            : item
        ))
        : [
          ...prev.trabajos,
          {
            id: Date.now(),
            producto: trabajoDraft.producto,
            codigo: trabajoDraft.producto,
            numero: trabajoDraft.producto,
            descripcion: trabajoDraft.descripcion,
            cantidad: trabajoDraft.cantidad,
            unidad: "UND",
            precio_unitario: trabajoDraft.precio_unitario,
            utilidad_pct: 0,
            materiales: [],
          },
        ],
    }));
    handleCloseTrabajoModal();
  };

  const handleDeleteTrabajo = (id) => {
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

  const handleTrabajoDetalleChange = (name, value) => {
    if (!trabajoSeleccionado) {
      return;
    }

    setPresupuesto(prev => ({
      ...prev,
      trabajos: prev.trabajos.map(item => (
        item.id === trabajoSeleccionado.id
          ? { ...item, [name]: value }
          : item
      )),
    }));
  };

  const handleAddRecurso = () => {
    if (!trabajoSeleccionado || !recursoNuevo.descripcion) {
      return;
    }

    const recurso = {
      id: Date.now(),
      tipo: recursoNuevo.tipo,
      codigo: recursoNuevo.codigo || `${recursoNuevo.tipo.substring(0, 3)}-${Date.now().toString().slice(-4)}`,
      descripcion: recursoNuevo.descripcion,
      unidad: recursoNuevo.unidad,
    };

    if (recursoNuevo.tipo === "MANO_OBRA" || recursoNuevo.tipo === "OPERARIO") {
      recurso.horas = recursoNuevo.horas;
      recurso.costo_hora = recursoNuevo.costo_hora;
    } else if (recursoNuevo.tipo === "SERVICIO") {
      recurso.largo = recursoNuevo.largo;
      recurso.ancho = recursoNuevo.ancho;
      recurso.costo_m2 = recursoNuevo.costo_m2;
      recurso.unidad = "M2";
    } else {
      recurso.cantidad = recursoNuevo.cantidad;
      recurso.costo_unitario = recursoNuevo.costo_unitario;
    }

    setPresupuesto(prev => ({
      ...prev,
      trabajos: prev.trabajos.map(item => (
        item.id === trabajoSeleccionado.id
          ? { ...item, materiales: [...(item.materiales || []), recurso] }
          : item
      )),
    }));

    setRecursoNuevo(prev => ({
      ...prev,
      codigo: "",
      descripcion: "",
      cantidad: 1,
      costo_unitario: 0,
      horas: 1,
      costo_hora: 0,
      largo: 1,
      ancho: 1,
      costo_m2: 0,
    }));
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
        codigo: producto.codigo,
        descripcion: producto.descripcion,
        unidad: producto.tipo === "SERVICIO" ? "M2" : producto.cont_und || prev.unidad,
      };

      if (prev.tipo === "OPERARIO" || prev.tipo === "MANO_OBRA") {
        next.costo_hora = producto.precio_compra;
      } else if (prev.tipo === "SERVICIO") {
        next.costo_m2 = producto.precio_compra;
      } else {
        next.costo_unitario = producto.precio_compra;
      }

      return next;
    });
    setProductoModalOpen(false);
  };

  const productosColumnas = useMemo(() => [
    /*{
      name: "Codigo",
      selector: row => row.codigo,
      sortable: true,
      width: "80px",
      cell: row => (
        <Typography sx={{ color: palette.accent, fontSize: "13px", fontWeight: 500 }}>
          {row.codigo}
        </Typography>
      ),
    },*/
    {
      name: "Descripcion",
      selector: row => row.descripcion,
      sortable: true,
      //grow: 2,
      width: productoModalSmall ? "280px" : "380px",
      compact: true,
      /*cell: row => (
        <Typography sx={{ color: palette.text, fontSize: "13px" }}>
          {row.descripcion}
        </Typography>
      ),*/
    },
    {
      name: "UND",
      selector: row => row.tipo === "SERVICIO" ? "M2" : row.cont_und || "-",
      sortable: true,
      width: "40px",
      compact: true,
      cell: row => (
        <Typography sx={{ color: palette.muted, fontSize: "13px", fontWeight: 400 }}>
          {row.tipo === "SERVICIO" ? "M2" : row.cont_und || "-"}
        </Typography>
      ),
    },
    {
      name: "Costo",
      selector: row => row.precio_compra,
      sortable: true,
      right: true,
      width: "60px",
      compact: true,
      cell: row => (
        <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 400 }}>
          {Money({ value: row.precio_compra })}
        </Typography>
      ),
    },
    {
      name: "Tipo",
      selector: row => row.tipo,
      sortable: true,
      right: true,
      width: "80px",
      compact: true,
      cell: row => (
        <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 400 }}>
          {row.tipo}
        </Typography>
      ),
    },
  ], [productoModalSmall]);

  const handleDeleteRecurso = (idRecurso) => {
    if (!trabajoSeleccionado) {
      return;
    }

    setPresupuesto(prev => ({
      ...prev,
      trabajos: prev.trabajos.map(item => (
        item.id === trabajoSeleccionado.id
          ? { ...item, materiales: (item.materiales || []).filter(recurso => recurso.id !== idRecurso) }
          : item
      )),
    }));
  };

  const handleSaveDemo = () => {
    console.log("Presupuesto demo listo para enviar:", {
      ...presupuesto,
      subtotal,
      igv,
      total,
    });
    alert("Demo: presupuesto listo para grabar. Revisa la consola para ver el JSON.");
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
  const porcentajeUtilidadTrabajo = Number(trabajoSeleccionado?.utilidad_pct || 0);
  const montoUtilidadTrabajo = trabajoSeleccionado ? utilidadTrabajo(trabajoSeleccionado) : 0;
  const totalCosteadoTrabajoSeleccionado = trabajoSeleccionado ? totalCosteadoTrabajo(trabajoSeleccionado) : 0;
  const totalTrabajoDraft = Number(trabajoDraft.cantidad || 0) * Number(trabajoDraft.precio_unitario || 0);
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
                {editando ? "Modificar presupuesto" : "Nuevo presupuesto"}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "13px", mt: 0.5 }}>
                {editando ? presupuesto.numero : "Demo temporal con JSON local"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: { xs: "flex-end", md: "flex-start" } }}>
            <AppButton icon={<Save size={17} />} onClick={handleSaveDemo}>
              Grabar presupuesto
            </AppButton>
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
                  placeholder="Numero"
                  value={presupuesto.numero}
                  onChange={(e) => handleCabeceraChange("numero", e.target.value)}
                  sx={{ ...headerInputSx, ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={headerFieldSx}>
                <Calendar size={15} color={palette.muted} />
                <HeaderInlineLabel>Fecha</HeaderInlineLabel>
                <InputBase
                  type="date"
                  value={presupuesto.fecha}
                  onChange={(e) => handleCabeceraChange("fecha", e.target.value)}
                  sx={{ ...headerInputSx, ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Select
                fullWidth
                size="small"
                value={presupuesto.moneda}
                onChange={(e) => handleCabeceraChange("moneda", e.target.value)}
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
                value={presupuesto.forma_pago}
                onChange={(e) => handleCabeceraChange("forma_pago", e.target.value)}
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
              <Box sx={headerFieldSx}>
                <Building2 size={15} color={palette.muted} />
                <HeaderInlineLabel>Doc.</HeaderInlineLabel>
                <InputBase
                  placeholder="Documento cliente"
                  value={presupuesto.cliente_documento}
                  onChange={(e) => handleCabeceraChange("cliente_documento", e.target.value)}
                  sx={{ ...headerInputSx, ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={headerFieldSx}>
                <Building2 size={15} color={palette.muted} />
                <HeaderInlineLabel>Cliente</HeaderInlineLabel>
                <InputBase
                  placeholder="Cliente"
                  value={presupuesto.cliente_nombre}
                  onChange={(e) => handleCabeceraChange("cliente_nombre", e.target.value)}
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
                  value={presupuesto.contacto}
                  onChange={(e) => handleCabeceraChange("contacto", e.target.value)}
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
                  value={presupuesto.celular}
                  onChange={(e) => handleCabeceraChange("celular", e.target.value)}
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
                  value={presupuesto.direccion}
                  onChange={(e) => handleCabeceraChange("direccion", e.target.value)}
                  sx={{ ...headerInputSx, ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={headerFieldSx}>
                <HeaderInlineLabel>Campaña</HeaderInlineLabel>
                <InputBase
                  placeholder="Campaña"
                  value={presupuesto.campana}
                  onChange={(e) => handleCabeceraChange("campana", e.target.value)}
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
            <Grid item md={5.2}>Descripcion</Grid>
            <Grid item md={1}>Cantidad</Grid>
            <Grid item md={1.4}>Precio unitario</Grid>
            <Grid item md={1.4}>Total</Grid>
            <Grid item md={1.4}></Grid>
          </Grid>

          {presupuesto.trabajos.map((item) => {
            const importe = totalTrabajo(item);
            const totalDetallado = totalRecursosTrabajo(item);
            const utilidad = utilidadTrabajo(item);
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
                    {item.producto || item.codigo}
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
                    {item.descripcion || "Sin descripcion"}
                  </Typography>
                </Grid>
                <Grid item xs={4} md={1}>
                  <Typography sx={{ color: palette.text, fontSize: "13px", textAlign: { xs: "left", md: "right" } }}>
                    {item.cantidad}
                  </Typography>
                </Grid>
                <Grid item xs={4} md={1.4}>
                  <Typography sx={{ color: palette.text, fontSize: "13px", textAlign: "right" }}>
                    {tieneDetalle ? Money({ value: totalDetallado }) : Money({ value: item.precio_unitario })}
                  </Typography>
                  {tieneDetalle && (
                    <Typography sx={{ color: palette.muted, fontSize: "11px", textAlign: "right", mt: 0.25 }}>
                      Util. {Number(item.utilidad_pct || 0)}%
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={4} md={1.4}>
                  <Box sx={{ color: palette.accent, fontSize: "13px", fontWeight: 800, textAlign: "right" }}>
                    {Money({ value: importe })}
                  </Box>
                  {tieneDetalle && (
                    <Typography sx={{ color: palette.muted, fontSize: "11px", textAlign: "right", mt: 0.25 }}>
                      + {Money({ value: utilidad })}
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
                <span>{presupuesto.moneda} {Money({ value: subtotal })}</span>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, color: palette.muted }}>
                <span>IGV 18%</span>
                <span>{presupuesto.moneda} {Money({ value: igv })}</span>
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
                <span>{presupuesto.moneda} {Money({ value: total })}</span>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={trabajoModalOpen}
        onClose={handleCloseTrabajoModal}
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
        <Box sx={{ p: 2.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <AppIconBox>
                {trabajoEditId ? <Pencil size={16} /> : <Plus size={16} />}
              </AppIconBox>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "17px" }}>
                  {trabajoEditId ? "Modificar trabajo" : "Agregar trabajo"}
                </Typography>
                <Typography sx={{ color: palette.muted, fontSize: "13px" }}>
                  Producto, descripcion e importe del trabajo
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseTrabajoModal} sx={{ color: palette.muted }}>
              <X size={18} />
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <DemoField label="Producto">
                <Box sx={fieldSx}>
                  <InputBase
                    autoFocus
                    placeholder="Ej. PORONGOCHE 1"
                    value={trabajoDraft.producto}
                    onChange={(e) => handleTrabajoDraftChange("producto", e.target.value)}
                    sx={{ color: palette.text, fontSize: "13px", width: "100%" }}
                  />
                </Box>
              </DemoField>
            </Grid>
            <Grid item xs={12}>
              <DemoField label="Descripcion">
                <Box sx={multilineFieldSx}>
                  <InputBase
                    multiline
                    minRows={6}
                    placeholder="Detalle del trabajo, medidas y condiciones"
                    value={trabajoDraft.descripcion}
                    onChange={(e) => handleTrabajoDraftChange("descripcion", e.target.value)}
                    sx={{
                      color: palette.text,
                      fontSize: "13px",
                      lineHeight: 1.5,
                      width: "100%",
                      alignItems: "flex-start",
                    }}
                  />
                </Box>
              </DemoField>
            </Grid>
            <Grid item xs={12} md={4}>
              <DemoField label="Cantidad">
                <Box sx={fieldSx}>
                  <InputBase
                    type="number"
                    value={trabajoDraft.cantidad}
                    onChange={(e) => handleTrabajoDraftChange("cantidad", e.target.value)}
                    sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                  />
                </Box>
              </DemoField>
            </Grid>
            <Grid item xs={12} md={4}>
              <DemoField label="Precio unitario">
                <Box sx={fieldSx}>
                  <InputBase
                    type="number"
                    value={trabajoDraft.precio_unitario}
                    onChange={(e) => handleTrabajoDraftChange("precio_unitario", e.target.value)}
                    sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                  />
                </Box>
              </DemoField>
            </Grid>
            <Grid item xs={12} md={4}>
              <DemoField label="Total">
                <Box sx={{ ...fieldSx, justifyContent: "flex-end", color: palette.accent, fontWeight: 800 }}>
                  {presupuesto.moneda} {Money({ value: totalTrabajoDraft })}
                </Box>
              </DemoField>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2.5 }}>
            <AppButton onClick={handleCloseTrabajoModal}>
              Cancelar
            </AppButton>
            <AppButton icon={<Save size={16} />} onClick={handleSaveTrabajo}>
              Guardar trabajo
            </AppButton>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(trabajoSeleccionado)}
        onClose={() => setTrabajoMateriales(null)}
        maxWidth="md"
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
                  {trabajoSeleccionado?.codigo} - {trabajoSeleccionado?.descripcion}
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
                  {presupuesto.moneda} {Money({ value: totalMateriales })}
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
                  {presupuesto.moneda} {Money({ value: totalCosteadoTrabajoSeleccionado })}
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
                Costo calculado: {presupuesto.moneda} {Money({ value: costoRecursoNuevo })}
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
                    value={recursoNuevo.codigo}
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
                  <Grid item xs={4} md={1}>
                    <DemoField label="Cantidad" compactMobile>
                    <Box sx={compactNumberFieldSx}>
                      <HeaderInlineLabel>Cant.</HeaderInlineLabel>
                      <InputBase
                        type="number"
                        placeholder="0"
                        value={recursoNuevo.cantidad}
                        onChange={(e) => handleRecursoNuevoChange("cantidad", e.target.value)}
                        sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                      />
                    </Box>
                    </DemoField>
                  </Grid>
                  <Grid item xs={4} md={1}>
                    <DemoField label="Unidad" compactMobile>
                    <Box sx={compactNumberFieldSx}>
                      <HeaderInlineLabel>Und.</HeaderInlineLabel>
                      <InputBase
                        placeholder="-"
                        value={recursoNuevo.unidad}
                        onChange={(e) => handleRecursoNuevoChange("unidad", e.target.value)}
                        sx={{ color: palette.text, fontSize: "13px", width: "100%" }}
                      />
                    </Box>
                    </DemoField>
                  </Grid>
                  <Grid item xs={4} md={1.4}>
                    <DemoField label="Costo unit." compactMobile>
                    <Box sx={compactNumberFieldSx}>
                      <HeaderInlineLabel>Costo</HeaderInlineLabel>
                      <InputBase
                        type="number"
                        placeholder="0.00"
                        value={recursoNuevo.costo_unitario}
                        onChange={(e) => handleRecursoNuevoChange("costo_unitario", e.target.value)}
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
                    <Box sx={compactNumberFieldSx}>
                      <HeaderInlineLabel>Horas</HeaderInlineLabel>
                      <InputBase
                        type="number"
                        placeholder="0"
                        value={recursoNuevo.horas}
                        onChange={(e) => handleRecursoNuevoChange("horas", e.target.value)}
                        sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                      />
                    </Box>
                    </DemoField>
                  </Grid>
                  <Grid item xs={6} md={1.4}>
                    <DemoField label="Costo hora" compactMobile>
                    <Box sx={compactNumberFieldSx}>
                      <HeaderInlineLabel>Costo</HeaderInlineLabel>
                      <InputBase
                        type="number"
                        placeholder="0.00"
                        value={recursoNuevo.costo_hora}
                        onChange={(e) => handleRecursoNuevoChange("costo_hora", e.target.value)}
                        sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                      />
                    </Box>
                    </DemoField>
                  </Grid>
                </>
              )}

              {recursoNuevo.tipo === "SERVICIO" && (
                <>
                  <Grid item xs={4} md={0.9}>
                    <DemoField label="Largo" compactMobile>
                    <Box sx={compactNumberFieldSx}>
                      <HeaderInlineLabel>Largo</HeaderInlineLabel>
                      <InputBase
                        type="number"
                        placeholder="0"
                        value={recursoNuevo.largo}
                        onChange={(e) => handleRecursoNuevoChange("largo", e.target.value)}
                        sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                      />
                    </Box>
                    </DemoField>
                  </Grid>
                  <Grid item xs={4} md={0.9}>
                    <DemoField label="Ancho" compactMobile>
                    <Box sx={compactNumberFieldSx}>
                      <HeaderInlineLabel>Ancho</HeaderInlineLabel>
                      <InputBase
                        type="number"
                        placeholder="0"
                        value={recursoNuevo.ancho}
                        onChange={(e) => handleRecursoNuevoChange("ancho", e.target.value)}
                        sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                      />
                    </Box>
                    </DemoField>
                  </Grid>
                  <Grid item xs={4} md={1.2}>
                    <DemoField label="Costo m2" compactMobile>
                    <Box sx={compactNumberFieldSx}>
                      <HeaderInlineLabel>Costo</HeaderInlineLabel>
                      <InputBase
                        type="number"
                        placeholder="0.00"
                        value={recursoNuevo.costo_m2}
                        onChange={(e) => handleRecursoNuevoChange("costo_m2", e.target.value)}
                        sx={{ color: palette.text, fontSize: "13px", width: "100%", "& input": { textAlign: "right" } }}
                      />
                    </Box>
                    </DemoField>
                  </Grid>
                </>
              )}

              <Grid item xs={12} md={1.2}>
                <Box sx={{ pt: { xs: 0, md: 2.4 }, display: "flex", justifyContent: "center", ml: { xs: 0, md: 1.25 } }}>
                <AppButton fullWidth icon={<Plus size={16} />} onClick={handleAddRecurso}>
                  Agregar
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
                    <Tooltip title={`Tipo: ${material.tipo} · Codigo: ${material.codigo}`} arrow placement="top-start">
                      <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 700, lineHeight: 1.12 }}>
                        {material.descripcion}
                      </Typography>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={2} sx={{ display: { xs: "block", md: "none" } }}>
                    <Box
                      onClick={() => handleDeleteRecurso(material.id)}
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        color: palette.muted,
                        cursor: "pointer",
                        "&:hover": { color: "#ff8a65" },
                      }}
                    >
                      <Trash2 size={19} />
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
                    <Tooltip title={`Tipo: ${material.tipo} · Codigo: ${material.codigo}`} arrow placement="top-start">
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
                    <Box
                      onClick={() => handleDeleteRecurso(material.id)}
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        color: palette.muted,
                        cursor: "pointer",
                        "&:hover": { color: "#ff8a65" },
                      }}
                    >
                      <Trash2 size={18} />
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  mt: 1,
                  color: palette.muted,
                  fontWeight: 700,
                }}
              >
                <Typography sx={{ color: palette.muted, fontSize: "12px", fontWeight: 700 }}>
                  Utilidad
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                  <Box sx={{ ...fieldSx, width: 86, height: 32, backgroundColor: palette.bg }}>
                    <InputBase
                      type="number"
                      value={trabajoSeleccionado?.utilidad_pct || 0}
                      onChange={(e) => handleTrabajoDetalleChange("utilidad_pct", e.target.value)}
                      sx={{ color: palette.text, fontSize: "13px", fontWeight: 800, width: "100%", "& input": { textAlign: "right" } }}
                    />
                    <Typography sx={{ color: palette.muted, fontSize: "12px", ml: 0.4 }}>
                      %
                    </Typography>
                  </Box>
                  <Typography sx={{ color: palette.accent, fontSize: "12px", fontWeight: 800, width: 92, textAlign: "right" }}>
                    {Money({ value: montoUtilidadTrabajo })}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ color: palette.muted, fontSize: "11px", textAlign: "right", mt: 0.5 }}>
                Base {Money({ value: totalMateriales })} x {porcentajeUtilidadTrabajo}%
              </Typography>
            </Box>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        open={productoModalOpen}
        onClose={() => setProductoModalOpen(false)}
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
        <Box sx={{ p: 2.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "17px" }}>
                Seleccionar {recursoNuevo.tipo === "OPERARIO" ? "operario" : recursoNuevo.tipo.toLowerCase()}
              </Typography>
              <Typography sx={{ color: palette.muted, fontSize: "12px", mt: 0.25 }}>
                {productosCargando
                  ? "Cargando productos..."
                  : `${productosResumen.mostrados} mostrados · total ${productosResumen.total} · operario ${productosResumen.operario} · servicio ${productosResumen.servicio}`}
              </Typography>
            </Box>
            <IconButton onClick={() => setProductoModalOpen(false)} sx={{ color: palette.muted }}>
              <X size={18} />
            </IconButton>
          </Box>

          <DemoField label="Buscar">
            <Box sx={{ ...fieldSx, mb: 1.5 }}>
              <InputBase
                autoFocus
                inputRef={productoBusquedaRef}
                placeholder="Filtrar por codigo, descripcion o tipo"
                value={productoBusqueda}
                onChange={(e) => {
                  setProductoBusqueda(e.target.value);
                  setProductoResetPagina(prev => !prev);
                }}
                sx={{ color: palette.text, fontSize: "13px", width: "100%" }}
              />
            </Box>
          </DemoField>

          {productosError && (
            <Typography sx={{ color: "#ffab91", fontSize: "13px", py: 1.5, textAlign: "center" }}>
              {productosError}
            </Typography>
          )}

          <DataTable
            columns={productosColumnas}
            data={productosListado}
            customStyles={productosTableStyles}
            progressPending={productosCargando}
            noDataComponent="Sin resultados para la busqueda."
            pagination
            paginationPerPage={8}
            paginationResetDefaultPage={productoResetPagina}
            paginationRowsPerPageOptions={[8, 15, 30, 50]}
            dense
            highlightOnHover
            pointerOnHover
            onRowClicked={handleSelectProducto}
          />
        </Box>
      </Dialog>
    </Box>
  );
}
