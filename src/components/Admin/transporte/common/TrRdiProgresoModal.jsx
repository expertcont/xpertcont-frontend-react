"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Dialog, LinearProgress, Typography } from "@mui/material";
import { Check, CircleAlert, Loader2, MinusCircle, X } from "lucide-react";

import palette from "../../../../theme/palette";

// Estados de cada paso del envio. La cola se procesa en orden y se detiene en el
// primer error: seguir despues saltaria un dia pendiente, que es justo lo que
// SUNAT no acepta.
export const ESTADO_PASO = {
  PENDIENTE: "PENDIENTE",
  ENVIANDO: "ENVIANDO",
  ENVIADO: "ENVIADO",
  ERROR: "ERROR",
  OMITIDO: "OMITIDO",
};

const diaCorto = (fecha) => {
  const iso = String(fecha || "").substring(0, 10);
  return iso.length === 10
    ? `${iso.substring(8, 10)}/${iso.substring(5, 7)}/${iso.substring(0, 4)}`
    : iso;
};

const ESTILO_ICONO = {
  PENDIENTE: { color: palette.muted, fondo: palette.surfaceAlt },
  ENVIANDO: { color: palette.accent, fondo: palette.accentSoft },
  ENVIADO: { color: palette.success, fondo: palette.successSoft },
  ERROR: { color: palette.danger, fondo: palette.dangerSoft },
  OMITIDO: { color: palette.muted, fondo: palette.surfaceAlt },
};

/**
 * Modal de progreso del envio de Resumenes Diario.
 *
 * Muestra una fila por dia, del mas antiguo al mas nuevo, y va marcando cada
 * envio a medida que avanza. No se puede cerrar mientras corre para que nadie
 * se lleve la pantalla creyendo que el resto ya se mando.
 *
 * `enviarPaso` lo resuelve el padre (es quien tiene back_host y los parametros):
 * recibe un paso y devuelve { ok, mensaje }.
 */
export default function TrRdiProgresoModal({
  abierto,
  pasos = [],
  nombreRubroPlural = "encomiendas",
  periodo = "",
  enviarPaso,
  alCerrar,
  alTerminar,
}) {
  const [estadoPasos, setEstadoPasos] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [terminado, setTerminado] = useState(false);
  const [ejecutando, setEjecutando] = useState(false);
  // Sirve para no setear estado si el padre cerro el modal a mitad del envio.
  const vivoRef = useRef(true);
  const alTerminarRef = useRef(alTerminar);
  const enviarPasoRef = useRef(enviarPaso);
  const pasosRef = useRef(pasos);

  useEffect(() => {
    alTerminarRef.current = alTerminar;
  }, [alTerminar]);

  useEffect(() => {
    enviarPasoRef.current = enviarPaso;
  }, [enviarPaso]);

  useEffect(() => {
    pasosRef.current = pasos;
  }, [pasos]);

  const procesarDesde = useCallback(async (indiceInicio = 0) => {
    const pasosActuales = pasosRef.current;
    setEjecutando(true);
    setTerminado(false);

    for (let i = indiceInicio; i < pasosActuales.length; i += 1) {
      if (!vivoRef.current) {
        setEjecutando(false);
        return;
      }

      setEstadoPasos((prev) => prev.map((estado, k) => (
        k === i ? ESTADO_PASO.ENVIANDO : estado
      )));

      let resultado = { ok: false, mensaje: "Sin respuesta del servidor.", data: null };

      try {
        resultado = await enviarPasoRef.current(pasosActuales[i]) || resultado;
      } catch (error) {
        resultado = { ok: false, mensaje: error?.message || "Error inesperado.", data: null };
      }

      if (!vivoRef.current) {
        setEjecutando(false);
        return;
      }

      setMensajes((prev) => prev.map((mensaje, k) => (
        k === i ? (resultado.mensaje || "") : mensaje
      )));
      setResultados((prev) => prev.map((item, k) => (
        k === i ? (resultado.data || resultado) : item
      )));

      const estadoFinal = resultado.ok ? ESTADO_PASO.ENVIADO : ESTADO_PASO.ERROR;
      setEstadoPasos((prev) => prev.map((estado, k) => {
        if (k === i) {
          return estadoFinal;
        }
        // Con el primer error, lo que sigue queda pendiente de reintento.
        if (estadoFinal === ESTADO_PASO.ERROR && k > i) {
          return ESTADO_PASO.OMITIDO;
        }
        return estado;
      }));

      if (!resultado.ok) {
        break;
      }
    }

    if (vivoRef.current) {
      setEjecutando(false);
      setTerminado(true);
      alTerminarRef.current?.();
    }
  }, []);

  // Cada apertura es una corrida nueva: se reinicia la lista y se procesa.
  useEffect(() => {
    if (!abierto) {
      return undefined;
    }

    vivoRef.current = true;
    setEstadoPasos(pasos.map(() => ESTADO_PASO.PENDIENTE));
    setMensajes(pasos.map(() => ""));
    setResultados(pasos.map(() => null));
    setTerminado(false);
    procesarDesde(0);

    return () => {
      vivoRef.current = false;
    };
  }, [abierto, pasos, procesarDesde]);

  const resumen = useMemo(() => {
    const enviados = estadoPasos.filter((e) => e === ESTADO_PASO.ENVIADO).length;
    const fallidos = estadoPasos.filter((e) => e === ESTADO_PASO.ERROR).length;
    const omitidos = estadoPasos.filter((e) => e === ESTADO_PASO.OMITIDO).length;
    return { enviados, fallidos, omitidos, total: pasos.length };
  }, [estadoPasos, pasos.length]);

  const indiceActual = useMemo(() => (
    estadoPasos.findIndex((e) => e === ESTADO_PASO.ENVIANDO)
  ), [estadoPasos]);

  const avance = useMemo(() => {
    if (!pasos.length) {
      return 0;
    }
    const cerrados = estadoPasos.filter(
      (e) => e === ESTADO_PASO.ENVIADO || e === ESTADO_PASO.ERROR || e === ESTADO_PASO.OMITIDO
    ).length;
    return Math.round((cerrados / pasos.length) * 100);
  }, [estadoPasos, pasos.length]);

  const cerrar = useCallback(() => {
    if (terminado && !ejecutando) {
      alCerrar?.();
    }
  }, [alCerrar, ejecutando, terminado]);

  const reintentarDesdeError = useCallback(() => {
    const indice = indiceFallo(estadoPasos, pasos);
    setEstadoPasos((prev) => prev.map((estado, k) => (
      k >= indice && [ESTADO_PASO.ERROR, ESTADO_PASO.OMITIDO].includes(estado)
        ? ESTADO_PASO.PENDIENTE
        : estado
    )));
    setMensajes((prev) => prev.map((mensaje, k) => (k >= indice ? "" : mensaje)));
    setResultados((prev) => prev.map((resultado, k) => (k >= indice ? null : resultado)));
    procesarDesde(indice);
  }, [estadoPasos, pasos, procesarDesde]);

  const mensajeFinal = terminado
    ? (
      resumen.fallidos > 0
        ? `Se detuvo en ${nombreRubroPlural} del dia ${diaCorto(pasos[indiceFallo(estadoPasos, pasos)]?.fecha)}. `
          + `${resumen.enviados} enviado(s), ${resumen.fallidos} con error`
          + (resumen.omitidos > 0 ? ` y ${resumen.omitidos} sin intentar.` : ".")
        : `Listo: ${resumen.enviados} resumen(es) enviado(s) a SUNAT.`
    )
    : `Enviando ${nombreRubroPlural} del mas antiguo al mas nuevo...`;

  return (
    <Dialog
      open={abierto}
      onClose={cerrar}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: palette.radius.modal,
          boxShadow: palette.shadowSoft,
          backgroundImage: "none",
        },
      }}
    >
      <Box sx={{ px: 2.5, pt: 2.25, pb: 1.5, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: palette.text }}>
            {`Enviando RDI de ${nombreRubroPlural} a SUNAT`}
          </Typography>
          <Typography sx={{ mt: 0.2, fontSize: 11.5, color: palette.muted }}>
            {periodo
              ? `Periodo ${periodo} - dia por dia, todas las agencias`
              : "Dia por dia, todas las agencias"}
          </Typography>
          <Typography
            aria-live="polite"
            sx={{ mt: 0.25, fontSize: 12.5, color: resumen.fallidos > 0 ? palette.danger : palette.muted }}
          >
            {mensajeFinal}
          </Typography>
        </Box>

        <Box
          onClick={cerrar}
          role="button"
          aria-label="Cerrar"
          sx={{
            display: "grid",
            placeItems: "center",
            width: 30,
            height: 30,
            flexShrink: 0,
            borderRadius: 1.5,
            cursor: terminado ? "pointer" : "default",
            opacity: terminado ? 1 : 0.35,
            color: palette.muted,
            backgroundColor: "transparent",
            border: `1px solid ${palette.borderSoft}`,
            pointerEvents: terminado && !ejecutando ? "auto" : "none",
          }}
        >
          <X size={15} />
        </Box>
      </Box>

      <Box sx={{ px: 2.5, pb: 0.5 }}>
        <LinearProgress
          variant="determinate"
          value={avance}
          sx={{
            height: 5,
            borderRadius: 3,
            backgroundColor: palette.surfaceAlt,
            "& .MuiLinearProgress-bar": {
              borderRadius: 3,
              backgroundColor: resumen.fallidos > 0 ? palette.danger : palette.accent,
              transition: "transform .45s ease",
            },
          }}
        />
      </Box>

      <Box sx={{ px: 1.5, py: 1.5, maxHeight: "46vh", overflowY: "auto" }}>
        {pasos.map((paso, indice) => {
          const estado = estadoPasos[indice] || ESTADO_PASO.PENDIENTE;
          const activo = estado === ESTADO_PASO.ENVIANDO;
          const estilo = ESTILO_ICONO[estado] || ESTILO_ICONO.PENDIENTE;
          const ultimo = indice === pasos.length - 1;
          const resultado = resultados[indice] || {};
          const numeroRdi = resultado.numero_rdi || paso.numeroRdi;
          const estadoSunat = resultado.nivel || resultado.estado || paso.estado || "PENDIENTE";
          const ticket = resultado.ticket || paso.ticket;
          const nombreArchivo = resultado.nombre_archivo || paso.nombreArchivo;
          const rutaCdr = resultado.ruta_cdr || paso.rutaCdr;
          const respuesta = resultado.respuesta_sunat_descripcion || resultado.respuesta_desc;

          return (
            <Box key={paso.clave || `${paso.fecha}-${indice}`} sx={{ display: "flex", gap: 1.25 }}>
              {/* Riel vertical: une los dias y marca por donde va el envio. */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 26, flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    color: estilo.color,
                    backgroundColor: estilo.fondo,
                    border: `1px solid ${activo ? palette.accent : palette.borderSoft}`,
                    ...(activo && {
                      "@keyframes rdi-paso-pulso": {
                        "0%": { boxShadow: `0 0 0 0 ${palette.accentSoft}` },
                        "70%": { boxShadow: `0 0 0 9px ${palette.accentSoft}` },
                        "100%": { boxShadow: `0 0 0 0 ${palette.accentSoft}` },
                      },
                      animation: "rdi-paso-pulso 1.4s ease-out infinite",
                    }),
                  }}
                >
                  {estado === ESTADO_PASO.ENVIADO ? <Check size={14} strokeWidth={3} />
                    : estado === ESTADO_PASO.ERROR ? <CircleAlert size={14} strokeWidth={2.5} />
                      : estado === ESTADO_PASO.OMITIDO ? <MinusCircle size={14} />
                        : activo ? (
                          <Box
                            sx={{
                              display: "flex",
                              "@keyframes rdi-giro": { to: { transform: "rotate(360deg)" } },
                              animation: "rdi-giro .9s linear infinite",
                            }}
                          >
                            <Loader2 size={14} />
                          </Box>
                        )
                          : <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: palette.muted }}>{indice + 1}</Typography>}
                </Box>
                {!ultimo && (
                  <Box sx={{ flex: 1, width: 2, minHeight: 14, backgroundColor: palette.borderSoft }} />
                )}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0, pb: ultimo ? 0 : 1.25 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: palette.text }}>
                    {`Dia ${diaCorto(paso.fecha)}`}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: palette.muted }}>
                    {numeroRdi
                      ? numeroRdi
                      : `resumen nuevo (${paso.cantidad || 0} ${nombreRubroPlural} sin RDI)`}
                  </Typography>
                  {activo && (
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: palette.accent }}>
                      procesando...
                    </Typography>
                  )}
                  {estado === ESTADO_PASO.ERROR && (
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: palette.danger }}>
                      error
                    </Typography>
                  )}
                  {estado === ESTADO_PASO.OMITIDO && (
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: palette.muted }}>
                      no se intento
                    </Typography>
                  )}
                  {estado === ESTADO_PASO.ENVIADO && (
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: palette.success }}>
                      enviado
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", gap: 0.7 }}>
                  <InfoPill label="Estado" value={estadoSunat} color={estado === ESTADO_PASO.ERROR ? palette.danger : undefined} />
                  <InfoPill label="Docs" value={resultado.total_documentos || paso.cantidad || 0} />
                  {ticket && <InfoPill label="Ticket" value={ticket} />}
                  {nombreArchivo && <InfoPill label="Archivo" value={nombreArchivo} />}
                  {rutaCdr && rutaCdr !== "error" && <InfoPill label="CDR" value="disponible" color={palette.success} />}
                </Box>

                <Typography sx={{ mt: 0.45, fontSize: 11.5, color: estado === ESTADO_PASO.ERROR ? palette.danger : palette.muted }}>
                  {mensajes[indice]
                    || respuesta
                    || paso.detalle
                    || `${paso.cantidad || 0} ${nombreRubroPlural} | estado ${paso.estado || "PENDIENTE"}`}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: `1px solid ${palette.borderSoft}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          opacity: terminado ? 1 : 0.6,
        }}
      >
        <Typography sx={{ fontSize: 11.5, color: palette.muted }}>
          {terminado
            ? `${resumen.enviados} de ${resumen.total} enviados`
            : `${indiceActual >= 0 ? indiceActual + 1 : 0} de ${resumen.total} en curso`}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {terminado && resumen.fallidos > 0 && (
            <Box
              onClick={reintentarDesdeError}
              role="button"
              tabIndex={0}
              sx={{
                px: 1.6,
                py: 0.85,
                borderRadius: palette.radius.control,
                fontSize: 12,
                fontWeight: 800,
                color: palette.accent,
                backgroundColor: palette.accentSoft,
                cursor: "pointer",
              }}
            >
              REINTENTAR
            </Box>
          )}

          <Box
            onClick={cerrar}
            role="button"
            tabIndex={terminado ? 0 : -1}
            sx={{
              px: 2,
              py: 0.85,
              borderRadius: palette.radius.control,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: ".04em",
              color: palette.onAccent,
              backgroundColor: palette.accent,
              cursor: terminado ? "pointer" : "default",
              pointerEvents: terminado ? "auto" : "none",
            }}
          >
            CERRAR
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

function InfoPill({ label, value, color }) {
  return (
    <Box
      sx={{
        px: 0.85,
        py: 0.35,
        borderRadius: 1,
        border: `1px solid ${palette.borderSoft}`,
        backgroundColor: palette.surfaceAlt,
        display: "flex",
        alignItems: "center",
        gap: 0.45,
        minHeight: 22,
        maxWidth: "100%",
      }}
    >
      <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: palette.muted, textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: color || palette.text, overflowWrap: "anywhere" }}>
        {String(value || "-")}
      </Typography>
    </Box>
  );
}

// Primer paso con error: es donde se detuvo la cola.
function indiceFallo(estadoPasos, pasos) {
  const indice = estadoPasos.findIndex((e) => e === ESTADO_PASO.ERROR);
  return indice === -1 ? 0 : indice;
}
