import React, { useCallback, useEffect, useState } from "react";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import { Plus, RefreshCw, X } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";

import palette from "../../../../theme/palette";
import AppButton from "../../../ui/AppButton";
import TrManifiestoModal from "./TrManifiestoModal";
import TrManifiestoPasajeros from "./TrManifiestoPasajeros";
import { periodoDeFecha } from "./trManifiestoUtils";

// ===========================================================================
// PAGINA DE MANIFIESTOS
//
// Arma las 7 rutas de /mve_transmanifiesto y hospeda los dos componentes:
//   - la cabecera (modal angosto) se abre con "Nuevo manifiesto"
//   - los pasajeros (vista ancha) ocupan la pantalla al elegir uno
//
// El idioma de red es el mismo que el del panel de encomiendas/boletos:
// `back_host` desde process.env y fetch sin cliente HTTP.
const BACK_HOST =
  process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";

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
};

const textoVacioSx = {
  color: palette.muted,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.3px",
};

const COLS = "70px 110px minmax(150px, 2fr) minmax(110px, 1fr) 96px 88px 74px";

const fechaHoy = () => new Date().toISOString().slice(0, 10);

export default function TrManifiestoList() {
  const [manifiestos, setManifiestos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [abierto, setAbierto] = useState(null);
  const [disponibles, setDisponibles] = useState([]);
  const [cargandoPasajeros, setCargandoPasajeros] = useState(false);
  const [rutas, setRutas] = useState([]);

  // La empresa y el documento vienen de la ruta; el punto de venta viaja en el
  // query porque lo elige el filtro de la cabecera del panel y no forma parte de
  // la ruta. Sin punto de venta no se puede crear un manifiesto, y la pantalla lo
  // explica en vez de mandar un request incompleto.
  const params = useParams();
  const [query] = useSearchParams();
  const idAnfitrion = params?.id_anfitrion || "";
  const documentoId = params?.documento_id || "";
  const puntoVenta = query.get("pv") || query.get("id_punto_venta") || "";

  // Rutas con pasaje configurado: son las unicas que puede tener un manifiesto.
  useEffect(() => {
    if (!idAnfitrion || !documentoId) {
      return;
    }
    let vivo = true;
    (async () => {
      try {
        const r = await fetch(
          `${BACK_HOST}/mve_transruta/${encodeURIComponent(idAnfitrion)}/${encodeURIComponent(documentoId)}?solo_pasaje=true`
        );
        const json = await r.json();
        if (vivo && json.success && Array.isArray(json.data)) {
          setRutas(json.data);
        }
      } catch (e) {
        // sin rutas no se puede crear manifiesto, pero la lista sigue sirviendo.
      }
    })();
    return () => {
      vivo = false;
    };
  }, [idAnfitrion, documentoId]);

  const consultar = useCallback(async () => {
    if (!idAnfitrion || !documentoId) {
      return;
    }
    setCargando(true);
    setError("");
    try {
      const url = `${BACK_HOST}/mve_transmanifiesto?id_usuario=${encodeURIComponent(idAnfitrion)}`
        + `&documento_id=${encodeURIComponent(documentoId)}`
        + (puntoVenta ? `&id_punto_venta=${encodeURIComponent(puntoVenta)}` : "");
      const r = await fetch(url);
      const json = await r.json();
      if (!r.ok || !json.success) {
        setError(json.message || "No se pudieron obtener los manifiestos.");
        return;
      }
      setManifiestos(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError("No se pudo conectar con el servidor de manifiestos.");
    } finally {
      setCargando(false);
    }
  }, [idAnfitrion, documentoId, puntoVenta]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  // Carga cabecera + pasajeros + disponibles del manifiesto abierto.
  const abrirManifiesto = useCallback(async (id) => {
    setCargandoPasajeros(true);
    setError("");
    try {
      const det = await fetch(`${BACK_HOST}/mve_transmanifiesto/${id}`);
      const detJson = await det.json();
      if (!det.ok || !detJson.success) {
        setError(detJson.message || "No se pudo abrir el manifiesto.");
        setCargandoPasajeros(false);
        return;
      }
      setAbierto(detJson.data);

      const m = detJson.data;
      const periodo = periodoDeFecha(m.fecha);
      const disp = await fetch(
        `${BACK_HOST}/mve_transmanifiesto/boletos-disponibles`
        + `?periodo=${periodo}`
        + `&id_usuario=${encodeURIComponent(m.id_usuario || idAnfitrion)}`
        + `&documento_id=${encodeURIComponent(m.documento_id || documentoId)}`
        + (m.fecha ? `&fecha=${m.fecha}` : "")
        + (m.id_punto_venta ? `&id_punto_venta=${encodeURIComponent(m.id_punto_venta)}` : "")
        + (m.id_punto_venta_dest ? `&id_punto_venta_dest=${encodeURIComponent(m.id_punto_venta_dest)}` : "")
      );
      const dispJson = await disp.json();
      setDisponibles(dispJson.success && Array.isArray(dispJson.data) ? dispJson.data : []);
      setCargandoPasajeros(false);
    } catch (e) {
      setError("No se pudo conectar con el servidor de manifiestos.");
      setCargandoPasajeros(false);
    }
  }, [idAnfitrion, documentoId]);

  const crear = async (payload) => {
    setGuardando(true);
    setError("");
    try {
      const r = await fetch(`${BACK_HOST}/mve_transmanifiesto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await r.json();
      if (!r.ok || !json.success) {
        setError(json.message || "No se pudo crear el manifiesto.");
        return;
      }
      setModalAbierto(false);
      await consultar();
      await abrirManifiesto(json.data.id_manifiesto);
    } catch (e) {
      setError("No se pudo conectar con el servidor de manifiestos.");
    } finally {
      setGuardando(false);
    }
  };

  const agregar = async (clave) => {
    try {
      const r = await fetch(`${BACK_HOST}/mve_transmanifiesto/${abierto.id_manifiesto}/pasajero`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clave),
      });
      const json = await r.json();
      if (!r.ok || !json.success) {
        setError(json.message || "No se pudo sumar el pasajero.");
        return;
      }
      await abrirManifiesto(abierto.id_manifiesto);
    } catch (e) {
      setError("No se pudo conectar con el servidor de manifiestos.");
    }
  };

  const quitar = async (clave) => {
    try {
      const r = await fetch(`${BACK_HOST}/mve_transmanifiesto/${abierto.id_manifiesto}/pasajero`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clave),
      });
      const json = await r.json();
      if (!r.ok || !json.success) {
        setError(json.message || "No se pudo sacar el pasajero.");
        return;
      }
      await abrirManifiesto(abierto.id_manifiesto);
    } catch (e) {
      setError("No se pudo conectar con el servidor de manifiestos.");
    }
  };

  const cerrarManifiesto = async () => {
    try {
      const r = await fetch(`${BACK_HOST}/mve_transmanifiesto/${abierto.id_manifiesto}/cerrar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await r.json();
      if (!r.ok || !json.success) {
        setError(json.message || "No se pudo cerrar el manifiesto.");
        return;
      }
      await consultar();
      await abrirManifiesto(abierto.id_manifiesto);
    } catch (e) {
      setError("No se pudo conectar con el servidor de manifiestos.");
    }
  };

  return (
    <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 0.9, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.8, flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ color: palette.text, fontSize: "15px", fontWeight: 800 }}>
            Control de Manifiestos
          </Typography>
          <Typography sx={textoVacioSx}>
            Viajes de pasajeros agrupados por fecha y destino
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <AppButton
            icon={<RefreshCw size={18} />}
            onClick={consultar}
            sx={{
              height: 42, px: 1,
              borderRadius: palette.radius.control,
              color: palette.muted,
              backgroundColor: palette.overlaySoft,
              borderColor: palette.borderSoft,
              fontSize: "12px", fontWeight: 800,
              "& svg": { width: 18, height: 18 },
            }}
          >
            Actualizar
          </AppButton>

          <AppButton
            icon={<Plus size={18} />}
            onClick={() => setModalAbierto(true)}
            disabled={!puntoVenta}
            sx={{
              height: 42, px: 1.3,
              borderRadius: palette.radius.control,
              backgroundColor: palette.accent,
              borderColor: palette.accent,
              color: palette.onAccent,
              fontSize: "13px", fontWeight: 800,
              "& svg": { width: 18, height: 18 },
            }}
          >
            Nuevo manifiesto
          </AppButton>
        </Box>
      </Box>

      {!puntoVenta && (
        <Box sx={{
          px: 0.9, py: 0.6,
          borderRadius: palette.radius.control,
          backgroundColor: palette.chip,
          border: `1px solid ${palette.borderSoft}`,
        }}>
          <Typography sx={{ color: palette.muted, fontSize: "11.5px", fontWeight: 700 }}>
            Elige un punto de venta en el filtro de la cabecera para poder crear manifiestos.
          </Typography>
        </Box>
      )}

      {error && (
        <Box sx={{
          px: 0.9, py: 0.6,
          borderRadius: palette.radius.control,
          backgroundColor: palette.dangerSoft,
          border: `1px solid ${palette.danger}`,
        }}>
          <Typography sx={{ color: palette.danger, fontSize: "11.5px", fontWeight: 700 }}>
            {error}
          </Typography>
        </Box>
      )}

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
          {["N", "Fecha", "Ruta", "Salida", "Chofer", "Pax", "Estado"].map((t) => (
            <Typography key={t} sx={thSx}>{t}</Typography>
          ))}
        </Box>

        {cargando && (
          <Typography sx={{ ...tdSx, color: palette.muted }}>Cargando manifiestos...</Typography>
        )}

        {!cargando && manifiestos.length === 0 && (
          <Typography sx={{ ...tdSx, color: palette.muted }}>
            Todavia no hay manifiestos.
          </Typography>
        )}

        {manifiestos.map((m) => {
          const abiertoFila = m.estado === "ABIERTO";
          return (
            <Box
              key={m.id_manifiesto}
              onClick={() => abrirManifiesto(m.id_manifiesto)}
              sx={{
                display: "grid",
                gridTemplateColumns: COLS,
                alignItems: "center",
                cursor: "pointer",
                borderBottom: `1px solid ${palette.borderSoft}`,
                transition: "background-color .16s ease",
                "&:hover": { backgroundColor: palette.rowHover },
              }}
            >
              <Box sx={{ ...tdSx, fontWeight: 800, color: palette.accent }}>{m.id_manifiesto}</Box>
              <Box sx={tdSx}>{m.fecha || "-"}</Box>
              <Box sx={{ ...tdSx, fontWeight: 700 }}>{m.ruta_nombre || m.id_punto_venta_dest || "-"}</Box>
              <Box sx={tdSx}>{m.id_punto_venta || "-"}</Box>
              <Box sx={tdSx}>{m.chofer || "-"}</Box>
              <Box sx={{ ...tdSx, textAlign: "right" }}>{m.total_pasajeros ?? 0}</Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{
                  display: "inline-block",
                  px: 0.7, py: 0.15,
                  borderRadius: palette.radius.control,
                  fontSize: "10.5px", fontWeight: 800,
                  color: abiertoFila ? palette.accent : palette.muted,
                  backgroundColor: abiertoFila ? palette.accentSoft : palette.chip,
                  border: `1px solid ${abiertoFila ? palette.accent : palette.borderSoft}`,
                }}>
                  {m.estado}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <TrManifiestoModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCrear={crear}
        id_usuario={idAnfitrion}
        documento_id={documentoId}
        puntoVentaOrigen={puntoVenta}
        rutasDisponibles={rutas}
        fechaServidor={fechaHoy()}
        guardando={guardando}
      />

      <Dialog
        open={!!abierto}
        onClose={() => setAbierto(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: palette.radius.modal,
            height: "calc(100vh - 40px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        <Box sx={{ p: 1, flexShrink: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ color: palette.text, fontSize: "13px", fontWeight: 800 }}>
              Pasajeros del manifiesto
            </Typography>
            <IconButton onClick={() => setAbierto(null)} sx={{ color: palette.muted }}>
              <X size={18} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 1, pb: 1, flex: 1, minHeight: 0, display: "flex" }}>
          <TrManifiestoPasajeros
            manifiesto={abierto}
            pasajeros={Array.isArray(abierto?.pasajeros) ? abierto.pasajeros : []}
            disponibles={disponibles}
            loading={cargandoPasajeros}
            onAgregar={agregar}
            onQuitar={quitar}
            onCerrar={cerrarManifiesto}
            onVolver={() => setAbierto(null)}
          />
        </Box>
      </Dialog>
    </Box>
  );
}
