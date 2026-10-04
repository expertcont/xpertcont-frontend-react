import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, InputBase, Typography } from "@mui/material";
import {
  ClipboardList,
  Lock,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import palette from "../../../../theme/palette";
import AppButton from "../../../ui/AppButton";
import {
  clavePasajero,
  dosDecimales,
  textoBusquedaPasajero,
} from "./trManifiestoUtils";

// ===========================================================================
// PASAJEROS DEL MANIFIESTO (vista ancha)
//
// A diferencia de la cabecera, que son 6 campos y va en columna angosta, esto es una
// LISTA: nombre, documento, asiento y placa de cada pasajero. En 430px no se lee.
//
// El buscador es el mismo patron del modulo: texto + Array.filter con "includes",
// sin debounce, con el resaltado movido por flechas y elegido con Enter.
//
// El manifiesto NO edita datos del pasajero: el nombre, el documento y el precio
// son los del boleto y se corrigen en el boleto. Lo unico que se hace aca es sumar y
// sacar pasajeros, y cerrar.
// ===========================================================================

const COLS = "54px minmax(150px, 2fr) minmax(96px, 1fr) 78px 88px 96px 42px";

const thSx = {
  textAlign: "left",
  color: palette.muted,
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
  px: 0.9,
  py: 0.55,
  whiteSpace: "nowrap",
};

const tdSx = {
  color: palette.text,
  fontSize: "12.5px",
  px: 0.9,
  py: 0.5,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const textoVacioSx = {
  color: palette.muted,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.3px",
};

const botonSecundarioSx = {
  height: 42,
  px: 1.2,
  borderRadius: palette.radius.control,
  color: palette.muted,
  backgroundColor: palette.overlaySoft,
  borderColor: palette.borderSoft,
  fontSize: "12px",
  fontWeight: 800,
  "& svg": { width: 18, height: 18 },
};

const botonNeutroSx = {
  height: 42,
  px: 1.2,
  borderRadius: palette.radius.control,
  color: palette.text,
  backgroundColor: palette.chip,
  borderColor: palette.border,
  fontSize: "12px",
  fontWeight: 800,
  "& svg": { width: 18, height: 18 },
};

const botonPrincipalSx = {
  height: 42,
  minWidth: 148,
  px: 1.4,
  borderRadius: palette.radius.control,
  backgroundColor: palette.accent,
  borderColor: palette.accent,
  color: palette.onAccent,
  fontSize: "13px",
  fontWeight: 800,
  "& svg": { width: 18, height: 18 },
};

const claveFila = (fila) => `${fila.r_serie}-${fila.r_numero}-${fila.elemento}`;

export default function TrManifiestoPasajeros({
  manifiesto,
  pasajeros = [],
  disponibles = [],
  loading = false,
  onAgregar,
  onQuitar,
  onCerrar,
  onVolver,
}) {
  const [busqueda, setBusqueda] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [indice, setIndice] = useState(0);
  const busquedaRef = useRef(null);

  // El manifiesto solo admite cambios mientras esta ABIERTO. Es la misma regla que
  // aplica el backend, no una decision de pantalla.
  const abierto = manifiesto?.estado === "ABIERTO";

  useEffect(() => {
    setBusqueda("");
    setAgregando(false);
    setIndice(0);
    window.setTimeout(() => {
      busquedaRef.current?.focus();
      busquedaRef.current?.select?.();
    }, 80);
  }, [manifiesto?.id_manifiesto]);

  // Texto prearmado con todo lo que el chofer podria escribir (DNI, nombre, serie,
  // numero, asiento, placa). Mismo criterio que el buscador de encomiendas.
  const conTexto = useMemo(
    () => disponibles.map((fila) => ({ ...fila, _texto: textoBusquedaPasajero(fila) })),
    [disponibles]
  );

  const texto = String(busqueda || "").toLowerCase();
  const filtrados = useMemo(
    () => conTexto.filter((fila) => fila._texto.includes(texto)),
    [conTexto, texto]
  );

  useEffect(() => {
    setIndice(0);
  }, [busqueda, agregando]);

  const indiceFinal = Math.min(indice, Math.max(0, filtrados.length - 1));

  const elegir = (fila) => {
    setAgregando(false);
    setBusqueda("");
    onAgregar(clavePasajero(fila));
  };

  // Teclado: con el selector abierto, flechas mueven el resaltado, Enter suma el
  // pasajero y Escape lo cierra. Con el selector cerrado, "+" sobre el buscador lo
  // abre (es el atajo de encomienda para abrir un picker desde un campo de captura).
  const alTeclear = (event) => {
    if (!agregando) {
      if (event.key === "+" && available(disponibles)) {
        event.preventDefault();
        setAgregando(true);
        setIndice(0);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setAgregando(false);
      busquedaRef.current?.focus();
      return;
    }
    if (!filtrados.length) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      setIndice(Math.min(indiceFinal + 1, filtrados.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      setIndice(Math.max(indiceFinal - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      elegir(filtrados[indiceFinal]);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, height: "100%" }}>
      {/* cabecera del manifiesto */}
      <Box sx={{
        p: 0.9,
        borderRadius: palette.radius.listCard,
        backgroundColor: palette.overlaySoft,
        border: `1px solid ${palette.borderSoft}`,
      }}>
        <Box sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 0.8,
          flexWrap: "wrap",
        }}>
          <Box>
            <Typography sx={{ color: palette.text, fontSize: "14px", fontWeight: 800 }}>
              Manifiesto {manifiesto?.id_manifiesto}
            </Typography>
            <Typography sx={textoVacioSx}>
              {[manifiesto?.fecha, manifiesto?.ruta_nombre || manifiesto?.id_punto_venta_dest]
                .filter(Boolean).join("   -   ")}
            </Typography>
          </Box>

          <Box sx={{
            px: 0.8,
            py: 0.25,
            borderRadius: palette.radius.control,
            fontSize: "11px",
            fontWeight: 800,
            color: abierto ? palette.accent : palette.muted,
            backgroundColor: abierto ? palette.accentSoft : palette.chip,
            border: `1px solid ${abierto ? palette.accent : palette.borderSoft}`,
          }}>
            {manifiesto?.estado || "-"}
          </Box>
        </Box>

        <Box sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 0.6,
          mt: 0.75,
        }}>
          {[
            ["Salida", manifiesto?.id_punto_venta || "-"],
            ["Destino", manifiesto?.id_punto_venta_dest || "-"],
            ["Placa", manifiesto?.placa || "-"],
            ["Licencia", manifiesto?.licencia || "-"],
            ["Chofer", manifiesto?.chofer || "-"],
            ["Pasajeros", pasajeros.length],
          ].map(([titulo, valor]) => (
            <Box key={titulo}>
              <Typography sx={textoVacioSx}>{titulo}</Typography>
              <Typography sx={{ color: palette.text, fontSize: "12.5px", fontWeight: 800 }}>
                {valor}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* buscador */}
      <Box sx={{
        minHeight: 30,
        px: 0.9,
        display: "flex",
        alignItems: "center",
        backgroundColor: palette.bg,
        border: `1px solid ${abierto ? palette.border : palette.borderSoft}`,
        borderRadius: palette.radius.control,
        opacity: abierto ? 1 : 0.7,
        "&:focus-within": { borderColor: palette.accent, backgroundColor: palette.surfaceAlt },
      }}>
        <Box sx={{ color: palette.muted, display: "flex", mr: 0.6 }}>
          <Search size={15} />
        </Box>
        <InputBase
          inputRef={busquedaRef}
          value={busqueda}
          disabled={!abierto}
          onChange={(event) => setBusqueda(event.target.value)}
          onKeyDown={alTeclear}
          placeholder={abierto
            ? "Buscar pasajero por nombre, DNI, serie, numero o asiento   (+ para sumar)"
            : "Manifiesto cerrado: no admite cambios"}
          sx={{ color: palette.text, fontSize: "12.5px", width: "100%" }}
        />
        {busqueda && (
          <IconButton size="small" onClick={() => setBusqueda("")} sx={{ color: palette.muted }}>
            <X size={15} />
          </IconButton>
        )}
      </Box>

      {!abierto && (
        <Box sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 0.8,
          py: 0.5,
          borderRadius: palette.radius.control,
          backgroundColor: palette.chip,
          border: `1px solid ${palette.borderSoft}`,
        }}>
          <Lock size={14} />
          <Typography sx={{ color: palette.muted, fontSize: "11.5px", fontWeight: 700 }}>
            Este manifiesto esta cerrado y no se puede modificar.
          </Typography>
        </Box>
      )}

      {/* pasajeros que ya estan en el manifiesto */}
      <Box sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        borderRadius: palette.radius.listCard,
        border: `1px solid ${palette.borderSoft}`,
        backgroundColor: palette.bg,
      }}>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: COLS,
          position: "sticky",
          top: 0,
          zIndex: 1,
          backgroundColor: palette.overlaySoft,
          borderBottom: `1px solid ${palette.border}`,
        }}>
          {["Serie", "Pasajero", "Documento", "Asiento", "Pasaje", "Placa", ""].map((t) => (
            <Typography key={t} sx={thSx}>{t}</Typography>
          ))}
        </Box>

        {loading && (
          <Typography sx={{ ...tdSx, color: palette.muted }}>Cargando pasajeros...</Typography>
        )}

        {!loading && pasajeros.length === 0 && (
          <Typography sx={{ ...tdSx, color: palette.muted }}>
            Todavia no hay pasajeros en este manifiesto.
          </Typography>
        )}

        {pasajeros.map((fila) => (
          <Box
            key={claveFila(fila)}
            sx={{
              display: "grid",
              gridTemplateColumns: COLS,
              alignItems: "center",
              borderBottom: `1px solid ${palette.borderSoft}`,
              "&:hover": abierto ? { backgroundColor: palette.rowHover } : null,
            }}
          >
            <Box sx={{ ...tdSx, fontWeight: 800, color: palette.accent }}>{fila.r_serie || ""}</Box>
            <Box sx={{ ...tdSx, fontWeight: 700 }}>{fila.cliente || "-"}</Box>
            <Box sx={tdSx}>{fila.cliente_documento_id || fila.cliente_documento || "-"}</Box>
            <Box sx={{ ...tdSx, textAlign: "right" }}>{fila.asiento || "-"}</Box>
            <Box sx={{ ...tdSx, textAlign: "right" }}>{dosDecimales(fila.precio_neto)}</Box>
            <Box sx={tdSx}>{fila.placa || "-"}</Box>
            <Box sx={{ textAlign: "center" }}>
              {abierto && (
                <IconButton
                  size="small"
                  title="Sacar del manifiesto"
                  onClick={() => onQuitar(clavePasajero(fila))}
                  sx={{ color: palette.danger, p: 0.3 }}
                >
                  <Trash2 size={15} />
                </IconButton>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {/* selector de pasajero a sumar */}
      {agregando && (
        <Box sx={{
          borderRadius: palette.radius.listCard,
          border: `1px solid ${palette.accent}`,
          backgroundColor: palette.surfaceAlt,
          overflow: "hidden",
        }}>
          <Box sx={{
            px: 0.9,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 0.6,
            borderBottom: `1px solid ${palette.borderSoft}`,
          }}>
            <Typography sx={{ color: palette.text, fontSize: "11.5px", fontWeight: 800 }}>
              Sumar pasajero   -   {filtrados.length} boleto(s) disponible(s)
            </Typography>
            <IconButton size="small" onClick={() => setAgregando(false)} sx={{ color: palette.muted }}>
              <X size={15} />
            </IconButton>
          </Box>

          <Box sx={{ maxHeight: 230, overflowY: "auto" }}>
            {filtrados.length === 0 && (
              <Typography sx={{ ...tdSx, color: palette.muted }}>
                Ningun boleto disponible coincide con la busqueda.
              </Typography>
            )}

            {filtrados.map((fila, i) => {
              const resaltada = i === indiceFinal;
              return (
                <Box
                  key={claveFila(fila)}
                  onClick={() => elegir(fila)}
                  sx={{
                    px: 0.9,
                    py: 0.5,
                    display: "grid",
                    gridTemplateColumns: "54px minmax(150px, 2fr) minmax(96px, 1fr) 88px",
                    alignItems: "center",
                    cursor: "pointer",
                    backgroundColor: resaltada ? palette.accentSoft : "transparent",
                    borderBottom: `1px solid ${palette.borderSoft}`,
                    transition: "background-color .16s ease",
                    "&:hover": { backgroundColor: palette.rowHover },
                  }}
                >
                  <Box sx={{ ...tdSx, fontWeight: 800, color: palette.accent }}>{fila.r_serie}</Box>
                  <Box sx={{ ...tdSx, fontWeight: 700 }}>{fila.cliente || "-"}</Box>
                  <Box sx={tdSx}>{fila.cliente_documento_id || fila.cliente_documento || "-"}</Box>
                  <Box sx={{ ...tdSx, textAlign: "right" }}>{dosDecimales(fila.precio_neto)}</Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* footer */}
      <Box sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 0.6,
        flexWrap: "wrap",
      }}>
        <AppButton icon={<ClipboardList size={18} />} onClick={onVolver} sx={botonSecundarioSx}>
          Volver
        </AppButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          {abierto && (
            <AppButton
              icon={<UserPlus size={18} />}
              onClick={() => {
                setAgregando((prev) => !prev);
                setIndice(0);
              }}
              sx={botonNeutroSx}
            >
              {agregando ? "Cerrar" : "Sumar"}
            </AppButton>
          )}

          {abierto && (
            <AppButton icon={<Lock size={18} />} onClick={onCerrar} sx={botonPrincipalSx}>
              Cerrar manifiesto
            </AppButton>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// Hay boletos disponibles para sumar?
function available(lista) {
  return Array.isArray(lista) && lista.length > 0;
}
