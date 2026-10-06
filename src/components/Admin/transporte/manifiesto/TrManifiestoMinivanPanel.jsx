import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Bus, CheckCircle2, Clock, RefreshCw, Trash2, Unlock } from "lucide-react";

import palette from "../../../../theme/palette";
import asientoChoferImg from "../../../../assets/images/asiento00.png";
import asientoDisponibleImg from "../../../../assets/images/asiento01.png";
import asientoOcupadoImg from "../../../../assets/images/asiento02.png";
import AppButton from "../../../ui/AppButton";
import TrBoletoModal from "../TrBoletoModal";
import TrManifiestoModal from "./TrManifiestoModal";

const CAPACIDAD_GENERAL_MINIVAN = 20;

const panelSx = {
  mt: 1,
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(230px, 400px))" },
  gap: 1,
  justifyContent: "flex-start",
};

const asientoSx = (ocupado, cerrado) => ({
  width: "100%",
  height: 54,
  border: 0,
  backgroundColor: "transparent",
  color: ocupado ? palette.success : cerrado ? palette.muted : palette.text,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  p: 0,
  cursor: cerrado ? "default" : "pointer",
  position: "relative",
  overflow: "visible",
  transition: "transform .16s ease, filter .16s ease",
  "&:hover": cerrado ? {} : {
    transform: "translateY(-2px)",
    filter: "drop-shadow(0 7px 10px rgba(0,0,0,.22))",
  },
  "&:disabled": {
    opacity: 1,
  },
});

const asientoImgSx = (cerrado) => ({
  width: "100%",
  maxWidth: 50,
  height: 50,
  objectFit: "contain",
  display: "block",
  opacity: cerrado ? 0.62 : 1,
  filter: "drop-shadow(0 3px 4px rgba(0,0,0,.2))",
  pointerEvents: "none",
});

const asientoNumeroSx = (ocupado) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  minWidth: 22,
  height: 20,
  px: 0.4,
  borderRadius: 999,
  backgroundColor: ocupado ? "rgba(17, 24, 39, .7)" : "rgba(255, 255, 255, .78)",
  color: ocupado ? "#ffffff" : "#122032",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: "20px",
  textAlign: "center",
  pointerEvents: "none",
});

const pasajeroMiniSx = {
  position: "absolute",
  left: 4,
  right: 4,
  bottom: 1,
  px: 0.35,
  py: 0.1,
  borderRadius: "5px",
  backgroundColor: "rgba(17, 24, 39, .76)",
  color: "#fff",
  fontSize: "8.5px",
  fontWeight: 900,
  lineHeight: 1.05,
  textAlign: "center",
  pointerEvents: "none",
};

const minivanSx = {
  position: "relative",
  maxWidth: 360,
  mx: "auto",
  px: { xs: 3.2, sm: 4 },
  pt: 2.35,
  pb: 1.7,
  minHeight: 510,
  overflow: "hidden",
};

const manifiestoCardSx = {
  border: "none",
  backgroundColor: "transparent",
  borderRadius: 0,
  p: 0.35,
  width: "100%",
  maxWidth: 400,
  mx: 0,
};

const manifiestoCerradoSx = {
  ...manifiestoCardSx,
  maxWidth: 230,
  p: 0.65,
  backgroundColor: "transparent",
  opacity: 0.86,
};

const minivanCerradaSx = {
  ...minivanSx,
  maxWidth: 178,
  px: 1.55,
  pt: 1.3,
  pb: 1,
  minHeight: 248,
};

const asientoCerradoSx = {
  width: "100%",
  height: 28,
  border: 0,
  backgroundColor: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: 0,
  position: "relative",
  overflow: "visible",
};

const cabinaCerradaSx = {
  display: "grid",
  gridTemplateColumns: "minmax(0, .92fr) 2px minmax(0, .58fr) minmax(0, .58fr)",
  gap: 0,
  alignItems: "center",
  width: "69%",
  mx: "auto",
  px: { xs: 0.6, sm: 0.8 },
  py: 0.1,
};

const listaPasajerosCerradaSx = {
  position: "relative",
  zIndex: 1,
  width: "74%",
  mx: "auto",
  mt: 0.75,
  display: "grid",
  gap: 0.18,
};

const minivanBodySvgSx = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  color: palette.surface,
  "& .van-main": {
    fill: palette.surface,
    stroke: palette.border,
    strokeWidth: 2,
  },
  "& .van-glass": {
    fill: palette.bg,
    stroke: palette.borderSoft,
    strokeWidth: 1.5,
    opacity: 0.9,
  },
  "& .van-line": {
    fill: "none",
    stroke: palette.borderSoft,
    strokeWidth: 1.4,
    opacity: 0.85,
  },
  "& .van-wheel": {
    fill: palette.text,
    opacity: 0.18,
  },
};

const filaSx = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 0,
  alignItems: "stretch",
  width: { xs: "84%", sm: "82%" },
  mx: "auto",
};

const cabinaSx = {
  display: "grid",
  gridTemplateColumns: "minmax(0, .92fr) 2px minmax(0, .58fr) minmax(0, .58fr)",
  gap: 0,
  alignItems: "center",
  width: { xs: "72%", sm: "69%" },
  mx: "auto",
  px: { xs: 1, sm: 1.25 },
  py: 0.25,
};

const cuerpoAsientosSx = {
  display: "grid",
  gap: 0.28,
  mt: 1.05,
  px: { xs: 0.25, sm: 0.4 },
  py: 0.2,
};

const pasadizoPuertaSx = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 8px minmax(0, 2.05fr)",
  gap: 0.06,
  alignItems: "center",
  minHeight: 18,
};

const maleteraAccionesSx = {
  mt: 0.2,
  mx: { xs: 3.2, sm: 4.2 },
  minHeight: 38,
  borderRadius: "0 0 18px 18px",
  borderTop: `1px solid ${palette.borderSoft}`,
  backgroundColor: "rgba(255,255,255,.34)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 0.55,
  px: 0.8,
  position: "relative",
  zIndex: 1,
};

const MODELO_GENERAL_MINIVAN = [
  { tipo: "fila", asientos: [3, 4, 5, 6] },
  { tipo: "pasadizo" },
  { tipo: "fila", asientos: [7, 8, null, 9] },
  { tipo: "fila", asientos: [10, 11, null, 12] },
  { tipo: "fila", asientos: [13, 14, 15, 16] },
  { tipo: "fila", asientos: [17, 18, 19, 20] },
];

const obtenerCapacidad = (manifiesto, ruta, placa) => {
  const candidatos = [
    manifiesto?.capacidad,
    manifiesto?.capacidad_asientos,
    manifiesto?.asientos,
    placa?.asientos,
    ruta?.capacidad,
    ruta?.capacidad_asientos,
    ruta?.capacidad_pasajeros,
  ].map(Number).filter((n) => Number.isFinite(n) && n > 0);

  return Math.min(Math.max(candidatos[0] || CAPACIDAD_GENERAL_MINIVAN, CAPACIDAD_GENERAL_MINIVAN), CAPACIDAD_GENERAL_MINIVAN);
};

const pasajeroAsiento = (pasajeros, numero) => (
  pasajeros.find((item, index) => Number(item.asiento || index + 1) === numero)
);

export default function TrManifiestoMinivanPanel({
  backHost,
  idAnfitrion,
  idInvitado,
  documentoId,
  periodoTrabajo,
  fechaOperacion,
  puntoVentaTrabajo,
  rutasDisponibles = [],
  placasDisponibles = [],
  puedeCrear = true,
  onGuardarBoleto,
  guardandoBoleto = false,
  guardarActionId,
}) {
  const [manifiestos, setManifiestos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [modalManifiestoOpen, setModalManifiestoOpen] = useState(false);
  const [manifiestoCierre, setManifiestoCierre] = useState(null);
  const [guardandoManifiesto, setGuardandoManifiesto] = useState(false);
  const [boletoContexto, setBoletoContexto] = useState(null);

  const rutasPorId = useMemo(() => {
    const map = new Map();
    rutasDisponibles.forEach((ruta) => map.set(String(ruta.id_ruta), ruta));
    return map;
  }, [rutasDisponibles]);

  const placasPorId = useMemo(() => {
    const map = new Map();
    placasDisponibles.forEach((placa) => map.set(String(placa.placa || "").toUpperCase(), placa));
    return map;
  }, [placasDisponibles]);

  const cargarManifiestos = useCallback(async () => {
    if (!backHost || !idAnfitrion || !documentoId || !periodoTrabajo) {
      return;
    }

    setCargando(true);
    setError("");

    try {
      const query = new URLSearchParams({
        id_usuario: idAnfitrion,
        documento_id: documentoId,
        periodo: periodoTrabajo,
      });
      if (puntoVentaTrabajo) query.set("id_punto_venta", puntoVentaTrabajo);

      const response = await fetch(`${backHost}/mve_transmanifiesto?${query.toString()}`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json.message || "No se pudieron cargar los manifiestos.");
        setManifiestos([]);
        return;
      }

      const cabeceras = Array.isArray(json.data) ? json.data : [];
      const conPasajeros = await Promise.all(cabeceras.map(async (item) => {
        try {
          const detalleResponse = await fetch(`${backHost}/mve_transmanifiesto/${item.id_manifiesto}`);
          const detalleJson = await detalleResponse.json();
          return detalleJson.success ? detalleJson.data : item;
        } catch (err) {
          return item;
        }
      }));

      setManifiestos(conPasajeros);
    } catch (err) {
      setError("No se pudo conectar con el servidor de manifiestos.");
    } finally {
      setCargando(false);
    }
  }, [backHost, documentoId, idAnfitrion, periodoTrabajo, puntoVentaTrabajo]);

  useEffect(() => {
    cargarManifiestos();
  }, [cargarManifiestos]);

  useEffect(() => {
    const abrir = () => {
      if (puedeCrear && puntoVentaTrabajo) {
        setModalManifiestoOpen(true);
      }
    };

    window.addEventListener("transporte:abrir-manifiesto", abrir);
    return () => window.removeEventListener("transporte:abrir-manifiesto", abrir);
  }, [puedeCrear, puntoVentaTrabajo]);

  const crearManifiesto = async (payload) => {
    setGuardandoManifiesto(true);
    setError("");

    try {
      if (payload.id_manifiesto || manifiestoCierre) {
        await cerrarManifiesto(payload);
        return;
      }

      const response = await fetch(`${backHost}/mve_transmanifiesto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          id_invitado: idInvitado,
          ctrl_crea_us: idInvitado,
        }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json.message || "No se pudo crear el manifiesto.");
        return;
      }

      setModalManifiestoOpen(false);
      setManifiestoCierre(null);
      await cargarManifiestos();
    } catch (err) {
      setError("No se pudo conectar con el servidor de manifiestos.");
    } finally {
      setGuardandoManifiesto(false);
    }
  };

  const cerrarManifiesto = async (manifiesto) => {
    setError("");
    const idManifiesto = manifiesto.id_manifiesto || manifiestoCierre?.id_manifiesto;
    const placa = String(manifiesto.placa || "").trim().toUpperCase();
    const licencia = String(manifiesto.licencia || "").trim().toUpperCase();

    try {
      const response = await fetch(`${backHost}/mve_transmanifiesto/${idManifiesto}/cerrar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placa, licencia, id_invitado: idInvitado, ctrl_mod_us: idInvitado }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json.message || "No se pudo cerrar el manifiesto.");
        return;
      }

      setModalManifiestoOpen(false);
      setManifiestoCierre(null);
      await cargarManifiestos();
    } catch (err) {
      setError("No se pudo conectar con el servidor de manifiestos.");
    }
  };

  const abrirCierreManifiesto = (manifiesto) => {
    if (manifiesto.estado !== "ABIERTO") return;
    setManifiestoCierre(manifiesto);
    setModalManifiestoOpen(true);
  };

  const reabrirManifiesto = async (manifiesto) => {
    if (manifiesto.estado === "ABIERTO") return;
    const confirmado = window.confirm(`Reabrir manifiesto ${manifiesto.id_manifiesto}?`);
    if (!confirmado) return;

    setError("");
    try {
      const response = await fetch(`${backHost}/mve_transmanifiesto/${manifiesto.id_manifiesto}/reabrir`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_invitado: idInvitado, ctrl_mod_us: idInvitado }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json.message || "No se pudo reabrir el manifiesto.");
        return;
      }

      await cargarManifiestos();
    } catch (err) {
      setError("No se pudo conectar con el servidor de manifiestos.");
    }
  };

  const eliminarManifiesto = async (manifiesto) => {
    if (manifiesto.estado === "CERRADO") return;
    const confirmado = window.confirm(`Eliminar manifiesto ${manifiesto.id_manifiesto}?`);
    if (!confirmado) return;

    setError("");
    try {
      const response = await fetch(`${backHost}/mve_transmanifiesto/${manifiesto.id_manifiesto}`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json.message || "No se pudo eliminar el manifiesto.");
        return;
      }

      await cargarManifiestos();
    } catch (err) {
      setError("No se pudo conectar con el servidor de manifiestos.");
    }
  };

  const abrirBoleto = (manifiesto, asiento, pasajero = null) => {
    if (manifiesto.estado !== "ABIERTO") return;
    setBoletoContexto({ manifiesto, asiento, pasajero });
  };

  const guardarBoleto = async (datos) => {
    if (!boletoContexto) return null;

    const { manifiesto, asiento, pasajero } = boletoContexto;
    const guardado = await onGuardarBoleto?.({
      ...datos,
      id_manifiesto: manifiesto.id_manifiesto,
      asiento,
      periodo: manifiesto.periodo || periodoTrabajo,
      r_fecemi: manifiesto.fecha || fechaOperacion,
      id_ruta: manifiesto.id_ruta,
      id_punto_venta: manifiesto.id_punto_venta,
      id_punto_venta_dest: manifiesto.id_punto_venta_dest,
    }, pasajero ? { operacionEditando: pasajero } : {});

    if (guardado) {
      setBoletoContexto(null);
      await cargarManifiestos();
    }

    return guardado;
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.8, flexWrap: "wrap", mb: 0.8 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.65 }}>
          <Bus size={17} color={palette.accent} />
          <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 900 }}>
            Manifiestos de pasajeros
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: "11px", fontWeight: 700 }}>
            {manifiestos.length} viaje{manifiestos.length === 1 ? "" : "s"}
          </Typography>
        </Box>

        <IconButton onClick={cargarManifiestos} disabled={cargando} sx={{ color: palette.muted }}>
          <RefreshCw size={17} />
        </IconButton>
      </Box>

      {!puntoVentaTrabajo && (
        <Typography sx={{ color: palette.muted, fontSize: "12px", mb: 0.8 }}>
          Selecciona un punto de venta para crear manifiestos.
        </Typography>
      )}

      {error && (
        <Typography sx={{ color: palette.danger, fontSize: "12px", mb: 0.8 }}>
          {error}
        </Typography>
      )}

      {cargando && (
        <Typography sx={{ color: palette.muted, fontSize: "12px" }}>Cargando manifiestos...</Typography>
      )}

      {!cargando && manifiestos.length === 0 && (
        <Box sx={{ border: `1px dashed ${palette.border}`, borderRadius: 1.2, p: 1.4, color: palette.muted, fontSize: "12px" }}>
          Aun no hay manifiestos para este filtro.
        </Box>
      )}

      <Box sx={panelSx}>
        {manifiestos.map((manifiesto) => {
          const ruta = rutasPorId.get(String(manifiesto.id_ruta));
          const placaInfo = placasPorId.get(String(manifiesto.placa || "").toUpperCase());
          const pasajeros = Array.isArray(manifiesto.pasajeros) ? manifiesto.pasajeros : [];
          const capacidad = obtenerCapacidad(manifiesto, ruta, placaInfo);
          const cerrado = manifiesto.estado !== "ABIERTO";
          const destinoLabel = ruta?.punto_venta_dest_nombre || manifiesto.id_punto_venta_dest || ruta?.nombre || manifiesto.id_ruta || "-";
          const salidaLabel = manifiesto.hora_salida ? String(manifiesto.hora_salida).slice(0, 5) : "-";
          const choferLabel = manifiesto.conductor || manifiesto.chofer || manifiesto.licencia || "Sin chofer";
          const renderAsiento = (numero) => {
            if (!numero || numero > capacidad) {
              return <Box aria-hidden="true" />;
            }

            const pasajero = pasajeroAsiento(pasajeros, numero);
            const tooltip = pasajero
              ? `Editar boleto de ${pasajero.cliente || "Pasajero"} - ${pasajero.cliente_documento || pasajero.cliente_documento_id || "Sin documento"}`
              : cerrado
                ? `Asiento ${numero}`
                : `Vender boleto para asiento ${numero}`;

            return (
              <Tooltip key={numero} title={tooltip} arrow>
                <Box
                  component="button"
                  type="button"
                  sx={{
                    ...asientoSx(Boolean(pasajero), cerrado),
                    appearance: "none",
                    font: "inherit",
                  }}
                  onClick={() => abrirBoleto(manifiesto, numero, pasajero)}
                  disabled={cerrado}
                >
                  <Box
                    component="img"
                    src={pasajero ? asientoOcupadoImg : asientoDisponibleImg}
                    alt={pasajero ? `Asiento ${numero} ocupado` : `Asiento ${numero} disponible`}
                    sx={asientoImgSx(cerrado)}
                  />
                  <Typography component="span" sx={asientoNumeroSx(Boolean(pasajero))}>
                    {numero}
                  </Typography>
                  {pasajero && (
                    <Typography component="span" sx={pasajeroMiniSx} noWrap>
                      {pasajero.cliente || "Pasajero"}
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            );
          };

          if (cerrado) {
            return (
              <Box key={manifiesto.id_manifiesto} sx={manifiestoCerradoSx}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 0.7, alignItems: "flex-start", mb: 0.45 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 900 }} noWrap>
                      Manifiesto {manifiesto.id_manifiesto}
                    </Typography>
                    <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800 }} noWrap>
                      {destinoLabel} · {salidaLabel}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: palette.success, fontSize: "9px", fontWeight: 900, flexShrink: 0 }}>
                    SALIO
                  </Typography>
                </Box>

                <Box sx={minivanCerradaSx}>
                  <Box
                    component="svg"
                    viewBox="0 0 430 650"
                    preserveAspectRatio="none"
                    sx={minivanBodySvgSx}
                    aria-hidden="true"
                  >
                    <path
                      className="van-main"
                      d="M142 14 C104 16 82 45 75 101 L50 276 C43 332 45 483 62 565 C70 604 103 630 151 636 L279 636 C327 630 360 604 368 565 C385 483 387 332 380 276 L355 101 C348 45 326 16 288 14 Z"
                    />
                    <path className="van-glass" d="M148 34 C116 39 100 61 96 103 L118 120 L312 120 L334 103 C330 61 314 39 282 34 Z" />
                    <path className="van-line" d="M88 168 C115 184 158 192 215 192 C272 192 315 184 342 168" />
                    <path className="van-line" d="M78 565 C111 588 157 600 215 600 C273 600 319 588 352 565" />
                    <path className="van-line" d="M87 251 L343 251" />
                    <path className="van-line" d="M78 504 L352 504" />
                  </Box>

                  <Box sx={{ position: "relative", zIndex: 1, display: "grid", gap: 0.32, mt: 1.45 }}>
                    <Box sx={cabinaCerradaSx}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Box
                          component="img"
                          src={asientoChoferImg}
                          alt="Chofer"
                          sx={{
                            width: "100%",
                            maxWidth: 31,
                            height: 31,
                            objectFit: "contain",
                            opacity: 0.82,
                            filter: "drop-shadow(0 2px 3px rgba(0,0,0,.2))",
                          }}
                        />
                      </Box>
                      <Box sx={{ minHeight: 24, opacity: 0 }} />
                      <Box sx={asientoCerradoSx} />
                      <Box sx={asientoCerradoSx} />
                    </Box>
                  </Box>

                  <Box sx={listaPasajerosCerradaSx}>
                    {pasajeros.slice(0, 8).map((pasajero, index) => {
                      const numeroAsiento = pasajero.asiento || index + 1;
                      return (
                        <Tooltip key={`${numeroAsiento}-${index}`} title={pasajero.cliente || "Pasajero"} arrow>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "18px minmax(0, 1fr)",
                              gap: 0.35,
                              alignItems: "center",
                              minHeight: 18,
                              px: 0.35,
                              borderRadius: "5px",
                              backgroundColor: "rgba(17, 24, 39, .55)",
                              color: "#ffffff",
                            }}
                          >
                            <Typography sx={{ fontSize: "8px", fontWeight: 900, textAlign: "center" }}>
                              {numeroAsiento}
                            </Typography>
                            <Typography sx={{ fontSize: "8.5px", fontWeight: 850 }} noWrap>
                              {pasajero.cliente || "Pasajero"}
                            </Typography>
                          </Box>
                        </Tooltip>
                      );
                    })}
                    {pasajeros.length > 8 && (
                      <Typography sx={{ color: palette.muted, fontSize: "8.5px", fontWeight: 900, textAlign: "center" }}>
                        +{pasajeros.length - 8} pasajeros
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, mt: 0.35 }} noWrap>
                  {choferLabel} · {manifiesto.placa || "Sin placa"} · {pasajeros.length}/{capacidad}
                </Typography>
                <Box sx={{ mt: 0.45, display: "flex", justifyContent: "center" }}>
                  <AppButton
                    icon={<Unlock size={13} />}
                    onClick={() => reabrirManifiesto(manifiesto)}
                    sx={{ height: 28, px: 0.75, fontSize: "10px", fontWeight: 900 }}
                  >
                    Reabrir manifiesto
                  </AppButton>
                </Box>
              </Box>
            );
          }

          return (
            <Box key={manifiesto.id_manifiesto} sx={manifiestoCardSx}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.8 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 900 }}>
                    Manifiesto {manifiesto.id_manifiesto}
                  </Typography>
                  <Typography sx={{ color: palette.muted, fontSize: "11px", fontWeight: 700 }} noWrap>
                    {destinoLabel} · {manifiesto.fecha || "-"}
                  </Typography>
                  <Typography sx={{ color: palette.muted, fontSize: "10.5px", fontWeight: 700 }} noWrap>
                    {manifiesto.hora_salida ? `Salida ${salidaLabel} · ` : ""}
                    {manifiesto.placa || "Sin placa"} · {manifiesto.licencia || "Sin licencia"}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography sx={{ color: cerrado ? palette.muted : palette.accent, fontSize: "10px", fontWeight: 900 }}>
                    {manifiesto.estado}
                  </Typography>
                  <Typography sx={{ color: palette.text, fontSize: "16px", fontWeight: 900 }}>
                    {pasajeros.length}/{capacidad}
                  </Typography>
                </Box>
              </Box>

              <Box sx={minivanSx}>
                <Box
                  component="svg"
                  viewBox="0 0 430 650"
                  preserveAspectRatio="none"
                  sx={minivanBodySvgSx}
                  aria-hidden="true"
                >
                  <path
                    className="van-main"
                    d="M142 14 C104 16 82 45 75 101 L50 276 C43 332 45 483 62 565 C70 604 103 630 151 636 L279 636 C327 630 360 604 368 565 C385 483 387 332 380 276 L355 101 C348 45 326 16 288 14 Z"
                  />
                  <path className="van-glass" d="M148 34 C116 39 100 61 96 103 L118 120 L312 120 L334 103 C330 61 314 39 282 34 Z" />
                  <path className="van-line" d="M88 168 C115 184 158 192 215 192 C272 192 315 184 342 168" />
                  <path className="van-line" d="M78 565 C111 588 157 600 215 600 C273 600 319 588 352 565" />
                  <path className="van-line" d="M87 251 L343 251" />
                  <path className="van-line" d="M78 504 L352 504" />
                  <rect className="van-wheel" x="38" y="160" width="22" height="76" rx="9" />
                  <rect className="van-wheel" x="370" y="160" width="22" height="76" rx="9" />
                  <rect className="van-wheel" x="37" y="457" width="22" height="84" rx="9" />
                  <rect className="van-wheel" x="371" y="457" width="22" height="84" rx="9" />
                </Box>

                <Box sx={{ position: "relative", zIndex: 1, display: "grid", gap: 0.78, mt: 3 }}>
                  <Box sx={cabinaSx}>
                    <Box sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Box
                        component="img"
                        src={asientoChoferImg}
                        alt="Chofer"
                          sx={{
                            width: "100%",
                            maxWidth: 58,
                            height: 58,
                            objectFit: "contain",
                            filter: "drop-shadow(0 3px 4px rgba(0,0,0,.24))",
                          }}
                      />
                    </Box>
                    <Box sx={{
                      minHeight: 46,
                      borderRadius: 999,
                      opacity: 0,
                    }} />
                    {renderAsiento(1)}
                    {renderAsiento(2)}
                  </Box>

                  <Box sx={cuerpoAsientosSx}>
                    {MODELO_GENERAL_MINIVAN.map((fila, index) => (
                      <React.Fragment key={`modelo-${index}`}>
                        {fila.tipo === "pasadizo" ? (
                          <Box sx={pasadizoPuertaSx}>
                            <Box sx={{
                              height: 16,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}>
                              <Typography sx={{ color: palette.muted, fontSize: "8px", fontWeight: 900, opacity: 0.72 }}>
                                PUERTA
                              </Typography>
                            </Box>
                            <Box sx={{
                              height: 18,
                              borderRadius: 999,
                              opacity: 0,
                            }} />
                            <Box sx={{
                              height: 1,
                              borderRadius: 999,
                              borderTop: `1px dashed ${palette.borderSoft}`,
                              opacity: 0.35,
                            }} />
                          </Box>
                        ) : (
                          <Box sx={filaSx}>
                            {fila.asientos.map((numero, asientoIndex) => (
                              numero
                                ? renderAsiento(numero)
                                : (
                                  <Box
                                    key={`pasillo-${index}-${asientoIndex}`}
                                    sx={{
                                      minHeight: 46,
                                      borderRadius: 999,
                                      opacity: 0,
                                    }}
                                  />
                                )
                            ))}
                          </Box>
                        )}
                      </React.Fragment>
                    ))}
                  </Box>

                  <Box sx={maleteraAccionesSx}>
                    {!cerrado && (
                      <Tooltip title="Eliminar manifiesto">
                        <IconButton onClick={() => eliminarManifiesto(manifiesto)} sx={{ color: palette.danger, width: 32, height: 32 }}>
                          <Trash2 size={15} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <AppButton
                      icon={<CheckCircle2 size={15} />}
                      disabled={cerrado}
                      onClick={() => abrirCierreManifiesto(manifiesto)}
                      sx={{ height: 32, px: 0.9, fontSize: "10.5px", fontWeight: 900 }}
                    >
                      Finalizar manifiesto
                    </AppButton>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 0.8, display: "flex", alignItems: "center", gap: 0.8 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, color: palette.muted }}>
                  <Clock size={13} />
                  <Typography sx={{ fontSize: "10.5px", fontWeight: 800 }}>
                    {manifiesto.observacion || "Sin observacion"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <TrManifiestoModal
        open={modalManifiestoOpen}
        onClose={() => {
          setModalManifiestoOpen(false);
          setManifiestoCierre(null);
        }}
        onCrear={crearManifiesto}
        manifiesto={manifiestoCierre}
        modoCierre={Boolean(manifiestoCierre)}
        id_usuario={idAnfitrion}
        documento_id={documentoId}
        puntoVentaOrigen={puntoVentaTrabajo}
        rutasDisponibles={rutasDisponibles}
        fechaServidor={fechaOperacion}
        guardando={guardandoManifiesto}
      />

      <TrBoletoModal
        open={Boolean(boletoContexto)}
        operacion={boletoContexto?.pasajero || null}
        back_host={backHost}
        periodoTrabajo={boletoContexto?.manifiesto?.periodo || periodoTrabajo}
        fechaOperacion={boletoContexto?.manifiesto?.fecha || fechaOperacion}
        rutasDisponibles={boletoContexto ? rutasDisponibles.filter((ruta) => String(ruta.id_ruta) === String(boletoContexto.manifiesto.id_ruta)) : []}
        modalNuevoTitulo={`Boleto #${boletoContexto?.asiento || ""}`}
        modalEditarTitulo="Editar boleto"
        guardarActionId={guardarActionId}
        onClose={() => setBoletoContexto(null)}
        onSubmit={guardarBoleto}
        guardando={guardandoBoleto}
      />
    </Box>
  );
}
