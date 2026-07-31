import React, { useMemo, useState } from "react";
import { Box, Dialog, Grid, IconButton, InputBase, MenuItem, Select, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, Calendar, FileText, FileSearch, PackageSearch, Pencil, Plus, Save, Search, Trash2, UserRound, X } from "lucide-react";
import AppButton from "../ui/AppButton";
import AppIconBox from "../ui/AppIconBox";
import palette from "../../theme/palette";
import {
  costoRecurso as calcularCostoRecurso,
  detalleRecurso as obtenerDetalleRecurso,
  getPresupuestoDemo,
  productosPresupuestoDemo,
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

function DemoField({ label, children }) {
  return (
    <Box>
      <Typography sx={{ color: palette.muted, fontSize: "11px", mb: 0.75, textTransform: "uppercase" }}>
        {label}
      </Typography>
      {children}
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

export default function AdminVentaPresupuestoNuevoForm() {
  const navigate = useNavigate();
  const params = useParams();
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
  const [productoPagina, setProductoPagina] = useState(0);
  const [productoBusqueda, setProductoBusqueda] = useState("");
  const productosPorPagina = 6;

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

  const productosFiltrados = useMemo(() => {
    const textoBusqueda = productoBusqueda.trim().toLowerCase();
    if (recursoNuevo.tipo === "MATERIAL") {
      return productosPresupuestoDemo.filter(producto => {
        const coincideTipo = producto.tipo !== "OPERARIO" && producto.tipo !== "SERVICIO";
        const coincideBusqueda = !textoBusqueda
          || producto.id_producto.toLowerCase().includes(textoBusqueda)
          || producto.nombre.toLowerCase().includes(textoBusqueda)
          || producto.tipo.toLowerCase().includes(textoBusqueda);
        return coincideTipo && coincideBusqueda;
      });
    }
    return productosPresupuestoDemo.filter(producto => {
      const coincideTipo = producto.tipo === recursoNuevo.tipo;
      const coincideBusqueda = !textoBusqueda
        || producto.id_producto.toLowerCase().includes(textoBusqueda)
        || producto.nombre.toLowerCase().includes(textoBusqueda)
        || producto.tipo.toLowerCase().includes(textoBusqueda);
      return coincideTipo && coincideBusqueda;
    });
  }, [productoBusqueda, recursoNuevo.tipo]);

  const totalPaginasProducto = Math.max(1, Math.ceil(productosFiltrados.length / productosPorPagina));
  const productosPaginaActual = productosFiltrados.slice(
    productoPagina * productosPorPagina,
    (productoPagina + 1) * productosPorPagina,
  );

  const handleOpenProductoModal = () => {
    setProductoPagina(0);
    setProductoBusqueda("");
    setProductoModalOpen(true);
  };

  const handleSelectProducto = (producto) => {
    setRecursoNuevo(prev => {
      const next = {
        ...prev,
        codigo: producto.id_producto,
        descripcion: producto.nombre,
        unidad: producto.tipo === "SERVICIO" ? "M2" : prev.unidad,
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
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

          <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
            <AppButton onClick={() => navigate(`/ad_ventapresupuesto/${params.id_anfitrion}/${params.id_invitado}/${params.periodo}/${params.documento_id}`)}>
              Anterior
            </AppButton>
            <AppButton icon={<Save size={17} />} onClick={handleSaveDemo}>
              Grabar presupuesto
            </AppButton>
            <AppButton icon={<FileSearch size={17} />} onClick={handlePrevioPdf}>
              Previo PDF
            </AppButton>
            <AppButton icon={<FileText size={17} />} onClick={handlePdfCliente}>
              PDF cliente
            </AppButton>
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
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <DemoField label="Numero">
                <Box sx={fieldSx}>
                  <FileText size={15} color={palette.muted} />
                  <InputBase
                    value={presupuesto.numero}
                    onChange={(e) => handleCabeceraChange("numero", e.target.value)}
                    sx={{ ml: 1, color: palette.text, fontSize: "13px", width: "100%" }}
                  />
                </Box>
              </DemoField>
            </Grid>
            <Grid item xs={12} md={3}>
              <DemoField label="Fecha">
                <Box sx={fieldSx}>
                  <Calendar size={15} color={palette.muted} />
                  <InputBase
                    type="date"
                    value={presupuesto.fecha}
                    onChange={(e) => handleCabeceraChange("fecha", e.target.value)}
                    sx={{ ml: 1, color: palette.text, fontSize: "13px", width: "100%" }}
                  />
                </Box>
              </DemoField>
            </Grid>
            <Grid item xs={12} md={3}>
              <DemoField label="Moneda">
                <Select
                  fullWidth
                  size="small"
                  value={presupuesto.moneda}
                  onChange={(e) => handleCabeceraChange("moneda", e.target.value)}
                  sx={{ ...fieldSx, ".MuiSelect-select": { p: 0 }, ".MuiSelect-icon": { color: palette.muted } }}
                  MenuProps={{ PaperProps: { sx: { bgcolor: palette.surface, color: palette.text } } }}
                >
                  <MenuItem value="PEN">Soles</MenuItem>
                  <MenuItem value="USD">Dolares</MenuItem>
                </Select>
              </DemoField>
            </Grid>
            <Grid item xs={12} md={3}>
              <DemoField label="Forma pago">
                <Select
                  fullWidth
                  size="small"
                  value={presupuesto.forma_pago}
                  onChange={(e) => handleCabeceraChange("forma_pago", e.target.value)}
                  sx={{ ...fieldSx, ".MuiSelect-select": { p: 0 }, ".MuiSelect-icon": { color: palette.muted } }}
                  MenuProps={{ PaperProps: { sx: { bgcolor: palette.surface, color: palette.text } } }}
                >
                  <MenuItem value="Contado">Contado</MenuItem>
                  <MenuItem value="Credito">Credito</MenuItem>
                </Select>
              </DemoField>
            </Grid>

            <Grid item xs={12} md={3}>
              <DemoField label="Documento cliente">
                <Box sx={fieldSx}>
                  <Building2 size={15} color={palette.muted} />
                  <InputBase
                    value={presupuesto.cliente_documento}
                    onChange={(e) => handleCabeceraChange("cliente_documento", e.target.value)}
                    sx={{ ml: 1, color: palette.text, fontSize: "13px", width: "100%" }}
                  />
                </Box>
              </DemoField>
            </Grid>
            <Grid item xs={12} md={6}>
              <DemoField label="Cliente">
                <Box sx={fieldSx}>
                  <InputBase
                    value={presupuesto.cliente_nombre}
                    onChange={(e) => handleCabeceraChange("cliente_nombre", e.target.value)}
                    sx={{ color: palette.text, fontSize: "13px", width: "100%" }}
                  />
                </Box>
              </DemoField>
            </Grid>
            <Grid item xs={12} md={2}>
              <DemoField label="Contacto">
                <Box sx={fieldSx}>
                  <UserRound size={15} color={palette.muted} />
                  <InputBase
                    value={presupuesto.contacto}
                    onChange={(e) => handleCabeceraChange("contacto", e.target.value)}
                    sx={{ ml: 1, color: palette.text, fontSize: "13px", width: "100%" }}
                  />
                </Box>
              </DemoField>
            </Grid>
            <Grid item xs={12} md={2}>
              <DemoField label="Celular">
                <Box sx={fieldSx}>
                  <InputBase
                    value={presupuesto.celular}
                    onChange={(e) => handleCabeceraChange("celular", e.target.value)}
                    sx={{ color: palette.text, fontSize: "13px", width: "100%" }}
                  />
                </Box>
              </DemoField>
            </Grid>
            <Grid item xs={12} md={8}>
              <DemoField label="Direccion">
                <Box sx={fieldSx}>
                  <InputBase
                    value={presupuesto.direccion}
                    onChange={(e) => handleCabeceraChange("direccion", e.target.value)}
                    sx={{ color: palette.text, fontSize: "13px", width: "100%" }}
                  />
                </Box>
              </DemoField>
            </Grid>
            <Grid item xs={12} md={4}>
              <DemoField label="Campaña">
                <Box sx={fieldSx}>
                  <InputBase
                    value={presupuesto.campana}
                    onChange={(e) => handleCabeceraChange("campana", e.target.value)}
                    sx={{ color: palette.text, fontSize: "13px", width: "100%" }}
                  />
                </Box>
              </DemoField>
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
                    ? "Costeo detallado en proceso: revisa que materiales, operarios y servicios esten completos antes de cerrar."
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
                <DemoField label="Tipo">
                <Select
                  fullWidth
                  size="small"
                  value={recursoNuevo.tipo}
                  onChange={(e) => {
                    handleRecursoNuevoChange("tipo", e.target.value);
                    setProductoPagina(0);
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
                <DemoField label="Codigo">
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
                <DemoField label="Descripcion">
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
                    <DemoField label="Cantidad">
                    <InputBase
                      type="number"
                      placeholder="Cant."
                      value={recursoNuevo.cantidad}
                      onChange={(e) => handleRecursoNuevoChange("cantidad", e.target.value)}
                      sx={{ ...fieldSx, "& input": { textAlign: "right" } }}
                    />
                    </DemoField>
                  </Grid>
                  <Grid item xs={4} md={1}>
                    <DemoField label="Unidad">
                    <InputBase
                      placeholder="Und."
                      value={recursoNuevo.unidad}
                      onChange={(e) => handleRecursoNuevoChange("unidad", e.target.value)}
                      sx={fieldSx}
                    />
                    </DemoField>
                  </Grid>
                  <Grid item xs={4} md={1.4}>
                    <DemoField label="Costo unit.">
                    <InputBase
                      type="number"
                      placeholder="Costo"
                      value={recursoNuevo.costo_unitario}
                      onChange={(e) => handleRecursoNuevoChange("costo_unitario", e.target.value)}
                      sx={{ ...fieldSx, "& input": { textAlign: "right" } }}
                    />
                    </DemoField>
                  </Grid>
                </>
              )}

              {recursoNuevo.tipo === "OPERARIO" && (
                <>
                  <Grid item xs={6} md={1.2}>
                    <DemoField label="Horas">
                    <InputBase
                      type="number"
                      placeholder="Horas"
                      value={recursoNuevo.horas}
                      onChange={(e) => handleRecursoNuevoChange("horas", e.target.value)}
                      sx={{ ...fieldSx, "& input": { textAlign: "right" } }}
                    />
                    </DemoField>
                  </Grid>
                  <Grid item xs={6} md={1.4}>
                    <DemoField label="Costo hora">
                    <InputBase
                      type="number"
                      placeholder="Costo/h"
                      value={recursoNuevo.costo_hora}
                      onChange={(e) => handleRecursoNuevoChange("costo_hora", e.target.value)}
                      sx={{ ...fieldSx, "& input": { textAlign: "right" } }}
                    />
                    </DemoField>
                  </Grid>
                </>
              )}

              {recursoNuevo.tipo === "SERVICIO" && (
                <>
                  <Grid item xs={4} md={0.9}>
                    <DemoField label="Largo">
                    <InputBase
                      type="number"
                      placeholder="Largo"
                      value={recursoNuevo.largo}
                      onChange={(e) => handleRecursoNuevoChange("largo", e.target.value)}
                      sx={{ ...fieldSx, "& input": { textAlign: "right" } }}
                    />
                    </DemoField>
                  </Grid>
                  <Grid item xs={4} md={0.9}>
                    <DemoField label="Ancho">
                    <InputBase
                      type="number"
                      placeholder="Ancho"
                      value={recursoNuevo.ancho}
                      onChange={(e) => handleRecursoNuevoChange("ancho", e.target.value)}
                      sx={{ ...fieldSx, "& input": { textAlign: "right" } }}
                    />
                    </DemoField>
                  </Grid>
                  <Grid item xs={4} md={1.2}>
                    <DemoField label="Costo m2">
                    <InputBase
                      type="number"
                      placeholder="Costo m2"
                      value={recursoNuevo.costo_m2}
                      onChange={(e) => handleRecursoNuevoChange("costo_m2", e.target.value)}
                      sx={{ ...fieldSx, "& input": { textAlign: "right" } }}
                    />
                    </DemoField>
                  </Grid>
                </>
              )}

              <Grid item xs={12} md={1.2}>
                <Box sx={{ pt: { xs: 0, md: 2.4 }, display: "flex", justifyContent: "center", ml: { xs: 0, md: 1.25 } }}>
                <AppButton icon={<Plus size={16} />} onClick={handleAddRecurso}>
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
            <Grid item md={1.4}>Codigo</Grid>
            <Grid item md={1.5}>Tipo</Grid>
            <Grid item md={4.1}>Descripcion</Grid>
            <Grid item md={2.5}>Detalle calculo</Grid>
            <Grid item md={1.4} sx={{ textAlign: "right" }}>Costo</Grid>
            <Grid item md={0.4}></Grid>
          </Grid>

          <Box>
            {(trabajoSeleccionado?.materiales || []).map((material) => {
              const importe = costoRecurso(material);

              return (
                <Grid
                  container
                  spacing={1}
                  key={material.id}
                  sx={{
                    py: 1,
                    borderBottom: `1px solid ${palette.borderSoft}`,
                    alignItems: "center",
                  }}
                >
                  <Grid item xs={12} md={1.4}>
                    <Typography sx={{ color: palette.accent, fontSize: "13px", fontWeight: 700 }}>
                      {material.codigo}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <Typography sx={{ color: palette.muted, fontSize: "12px", fontWeight: 700 }}>
                      {material.tipo}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4.1}>
                    <Typography sx={{ color: palette.text, fontSize: "13px" }}>
                      {material.descripcion}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={2.5}>
                    <Typography sx={{ color: palette.muted, fontSize: "13px" }}>
                      {detalleRecurso(material)}
                    </Typography>
                  </Grid>
                  <Grid item xs={10} md={1.4}>
                    <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 800, textAlign: "right" }}>
                      {Money({ value: importe })}
                    </Typography>
                  </Grid>
                  <Grid item xs={2} md={0.4}>
                    <Box
                      onClick={() => handleDeleteRecurso(material.id)}
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        color: palette.muted,
                        cursor: "pointer",
                        "&:hover": { color: "#ff8a65" },
                      }}
                    >
                      <Trash2 size={15} />
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
                {productosFiltrados.length} opciones disponibles
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
                placeholder="Filtrar por codigo, nombre o tipo"
                value={productoBusqueda}
                onChange={(e) => {
                  setProductoBusqueda(e.target.value);
                  setProductoPagina(0);
                }}
                sx={{ color: palette.text, fontSize: "13px", width: "100%" }}
              />
            </Box>
          </DemoField>

          <Grid
            container
            spacing={1}
            sx={{
              display: { xs: "none", sm: "flex" },
              color: palette.muted,
              fontSize: "11px",
              textTransform: "uppercase",
              pb: 0.75,
              borderBottom: `1px solid ${palette.borderSoft}`,
            }}
          >
            <Grid item sm={3}>Id producto</Grid>
            <Grid item sm={6}>Nombre</Grid>
            <Grid item sm={3} sx={{ textAlign: "right" }}>Precio compra</Grid>
          </Grid>

          {productosPaginaActual.map((producto) => (
            <Grid
              container
              spacing={1}
              key={producto.id_producto}
              onClick={() => handleSelectProducto(producto)}
              sx={{
                py: 1,
                borderBottom: `1px solid ${palette.borderSoft}`,
                alignItems: "center",
                cursor: "pointer",
                "&:hover": { backgroundColor: palette.accentSoft },
              }}
            >
              <Grid item xs={12} sm={3}>
                <Typography sx={{ color: palette.accent, fontSize: "13px", fontWeight: 800 }}>
                  {producto.id_producto}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ color: palette.text, fontSize: "13px" }}>
                  {producto.nombre}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 800, textAlign: { xs: "left", sm: "right" } }}>
                  {Money({ value: producto.precio_compra })}
                </Typography>
              </Grid>
            </Grid>
          ))}

          {productosPaginaActual.length === 0 && (
            <Typography sx={{ color: palette.muted, fontSize: "13px", py: 3, textAlign: "center" }}>
              Sin resultados para la busqueda.
            </Typography>
          )}

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mt: 2 }}>
            <AppButton onClick={() => setProductoPagina(prev => Math.max(0, prev - 1))}>
              Anterior
            </AppButton>
            <Typography sx={{ color: palette.muted, fontSize: "12px", fontWeight: 700 }}>
              Pagina {productoPagina + 1} de {totalPaginasProducto}
            </Typography>
            <AppButton onClick={() => setProductoPagina(prev => Math.min(totalPaginasProducto - 1, prev + 1))}>
              Siguiente
            </AppButton>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
