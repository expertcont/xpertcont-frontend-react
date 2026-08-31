import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable, { createTheme } from "react-data-table-component";
import { Box } from "@mui/material";
import { Search, Truck } from "lucide-react";
import swal2 from "sweetalert2";

import DaySelector from "../../AdminDias";
import { useDialog } from "../../AdminConfirmDialogProvider";
import palette from "../../../../theme/palette";
import TrBoletoModal from "../TrBoletoModal";
import TrEncomiendaModal from "../encomienda/modal/TrEncomiendaModal";
import TrHeader from "./components/TrHeader";
import TrFiltros from "./components/TrFiltros";
import { createColumns, customStyles } from "./components/TrOperacionRow";
import useTrCatalogos from "./hooks/useTrCatalogos";
import useTrOperaciones from "./hooks/useTrOperaciones";

// Tema oscuro propio de las tablas del modulo transporte.
createTheme(
  "transportesDark",
  {
    text: { primary: palette.text, secondary: palette.accent },
    background: { default: "transparent" },
    context: { background: palette.accent, text: "#FFFFFF" },
    divider: { default: palette.borderSoft },
    action: {
      button: "rgba(255,255,255,.54)",
      hover: "rgba(42,161,152,0.06)",
      disabled: "rgba(255,255,255,.12)",
    },
  },
  "dark",
);

export default function TrModuloBase({
  tipoOperacionFijo = "E",
  titulo = "Control de Encomiendas",
  contadorTexto = "encomiendas registradas",
  nuevoTexto = "Nueva encomienda",
  buscarTexto = "Buscar encomienda...",
  modalNuevoTitulo = "Nueva encomienda",
  modalEditarTitulo = "Editar encomienda",
  sinDatosTexto = "Sin encomiendas para el filtro actual",
  footerTexto = "Encomiendas de transporte registradas en mve_transventa.",
  basePath = "/ad_transportesencomienda",
}) {
  /*
    Componente base del modulo.

    Este componente se reutiliza para:
    - Encomiendas: tipoOperacionFijo = "E"
    - Boletos: tipoOperacionFijo = "B"

    Flujo general:
    1. Lee parametros de ruta y recupera periodo/empresa desde sessionStorage.
    2. Carga catalogos necesarios para la cabecera y el modal.
    3. Carga mve_transventa y filtra por tipo de operacion.
    4. Renderiza cabecera, filtros, selector de dia, tabla y modal correspondiente.
  */
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const params = useParams();
  const navigate = useNavigate();
  const { confirmDialog } = useDialog();

  // -----------------------------
  // Estado principal de pantalla
  // -----------------------------

  const [diaSel, setDiaSel] = useState("*");
  const [periodoTrabajo, setPeriodoTrabajo] = useState("");
  const [contabilidadTrabajo, setContabilidadTrabajo] = useState("");
  const [puntoVentaTrabajo, setPuntoVentaTrabajo] = useState("");

  // updateTrigger fuerza recarga luego de guardar, eliminar o registrar entrega.
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Estado del modal de alta/edicion.
  const [modalOperacionOpen, setModalOperacionOpen] = useState(false);
  const [operacionEditando, setOperacionEditando] = useState(null);

  // -----------------------------
  // Catalogos y operaciones
  // -----------------------------

  const {
    periodoSelect,
    contabilidadSelect,
    rutasDisponibles,
    placasDisponibles,
    licenciasDisponibles,
    zonasDisponibles,
    puntosVentaAsignados,
    setPuntosVentaAsignados,
    cargarPeriodos,
    cargarContabilidades,
    cargarPuntosVentaAsignados,
    cargarRutas,
    cargarPlacas,
    cargarLicencias,
    cargarZonas,
  } = useTrCatalogos({
    back_host,
    params,
    contabilidadTrabajo,
    tipoOperacionFijo,
    puntoVentaTrabajo,
    setPuntoVentaTrabajo,
  });

  const {
    data,
    valorBusqueda,
    setValorBusqueda,
    loading,
    cargarRegistros,
    aplicarBusquedaLocal,
    quitarOperacionLocal,
  } = useTrOperaciones({
    back_host,
    params,
    periodoTrabajo,
    contabilidadTrabajo,
    diaSel,
    puntoVentaTrabajo,
    tipoOperacionFijo,
  });

  // Fecha enviada al modal. Si el filtro esta en "todos", usa hoy cuando pertenece al periodo.
  const fechaOperacion = useMemo(() => {
    if (!periodoTrabajo) {
      return "";
    }

    if (diaSel !== "*") {
      return `${periodoTrabajo}-${diaSel}`;
    }

    const hoy = new Date().toISOString().slice(0, 10);
    return hoy.startsWith(periodoTrabajo) ? hoy : `${periodoTrabajo}-01`;
  }, [diaSel, periodoTrabajo]);

  // -----------------------------
  // Efectos de carga y refresco
  // -----------------------------

  // Primera carga: periodo y empresa se recuperan desde sessionStorage o desde la URL.
  useEffect(() => {
    const periodoHistorial = sessionStorage.getItem("periodo_trabajo") || params.periodo;
    const contabilidadHistorial = sessionStorage.getItem("contabilidad_trabajo") || params.documento_id;

    cargarPeriodos(periodoHistorial, setPeriodoTrabajo);
    cargarContabilidades(contabilidadHistorial, setContabilidadTrabajo);
  }, [cargarContabilidades, cargarPeriodos, params.documento_id, params.periodo]);

  // Recarga operaciones cuando cambia periodo, empresa, dia, punto de venta o updateTrigger.
  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros, updateTrigger]);

  // Busqueda local: no vuelve al backend, solo filtra tablaBase.
  useEffect(() => {
    aplicarBusquedaLocal();
  }, [aplicarBusquedaLocal]);

  // Catalogos dependientes de empresa o punto operativo.
  useEffect(() => {
    cargarPuntosVentaAsignados();
  }, [cargarPuntosVentaAsignados]);

  useEffect(() => {
    cargarRutas();
  }, [cargarRutas]);

  useEffect(() => {
    cargarPlacas();
  }, [cargarPlacas]);

  useEffect(() => {
    cargarLicencias();
  }, [cargarLicencias]);

  useEffect(() => {
    cargarZonas();
  }, [cargarZonas]);

  // -----------------------------
  // Handlers de filtros
  // -----------------------------

  const actualizaValorFiltro = (event) => {
    setValorBusqueda(event.target.value);
  };

  const handleDayFilter = (selectedDay) => {
    const dia = selectedDay === "*" ? "*" : selectedDay.toString().padStart(2, "0");
    setDiaSel(dia);
  };

  const handlePeriodoSelect = (periodo) => {
    setPeriodoTrabajo(periodo);
    sessionStorage.setItem("periodo_trabajo", periodo);
    setDiaSel("*");
  };

  const handleContabilidadSelect = (documentoId) => {
    if (documentoId === contabilidadTrabajo) {
      return;
    }

    setContabilidadTrabajo(documentoId);
    setPuntosVentaAsignados([]);
    setPuntoVentaTrabajo("");
    sessionStorage.setItem("contabilidad_trabajo", documentoId);
    const seleccionada = contabilidadSelect.find(item => item.documento_id === documentoId);
    if (seleccionada?.razon_social) {
      sessionStorage.setItem("contabilidad_nombre", seleccionada.razon_social);
    }
    navigate(`${basePath}/${params.id_anfitrion}/${params.id_invitado}/${periodoTrabajo}/${documentoId}`);
  };

  const handlePuntoVentaSelect = (puntoVenta) => {
    setPuntoVentaTrabajo(puntoVenta);
    const sessionKey = `punto_venta_trabajo_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
    if (puntoVenta) {
      sessionStorage.setItem(sessionKey, puntoVenta);
    }
  };

  // -----------------------------
  // Handlers de operaciones
  // -----------------------------

  // Abre el modal en modo nuevo o edicion. Para encomiendas exige punto operativo.
  const solicitarOperacion = (operacion = null) => {
    if (!operacion && tipoOperacionFijo === "E" && !puntoVentaTrabajo) {
      swal2.fire({
        title: "Selecciona punto de venta",
        text: "Para emitir una encomienda primero selecciona un punto de venta.",
        icon: "warning",
        confirmButtonText: "ACEPTAR",
      });
      return;
    }

    setOperacionEditando(operacion);
    setModalOperacionOpen(true);
  };

  const cerrarModalOperacion = () => {
    setModalOperacionOpen(false);
    setOperacionEditando(null);
  };

  // Une datos del modal con datos de ruta/usuario/periodo antes de enviar POST o PUT.
  const guardarOperacion = async (datosOperacion) => {
    const esEdicion = Boolean(operacionEditando);

    if (tipoOperacionFijo === "E" && !puntoVentaTrabajo) {
      swal2.fire({
        title: "Selecciona punto de venta",
        text: "Para guardar una encomienda primero selecciona un punto de venta.",
        icon: "warning",
        confirmButtonText: "ACEPTAR",
      });
      return;
    }

    const payload = {
      ...datosOperacion,
      id_usuario: params.id_anfitrion,
      id_anfitrion: params.id_anfitrion,
      id_invitado: params.id_invitado,
      documento_id: contabilidadTrabajo,
      periodo: periodoTrabajo,
      r_cod: esEdicion ? operacionEditando.r_cod : datosOperacion.r_cod,
      r_serie: esEdicion ? operacionEditando.r_serie : datosOperacion.r_serie,
      r_numero: esEdicion ? operacionEditando.r_numero : datosOperacion.r_numero,
      elemento: operacionEditando?.elemento || 1,
      cantidad: 1,
      ctrl_crea_us: params.id_invitado,
      ctrl_mod_us: params.id_invitado,
    };

    try {
      const response = await fetch(`${back_host}/mve_transventa`, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const dataResponse = await response.json();

      if (!response.ok || !dataResponse.success) {
        throw new Error(dataResponse.message || "No se pudo guardar la encomienda.");
      }

      cerrarModalOperacion();
      setUpdateTrigger(Date.now());
    } catch (error) {
      swal2.fire({
        title: "No se pudo guardar",
        text: error.message || "Error interno.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
      });
    }
  };

  // Elimina una operacion completa identificada por la llave de mve_transventa.
  const handleDelete = async (operacion) => {
    const result = await confirmDialog({
      title: "Eliminar operacion?",
      message: `${operacion.numero} - ${operacion.clienteLabel}`,
      icon: "warning",
      confirmText: "ELIMINAR",
      cancelText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transventa/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${operacion.r_cod}/${operacion.r_serie}/${operacion.r_numero}/${operacion.elemento || 1}`, {
        method: "DELETE",
      });
      const dataResponse = await response.json();

      if (!response.ok || !dataResponse.success) {
        throw new Error(dataResponse.message || "No se pudo eliminar la operacion.");
      }

      quitarOperacionLocal(operacion);
    } catch (error) {
      swal2.fire({
        title: "No se pudo eliminar",
        text: error.message || "Error interno.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
      });
    }
  };

  // Registra datos de entrega desde el listado principal de encomiendas.
  const handleEntrega = async (operacion) => {
    const fechaDefault = new Date().toISOString().slice(0, 10);
    const result = await swal2.fire({
      title: "Registrar entrega",
      color: palette.text,
      background: palette.surface,
      confirmButtonText: "REGISTRAR",
      cancelButtonText: "CANCELAR",
      showCancelButton: true,
      html: `
        <input id="entrega_fecha" type="date" class="swal2-input" value="${String(operacion.entrega_fecha || fechaDefault).slice(0, 10)}" />
        <input id="entrega_documento" class="swal2-input" placeholder="Documento recibe" value="${operacion.entrega_documento || ""}" />
        <input id="entrega_nombres" class="swal2-input" placeholder="Nombres recibe" value="${operacion.entrega_nombres || ""}" />
      `,
      preConfirm: () => {
        const entrega_fecha = document.getElementById("entrega_fecha")?.value;
        const entrega_documento = document.getElementById("entrega_documento")?.value?.trim();
        const entrega_nombres = document.getElementById("entrega_nombres")?.value?.trim();

        if (!entrega_fecha || !entrega_documento || !entrega_nombres) {
          swal2.showValidationMessage("Completa fecha, documento y nombres.");
          return false;
        }

        return { entrega_fecha, entrega_documento, entrega_nombres };
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`${back_host}/mve_transventa/entrega`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodo: periodoTrabajo,
          id_usuario: params.id_anfitrion,
          id_anfitrion: params.id_anfitrion,
          id_invitado: params.id_invitado,
          documento_id: contabilidadTrabajo,
          r_cod: operacion.r_cod,
          r_serie: operacion.r_serie,
          r_numero: operacion.r_numero,
          elemento: operacion.elemento || 1,
          entrega_ctrl_us: params.id_invitado,
          ...result.value,
        }),
      });
      const dataResponse = await response.json();

      if (!response.ok || !dataResponse.success) {
        throw new Error(dataResponse.message || "No se pudo registrar la entrega.");
      }

      setUpdateTrigger(Date.now());
    } catch (error) {
      swal2.fire({
        title: "No se pudo registrar",
        text: error.message || "Error interno.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
      });
    }
  };

  // -----------------------------
  // Renderizado del formulario
  // -----------------------------

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.bg, p: { xs: 1, md: 4 } }}>
      <Box sx={{ maxWidth: 980, mx: "auto" }}>
        <TrHeader
          titulo={titulo}
          contador={data.length}
          contadorTexto={contadorTexto}
          nuevoTexto={nuevoTexto}
          buscarTexto={buscarTexto}
          valorBusqueda={valorBusqueda}
          nuevoDeshabilitado={tipoOperacionFijo === "E" && !puntoVentaTrabajo}
          onNuevo={() => solicitarOperacion()}
          onBuscar={actualizaValorFiltro}
        />

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
        />

        <DaySelector period={periodoTrabajo || params.periodo} onDaySelect={handleDayFilter} />

        <DataTable
          theme="transportesDark"
          columns={createColumns({
            onEdit: solicitarOperacion,
            onDelete: handleDelete,
            onEntrega: handleEntrega,
          })}
          data={data}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          highlightOnHover
          responsive
          customStyles={customStyles}
          noDataComponent={
            <Box sx={{ py: 4, color: palette.muted, display: "flex", alignItems: "center", gap: 1 }}>
              <Search size={16} />
              {sinDatosTexto}
            </Box>
          }
        />

        {tipoOperacionFijo === "E" && (
          <TrEncomiendaModal
            open={modalOperacionOpen}
            back_host={back_host}
            idAnfitrion={params.id_anfitrion}
            documentoId={contabilidadTrabajo}
            operacion={operacionEditando}
            periodoTrabajo={periodoTrabajo}
            fechaOperacion={fechaOperacion}
            rutasDisponibles={rutasDisponibles}
            puntoVentaOrigen={puntoVentaTrabajo}
            puntoVentaOrigenNombre={puntosVentaAsignados.find((item) => item.id_punto_venta === puntoVentaTrabajo)?.nombre || puntoVentaTrabajo}
            zonasDisponibles={zonasDisponibles}
            placasDisponibles={placasDisponibles}
            licenciasDisponibles={licenciasDisponibles}
            modalNuevoTitulo={modalNuevoTitulo}
            modalEditarTitulo={modalEditarTitulo}
            onClose={cerrarModalOperacion}
            onSubmit={guardarOperacion}
          />
        )}

        {tipoOperacionFijo === "B" && (
          <TrBoletoModal
            open={modalOperacionOpen}
            operacion={operacionEditando}
            periodoTrabajo={periodoTrabajo}
            fechaOperacion={fechaOperacion}
            rutasDisponibles={rutasDisponibles}
            modalNuevoTitulo={modalNuevoTitulo}
            modalEditarTitulo={modalEditarTitulo}
            onClose={cerrarModalOperacion}
            onSubmit={guardarOperacion}
          />
        )}

        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, color: palette.muted, fontSize: "12px" }}>
          <Truck size={14} />
          {footerTexto}
        </Box>
      </Box>
    </Box>
  );
}
