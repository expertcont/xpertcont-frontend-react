import React, { useCallback, useEffect, useState } from "react";
import { Box, Typography, IconButton, Tooltip, LinearProgress, MenuItem, Select, useMediaQuery } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Boxes,
  Building2,
  CheckCircle2,
  Clock3,
  CloudUpload,
  Gauge,
  LayoutDashboard,
  Package,
  RefreshCw,
  Search,
  Send,
  Wallet,
} from "lucide-react";

import DaySelector from "../../AdminDias";
import palette from "../../../../theme/palette";

const backHost = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";

const dashboardVacio = {
  resumen: {},
  productividad: [],
  sunat: [],
  rutas: [],
  comparativo_mensual_encomiendas: [],
  recaudacion_agencias: [],
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    const preview = text.replace(/\s+/g, " ").slice(0, 120);
    throw new Error(`Respuesta no JSON (${response.status}) desde ${url}. ${preview}`);
  }

  return {
    response,
    result: await response.json(),
  };
};

const resolverUsuarioTrabajo = ({ rows, usuarioActual, permiteTodos }) => {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const usuarioValido = rows.some((item) => item.id_usuario === usuarioActual);

  if (permiteTodos) {
    return usuarioValido ? usuarioActual : "";
  }

  return usuarioValido ? usuarioActual : rows[0]?.id_usuario || "";
};

const ui = {
  page: palette.bg,
  shell: palette.bg,
  panel: palette.surface,
  panel2: palette.surfaceAlt,
  panel3: palette.chip,
  border: palette.border,
  borderStrong: "rgba(139,154,165,0.32)",
  text: palette.text,
  muted: palette.muted,
  muted2: "#6f7f8a",
  cyan: "#cdeff6",
  peach: "#ffc480",
  mint: "#d5efbd",
  blue: "#8fb7d7",
  green: "#8bc0a3",
  yellow: "#d5b25f",
  red: "#d68f8f",
};

const formatCantidad = (value) => new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatSoles = (value) => new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
}).format(Number(value || 0));

const formatPorcentaje = (value) => `${Number(value || 0).toFixed(0)}%`;

const estadoSunatLabel = (estado) => {
  const estados = {
    A: "Aceptado",
    P: "Pendiente",
    R: "Rechazado",
    E: "Error",
    "": "Por resumir",
  };

  return estados[estado] || estado || "Por resumir";
};

const tipoOperacionLabel = (tipo) => (tipo === "B" ? "Boletos" : "Encomiendas");

const panelSx = {
  backgroundColor: ui.panel,
  border: `1px solid ${ui.border}`,
  borderRadius: 2,
  boxShadow: "0 24px 70px rgba(0,0,0,0.18)",
};

const selectSx = {
  minHeight: 40,
  color: ui.text,
  backgroundColor: "rgba(255,255,255,0.04)",
  borderRadius: 2,
  fontSize: "12.5px",
  fontWeight: 700,
  "& .MuiSelect-select": {
    py: 1,
    pl: 1.25,
    pr: 3.5,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: ui.border,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: ui.borderStrong,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: ui.cyan,
  },
  "& .MuiSvgIcon-root": {
    color: ui.muted,
  },
};

const dashboardTabs = [
  { value: "resumen", label: "Dashboard", icon: LayoutDashboard },
  { value: "recaudacion", label: "Agencias", icon: Building2 },
  { value: "flujo", label: "Operaciones", icon: Gauge },
  { value: "sunat", label: "SUNAT", icon: Send },
];

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function getNiceChartMax(value) {
  const max = Math.max(1, Number(value || 0));

  if (max <= 5) {
    return 5;
  }

  if (max <= 10) {
    return 10;
  }

  return Math.ceil(max / 5) * 5;
}

function formatHourAmPm(value) {
  const rawHour = String(value || "").split("-")[0];
  const hour = Number(rawHour);

  if (!Number.isFinite(hour)) {
    return value || "-";
  }

  if (hour === 0) {
    return "12 AM";
  }

  if (hour < 12) {
    return `${hour} AM`;
  }

  if (hour === 12) {
    return "12 PM";
  }

  return `${hour - 12} PM`;
}

function formatPeriodoCorto(periodo) {
  const normalized = String(periodo || "").includes("-")
    ? String(periodo || "")
    : String(periodo || "").replace(/^(\d{4})(\d{2})$/, "$1-$2");
  const [year, month] = normalized.split("-");
  const monthIndex = Number(month) - 1;
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

  if (!year || monthIndex < 0 || monthIndex > 11) {
    return periodo || "-";
  }

  return `${months[monthIndex]} ${year}`;
}

function buildSmoothPath(points) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  const smoothing = 0.18;
  const line = (pointA, pointB) => {
    const lengthX = pointB.x - pointA.x;
    const lengthY = pointB.y - pointA.y;
    return {
      length: Math.sqrt((lengthX ** 2) + (lengthY ** 2)),
      angle: Math.atan2(lengthY, lengthX),
    };
  };
  const controlPoint = (current, previous, next, reverse = false) => {
    const p = previous || current;
    const n = next || current;
    const o = line(p, n);
    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * smoothing;

    return {
      x: current.x + Math.cos(angle) * length,
      y: current.y + Math.sin(angle) * length,
    };
  };

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const previousPrevious = points[index - 2];
    const next = points[index + 1];
    const start = controlPoint(previous, previousPrevious, point);
    const end = controlPoint(point, previous, next, true);

    return `${path} C ${start.x} ${start.y}, ${end.x} ${end.y}, ${point.x} ${point.y}`;
  }, "");
}

function StatusChip({ label, type = "default" }) {
  const colors = {
    default: { bg: "rgba(255,255,255,0.055)", color: ui.text, border: ui.border },
    ok: { bg: "rgba(139,192,163,0.12)", color: "#c8ead7", border: "rgba(139,192,163,0.26)" },
    warning: { bg: "rgba(213,178,95,0.12)", color: "#f2d990", border: "rgba(213,178,95,0.28)" },
    danger: { bg: "rgba(214,143,143,0.12)", color: "#f3bbbb", border: "rgba(214,143,143,0.28)" },
  };
  const selected = colors[type] || colors.default;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 26,
        px: 1.15,
        borderRadius: 1.2,
        border: `1px solid ${selected.border}`,
        backgroundColor: selected.bg,
        color: selected.color,
        fontSize: "11.5px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  );
}

function MetricTile({ item }) {
  const Icon = item.icon;

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255,255,255,0.035)",
        border: `1px solid ${ui.border}`,
        borderRadius: 1.5,
        p: 1.45,
        minWidth: 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography sx={{ color: ui.muted, fontSize: "11.8px", fontWeight: 750 }} noWrap>
          {item.label}
        </Typography>
        <Box sx={{ color: item.color || ui.cyan }}>
          <Icon size={16} />
        </Box>
      </Box>
      <Typography sx={{ color: ui.text, fontSize: { xs: "19px", md: "22px" }, fontWeight: 700, lineHeight: 1.08, mt: 0.75 }} noWrap>
        {item.value}
      </Typography>
      <Typography sx={{ color: ui.muted2, fontSize: "11.5px", mt: 0.55 }} noWrap>
        {item.detail}
      </Typography>
    </Box>
  );
}

function AreaUsagePanel({ productividad, totalEncomiendas, bestFranja }) {
  const source = productividad.length > 0
    ? productividad.slice(0, 12).map((item) => ({
      label: item.hora,
      value: Number(item.encomiendas || 0),
    }))
    : [];
  const max = Math.max(...source.map((item) => item.value), 0);
  const chartMax = getNiceChartMax(max);
  const ticks = Array.from({ length: 6 }, (_, index) => Math.round(chartMax - ((chartMax / 5) * index)));
  const points = source.map((item, index) => {
    const x = source.length === 1 ? 50 : (index / (source.length - 1)) * 100;
    const y = 78 - (item.value / chartMax) * 48;
    return { ...item, x, y };
  });
  const curvePath = buildSmoothPath(points);
  const areaPath = points.length > 0
    ? `${curvePath} L 100 86 L 0 86 Z`
    : "";
  const focusIndex = Math.max(0, Math.floor(points.length / 2));
  const focus = points[focusIndex];

  return (
    <Box sx={{ ...panelSx, p: { xs: 1.6, md: 2.4 }, minHeight: { xs: 310, lg: 385 }, overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: ui.text, fontSize: "15px", fontWeight: 700 }} noWrap>
            Produccion diaria
          </Typography>
          <Typography sx={{ color: ui.muted, fontSize: "12.5px", mt: 0.45 }} noWrap>
            Encomiendas emitidas por hora
          </Typography>
        </Box>
        <Typography sx={{ color: ui.text, fontSize: { xs: "23px", md: "28px" }, fontWeight: 720, lineHeight: 1 }} noWrap>
          {formatCantidad(totalEncomiendas)}
        </Typography>
      </Box>

      <Box sx={{ position: "relative", height: { xs: 214, md: 266 } }}>
        <Box sx={{ position: "absolute", inset: 0, display: "grid", gridTemplateRows: `repeat(${ticks.length}, 1fr)` }}>
          {ticks.map((tick) => (
            <Box key={tick} sx={{ borderTop: `1px dashed rgba(148,163,184,0.16)`, position: "relative" }}>
              <Typography sx={{ position: "absolute", left: 0, top: -8, color: ui.muted2, fontSize: "11.5px", fontWeight: 700 }}>
                {tick}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box component="svg" viewBox="0 0 100 92" preserveAspectRatio="none" sx={{ position: "absolute", inset: "4px 0 26px 44px", width: "calc(100% - 44px)", height: "calc(100% - 30px)", overflow: "visible" }}>
          <defs>
            <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ui.cyan} stopOpacity="0.28" />
              <stop offset="100%" stopColor={ui.cyan} stopOpacity="0.015" />
            </linearGradient>
          </defs>
          {points.length > 0 && (
            <>
              <path d={areaPath} fill="url(#areaGlow)" />
              <path d={curvePath} fill="none" stroke={ui.cyan} strokeWidth="1.15" strokeOpacity="0.92" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {focus && (
            <>
              <line x1={focus.x} y1={focus.y} x2={focus.x} y2="86" stroke="rgba(205,239,246,0.34)" strokeWidth="0.8" />
              <circle cx={focus.x} cy={focus.y} r="2.2" fill={ui.text} stroke={ui.cyan} strokeWidth="0.8" />
            </>
          )}
        </Box>
        {focus && (
          <Box
            sx={{
              position: "absolute",
              left: `calc(44px + ${focus.x}% - 48px)`,
              top: `${Math.max(4, focus.y + 2)}%`,
              px: 1.1,
              py: 0.75,
              borderRadius: 1.2,
              color: ui.text,
              backgroundColor: "rgba(148,163,184,0.74)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
              display: { xs: "none", sm: "block" },
            }}
          >
            <Typography sx={{ fontSize: "14px", fontWeight: 720, lineHeight: 1 }}>{formatCantidad(focus.value)}</Typography>
            <Typography sx={{ fontSize: "11.5px", fontWeight: 600 }}>{bestFranja ? `Pico ${formatHourAmPm(bestFranja.hora)}` : formatHourAmPm(focus.label)}</Typography>
          </Box>
        )}
        {points.length === 0 && (
          <Box sx={{ position: "absolute", inset: "4px 0 26px 44px", display: "grid", placeItems: "center" }}>
            <Typography sx={{ color: ui.muted, fontSize: "13px" }}>
              Sin encomiendas emitidas por hora para el filtro actual.
            </Typography>
          </Box>
        )}
        <Box sx={{ position: "absolute", left: 44, right: 0, bottom: 0, display: "flex", justifyContent: "space-between" }}>
          {points.map((item, index) => (
            <Typography key={`${item.label}-${index}`} sx={{ color: ui.muted2, fontSize: "11.5px", fontWeight: 700 }} noWrap>
              {formatHourAmPm(item.label)}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function DonutPanel({ resumen }) {
  const emitidas = Number(resumen.encomiendas || 0);
  const entregadas = Number(resumen.encomiendas_entregadas || 0);
  const pendientes = Number(resumen.encomiendas_por_entregar || 0);
  const sunat = Number(resumen.sunat_pendientes || 0);
  const entregaPct = emitidas > 0 ? (entregadas / emitidas) * 100 : 0;
  const pendientePct = emitidas > 0 ? 100 - entregaPct : 0;
  const donut = `conic-gradient(${ui.green} 0 ${entregaPct}%, ${ui.peach} ${entregaPct}% 100%)`;

  const items = [
    { label: "Emitidas", value: formatCantidad(emitidas), color: ui.cyan },
    { label: "Entregadas", value: formatCantidad(entregadas), color: ui.cyan },
    { label: "Pendientes", value: formatCantidad(pendientes), color: ui.peach },
    { label: "SUNAT", value: formatCantidad(sunat), color: "#7d8898" },
  ];

  return (
    <Box sx={{ ...panelSx, p: 1.75 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
        <Typography sx={{ color: ui.text, fontSize: "15px", fontWeight: 700 }} noWrap>
          Estado de entregas
        </Typography>
        <Typography sx={{ color: ui.muted, fontSize: "12px", fontWeight: 700 }} noWrap>
          Encomiendas
        </Typography>
      </Box>

      <Box sx={{ display: "grid", placeItems: "center", py: 1 }}>
        <Box sx={{ width: 172, height: 172, borderRadius: "50%", background: donut, display: "grid", placeItems: "center" }}>
          <Box sx={{ width: 92, height: 92, borderRadius: "50%", backgroundColor: ui.panel, display: "grid", placeItems: "center", border: `1px solid ${ui.border}` }}>
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ color: ui.text, fontSize: "20px", fontWeight: 700, lineHeight: 1 }}>{formatPorcentaje(entregaPct)}</Typography>
              <Typography sx={{ color: ui.muted, fontSize: "10.5px", fontWeight: 650, mt: 0.35 }}>entregadas</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.8, mt: 0.8 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.65, color: ui.muted, minWidth: 0 }}>
          <Box sx={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: ui.green, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "11.5px", fontWeight: 650 }} noWrap>
            {formatPorcentaje(entregaPct)} entregadas
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.65, color: ui.muted, minWidth: 0 }}>
          <Box sx={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: ui.peach, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "11.5px", fontWeight: 650 }} noWrap>
            {formatPorcentaje(pendientePct)} pendientes
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.9, mt: 1.25 }}>
        {items.map((item) => (
          <Box key={item.label} sx={{ border: `1px solid ${ui.borderStrong}`, borderRadius: 1.2, p: 1.05, minWidth: 0 }}>
            <Typography sx={{ color: ui.muted2, fontSize: "11.5px", fontWeight: 800 }} noWrap>
              {item.label}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.65, mt: 0.55 }}>
              <Box sx={{ width: 3, height: 22, borderRadius: 1, backgroundColor: item.color }} />
              <Typography sx={{ color: ui.text, fontSize: "12.5px", fontWeight: 650 }} noWrap>
                {item.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function MiniLinePanel({ data }) {
  const source = data.slice(-3);
  const max = Math.max(...source.map((item) => Number(item.encomiendas || 0)), 0);
  const chartMax = getNiceChartMax(max);

  return (
    <Box sx={{ ...panelSx, p: 1.6, minHeight: 258 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: ui.text, fontSize: "14px", fontWeight: 700 }} noWrap>
            Comparativo mensual
          </Typography>
          <Typography sx={{ color: ui.muted, fontSize: "12px", mt: 0.35 }} noWrap>
            Ultimos 3 meses
          </Typography>
        </Box>
        <Typography sx={{ color: ui.text, fontSize: "21px", fontWeight: 700 }} noWrap>
          {formatCantidad(source.reduce((total, item) => total + Number(item.encomiendas || 0), 0))}
        </Typography>
      </Box>

      {source.length > 0 ? (
        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${source.length}, minmax(0, 1fr))`, gap: 1.1, alignItems: "end", height: 170, mt: 1.45 }}>
          {source.map((item) => {
            const encomiendas = Number(item.encomiendas || 0);
            const height = chartMax > 0 ? (encomiendas / chartMax) * 100 : 0;

            return (
              <Box key={item.periodo} sx={{ height: "100%", minWidth: 0, display: "grid", gridTemplateRows: "1fr auto", gap: 0.75 }}>
                <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", borderBottom: `1px solid ${ui.border}` }}>
                  <Box sx={{ width: "74%", maxWidth: 72, minHeight: encomiendas > 0 ? 14 : 5, height: `${Math.max(height, encomiendas > 0 ? 12 : 3)}%`, borderRadius: "7px 7px 0 0", background: `linear-gradient(180deg, ${ui.cyan} 0%, rgba(205,239,246,0.18) 100%)`, border: "1px solid rgba(205,239,246,0.35)", borderBottom: 0, position: "relative" }}>
                    <Typography sx={{ position: "absolute", top: -23, left: "50%", transform: "translateX(-50%)", color: ui.text, fontSize: "12px", fontWeight: 700 }} noWrap>
                      {formatCantidad(encomiendas)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "center", minWidth: 0 }}>
                  <Typography sx={{ color: ui.text, fontSize: "12px", fontWeight: 650 }} noWrap>
                    {formatPeriodoCorto(item.periodo)}
                  </Typography>
                  <Typography sx={{ color: ui.muted2, fontSize: "11px", mt: 0.2 }} noWrap>
                    {formatSoles(item.monto_total)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ height: 170, mt: 1.45, display: "grid", placeItems: "center", borderTop: `1px dashed ${ui.border}`, borderBottom: `1px dashed ${ui.border}` }}>
          <Typography sx={{ color: ui.muted, fontSize: "13px", textAlign: "center" }}>
            Sin comparativo mensual para el periodo actual.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function OperationMixPanel({ productividad }) {
  const source = productividad.length > 0 ? productividad.slice(0, 7) : [];
  const max = Math.max(...source.map((item) => Math.max(Number(item.encomiendas || 0), Number(item.boletos || 0))), 1);
  const totalEncomiendas = source.reduce((total, item) => total + Number(item.encomiendas || 0), 0);
  const totalBoletos = source.reduce((total, item) => total + Number(item.boletos || 0), 0);

  return (
    <Box sx={{ ...panelSx, p: 1.6, minHeight: 258 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: ui.text, fontSize: "14px", fontWeight: 700 }} noWrap>
            Boletos vs encomiendas
          </Typography>
          <Typography sx={{ color: ui.muted, fontSize: "12px", mt: 0.35 }} noWrap>
            Diferencia por hora
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.1, color: ui.muted, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: ui.cyan }} />
            <Typography sx={{ fontSize: "11.5px", fontWeight: 650 }} noWrap>
              Enc. {formatCantidad(totalEncomiendas)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: ui.peach }} />
            <Typography sx={{ fontSize: "11.5px", fontWeight: 650 }} noWrap>
              Bol. {formatCantidad(totalBoletos)}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ height: 170, display: "grid", gridTemplateColumns: `repeat(${Math.max(source.length, 1)}, 1fr)`, gap: 1, alignItems: "end", mt: 1.35 }}>
        {source.length > 0 ? source.map((item, index) => {
          const encomiendas = Number(item.encomiendas || 0);
          const boletos = Number(item.boletos || 0);

          return (
            <Box key={`${item.hora}-${index}`} sx={{ height: "100%", display: "grid", gridTemplateRows: "1fr auto", gap: 0.55 }}>
              <Box sx={{ height: "100%", display: "flex", gap: 0.45, justifyContent: "center", alignItems: "flex-end", borderBottom: `1px solid ${ui.border}` }}>
                <Tooltip title={`${formatCantidad(encomiendas)} encomiendas`}>
                  <Box sx={{ width: 8, height: `${Math.max(encomiendas > 0 ? 8 : 3, (encomiendas / max) * 100)}%`, borderRadius: "6px 6px 0 0", backgroundColor: ui.cyan }} />
                </Tooltip>
                <Tooltip title={`${formatCantidad(boletos)} boletos`}>
                  <Box sx={{ width: 8, height: `${Math.max(boletos > 0 ? 8 : 3, (boletos / max) * 100)}%`, borderRadius: "6px 6px 0 0", backgroundColor: ui.peach }} />
                </Tooltip>
              </Box>
              <Typography sx={{ color: ui.muted2, fontSize: "11px", textAlign: "center", fontWeight: 700 }} noWrap>
                {formatHourAmPm(item.hora)}
              </Typography>
            </Box>
          );
        }) : (
          <Box sx={{ gridColumn: "1 / -1", height: "100%", display: "grid", placeItems: "center", borderTop: `1px dashed ${ui.border}`, borderBottom: `1px dashed ${ui.border}` }}>
            <Typography sx={{ color: ui.muted, fontSize: "13px", textAlign: "center" }}>
              Sin boletos ni encomiendas por hora para el filtro actual.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function AgencyListPanel({ data }) {
  return (
    <Box sx={{ ...panelSx, p: 1.65, backgroundColor: ui.panel2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.25 }}>
        <Typography sx={{ color: ui.text, fontSize: "14px", fontWeight: 700 }} noWrap>
          Agencias
        </Typography>
        <Typography sx={{ color: ui.muted, fontSize: "12px", fontWeight: 700 }} noWrap>
          Ver todo
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, px: 1, py: 0.75, borderRadius: 1.1, backgroundColor: "rgba(255,255,255,0.07)", color: ui.muted, fontSize: "11.5px", fontWeight: 800 }}>
        <span>Nombre</span>
        <span>Venta</span>
      </Box>

      <Box sx={{ display: "grid", gap: 1.05, mt: 1.3 }}>
        {(data.length > 0 ? data.slice(0, 5) : []).map((item) => (
          <Box key={item.id_punto_venta || item.agencia} sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 1, alignItems: "center" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: ui.text, fontSize: "12.8px", fontWeight: 650 }} noWrap>
                {item.agencia || item.id_punto_venta}
              </Typography>
              <Typography sx={{ color: ui.muted, fontSize: "11.5px", mt: 0.2 }} noWrap>
                {formatCantidad(item.encomiendas_facturadas)} emitidas
              </Typography>
            </Box>
            <Typography sx={{ color: ui.muted, fontSize: "12px", fontWeight: 800 }} noWrap>
              {formatSoles(item.monto_recaudado ?? item.monto_efectivo)}
            </Typography>
          </Box>
        ))}
        {data.length === 0 && (
          <Typography sx={{ color: ui.muted, fontSize: "12.5px", py: 1 }}>
            Sin agencias registradas para el filtro actual.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function DetailRow({ icon: Icon, title, subtitle, value, color = ui.cyan }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "34px minmax(0, 1fr) auto", gap: 1.1, alignItems: "center", py: 1.15, borderTop: `1px solid ${ui.border}` }}>
      <Box sx={{ width: 34, height: 34, borderRadius: 1.2, display: "grid", placeItems: "center", color, backgroundColor: "rgba(255,255,255,0.055)" }}>
        <Icon size={16} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: ui.text, fontSize: "13px", fontWeight: 650 }} noWrap>
          {title}
        </Typography>
        <Typography sx={{ color: ui.muted, fontSize: "11.8px", mt: 0.25 }} noWrap>
          {subtitle}
        </Typography>
      </Box>
      <Typography sx={{ color: ui.text, fontSize: "12.5px", fontWeight: 650, whiteSpace: "nowrap" }}>
        {value}
      </Typography>
    </Box>
  );
}

function AgencyAmountPill({ label, value, color, muted = false }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        border: `1px solid ${color.border}`,
        backgroundColor: color.bg,
        borderRadius: 1.2,
        px: 1,
        py: 0.85,
      }}
    >
      <Typography sx={{ color: muted ? ui.muted2 : color.text, fontSize: "10.8px", fontWeight: 700 }} noWrap>
        {label}
      </Typography>
      <Typography sx={{ color: muted ? ui.muted : ui.text, fontSize: "12.5px", fontWeight: 700, mt: 0.25 }} noWrap>
        {formatSoles(value)}
      </Typography>
    </Box>
  );
}

function RecaudacionPanel({ data }) {
  const pillColors = {
    emitido: { bg: "rgba(205,239,246,0.08)", border: "rgba(205,239,246,0.22)", text: ui.cyan },
    porPagar: { bg: "rgba(213,178,95,0.10)", border: "rgba(213,178,95,0.26)", text: ui.yellow },
    salidas: { bg: "rgba(214,143,143,0.08)", border: "rgba(214,143,143,0.20)", text: ui.red },
    recaudado: { bg: "rgba(139,192,163,0.11)", border: "rgba(139,192,163,0.28)", text: ui.green },
  };

  return (
    <Box sx={{ ...panelSx, p: 1.75 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
        <Typography sx={{ color: ui.text, fontSize: "15px", fontWeight: 700 }} noWrap>
          Recaudacion por agencia
        </Typography>
        <StatusChip label={`${data.length} agencias`} />
      </Box>
      {data.length > 0 ? data.map((item) => {
        const montoEmitido = Number(item.monto_facturado || 0);
        const montoPorPagar = Number(item.monto_por_pagar || 0);
        const montoSalidas = Number(item.monto_salidas_dinero || 0);
        const montoRecaudado = Math.max(0, montoEmitido - montoPorPagar - montoSalidas);
        const avance = montoEmitido > 0 ? (montoRecaudado / montoEmitido) * 100 : 0;

        return (
          <Box key={item.id_punto_venta || item.agencia} sx={{ py: 1.15, borderTop: `1px solid ${ui.border}` }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(460px, 0.95fr)" }, gap: 1.2, alignItems: "center" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: ui.text, fontSize: "13px", fontWeight: 650 }} noWrap>
                  {item.agencia || item.id_punto_venta}
                </Typography>
                <Typography sx={{ color: ui.muted, fontSize: "11.8px", mt: 0.25 }} noWrap>
                  {item.encomiendas_facturadas} emitidas - {item.encomiendas_por_pagar || 0} por cobrar
                </Typography>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr 1.05fr" }, gap: 0.75, alignItems: "stretch", minWidth: 0 }}>
                <AgencyAmountPill label="Emitido" value={montoEmitido} color={pillColors.emitido} />
                <AgencyAmountPill label="POR_COBRAR" value={montoPorPagar} color={pillColors.porPagar} />
                <AgencyAmountPill label="Salidas dinero" value={montoSalidas} color={pillColors.salidas} muted={montoSalidas === 0} />
                <AgencyAmountPill label="Recaudado" value={montoRecaudado} color={pillColors.recaudado} />
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={clampPercent(avance)}
              sx={{
                height: 5,
                borderRadius: 2,
                mt: 0.85,
                backgroundColor: "rgba(255,255,255,0.06)",
                "& .MuiLinearProgress-bar": { backgroundColor: ui.green, borderRadius: 2 },
              }}
            />
          </Box>
        );
      }) : (
        <Typography sx={{ color: ui.muted, fontSize: "13px", py: 1 }}>
          Sin agencias registradas para la razon social actual.
        </Typography>
      )}
    </Box>
  );
}

function FlowPanel({ indicadores, productividad, bestFranja, entregasPendientes }) {
  return (
    <Box sx={{ ...panelSx, overflow: "hidden" }}>
      <Box sx={{ px: 1.8, py: 1.55, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Gauge size={17} color={ui.cyan} />
          <Typography sx={{ color: ui.text, fontSize: "15px", fontWeight: 700 }} noWrap>
            Productividad del dia
          </Typography>
        </Box>
        <StatusChip label="Encomiendas + boletos" />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1.1, p: 1.4, borderTop: `1px solid ${ui.border}` }}>
        {indicadores.map((item) => (
          <Box key={item.label} sx={{ backgroundColor: "rgba(255,255,255,0.035)", border: `1px solid ${ui.border}`, borderRadius: 1.2, p: 1.25, minWidth: 0 }}>
            <Typography sx={{ color: ui.muted, fontSize: "11.5px", fontWeight: 750 }} noWrap>
              {item.label}
            </Typography>
            <Typography sx={{ color: ui.text, fontSize: "19px", fontWeight: 700, mt: 0.4 }} noWrap>
              {item.value}
            </Typography>
            <Typography sx={{ color: ui.muted2, fontSize: "11.5px", mt: 0.3 }} noWrap>
              {item.detail}
            </Typography>
          </Box>
        ))}
      </Box>

      {productividad.length > 0 ? productividad.map((item) => (
        <DetailRow
          key={item.hora}
          icon={Clock3}
          title={item.hora}
          subtitle={`${item.encomiendas} encomiendas - ${item.boletos} boletos`}
          value={formatSoles(item.monto_total)}
          color={ui.cyan}
        />
      )) : (
        <Typography sx={{ color: ui.muted, fontSize: "13px", px: 1.6, py: 2, borderTop: `1px solid ${ui.border}` }}>
          Sin productividad registrada para el filtro actual.
        </Typography>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1, p: 1.45, borderTop: `1px solid ${ui.border}` }}>
        <DetailRow icon={CheckCircle2} title="Mejor franja" subtitle={bestFranja ? `${bestFranja.documentos} documentos` : "Sin movimiento destacado"} value={bestFranja?.hora || "-"} color={ui.green} />
        <DetailRow icon={Clock3} title="Pendientes" subtitle="Encomiendas sin cierre" value={formatCantidad(entregasPendientes)} color={ui.yellow} />
      </Box>
    </Box>
  );
}

function SunatPanel({ sunatItems }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.15fr 0.85fr" }, gap: 1.35 }}>
      <Box sx={{ ...panelSx, p: 1.75 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Send size={17} color={ui.cyan} />
            <Typography sx={{ color: ui.text, fontSize: "15px", fontWeight: 700 }} noWrap>
              Resumen SUNAT
            </Typography>
          </Box>
          <StatusChip label="Ticket" type="warning" />
        </Box>

        {sunatItems.map((item) => (
          <DetailRow key={item.label} icon={CloudUpload} title={item.label} subtitle={item.detail} value={item.value} color={ui.peach} />
        ))}
      </Box>

      <Box sx={{ ...panelSx, p: 1.55, display: "grid", gridTemplateColumns: "auto 1fr", gap: 1.15, alignItems: "center", alignSelf: "start" }}>
        <Box sx={{ width: 38, height: 38, borderRadius: 1.2, display: "grid", placeItems: "center", backgroundColor: "rgba(214,143,143,0.12)", color: ui.red }}>
          <AlertTriangle size={18} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: ui.text, fontSize: "13px", fontWeight: 650 }} noWrap>
            Observaciones por revisar
          </Typography>
          <Typography sx={{ color: ui.muted, fontSize: "12px", mt: 0.25 }} noWrap>
            SUNAT pendiente mas de 24h
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function TrEncomiendaDashboardMockup() {
  const params = useParams();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width:1100px)");

  // Estado principal del dashboard.
  // dashboard guarda los indicadores; los demas estados controlan filtros.
  const [dashboard, setDashboard] = useState(dashboardVacio);
  const [periodos, setPeriodos] = useState([]);
  const [contabilidades, setContabilidades] = useState([]);
  const [puntosVentaAsignados, setPuntosVentaAsignados] = useState([]);
  const [usuariosTrabajo, setUsuariosTrabajo] = useState([]);
  const [periodoTrabajo, setPeriodoTrabajo] = useState(sessionStorage.getItem("periodo_trabajo") || params.periodo || "");
  const [contabilidadTrabajo, setContabilidadTrabajo] = useState(sessionStorage.getItem("contabilidad_trabajo") || params.documento_id || "");
  const [puntoVentaTrabajo, setPuntoVentaTrabajo] = useState("");
  const [usuarioTrabajo, setUsuarioTrabajo] = useState("");
  const [diaSel, setDiaSel] = useState("*");
  const [activeTab, setActiveTab] = useState("resumen");
  const [loading, setLoading] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");

  // Reglas de acceso visual.
  // El backend tambien valida estas reglas antes de consultar datos.
  const superUsuario = sessionStorage.getItem("super") || "0";
  const accesoTotalDashboard = params.id_anfitrion === params.id_invitado || superUsuario === "1";
  const usuarioTieneVariasAgencias = puntosVentaAsignados.length > 1;
  const usuarioPuedeVerTodosCorreos = accesoTotalDashboard && usuarioTieneVariasAgencias;

  // Carga periodos y empresas disponibles para el usuario actual.
  const cargarCatalogos = useCallback(async () => {
    try {
      const [periodosData, contabilidadesData] = await Promise.all([
        fetchJson(`${backHost}/usuario/periodos/${params.id_anfitrion}`),
        fetchJson(`${backHost}/usuario/contabilidades/${params.id_anfitrion}/${params.id_invitado}`),
      ]);

      const periodosResult = periodosData.result;
      const contabilidadesResult = contabilidadesData.result;
      const periodosRows = Array.isArray(periodosResult) ? periodosResult : [];
      const contabilidadesRows = Array.isArray(contabilidadesResult) ? contabilidadesResult : [];

      setPeriodos(periodosRows);
      setContabilidades(contabilidadesRows);

      if (!periodoTrabajo && periodosRows[0]?.periodo) {
        setPeriodoTrabajo(periodosRows[0].periodo);
      }

      if (!contabilidadTrabajo && contabilidadesRows[0]?.documento_id) {
        setContabilidadTrabajo(contabilidadesRows[0].documento_id);
      }
    } catch (error) {
      console.log("Error cargando filtros del dashboard:", error);
    }
  }, [contabilidadTrabajo, params.id_anfitrion, params.id_invitado, periodoTrabajo]);

  // Carga agencias/puntos de venta.
  // Anfitrion/super ven todos; invitado normal ve solo sus puntos vigentes.
  const cargarPuntosVentaAsignados = useCallback(async () => {
    if (!contabilidadTrabajo || !params.id_anfitrion || !params.id_invitado) {
      setPuntosVentaAsignados([]);
      setPuntoVentaTrabajo("");
      return;
    }

    try {
      const url = accesoTotalDashboard
        ? `${backHost}/mad_punto_venta/${params.id_anfitrion}/${contabilidadTrabajo}`
        : `${backHost}/mad_punto_venta_usuario/${params.id_anfitrion}/${contabilidadTrabajo}/${params.id_invitado}`;
      const { result } = await fetchJson(url);
      const rows = Array.isArray(result?.data) ? result.data : [];
      const sessionKey = `punto_venta_trabajo_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
      const puntoGuardado = sessionStorage.getItem(sessionKey) || "";
      const puntoGuardadoValido = rows.some((item) => item.id_punto_venta === puntoGuardado);
      const permiteTodos = rows.length > 1;
      const puntoFinal = permiteTodos
        ? (puntoGuardadoValido ? puntoGuardado : "")
        : rows[0]?.id_punto_venta || "";

      setPuntosVentaAsignados(rows);
      setPuntoVentaTrabajo(puntoFinal);
    } catch (error) {
      console.log("Error cargando puntos de venta del dashboard:", error);
      setPuntosVentaAsignados([]);
      setPuntoVentaTrabajo("");
    }
  }, [accesoTotalDashboard, contabilidadTrabajo, params.id_anfitrion, params.id_invitado]);

  // Carga correos que registraron operaciones en el filtro actual.
  // La fuente oficial del usuario operativo es mve_transventa.ctrl_crea_us.
  const cargarUsuariosTrabajo = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || !params.id_anfitrion || !params.id_invitado) {
      setUsuariosTrabajo([]);
      setUsuarioTrabajo("");
      return;
    }

    if (!accesoTotalDashboard) {
      setUsuariosTrabajo([{ id_usuario: params.id_invitado, nombre: params.id_invitado }]);
      setUsuarioTrabajo(params.id_invitado);
      return;
    }

    try {
      const query = new URLSearchParams();
      query.set("id_invitado", params.id_invitado || "");
      query.set("super_usuario", superUsuario);
      if (puntoVentaTrabajo) {
        query.set("id_punto_venta", puntoVentaTrabajo);
      }
      if (diaSel && diaSel !== "*") {
        query.set("fecha", `${periodoTrabajo}-${diaSel}`);
      }

      const { result } = await fetchJson(`${backHost}/mve_transventa/dashboard/usuarios/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query.toString()}`);
      const rows = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.data?.usuarios_trabajo)
          ? result.data.usuarios_trabajo
          : [];
      const sessionKey = `usuario_dashboard_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
      const usuarioGuardado = sessionStorage.getItem(sessionKey) || "";
      const usuarioFinal = resolverUsuarioTrabajo({
        rows,
        usuarioActual: usuarioGuardado,
        permiteTodos: usuarioPuedeVerTodosCorreos,
      });

      setUsuariosTrabajo(rows);
      setUsuarioTrabajo(usuarioFinal);
    } catch (error) {
      console.log("Error cargando usuarios del dashboard:", error);
      setUsuariosTrabajo([]);
      setUsuarioTrabajo("");
    }
  }, [accesoTotalDashboard, contabilidadTrabajo, diaSel, params.id_anfitrion, params.id_invitado, periodoTrabajo, puntoVentaTrabajo, superUsuario, usuarioPuedeVerTodosCorreos]);

  // Consulta los indicadores principales del dashboard.
  // Si diaSel es "*", no se envia fecha y el backend resume todo el periodo.
  const cargarDashboard = useCallback(async () => {
    if (!periodoTrabajo || !contabilidadTrabajo || !params.id_anfitrion) {
      return;
    }

    setLoading(true);
    setErrorCarga("");

    try {
      const query = new URLSearchParams();
      query.set("id_invitado", params.id_invitado || "");
      query.set("super_usuario", superUsuario);

      if (puntoVentaTrabajo) {
        query.set("id_punto_venta", puntoVentaTrabajo);
      }
      if (usuarioTrabajo) {
        query.set("id_usuario_trabajo", usuarioTrabajo);
      }

      const diaFiltro = diaSel || "*";
      if (diaFiltro !== "*") {
        query.set("fecha", `${periodoTrabajo}-${diaFiltro}`);
      }

      const { response, result } = await fetchJson(`${backHost}/mve_transventa/dashboard/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}?${query.toString()}`);

      if (!response.ok || !result?.success) {
        const detail = result?.message || result?.error || "No se pudo cargar el dashboard.";
        throw new Error(`API ${response.status}: ${detail}`);
      }

      const dashboardData = result.data || dashboardVacio;
      setDashboard(dashboardData);

      if (Array.isArray(dashboardData.usuarios_trabajo)) {
        setUsuariosTrabajo(dashboardData.usuarios_trabajo);
        setUsuarioTrabajo((actual) => resolverUsuarioTrabajo({
          rows: dashboardData.usuarios_trabajo,
          usuarioActual: actual,
          permiteTodos: usuarioPuedeVerTodosCorreos,
        }));
      }
    } catch (error) {
      console.log("Error cargando dashboard transporte:", error);
      setDashboard(dashboardVacio);
      setErrorCarga(error.message || "No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }, [contabilidadTrabajo, diaSel, params.id_anfitrion, params.id_invitado, periodoTrabajo, puntoVentaTrabajo, superUsuario, usuarioPuedeVerTodosCorreos, usuarioTrabajo]);

  // Carga inicial de periodo y razon social.
  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  // Recarga agencias cuando cambia la empresa o el acceso del usuario.
  useEffect(() => {
    cargarPuntosVentaAsignados();
  }, [cargarPuntosVentaAsignados]);

  // Recarga usuarios cuando cambia dia, agencia, periodo o empresa.
  useEffect(() => {
    cargarUsuariosTrabajo();
  }, [cargarUsuariosTrabajo]);

  // Recarga indicadores cuando cambia cualquier filtro de trabajo.
  useEffect(() => {
    sessionStorage.setItem("periodo_trabajo", periodoTrabajo || "");
    sessionStorage.setItem("contabilidad_trabajo", contabilidadTrabajo || "");
    cargarDashboard();
  }, [cargarDashboard, periodoTrabajo, contabilidadTrabajo, diaSel, puntoVentaTrabajo, usuarioTrabajo]);

  const resumen = dashboard.resumen || {};
  const productividad = Array.isArray(dashboard.productividad) ? dashboard.productividad : [];
  const sunat = Array.isArray(dashboard.sunat) ? dashboard.sunat : [];
  const recaudacionAgencias = Array.isArray(dashboard.recaudacion_agencias) ? dashboard.recaudacion_agencias : [];
  const comparativoMensual = Array.isArray(dashboard.comparativo_mensual_encomiendas)
    ? dashboard.comparativo_mensual_encomiendas
    : [];
  const totalDocumentos = Number(resumen.encomiendas || 0) + Number(resumen.boletos || 0);
  const totalEncomiendasProductividad = productividad.reduce((total, item) => total + Number(item.encomiendas || 0), 0);
  const montoFacturadoEncomiendas = Number(resumen.monto_encomiendas_facturado ?? resumen.monto_encomiendas ?? 0);
  const montoPorCobrarPendiente = Number(resumen.monto_por_cobrar_pendiente_entrega || 0);
  const montoEfectivoDashboard = montoPorCobrarPendiente > 0
    ? Math.max(0, montoFacturadoEncomiendas - montoPorCobrarPendiente)
    : Number(resumen.monto_efectivo_agencia || 0);
  const bestFranjaEncomiendas = productividad.reduce((best, item) => (
    !best || Number(item.encomiendas || 0) > Number(best.encomiendas || 0) ? item : best
  ), null);
  const bestFranjaDocumentos = productividad.reduce((best, item) => (
    !best || Number(item.documentos || 0) > Number(best.documentos || 0) ? item : best
  ), null);

  const kpis = [
    { label: "Total facturado", value: formatSoles(montoFacturadoEncomiendas), detail: `${formatCantidad(resumen.encomiendas)} encomiendas`, icon: Package, color: ui.cyan },
    { label: "Total efectivo", value: formatSoles(montoEfectivoDashboard), detail: montoPorCobrarPendiente > 0 ? `Desc. ${formatSoles(montoPorCobrarPendiente)}` : "Sin POR_COBRAR pendiente", icon: Wallet, color: ui.green },
    { label: "Por entregar", value: formatCantidad(resumen.encomiendas_por_entregar), detail: "Pendientes de cierre", icon: Boxes, color: ui.yellow },
    { label: "SUNAT", value: formatCantidad(resumen.sunat_pendientes), detail: "pendientes resumen", icon: CloudUpload, color: ui.red },
  ];

  const indicadores = [
    { label: "Documentos", value: formatCantidad(totalDocumentos), detail: "Boletos + encomiendas" },
    { label: "Entrega efectiva", value: formatPorcentaje(resumen.entrega_efectiva), detail: `${formatCantidad(resumen.encomiendas_entregadas)} de ${formatCantidad(resumen.encomiendas)} cerradas` },
    { label: "Mix transporte", value: `${formatCantidad(resumen.encomiendas)}/${formatCantidad(resumen.boletos)}`, detail: "Encomiendas / boletos" },
  ];

  const sunatItems = sunat.length > 0
    ? sunat.slice(0, 5).map((item) => ({
      label: `${tipoOperacionLabel(item.tipo_operacion)} - ${estadoSunatLabel(item.estado_sunat)}`,
      value: formatCantidad(item.documentos),
      detail: `Base ${formatSoles(Number(item.base_gravada || 0) + Number(item.base_exonerada || 0))} - IGV ${formatSoles(item.igv)}`,
    }))
    : [{ label: "Sin documentos SUNAT", value: "0", detail: "No hay boletas para el filtro actual" }];

  const navegarDashboard = (periodo, documentoId) => {
    navigate(`/ad_transportedashboard/${params.id_anfitrion}/${params.id_invitado}/${periodo}/${documentoId}`);
  };

  // Al cambiar periodo, se reinicia el dia para evitar seleccionar un dia
  // que no exista en el nuevo mes.
  const handlePeriodoSelect = (event) => {
    const periodo = event.target.value;
    setPeriodoTrabajo(periodo);
    setDiaSel("*");
    navegarDashboard(periodo, contabilidadTrabajo);
  };

  // Al cambiar empresa se limpian agencia y usuario porque dependen del RUC.
  const handleContabilidadSelect = (event) => {
    const documentoId = event.target.value;
    const seleccionada = contabilidades.find((item) => item.documento_id === documentoId);
    setContabilidadTrabajo(documentoId);
    setPuntosVentaAsignados([]);
    setPuntoVentaTrabajo("");
    setUsuariosTrabajo([]);
    setUsuarioTrabajo("");
    if (seleccionada?.razon_social) {
      sessionStorage.setItem("contabilidad_nombre", seleccionada.razon_social);
    }
    navegarDashboard(periodoTrabajo, documentoId);
  };

  // Agencia vacia significa TODOS cuando el usuario tiene mas de un punto.
  const handlePuntoVentaSelect = (event) => {
    const puntoVenta = event.target.value;
    const sessionKey = `punto_venta_trabajo_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
    setPuntoVentaTrabajo(puntoVenta);
    setUsuarioTrabajo("");
    if (puntoVenta) {
      sessionStorage.setItem(sessionKey, puntoVenta);
    } else {
      sessionStorage.removeItem(sessionKey);
    }
  };

  // Dia "*" muestra todo el periodo; cualquier otro dia filtra caja diaria.
  const handleDayFilter = (selectedDay) => {
    const dia = selectedDay === "*" ? "*" : selectedDay.toString().padStart(2, "0");
    setUsuarioTrabajo("");
    setDiaSel(dia);
  };

  // Usuario vacio significa TODOS los correos permitidos para el filtro actual.
  const handleUsuarioSelect = (event) => {
    const usuario = event.target.value;
    const sessionKey = `usuario_dashboard_${params.id_anfitrion}_${contabilidadTrabajo}_${params.id_invitado}`;
    setUsuarioTrabajo(usuario);
    if (usuario) {
      sessionStorage.setItem(sessionKey, usuario);
    } else {
      sessionStorage.removeItem(sessionKey);
    }
  };

  const contentByTab = {
    resumen: (
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 390px" }, gap: 2 }}>
        <Box sx={{ display: "grid", gap: 2, minWidth: 0 }}>
          <AreaUsagePanel productividad={productividad} totalEncomiendas={totalEncomiendasProductividad} bestFranja={bestFranjaEncomiendas} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
            <MiniLinePanel data={comparativoMensual} />
            <OperationMixPanel productividad={productividad} />
          </Box>
        </Box>
        <Box sx={{ display: "grid", gap: 2, alignContent: "start", minWidth: 0 }}>
          <DonutPanel resumen={resumen} />
          <AgencyListPanel data={recaudacionAgencias} />
        </Box>
      </Box>
    ),
    recaudacion: <RecaudacionPanel data={recaudacionAgencias} />,
    flujo: <FlowPanel indicadores={indicadores} productividad={productividad} bestFranja={bestFranjaDocumentos} entregasPendientes={resumen.encomiendas_por_entregar} />,
    sunat: <SunatPanel sunatItems={sunatItems} />,
  };

  return (
    <Box sx={{ minHeight: "100vh", background: ui.page, p: { xs: 1, sm: 2, lg: 2.5 }, fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" }}>
      <Box
        sx={{
          maxWidth: 1560,
          mx: "auto",
          overflow: "hidden",
          borderRadius: { xs: 2, md: 3 },
          backgroundColor: ui.shell,
          boxShadow: "0 16px 42px rgba(0,0,0,0.18)",
          border: `1px solid ${ui.border}`,
        }}
      >
        <Box sx={{ p: { xs: 1.4, sm: 2, lg: 2.8 }, minWidth: 0 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" }, gap: 1.4, alignItems: "center", mb: 2.5 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: ui.text, fontWeight: 700, fontSize: { xs: "23px", md: "28px" }, lineHeight: 1.1 }} noWrap={isDesktop}>
                Dashboard Encomiendas
              </Typography>
              <Box sx={{ display: loading || errorCarga ? "flex" : "none", alignItems: "center", gap: 1, mt: 0.85, color: ui.muted, flexWrap: "wrap" }}>
                {loading && <StatusChip label="Cargando" />}
                {errorCarga && <StatusChip label={errorCarga} type="warning" />}
              </Box>
            </Box>

            {/* Filtros principales: periodo, empresa, agencia y usuario de caja. */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `140px minmax(180px, 260px) ${puntosVentaAsignados.length > 0 ? "minmax(170px, 230px)" : ""} ${usuariosTrabajo.length > 0 ? "minmax(190px, 260px)" : ""} auto` }, gap: 1, alignItems: "center", justifyContent: { xs: "stretch", md: "flex-end" } }}>
              <Select
                size="small"
                value={periodoTrabajo}
                onChange={handlePeriodoSelect}
                displayEmpty
                sx={selectSx}
                MenuProps={{ PaperProps: { sx: { backgroundColor: ui.panel2, color: ui.text } } }}
              >
                <MenuItem value="">Periodo</MenuItem>
                {periodos.map((item) => (
                  <MenuItem key={item.periodo} value={item.periodo}>
                    {item.periodo}
                  </MenuItem>
                ))}
              </Select>
              <Select
                size="small"
                value={contabilidadTrabajo}
                onChange={handleContabilidadSelect}
                displayEmpty
                sx={selectSx}
                MenuProps={{ PaperProps: { sx: { backgroundColor: ui.panel2, color: ui.text } } }}
              >
                <MenuItem value="">Razon social</MenuItem>
                {contabilidades.map((item) => (
                  <MenuItem key={item.documento_id} value={item.documento_id}>
                    {item.razon_social || item.documento_id}
                  </MenuItem>
                ))}
              </Select>
              {puntosVentaAsignados.length > 0 && (
                <Select
                  size="small"
                  value={puntoVentaTrabajo}
                  onChange={handlePuntoVentaSelect}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value && usuarioTieneVariasAgencias) return "TODOS";
                    if (!value) return "Punto de venta";
                    const punto = puntosVentaAsignados.find((item) => item.id_punto_venta === value);
                    return punto ? `${punto.id_punto_venta} - ${punto.nombre || punto.id_punto_venta}` : value;
                  }}
                  sx={selectSx}
                  MenuProps={{ PaperProps: { sx: { backgroundColor: ui.panel2, color: ui.text } } }}
                >
                  {usuarioTieneVariasAgencias && <MenuItem value="">TODOS</MenuItem>}
                  {puntosVentaAsignados.map((item) => (
                    <MenuItem key={item.id_punto_venta} value={item.id_punto_venta}>
                      {item.id_punto_venta} - {item.nombre || item.id_punto_venta}
                    </MenuItem>
                  ))}
                </Select>
              )}
              {usuariosTrabajo.length > 0 && (
                <Select
                  size="small"
                  value={usuarioTrabajo}
                  onChange={handleUsuarioSelect}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value && usuarioPuedeVerTodosCorreos) return "TODOS";
                    if (!value) return "Usuario";
                    const usuario = usuariosTrabajo.find((item) => item.id_usuario === value);
                    return usuario?.nombre || value;
                  }}
                  sx={selectSx}
                  MenuProps={{ PaperProps: { sx: { backgroundColor: ui.panel2, color: ui.text } } }}
                >
                  {usuarioPuedeVerTodosCorreos && <MenuItem value="">TODOS</MenuItem>}
                  {usuariosTrabajo.map((item) => (
                    <MenuItem key={item.id_usuario} value={item.id_usuario}>
                      {item.nombre || item.id_usuario}
                    </MenuItem>
                  ))}
                </Select>
              )}
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: { xs: "flex-start", sm: "flex-end" }, flexWrap: "nowrap" }}>
                <Tooltip title="Buscar">
                  <IconButton sx={{ width: 40, height: 40, flex: "0 0 40px", borderRadius: "50%", border: `1px solid ${ui.border}`, color: ui.text, backgroundColor: "rgba(255,255,255,0.03)" }}>
                    <Search size={17} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Notificaciones">
                  <IconButton sx={{ width: 40, height: 40, flex: "0 0 40px", borderRadius: "50%", border: `1px solid ${ui.border}`, color: ui.text, backgroundColor: "rgba(255,255,255,0.03)" }}>
                    <Bell size={17} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Actualizar">
                  <IconButton onClick={cargarDashboard} sx={{ width: 40, height: 40, flex: "0 0 40px", borderRadius: "50%", border: `1px solid ${ui.border}`, color: ui.text, backgroundColor: "rgba(255,255,255,0.03)" }}>
                    <RefreshCw size={17} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>

          {/* Selector de dia: un dia controla caja diaria; "*" resume todo el periodo. */}
          <Box sx={{ mb: 2 }}>
            <DaySelector period={periodoTrabajo} onDaySelect={handleDayFilter} />
          </Box>

          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mb: 2 }}>
            {dashboardTabs.map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.value;
              return (
                <Box
                  key={item.value}
                  component="button"
                  type="button"
                  onClick={() => setActiveTab(item.value)}
                  sx={{
                    minHeight: 36,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.8,
                    px: 1.25,
                    borderRadius: 1.4,
                    border: `1px solid ${selected ? ui.borderStrong : ui.border}`,
                    color: selected ? ui.text : ui.muted,
                    backgroundColor: selected ? "rgba(255,255,255,0.105)" : "rgba(255,255,255,0.035)",
                    cursor: "pointer",
                    font: "inherit",
                    transition: "background-color 160ms ease, color 160ms ease, border-color 160ms ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: ui.text,
                    },
                  }}
                >
                  <Icon size={15} />
                  <Typography sx={{ fontSize: "12.5px", fontWeight: 850 }} noWrap>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.25, mb: 2 }}>
            {kpis.map((item) => <MetricTile key={item.label} item={item} />)}
          </Box>

          {contentByTab[activeTab]}
        </Box>
      </Box>
    </Box>
  );
}
