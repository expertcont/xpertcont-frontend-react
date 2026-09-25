import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import DaySelector from "../../../AdminDias";
import palette from "../../../../../theme/palette";
import TrFiltros from "../../common/components/TrFiltros";
import useTrCatalogos from "../../common/hooks/useTrCatalogos";
import useTrOperaciones from "../../common/hooks/useTrOperaciones";
import GremEditorDialog, { cargarUbigeosGrem } from "./GremEditorDialog";
import GremList from "./GremList";
import { fechaHoyLima } from "./gremUtils";

export default function GremPage() {
  const backHost = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const params = useParams();
  const navigate = useNavigate();
  const [diaSel, setDiaSel] = useState(() => fechaHoyLima().slice(-2));
  const [periodoTrabajo, setPeriodoTrabajo] = useState("");
  const [contabilidadTrabajo, setContabilidadTrabajo] = useState("");
  const [puntoVentaTrabajo, setPuntoVentaTrabajo] = useState("");
  const [gremList, setGremList] = useState([]);
  const [loadingGrem, setLoadingGrem] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [gremActiva, setGremActiva] = useState(null);
  const [ubigeosGrem, setUbigeosGrem] = useState([]);
  const [ubigeosGremLoading, setUbigeosGremLoading] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const {
    periodoSelect,
    contabilidadSelect,
    rutasDisponibles,
    placasDisponibles,
    licenciasDisponibles,
    puntosVentaAsignados,
    setPuntosVentaAsignados,
    cargarPeriodos,
    cargarContabilidades,
    cargarPuntosVentaAsignados,
    cargarRutas,
    cargarPlacas,
    cargarLicencias,
  } = useTrCatalogos({
    back_host: backHost,
    params,
    contabilidadTrabajo,
    tipoOperacionFijo: "E",
    puntoVentaTrabajo,
    setPuntoVentaTrabajo,
  });

  const {
    data: encomiendas,
    loading: loadingEncomiendas,
    cargarRegistros,
    aplicarBusquedaLocal,
  } = useTrOperaciones({
    back_host: backHost,
    params,
    periodoTrabajo,
    contabilidadTrabajo,
    diaSel,
    puntoVentaTrabajo,
    tipoOperacionFijo: "E",
  });

  const cargarGrem = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || !params.id_anfitrion) return;

    setLoadingGrem(true);
    try {
      const response = await axios.get(`${backHost}/mve_transventa/grem/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}`);
      setGremList(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      setGremList([]);
    } finally {
      setLoadingGrem(false);
    }
  }, [backHost, contabilidadTrabajo, params.id_anfitrion, periodoTrabajo]);

  useEffect(() => {
    const periodoHistorial = sessionStorage.getItem("periodo_trabajo") || params.periodo;
    const contabilidadHistorial = sessionStorage.getItem("contabilidad_trabajo") || params.documento_id;
    cargarPeriodos(periodoHistorial, setPeriodoTrabajo);
    cargarContabilidades(contabilidadHistorial, setContabilidadTrabajo);
  }, [cargarContabilidades, cargarPeriodos, params.documento_id, params.periodo]);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros, updateTrigger]);

  useEffect(() => {
    aplicarBusquedaLocal();
  }, [aplicarBusquedaLocal]);

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
    let activo = true;
    setUbigeosGremLoading(true);
    cargarUbigeosGrem(backHost)
      .then((data) => {
        if (activo) setUbigeosGrem(data);
      })
      .catch((error) => {
        console.log("No se pudo precargar ubigeos GREM:", error);
        if (activo) setUbigeosGrem([]);
      })
      .finally(() => {
        if (activo) setUbigeosGremLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [backHost]);

  useEffect(() => {
    cargarGrem();
  }, [cargarGrem, updateTrigger]);

  const refrescar = () => {
    setUpdateTrigger(Date.now());
  };

  const handlePeriodoSelect = (periodo) => {
    setPeriodoTrabajo(periodo);
    sessionStorage.setItem("periodo_trabajo", periodo);
  };

  const handleContabilidadSelect = (documentoId) => {
    if (documentoId === contabilidadTrabajo) return;
    setContabilidadTrabajo(documentoId);
    setPuntosVentaAsignados([]);
    setPuntoVentaTrabajo("");
    sessionStorage.setItem("contabilidad_trabajo", documentoId);
    navigate(`/ad_transportegrem/${params.id_anfitrion}/${params.id_invitado}/${periodoTrabajo}/${documentoId}`);
  };

  const handlePuntoVentaSelect = (puntoVenta) => {
    setPuntoVentaTrabajo(puntoVenta);
    const sessionKey = `punto_venta_trabajo_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
    if (puntoVenta) {
      sessionStorage.setItem(sessionKey, puntoVenta);
    }
  };

  const abrirNuevaGrem = () => {
    setGremActiva(null);
    setEditorOpen(true);
  };

  const abrirEditarGrem = (grem) => {
    setGremActiva(grem);
    setEditorOpen(true);
  };

  const abrirEnvioGrem = (grem) => {
    if (grem?.vfirmado) return;
    setGremActiva(grem);
    setEditorOpen(true);
  };

  return (
    <Box sx={{ minHeight: "100%", backgroundColor: "transparent", p: { xs: 1, md: 4 } }}>
      <Box sx={{ width: "100%", maxWidth: { xs: "100%", lg: 1280, xl: 1440 }, mx: "auto", display: "grid", gap: 1.4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 1, sm: 2 },
            mb: { xs: 0, md: 1.6 },
          }}
        >
          <Box>
          <Typography sx={{ color: palette.text, fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>
            GREM Encomiendas
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: 13, mt: 0.4 }}>
            Guias de remision transportista de encomiendas
          </Typography>
          </Box>
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
        />

        <DaySelector period={periodoTrabajo || params.periodo} onDaySelect={(day) => setDiaSel(day === "*" ? "*" : day.toString().padStart(2, "0"))} />

        <GremList
          gremList={gremList}
          loading={loadingGrem}
          onAgregar={abrirNuevaGrem}
          onEditar={abrirEditarGrem}
          onEnviar={abrirEnvioGrem}
        />

        <GremEditorDialog
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSaved={refrescar}
          backHost={backHost}
          periodoTrabajo={periodoTrabajo}
          documentoId={contabilidadTrabajo}
          idAnfitrion={params.id_anfitrion}
          idInvitado={params.id_invitado}
          encomiendas={encomiendas}
          puntoVentaTrabajo={puntoVentaTrabajo}
          rutasDisponibles={rutasDisponibles}
          puntosVentaAsignados={puntosVentaAsignados}
          placasDisponibles={placasDisponibles}
          licenciasDisponibles={licenciasDisponibles}
          ubigeosPrecargados={ubigeosGrem}
          ubigeosPrecargando={ubigeosGremLoading}
          initialGrem={gremActiva}
          loadingEncomiendas={loadingEncomiendas}
        />
      </Box>
    </Box>
  );
}
