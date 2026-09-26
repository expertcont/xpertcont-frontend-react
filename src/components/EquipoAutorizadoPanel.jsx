import React from "react";
import { Box, Typography } from "@mui/material";

import palette from "../theme/palette";
import { CONTROL_EQUIPOS_ACTIVO } from "../security/dispositivo";

// Aviso del control de equipos autorizados. Solo aparece cuando el interruptor
// maestro esta prendido y hay algo que informar: si el equipo se esta
// verificando, o si el backend ya responde y el equipo no esta dado de alta.
export default function EquipoAutorizadoPanel({ estado, motivo, huellaCorta, etiqueta }) {
  // Con el control desactivado no se muestra nada: es el estado normal de trabajo.
  // El panel es solo informativo, nunca bloquea, asi que apagado no dice nada.
  if (!CONTROL_EQUIPOS_ACTIVO) {
    return null;
  }

  // 'pendiente' es el estado inicial, antes de resolver la consulta: no dice
  // nada todavia. 'autorizado' tampoco necesita aviso. Antes estos dos caian en
  // el titulo "Equipo no autorizado" y asustaban al usuario en el login.
  if (estado === "desactivado" || estado === "pendiente" || estado === "autorizado") {
    return null;
  }

  const verificando = estado === "verificando";
  const sinControl = estado === "sin-control";
  const rechazado = estado === "rechazado";

  const color = verificando ? palette.accent : rechazado ? palette.danger : palette.success;

  const titulo = verificando
    ? "Verificando este equipo"
    : sinControl
      ? "Control de equipos desactivado"
      : "Equipo no autorizado";

  const descripcion = verificando
    ? "Comprobando que la clave de este equipo este registrada..."
    : sinControl
      ? "El backend todavia no valida equipos, por eso se permitsio el ingreso. Crea la tabla mad_seguridad_dispositivo para aplicar el control."
      : motivo || "Pide al administrador que registre este equipo en el sistema.";

  return (
    <Box
      sx={{
        mt: 1.2,
        p: 1.6,
        borderRadius: "8px",
        textAlign: "left",
        backgroundColor: palette.chip,
        border: `1px solid ${palette.border}`,
      }}
    >
      <Typography
        sx={{
          color,
          fontSize: "12px",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
        }}
      >
        {titulo}
      </Typography>

      <Typography sx={{ color: palette.muted, fontSize: "11.5px", mt: 0.6 }}>
        {descripcion}
      </Typography>

      {etiqueta && (
        <Typography sx={{ color: palette.text, fontSize: "11.5px", mt: 0.8, fontWeight: 800 }}>
          Equipo: {etiqueta}
        </Typography>
      )}

      {huellaCorta && (
        <Box
          sx={{
            mt: 1.1,
            p: 1,
            borderRadius: "6px",
            backgroundColor: palette.bg,
            border: `1px dashed ${palette.border}`,
          }}
        >
          <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
            Codigo de este equipo
          </Typography>
          <Typography
            sx={{
              color: palette.text,
              fontSize: "17px",
              fontWeight: 900,
              letterSpacing: "2.5px",
              mt: 0.3,
              fontFamily: "Consolas, Menlo, monospace",
              userSelect: "all",
            }}
          >
            {huellaCorta}
          </Typography>
          <Typography sx={{ color: palette.muted, fontSize: "10.5px", mt: 0.5 }}>
            Pasa este codigo al administrador para autorizar el equipo.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
