"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import { BadgeCheck, Calendar, CalendarPlus, MapPin, Package, ReceiptText, Search, Truck, UserRound } from "lucide-react";
import swal2 from "sweetalert2";

import AppButton from "../../../../ui/AppButton";
import AppChip from "../../../../ui/AppChip";
import AppSearch from "../../../../ui/AppSearch";
import palette from "../../../../../theme/palette";

const normalizarTexto = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

const numeroOperacion = (item) => [
  item.r_cod,
  item.r_serie,
  item.r_numero,
].filter(Boolean).join("-");

const formatFecha = (value) => {
  const text = String(value || "").slice(0, 10);
  return text ? text.split("-").reverse().join("/") : "";
};

const formatMoney = (value) => `S/ ${Number(value || 0).toLocaleString("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;",
}[char]));

const crearIndiceBusqueda = (item) => [
  numeroOperacion(item),
  item.cliente,
  item.cliente_documento,
  item.cliente_documento_id,
  item.destinatario,
  item.destinatario_documento,
  item.destinatario_documento_id,
  item.descripcion,
  item.id_ruta,
  item.nombre_ruta,
  item.placa,
  item.licencia,
].map(normalizarTexto).join(" ");

const timestampLocal = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + " " + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(":");
};

const sumarMesesPeriodo = (periodo, offset) => {
  const match = String(periodo || "").match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    return periodo || "";
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const selectSx = {
  height: 40,
  minWidth: 0,
  color: palette.text,
  backgroundColor: palette.bg,
  borderRadius: 2,
  fontSize: "12.5px",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: palette.border },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: palette.accent },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: palette.accent },
  "& .MuiSvgIcon-root": { color: palette.muted },
};

function SelectFiltro({ label, value, options, onChange }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", mb: 0.35 }}>
        {label}
      </Typography>
      <Select
        fullWidth
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        sx={selectSx}
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: palette.surface,
              color: palette.text,
              border: `1px solid ${palette.border}`,
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export default function TrEncomiendaEntregaList() {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const params = useParams();
  const navigate = useNavigate();

  const [periodoTrabajo, setPeriodoTrabajo] = useState("");
  const [contabilidadTrabajo, setContabilidadTrabajo] = useState("");
  const [contabilidadSelect, setContabilidadSelect] = useState([]);
  const [puntosVentaAsignados, setPuntosVentaAsignados] = useState([]);
  const [puntoVentaTrabajo, setPuntoVentaTrabajo] = useState("");
  const [tablaBase, setTablaBase] = useState([]);
  const [valorBusqueda, setValorBusqueda] = useState("");
  const [periodosBusqueda, setPeriodosBusqueda] = useState(3);
  const [loading, setLoading] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const registros = useMemo(() => {
    const busqueda = normalizarTexto(valorBusqueda).trim();
    if (!busqueda) {
      return tablaBase;
    }
    return tablaBase.filter((item) => item._textoBusqueda?.includes(busqueda));
  }, [tablaBase, valorBusqueda]);
  const periodoLimiteBusqueda = useMemo(
    () => sumarMesesPeriodo(periodoTrabajo, -(periodosBusqueda - 1)),
    [periodoTrabajo, periodosBusqueda],
  );

  const cargarPeriodos = useCallback(async (periodoPreferido) => {
    try {
      const response = await fetch(`${back_host}/usuario/periodos/${params.id_anfitrion}`);
      const result = await response.json();
      const periodos = Array.isArray(result) ? result : [];
      const periodoFinal = periodoPreferido || periodos[0]?.periodo || params.periodo || "";

      setPeriodoTrabajo(periodoFinal);
      if (periodoFinal) {
        sessionStorage.setItem("periodo_trabajo", periodoFinal);
      }
    } catch (error) {
      console.log("Error cargando periodos entrega:", error);
      setPeriodoTrabajo(periodoPreferido || params.periodo || "");
    }
  }, [back_host, params.id_anfitrion, params.periodo]);

  const cargarContabilidades = useCallback(async (documentoPreferido) => {
    try {
      const response = await fetch(`${back_host}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`);
      const result = await response.json();
      const contabilidades = Array.isArray(result) ? result : [];
      const documentoFinal = documentoPreferido || contabilidades[0]?.documento_id || params.documento_id || "";

      setContabilidadSelect(contabilidades);
      setContabilidadTrabajo(documentoFinal);
      if (documentoFinal) {
        sessionStorage.setItem("contabilidad_trabajo", documentoFinal);
      }
    } catch (error) {
      console.log("Error cargando contabilidades entrega:", error);
      setContabilidadTrabajo(documentoPreferido || params.documento_id || "");
    }
  }, [back_host, params.id_anfitrion, params.id_invitado, params.documento_id]);

  const cargarPuntosVentaAsignados = useCallback(async () => {
    if (!contabilidadTrabajo) {
      setPuntosVentaAsignados([]);
      setPuntoVentaTrabajo("");
      return;
    }

    try {
      const response = await fetch(`${back_host}/mad_punto_venta_usuario/${params.id_anfitrion}/${contabilidadTrabajo}/${params.id_invitado}`);
      const result = await response.json();
      const rows = Array.isArray(result?.data) ? result.data : [];
      const sessionKey = `punto_venta_trabajo_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
      const puntoGuardado = sessionStorage.getItem(sessionKey);
      const puntoFinal = rows.some((item) => item.id_punto_venta === puntoGuardado)
        ? puntoGuardado
        : rows[0]?.id_punto_venta || "";

      setPuntosVentaAsignados(rows);
      setPuntoVentaTrabajo(puntoFinal);
      if (puntoFinal) {
        sessionStorage.setItem(sessionKey, puntoFinal);
      }
    } catch (error) {
      console.log("Error cargando puntos de venta entrega:", error);
      setPuntosVentaAsignados([]);
      setPuntoVentaTrabajo("");
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion, params.id_invitado]);

  const cargarPendientes = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || !puntoVentaTrabajo) {
      setTablaBase([]);
      return;
    }

    setLoading(true);
    try {
      const query = new URLSearchParams({
        limit: "200",
        periodos: String(periodosBusqueda),
      });
      const response = await fetch(`${back_host}/mve_transventa/encomienda/por-entregar/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${puntoVentaTrabajo}?${query.toString()}`);
      const result = await response.json();
      const rows = Array.isArray(result?.data) ? result.data : [];
      setTablaBase(rows.map((item) => ({
        ...item,
        _textoBusqueda: crearIndiceBusqueda(item),
      })));
    } catch (error) {
      console.log("Error cargando encomiendas por entregar:", error);
      setTablaBase([]);
    } finally {
      setLoading(false);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion, periodoTrabajo, puntoVentaTrabajo, periodosBusqueda]);

  useEffect(() => {
    const periodoHistorial = sessionStorage.getItem("periodo_trabajo") || params.periodo;
    const contabilidadHistorial = sessionStorage.getItem("contabilidad_trabajo") || params.documento_id;
    cargarPeriodos(periodoHistorial);
    cargarContabilidades(contabilidadHistorial);
  }, [cargarContabilidades, cargarPeriodos, params.documento_id, params.periodo]);

  useEffect(() => {
    cargarPuntosVentaAsignados();
  }, [cargarPuntosVentaAsignados]);

  useEffect(() => {
    cargarPendientes();
  }, [cargarPendientes, updateTrigger]);

  const handleContabilidadSelect = (documentoId) => {
    setContabilidadTrabajo(documentoId);
    setPuntosVentaAsignados([]);
    setPuntoVentaTrabajo("");
    sessionStorage.setItem("contabilidad_trabajo", documentoId);
    navigate(`/ad_transporteentregas/${params.id_anfitrion}/${params.id_invitado}/${periodoTrabajo}/${documentoId}`);
  };

  const handlePuntoVentaSelect = (puntoVenta) => {
    setPuntoVentaTrabajo(puntoVenta);
    const sessionKey = `punto_venta_trabajo_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
    if (puntoVenta) {
      sessionStorage.setItem(sessionKey, puntoVenta);
    }
  };

  const marcarEntregado = async (item) => {
    const operacion = numeroOperacion(item);
    const destinatario = item.destinatario || "Sin destinatario";
    const documentoDestinatario = item.destinatario_documento || item.destinatario_documento_id || "";
    const contenido = item.descripcion || "Sin descripcion";

    const result = await swal2.fire({
      title: "Confirmar entrega",
      html: `
        <div style="text-align:left;display:grid;gap:10px;font-family:Arial,sans-serif">
          <div style="padding:10px 12px;border:1px solid ${palette.border};border-radius:8px;background:${palette.bg};color:${palette.text};font-weight:800;text-align:center">
            ${escapeHtml(operacion)}
          </div>
          <div style="display:grid;gap:4px">
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:${palette.muted};font-weight:800">Destinatario</span>
            <span style="color:${palette.text};font-size:14px;font-weight:700">${escapeHtml(destinatario)}${documentoDestinatario ? ` - ${escapeHtml(documentoDestinatario)}` : ""}</span>
          </div>
          <div style="display:grid;gap:4px">
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:${palette.muted};font-weight:800">Contenido</span>
            <span style="color:${palette.muted};font-size:13px;line-height:1.35">${escapeHtml(contenido)}</span>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Registrar entrega",
      cancelButtonText: "Cancelar",
      color: palette.text,
      background: palette.surface,
      confirmButtonColor: palette.accent,
      cancelButtonColor: palette.border,
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
          r_cod: item.r_cod,
          r_serie: item.r_serie,
          r_numero: item.r_numero,
          elemento: item.elemento || 1,
          entrega_fecha: timestampLocal(),
          entrega_ctrl_us: params.id_invitado,
        }),
      });
      const dataResponse = await response.json();

      if (!response.ok || !dataResponse.success) {
        throw new Error(dataResponse.message || "No se pudo registrar la entrega.");
      }

      setTablaBase((prev) => prev.filter((row) => !(
        row.r_cod === item.r_cod &&
        row.r_serie === item.r_serie &&
        row.r_numero === item.r_numero &&
        Number(row.elemento || 1) === Number(item.elemento || 1)
      )));
      setUpdateTrigger(Date.now());
    } catch (error) {
      swal2.fire({
        title: "No se pudo registrar",
        text: error.message || "Error interno.",
        icon: "error",
        confirmButtonText: "ACEPTAR",
        color: palette.text,
        background: palette.surface,
      });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.bg, p: { xs: 1, md: 4 } }}>
      <Box sx={{ maxWidth: 980, mx: "auto" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, mb: 2 }}>
          <Box>
            <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "22px", lineHeight: 1.2 }}>
              Encomiendas por Entregar
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: "13px", mt: 0.35 }}>
              {registros.length} pendientes en destino
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: { xs: "100%", md: "auto" }, flexWrap: "wrap" }}>
            <AppSearch
              placeholder="Buscar por numero, remitente, destinatario..."
              value={valorBusqueda}
              onChange={(event) => setValorBusqueda(event.target.value)}
            />
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "280px minmax(260px, 1fr) 240px" }, gap: 1.25, mb: 2, p: 1.2, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 2, alignItems: "end" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", mb: 0.35 }}>
              Periodo busqueda
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 0.7, alignItems: "center" }}>
              <Box sx={{ height: 40, px: 1.15, display: "flex", alignItems: "center", borderRadius: 2, backgroundColor: palette.bg, border: `1px solid ${palette.border}`, color: palette.muted, fontSize: "12.5px", fontWeight: 700, whiteSpace: "nowrap" }}>
                {periodoLimiteBusqueda ? `${periodoLimiteBusqueda} -> Hasta Hoy` : "-"}
              </Box>
              <Tooltip title="Ampliar periodo" arrow>
                <Box>
                  <AppButton
                    icon={<CalendarPlus size={17} />}
                    onClick={() => setPeriodosBusqueda((prev) => Math.min(prev + 1, 12))}
                    sx={{ width: 40, height: 40, minWidth: 40, p: 0, color: palette.accent }}
                  />
                </Box>
              </Tooltip>
            </Box>
          </Box>
          <SelectFiltro
            label="Empresa"
            value={contabilidadTrabajo}
            options={contabilidadSelect.map((item) => ({ value: item.documento_id, label: item.razon_social || item.documento_id }))}
            onChange={handleContabilidadSelect}
          />
          <SelectFiltro
            label="Punto destino"
            value={puntoVentaTrabajo}
            options={puntosVentaAsignados.map((item) => ({ value: item.id_punto_venta, label: `${item.id_punto_venta} - ${item.nombre}` }))}
            onChange={handlePuntoVentaSelect}
          />
        </Box>

        <Box sx={{ display: "grid", gap: 1 }}>
          {loading && (
            <Box sx={{ p: 3, color: palette.muted, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 2 }}>
              Cargando encomiendas...
            </Box>
          )}

          {!loading && registros.length === 0 && (
            <Box sx={{ p: 3, color: palette.muted, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 2, display: "flex", gap: 1, alignItems: "center" }}>
              <Search size={16} />
              Sin encomiendas pendientes para este destino.
            </Box>
          )}

          {!loading && registros.map((item) => (
            <Box key={`${item.r_cod}-${item.r_serie}-${item.r_numero}-${item.elemento || 1}`} sx={{ p: 1.4, backgroundColor: palette.surface, border: `1px solid ${palette.borderSoft}`, borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: palette.accentSoft, color: palette.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Package size={16} />
                  </Box>
                  <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "15px" }}>
                    {numeroOperacion(item)}
                  </Typography>
                  <AppChip>Destino {item.id_punto_venta_dest}</AppChip>
                  <AppChip>{item.condicion_pago || "PAGADO"}</AppChip>
                </Box>
                <AppButton icon={<BadgeCheck size={16} />} onClick={() => marcarEntregado(item)} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
                  Entregar
                </AppButton>
              </Box>

              <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" }, gap: 1.1, alignItems: "center" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: palette.muted, fontSize: "11px", display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ReceiptText size={13} /> Remitente
                  </Typography>
                  <Typography sx={{ color: palette.text, fontSize: "13px" }} noWrap>
                    {item.cliente || "-"} {item.cliente_documento ? `- ${item.cliente_documento}` : ""}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: palette.muted, fontSize: "11px", display: "flex", alignItems: "center", gap: 0.5 }}>
                    <UserRound size={13} /> Destinatario
                  </Typography>
                  <Typography sx={{ color: palette.text, fontSize: "13px" }} noWrap>
                    {item.destinatario || "-"} {item.destinatario_documento ? `- ${item.destinatario_documento}` : ""}
                  </Typography>
                </Box>
                <Typography sx={{ color: palette.accent, fontSize: "16px", fontWeight: 800, whiteSpace: "nowrap" }}>
                  {formatMoney(item.r_monto_total || item.precio_neto)}
                </Typography>
              </Box>

              <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap", color: palette.muted }}>
                <Typography sx={{ fontSize: "12px", display: "flex", alignItems: "center", gap: 0.45 }}>
                  <Calendar size={13} /> {formatFecha(item.r_fecemi)}
                </Typography>
                <Typography sx={{ fontSize: "12px", display: "flex", alignItems: "center", gap: 0.45 }}>
                  <MapPin size={13} /> {item.nombre_ruta || item.id_ruta || "-"}
                </Typography>
                <Typography sx={{ color: palette.text, fontSize: "12.5px", minWidth: 0 }}>
                  {item.descripcion || "-"}
                </Typography>
                {(item.placa || item.licencia) && (
                  <Typography sx={{ fontSize: "12px", display: "flex", alignItems: "center", gap: 0.45 }}>
                    <Truck size={13} /> {[item.placa, item.licencia].filter(Boolean).join(" / ")}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
