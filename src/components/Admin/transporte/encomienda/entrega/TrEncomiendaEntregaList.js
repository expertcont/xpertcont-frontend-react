"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Dialog, IconButton, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import { BadgeCheck, Calendar, CalendarPlus, Camera, MapPin, MessageCircle, Mic, Package, ReceiptText, Search, UserRound, X } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import swal2 from "sweetalert2";

import AppButton from "../../../../ui/AppButton";
import AppChip from "../../../../ui/AppChip";
import AppSearch from "../../../../ui/AppSearch";
import palette from "../../../../../theme/palette";

const normalizarTexto = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

const normalizarTextoFonico = (value) => normalizarTexto(value)
  .replace(/qu/g, "k")
  .replace(/c(?=[eiy])/g, "s")
  .replace(/c/g, "k")
  .replace(/v/g, "b")
  .replace(/z/g, "s")
  .replace(/h/g, "")
  .replace(/ll/g, "y")
  .replace(/[^a-z0-9-]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const normalizarSerieCodigo = (value) => String(value || "")
  .toUpperCase()
  .replace(/^K(?=\d{3})/, "C")
  .replace(/^Q(?=\d{3})/, "C");

const numeroOperacion = (item) => [
  item.r_cod,
  item.r_serie,
  item.r_numero,
].filter(Boolean).join("-");

const numeroTicketAdmin = (item) => [
  item.r_serie,
  item.r_numero,
].filter(Boolean).join("-");

const nombreOrigenRuta = (item) => {
  const ruta = String(item.nombre_ruta || "").trim();
  if (!ruta) {
    return "-";
  }

  return ruta
    .split(/\s*(?:->|=>|—|–|-|\/)\s*/)[0]
    .trim() || "-";
};

const formatFecha = (value) => {
  const text = String(value || "").slice(0, 10);
  return text ? text.split("-").reverse().join("/") : "";
};

const formatMoney = (value) => `S/ ${Number(value || 0).toLocaleString("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const esPorCobrar = (value) => normalizarTexto(value)
  .replace(/[^a-z]/g, "") === "porcobrar";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;",
}[char]));

const resolveCssColor = (value, fallback) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallback;
  }

  const probe = document.createElement("span");
  probe.style.color = value;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const color = window.getComputedStyle(probe).color;
  probe.remove();
  return color || fallback;
};

const roundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) => {
  const words = String(text || "-").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) {
    lines.push(current);
  }

  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines && visibleLines.length) {
    let last = visibleLines[visibleLines.length - 1];
    while (ctx.measureText(`${last}...`).width > maxWidth && last.length > 1) {
      last = last.slice(0, -1);
    }
    visibleLines[visibleLines.length - 1] = `${last}...`;
  }

  visibleLines.forEach((line, index) => {
    ctx.fillText(line, x, y + (index * lineHeight));
  });

  return y + (visibleLines.length * lineHeight);
};

const formatFechaHoraEntrega = (value) => {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]} ${[match[4], match[5], match[6] || "00"].filter(Boolean).join(":")}`.trim();
  }

  return text || "-";
};

const nombreDestinoRuta = (item) => {
  const ruta = String(item.nombre_ruta || "").trim();
  if (!ruta) {
    return item.punto_venta_dest_nombre || item.id_punto_venta_dest || "-";
  }

  const partes = ruta
    .split(/\s*(?:->|=>|â€”|â€“|-|\/)\s*/)
    .map((parte) => parte.trim())
    .filter(Boolean);

  return partes[partes.length - 1] || item.punto_venta_dest_nombre || item.id_punto_venta_dest || "-";
};

const generarConstanciaEntregaPng = (encomienda) => new Promise((resolve, reject) => {
  const canvas = document.createElement("canvas");
  const scale = 1.5;
  const logicalWidth = 720;
  const logicalHeight = 940;
  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    reject(new Error("No se pudo preparar la constancia."));
    return;
  }

  ctx.scale(scale, scale);

  const colors = {
    bg: "#eef2f6",
    paper: "#ffffff",
    paperSoft: "#f7f9fb",
    border: "#d6dde5",
    borderSoft: "#e7ecf1",
    text: "#17212b",
    muted: "#657485",
    accent: resolveCssColor(palette.accent, "#2f83b7"),
    success: "#167a4a",
    successSoft: "#e7f6ee",
  };

  const drawPanel = (x, y, width, height, fill = colors.paper) => {
    ctx.fillStyle = fill;
    roundedRect(ctx, x, y, width, height, 18);
    ctx.fill();
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  };
  const drawDivider = (y) => {
    ctx.strokeStyle = colors.borderSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.lineTo(650, y);
    ctx.stroke();
  };
  const drawField = (label, value, x, y, width, maxLines = 1) => {
    ctx.fillStyle = colors.muted;
    ctx.font = "700 13px Arial";
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.fillStyle = colors.text;
    ctx.font = "700 18px Arial";
    return drawWrappedText(ctx, value, x, y + 25, width, 25, maxLines);
  };
  const drawSubText = (value, x, y, width) => {
    ctx.fillStyle = colors.muted;
    ctx.font = "700 14px Arial";
    return drawWrappedText(ctx, value || "-", x, y, width, 19, 1);
  };
  const textColumnX = 116;
  const drawPackageIcon = (x, y, size = 30) => {
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    roundedRect(ctx, x, y, size, size, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.5, y);
    ctx.lineTo(x + size * 0.5, y + size);
    ctx.moveTo(x, y + size * 0.34);
    ctx.lineTo(x + size, y + size * 0.34);
    ctx.stroke();
  };
  const drawPinIcon = (x, y) => {
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0.8 * Math.PI, 2.2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - 1, 2.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 6);
    ctx.lineTo(x, y + 15);
    ctx.lineTo(x + 5, y + 6);
    ctx.stroke();
  };

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  ctx.shadowColor = "rgba(15, 23, 42, 0.18)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;
  drawPanel(34, 30, 652, 870);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = colors.accent;
  roundedRect(ctx, 56, 52, 608, 8, 4);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = colors.text;
  ctx.font = "900 18px Arial";
  const empresaBottom = drawWrappedText(ctx, encomienda.empresa_razon_social || "EMPRESA", logicalWidth / 2, 86, 500, 22, 2);
  ctx.fillStyle = colors.muted;
  ctx.font = "800 15px Arial";
  ctx.fillText(`RUC: ${encomienda.empresa_documento_id || "-"}`, logicalWidth / 2, Math.max(126, empresaBottom + 14));
  ctx.font = "800 15px Arial";
  ctx.fillText("CONSTANCIA DIGITAL", logicalWidth / 2, 166);
  ctx.textAlign = "left";

  drawDivider(178);

  ctx.fillStyle = colors.muted;
  ctx.font = "700 13px Arial";
  drawPackageIcon(70, 205, 32);
  ctx.fillText("COMPROBANTE", textColumnX, 210);
  ctx.fillStyle = colors.text;
  ctx.font = "900 32px Arial";
  ctx.fillText(numeroOperacion(encomienda), textColumnX, 251);
  ctx.fillStyle = colors.paperSoft;
  roundedRect(ctx, 70, 280, 580, 92, 14);
  ctx.fill();
  ctx.strokeStyle = colors.borderSoft;
  ctx.stroke();
  drawField("Fecha y hora de entrega", formatFechaHoraEntrega(encomienda.entrega_fecha), textColumnX, 322, 270, 1);
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = colors.success;
  roundedRect(ctx, 356, 292, 282, 66, 18);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.58;
  ctx.strokeStyle = colors.success;
  ctx.lineWidth = 2.4;
  roundedRect(ctx, 356, 292, 282, 66, 18);
  ctx.stroke();
  ctx.fillStyle = colors.success;
  ctx.font = "900 38px Arial";
  ctx.textAlign = "center";
  ctx.fillText("ENTREGADO", 497, 337);
  ctx.restore();
  ctx.textAlign = "left";

  drawDivider(406);

  let y = 448;
  y = drawField("Remitente", encomienda.cliente || "-", textColumnX, y, 510, 1) - 1;
  y = drawSubText(encomienda.cliente_documento || encomienda.cliente_documento_id || "-", textColumnX, y, 510) + 17;

  ctx.fillStyle = colors.paperSoft;
  roundedRect(ctx, textColumnX - 14, y - 24, 534, 68, 12);
  ctx.fill();
  ctx.fillStyle = colors.accent;
  roundedRect(ctx, textColumnX - 14, y - 24, 5, 68, 3);
  ctx.fill();
  y = drawField("Destinatario", encomienda.destinatario || "-", textColumnX, y, 510, 1) - 1;
  y = drawSubText(encomienda.destinatario_documento || encomienda.destinatario_documento_id || "-", textColumnX, y, 510) + 24;

  drawDivider(y);
  y += 28;

  drawPinIcon(78, y + 22);
  drawField("Origen", nombreOrigenRuta(encomienda), textColumnX, y, 200, 1);
  drawPinIcon(388, y + 22);
  drawField("Destino", nombreDestinoRuta(encomienda), 426, y, 200, 1);
  y += 66;
  drawField("Contenido", encomienda.descripcion || "-", textColumnX, y, 510, 2);

  const firmaY = 820;
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(170, firmaY);
  ctx.lineTo(550, firmaY);
  ctx.stroke();
  ctx.fillStyle = colors.muted;
  ctx.font = "800 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText("FIRMA / CONFORMIDAD DE ENTREGA", logicalWidth / 2, firmaY + 20);
  ctx.textAlign = "left";

  const registradoTexto = `Registrado por: ${encomienda.entrega_ctrl_us || "-"}`;
  ctx.fillStyle = colors.muted;
  ctx.font = "700 13px Arial";
  const registradoWidth = ctx.measureText(registradoTexto).width;
  const registradoX = (logicalWidth - registradoWidth) / 2;
  const iconX = registradoX - 24;
  const iconY = 872;
  ctx.strokeStyle = colors.success;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(iconX, iconY - 4, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(iconX - 4, iconY - 4);
  ctx.lineTo(iconX - 1, iconY);
  ctx.lineTo(iconX + 5, iconY - 8);
  ctx.stroke();
  ctx.fillText(registradoTexto, registradoX, 872);

  canvas.toBlob((blob) => {
    if (blob) {
      resolve(blob);
    } else {
      reject(new Error("No se pudo generar el PNG de constancia."));
    }
  }, "image/png");
});

const copiarPngAlPortapapeles = async (blob) => {
  if (!navigator.clipboard?.write || typeof window.ClipboardItem === "undefined") {
    throw new Error("Este navegador no permite copiar imagenes al portapapeles.");
  }

  await navigator.clipboard.write([
    new window.ClipboardItem({ "image/png": blob }),
  ]);
};

const generarConstanciaEntregaPdfUrl = async (pngBlob) => {
  const pdfDoc = await PDFDocument.create();
  const pngBytes = await pngBlob.arrayBuffer();
  const pngImage = await pdfDoc.embedPng(pngBytes);
  const mmToPt = (mm) => (mm * 72) / 25.4;
  const pageWidth = mmToPt(80);
  const pageHeight = pageWidth * (pngImage.height / pngImage.width);
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(pdfBlob);
};

const normalizarTelefonoWhatsapp = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("51") && digits.length >= 11) return digits;
  if (digits.length === 9) return `51${digits}`;
  return digits;
};

const normalizarCodigoDictado = (value) => {
  const reemplazos = {
    cero: "0",
    uno: "1",
    una: "1",
    dos: "2",
    tres: "3",
    cuatro: "4",
    cinco: "5",
    seis: "6",
    siete: "7",
    ocho: "8",
    nueve: "9",
    guion: "-",
    guión: "-",
  };
  const texto = normalizarTexto(value)
    .replace(/\b(be|ve|ube)\b/g, "b")
    .replace(/\b(ce|se|ese|ke|ka|k)\b/g, "c")
    .replace(/\befe\b/g, "f")
    .replace(/\b([a-z])\s+(\d)/g, "$1$2")
    .split(/\s+/)
    .map((parte) => reemplazos[parte] || parte)
    .join("")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
  const match = texto.match(/^([A-Z]\d{3})-?(\d{1,10})$/);

  if (match) {
    return `${normalizarSerieCodigo(match[1])}-${match[2].padStart(10, "0")}`;
  }

  return normalizarSerieCodigo(texto);
};

const valoresBusqueda = (item) => [
  numeroOperacion(item),
  numeroTicketAdmin(item),
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
];

const crearIndiceBusqueda = (item) => valoresBusqueda(item).map(normalizarTexto).join(" ");

const crearIndiceBusquedaFonica = (item) => valoresBusqueda(item).map(normalizarTextoFonico).join(" ");

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
  borderRadius: palette.radius.control,
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
  const [mostrarEntregadas, setMostrarEntregadas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [escuchandoCodigo, setEscuchandoCodigo] = useState(false);
  const scannerVideoRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scannerFrameRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  const registros = useMemo(() => {
    const busqueda = normalizarTexto(valorBusqueda).trim();
    const busquedaFonica = normalizarTextoFonico(valorBusqueda);
    if (!busqueda) {
      return tablaBase;
    }
    return tablaBase.filter((item) => (
      item._textoBusqueda?.includes(busqueda) ||
      (busquedaFonica && item._textoBusquedaFonica?.includes(busquedaFonica))
    ));
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
        estado: mostrarEntregadas ? "entregadas" : "pendientes",
      });
      const response = await fetch(`${back_host}/mve_transventa/encomienda/por-entregar/${periodoTrabajo}/${params.id_anfitrion}/${contabilidadTrabajo}/${puntoVentaTrabajo}?${query.toString()}`);
      const result = await response.json();
      const rows = Array.isArray(result?.data) ? result.data : [];
      setTablaBase(rows.map((item) => ({
        ...item,
        _textoBusqueda: crearIndiceBusqueda(item),
        _textoBusquedaFonica: crearIndiceBusquedaFonica(item),
      })));
    } catch (error) {
      console.log("Error cargando encomiendas por entregar:", error);
      setTablaBase([]);
    } finally {
      setLoading(false);
    }
  }, [back_host, contabilidadTrabajo, params.id_anfitrion, periodoTrabajo, puntoVentaTrabajo, periodosBusqueda, mostrarEntregadas]);

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

  useEffect(() => () => {
    speechRecognitionRef.current?.abort?.();
  }, []);

  useEffect(() => {
    if (!scannerOpen) {
      return undefined;
    }

    let cancelado = false;
    let detector = null;

    const cerrarStream = () => {
      if (scannerFrameRef.current) {
        cancelAnimationFrame(scannerFrameRef.current);
        scannerFrameRef.current = null;
      }
      if (scannerStreamRef.current) {
        scannerStreamRef.current.getTracks().forEach((track) => track.stop());
        scannerStreamRef.current = null;
      }
    };

    const leerFrame = async () => {
      if (cancelado || !scannerVideoRef.current || !detector) {
        return;
      }

      try {
        if (scannerVideoRef.current.readyState >= 2) {
          const codes = await detector.detect(scannerVideoRef.current);
          const codigo = String(codes?.[0]?.rawValue || "").trim();

          if (codigo) {
            setValorBusqueda(codigo);
            setScannerOpen(false);
            cerrarStream();
            return;
          }
        }
      } catch (error) {
        console.log("Error leyendo codigo de encomienda:", error);
      }

      scannerFrameRef.current = requestAnimationFrame(leerFrame);
    };

    const iniciarScanner = async () => {
      setScannerError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerError("Este navegador no permite acceder a la camara.");
        return;
      }

      if (!("BarcodeDetector" in window)) {
        setScannerError("Este navegador no soporta lector de codigos desde la camara.");
        return;
      }

      try {
        detector = new window.BarcodeDetector({
          formats: ["qr_code", "code_128", "code_39", "ean_13"],
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        scannerStreamRef.current = stream;

        if (scannerVideoRef.current) {
          scannerVideoRef.current.srcObject = stream;
          await scannerVideoRef.current.play();
        }

        scannerFrameRef.current = requestAnimationFrame(leerFrame);
      } catch (error) {
        console.log("Error abriendo scanner de encomienda:", error);
        setScannerError("No se pudo abrir la camara. Revisa permisos del navegador.");
      }
    };

    iniciarScanner();

    return () => {
      cancelado = true;
      cerrarStream();
    };
  }, [scannerOpen]);

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

  const escucharCodigo = () => {
    if (escuchandoCodigo) {
      speechRecognitionRef.current?.stop?.();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      swal2.fire({
        title: "Microfono no disponible",
        text: "Este navegador no soporta reconocimiento de voz.",
        icon: "warning",
        confirmButtonText: "ACEPTAR",
        color: palette.text,
        background: palette.surface,
      });
      return;
    }

    const recognition = new SpeechRecognition();
    speechRecognitionRef.current = recognition;
    recognition.lang = "es-PE";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setEscuchandoCodigo(true);
    recognition.onend = () => setEscuchandoCodigo(false);
    recognition.onerror = () => setEscuchandoCodigo(false);
    recognition.onresult = (event) => {
      const alternativas = Array.from(event.results?.[0] || []);
      const texto = alternativas[0]?.transcript || "";
      const codigo = normalizarCodigoDictado(texto);

      if (codigo) {
        setValorBusqueda(codigo);
      }
    };

    recognition.start();
  };

  const mostrarEntregaRegistrada = async (encomiendaConfirmada) => {
    let constanciaBlob = null;
    let previewUrl = "";
    let pdfUrl = "";
    const whatsappRemitente = encomiendaConfirmada.cliente_telefono || "";
    const whatsappDestinatario = encomiendaConfirmada.destinatario_telefono || "";
    const empresa = contabilidadSelect.find((item) => item.documento_id === contabilidadTrabajo);
    const razonSocialEmpresa = empresa?.razon_social || contabilidadTrabajo || "Empresa";
    const encomiendaConstancia = {
      ...encomiendaConfirmada,
      empresa_razon_social: razonSocialEmpresa,
      empresa_documento_id: empresa?.documento_id || contabilidadTrabajo,
    };

    try {
      constanciaBlob = await generarConstanciaEntregaPng(encomiendaConstancia);
      previewUrl = URL.createObjectURL(constanciaBlob);
      pdfUrl = await generarConstanciaEntregaPdfUrl(constanciaBlob);
    } catch (error) {
      console.log("No se pudo generar constancia:", error);
    }

    await swal2.fire({
      title: "",
      html: `
        <style>
          .constancia-entrega-popup {
            width: min(460px, calc(100vw - 28px)) !important;
            padding: 0 !important;
            border: 1px solid ${palette.border} !important;
            border-radius: ${palette.radius.modal} !important;
            overflow: hidden !important;
          }
          .constancia-entrega-html {
            margin: 0 !important;
            padding: 0 !important;
          }
          .constancia-entrega-action {
            height: 34px;
            min-width: 0;
            padding: 0 12px !important;
            border-radius: ${palette.radius.control} !important;
            font-size: 12px !important;
            font-weight: 800 !important;
            box-shadow: none !important;
          }
          .constancia-entrega-select {
            height: 34px;
            padding: 0 8px;
            border-radius: ${palette.radius.control};
            border: 1px solid ${palette.border};
            background: ${palette.bg};
            color: ${palette.text};
            font-size: 12px;
            outline: none;
          }
        </style>
        <div style="display:grid;gap:10px;text-align:left;font-family:Arial,sans-serif;padding:12px;background:${palette.surface}">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <div style="min-width:0">
              <div style="font-size:14px;font-weight:900;line-height:1.15;color:${palette.text}">Entrega registrada</div>
              <div style="font-size:11px;font-weight:700;color:${palette.muted};margin-top:2px">${escapeHtml(numeroOperacion(encomiendaConfirmada))}</div>
            </div>
            <div style="padding:5px 8px;border-radius:999px;background:${palette.successSoft};color:${palette.success};font-size:10px;font-weight:900;white-space:nowrap">
              ENTREGADO
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr;gap:4px;padding:8px 10px;border:1px solid ${palette.borderSoft};border-radius:${palette.radius.control};background:${palette.bg};color:${palette.text};font-size:11.5px;line-height:1.35">
            <div><span style="color:${palette.muted};font-weight:800">Fecha:</span> ${escapeHtml(formatFechaHoraEntrega(encomiendaConfirmada.entrega_fecha))}</div>
            <div><span style="color:${palette.muted};font-weight:800">Usuario:</span> ${escapeHtml(encomiendaConfirmada.entrega_ctrl_us || "-")}</div>
            <div><span style="color:${palette.muted};font-weight:800">Destinatario:</span> ${escapeHtml(encomiendaConfirmada.destinatario || "-")}</div>
          </div>
          ${previewUrl ? `
            <div style="height:285px;display:flex;align-items:center;justify-content:center;border:1px solid ${palette.borderSoft};border-radius:${palette.radius.control};background:${palette.bg};overflow:hidden">
              <img
                src="${previewUrl}"
                alt="Constancia de entrega"
                style="max-width:100%;max-height:100%;object-fit:contain"
              />
            </div>
          ` : `
            <div style="padding:9px;border:1px solid ${palette.warning};border-radius:${palette.radius.control};color:${palette.warning};background:${palette.warningSoft};font-size:11.5px;font-weight:700">
              Entrega registrada. No se pudo preparar el PNG en este navegador.
            </div>
          `}
          <div style="display:grid;grid-template-columns:132px minmax(0,1fr);gap:8px;align-items:end">
            <div style="display:grid;gap:4px;min-width:0">
              <label for="whatsapp-tipo-entrega" style="font-size:10px;font-weight:900;letter-spacing:.45px;text-transform:uppercase;color:${palette.muted}">
                Enviar a
              </label>
              <select id="whatsapp-tipo-entrega" class="constancia-entrega-select">
                <option value="remitente">Remitente</option>
                <option value="destinatario">Destinatario</option>
              </select>
            </div>
            <div style="display:grid;gap:4px;min-width:0">
              <label for="whatsapp-numero-entrega" style="font-size:10px;font-weight:900;letter-spacing:.45px;text-transform:uppercase;color:${palette.muted}">
                WhatsApp
              </label>
              <input
                id="whatsapp-numero-entrega"
                value="${escapeHtml(whatsappRemitente)}"
                data-remitente="${escapeHtml(whatsappRemitente)}"
                data-destinatario="${escapeHtml(whatsappDestinatario)}"
                placeholder="Celular"
                inputmode="numeric"
                style="height:34px;padding:0 9px;border-radius:${palette.radius.control};border:1px solid ${palette.border};background:${palette.bg};color:${palette.text};font-size:12px;outline:none;min-width:0"
              />
            </div>
          </div>
          <div style="color:${palette.muted};font-size:10.8px;line-height:1.35">
            Puedes imprimir el PDF o enviar el PNG por WhatsApp. En el chat, pega la constancia con Ctrl + V.
          </div>
          <div style="display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap;padding-top:2px">
            ${pdfUrl ? `<button id="imprimir-pdf-constancia-entrega" type="button" class="constancia-entrega-action" style="border:1px solid ${palette.border};background:${palette.bg};color:${palette.text};margin:0">PDF imprimir</button>` : ""}
            ${constanciaBlob ? `<button id="enviar-whatsapp-constancia-entrega" type="button" class="constancia-entrega-action" style="border:1px solid ${palette.accent};background:${palette.accent};color:${palette.onAccent};margin:0">Enviar WhatsApp</button>` : ""}
            <button id="cerrar-constancia-entrega" type="button" class="constancia-entrega-action" style="border:1px solid ${palette.border};background:${palette.surfaceAlt};color:${palette.text};margin:0">Cerrar</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: true,
      color: palette.text,
      background: palette.surface,
      customClass: {
        popup: "constancia-entrega-popup",
        htmlContainer: "constancia-entrega-html",
      },
      didOpen: () => {
        const pdfButton = document.getElementById("imprimir-pdf-constancia-entrega");
        const whatsappButton = document.getElementById("enviar-whatsapp-constancia-entrega");
        const tipoSelect = document.getElementById("whatsapp-tipo-entrega");
        const numeroInput = document.getElementById("whatsapp-numero-entrega");
        const closeButton = document.getElementById("cerrar-constancia-entrega");

        const mensaje = [
          razonSocialEmpresa,
          "Constancia de entrega",
          numeroTicketAdmin(encomiendaConfirmada) || numeroOperacion(encomiendaConfirmada),
        ].join("\n");
        tipoSelect?.addEventListener("change", () => {
          const key = tipoSelect.value === "destinatario" ? "destinatario" : "remitente";
          numeroInput.value = numeroInput.dataset[key] || "";
        });

        pdfButton?.addEventListener("click", () => {
          window.open(pdfUrl, "_blank", "noopener,noreferrer");
        });

        whatsappButton?.addEventListener("click", async () => {
          try {
            const telefono = normalizarTelefonoWhatsapp(numeroInput?.value);

            if (!telefono) {
              numeroInput?.focus();
              swal2.showValidationMessage("Indica el celular para abrir WhatsApp.");
              return;
            }

            await copiarPngAlPortapapeles(constanciaBlob);
            window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
          } catch (error) {
            swal2.showValidationMessage(error.message || "No se pudo preparar WhatsApp.");
          }
        });

        closeButton?.addEventListener("click", () => {
          swal2.close();
        });
      },
      willClose: () => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
      },
    });
  };

  const marcarEntregado = async (item) => {
    const operacion = numeroOperacion(item);
    const destinatario = item.destinatario || "Sin destinatario";
    const documentoDestinatario = item.destinatario_documento || item.destinatario_documento_id || "";
    const contenido = item.descripcion || "Sin descripcion";
    const porCobrar = esPorCobrar(item.condicion_pago || item.numero_rdi);
    const monto = formatMoney(item.r_monto_total || item.precio_neto);

    if (porCobrar && navigator.vibrate) {
      navigator.vibrate([180, 90, 180, 90, 180]);
    }

    const result = await swal2.fire({
      title: "Confirmar entrega",
      html: `
        ${porCobrar ? `
          <style>
            @keyframes alerta-cobro-pulse {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 ${palette.warningSoft};
              }
              50% {
                transform: scale(1.015);
                box-shadow: 0 0 0 5px ${palette.warningSoft};
              }
            }
            @keyframes alerta-cobro-text {
              0%, 100% { opacity: 1; }
              50% { opacity: .45; }
            }
          </style>
        ` : ""}
        <div style="text-align:left;display:grid;gap:10px;font-family:Arial,sans-serif">
          <div style="padding:10px 12px;border:1px solid ${palette.border};border-radius:8px;background:${palette.bg};color:${palette.text};font-weight:800;text-align:center">
            ${escapeHtml(operacion)}
          </div>
          ${porCobrar ? `
            <div style="padding:12px;border:1px solid ${palette.warning};border-radius:8px;background:${palette.warningSoft};text-align:center;animation:alerta-cobro-pulse 1.05s ease-in-out infinite">
              <div style="color:${palette.warning};font-size:12px;font-weight:900;letter-spacing:.7px;text-transform:uppercase;animation:alerta-cobro-text .8s ease-in-out infinite">Por cobrar</div>
              <div style="color:${palette.text};font-size:26px;font-weight:900;line-height:1.15;margin-top:2px">${escapeHtml(monto)}</div>
              <div style="color:${palette.muted};font-size:12px;font-weight:700;margin-top:4px">Cobrar antes de registrar la entrega.</div>
            </div>
          ` : ""}
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
      confirmButtonText: porCobrar ? "Registrar entrega y cobro" : "Registrar entrega",
      cancelButtonText: "Cancelar",
      color: palette.text,
      background: palette.surface,
      confirmButtonColor: porCobrar ? palette.warning : palette.accent,
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
          entrega_ctrl_us: params.id_invitado,
        }),
      });
      const dataResponse = await response.json();

      if (!response.ok || !dataResponse.success) {
        throw new Error(dataResponse.message || "No se pudo registrar la entrega.");
      }

      const encomiendaConfirmada = {
        ...item,
        ...(dataResponse.data || {}),
        nombre_ruta: dataResponse.data?.nombre_ruta || item.nombre_ruta,
        periodo_origen: dataResponse.data?.periodo_origen || item.periodo_origen,
      };

      setTablaBase((prev) => prev.filter((row) => !(
        row.r_cod === item.r_cod &&
        row.r_serie === item.r_serie &&
        row.r_numero === item.r_numero &&
        Number(row.elemento || 1) === Number(item.elemento || 1)
      )));
      setUpdateTrigger(Date.now());
      await mostrarEntregaRegistrada(encomiendaConfirmada);
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
    <Box sx={{ minHeight: "100%", backgroundColor: "transparent", p: { xs: 1, md: 4 } }}>
      <Box sx={{ maxWidth: 980, mx: "auto" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, mb: 2 }}>
          <Box>
            <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "22px", lineHeight: 1.2 }}>
              Encomiendas por Entregar
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: "13px", mt: 0.35 }}>
              {registros.length} {mostrarEntregadas ? "entregadas recientes" : "pendientes en destino"}
            </Typography>
          </Box>
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr) 40px 40px", md: "260px 40px 40px" },
            gap: 1,
            alignItems: "center",
            width: { xs: "100%", md: "auto" },
          }}>
            <AppSearch
              placeholder="Buscar por numero, remitente, destinatario..."
              value={valorBusqueda}
              onChange={(event) => setValorBusqueda(event.target.value)}
              width="100%"
            />
            <Tooltip title="Escanear ticket" arrow>
              <Box>
                <AppButton
                  icon={<Camera size={17} />}
                  onClick={() => setScannerOpen(true)}
                  sx={{ width: 40, height: 40, minWidth: 40, p: 0, color: palette.accent }}
                />
              </Box>
            </Tooltip>
            <Tooltip title={escuchandoCodigo ? "Escuchando codigo" : "Dictar codigo"} arrow>
              <Box>
                <AppButton
                  icon={<Mic size={17} />}
                  onClick={escucharCodigo}
                  sx={{
                    width: 40,
                    height: 40,
                    minWidth: 40,
                    p: 0,
                    color: escuchandoCodigo ? palette.onAccent : palette.accent,
                    backgroundColor: escuchandoCodigo ? palette.accent : palette.surface,
                    borderColor: escuchandoCodigo ? palette.accent : palette.border,
                  }}
                />
              </Box>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "240px minmax(220px, 1fr) minmax(190px, 220px) 160px" }, gap: 1, mb: 2, p: 1.2, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: palette.radius.listCard, alignItems: "end" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", mb: 0.35 }}>
              Periodo busqueda
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 0.7, alignItems: "center" }}>
              <Box sx={{ height: 40, px: 1.15, display: "flex", alignItems: "center", borderRadius: palette.radius.control, backgroundColor: palette.bg, border: `1px solid ${palette.border}`, color: palette.muted, fontSize: "12.5px", fontWeight: 700, whiteSpace: "nowrap" }}>
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
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: palette.muted, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", mb: 0.35 }}>
              Estado
            </Typography>
            <Box sx={{ height: 40, p: 0.25, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.25, borderRadius: palette.radius.control, border: `1px solid ${palette.borderSoft}`, backgroundColor: palette.overlaySoft, minWidth: 0 }}>
              {[
                { value: false, label: "Pendientes" },
                { value: true, label: "Entregadas" },
              ].map((option) => (
                <Box
                  key={option.label}
                  onClick={() => setMostrarEntregadas(option.value)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: palette.radius.control,
                    color: mostrarEntregadas === option.value ? palette.text : palette.muted,
                    backgroundColor: mostrarEntregadas === option.value ? palette.chip : "transparent",
                    border: mostrarEntregadas === option.value ? `1px solid ${palette.border}` : "1px solid transparent",
                    fontSize: "10.5px",
                    fontWeight: 900,
                    cursor: "pointer",
                    transition: "all .15s ease",
                  }}
                >
                  {option.label}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 1 }}>
          {loading && (
            <Box sx={{ p: 3, color: palette.muted, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: palette.radius.listCard }}>
              Cargando encomiendas...
            </Box>
          )}

          {!loading && registros.length === 0 && (
            <Box sx={{ p: 3, color: palette.muted, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: palette.radius.listCard, display: "flex", gap: 1, alignItems: "center" }}>
              <Search size={16} />
              {mostrarEntregadas ? "Sin encomiendas entregadas recientes para este destino." : "Sin encomiendas pendientes para este destino."}
            </Box>
          )}

          {!loading && registros.map((item) => (
            <Box key={`${item.r_cod}-${item.r_serie}-${item.r_numero}-${item.elemento || 1}`} sx={{ p: 1.4, backgroundColor: palette.surface, border: `1px solid ${palette.borderSoft}`, borderRadius: palette.radius.listCard }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: palette.radius.control, backgroundColor: palette.accentSoft, color: palette.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Package size={16} />
                  </Box>
                  <Typography sx={{ color: palette.text, fontWeight: 800, fontSize: "15px" }}>
                    {numeroOperacion(item)}
                  </Typography>
                  {item.placa && <AppChip>{item.placa}</AppChip>}
                </Box>
                {mostrarEntregadas ? (
                  <AppButton icon={<MessageCircle size={16} />} onClick={() => mostrarEntregaRegistrada(item)} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
                    Enviar WhatsApp
                  </AppButton>
                ) : (
                  <AppButton icon={<BadgeCheck size={16} />} onClick={() => marcarEntregado(item)} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
                    Entregar
                  </AppButton>
                )}
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
                  <Typography sx={{ color: palette.accent, fontSize: "13px" }} noWrap>
                    {item.destinatario || "-"} {item.destinatario_documento ? `- ${item.destinatario_documento}` : ""}
                  </Typography>
                </Box>
                <Box sx={{ display: "grid", gap: 0.35, justifyItems: { xs: "flex-start", md: "flex-end" }, alignSelf: "stretch" }}>
                  <Typography sx={{ color: esPorCobrar(item.condicion_pago || item.numero_rdi) ? palette.warning : palette.text, fontSize: "16px", fontWeight: 800, whiteSpace: "nowrap" }}>
                    {formatMoney(item.r_monto_total || item.precio_neto)}
                  </Typography>
                  <Box
                    sx={{
                      minHeight: 24,
                      px: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: palette.radius.control,
                      backgroundColor: esPorCobrar(item.condicion_pago || item.numero_rdi) ? palette.warningSoft : palette.chip,
                      border: `1px solid ${esPorCobrar(item.condicion_pago || item.numero_rdi) ? palette.warning : palette.border}`,
                      color: esPorCobrar(item.condicion_pago || item.numero_rdi) ? palette.warning : palette.text,
                      fontSize: "10.5px",
                      fontWeight: 900,
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.condicion_pago || "PAGADO"}
                  </Box>
                  <Typography sx={{ color: palette.muted, fontSize: "12px", display: "flex", alignItems: "center", gap: 0.45, whiteSpace: "nowrap" }}>
                    <Calendar size={13} /> {formatFecha(item.r_fecemi)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap", color: palette.muted }}>
                <Typography sx={{ fontSize: "12px", display: "flex", alignItems: "center", gap: 0.45 }}>
                  <MapPin size={13} /> {nombreOrigenRuta(item)}
                </Typography>
                {item.descripcion && <AppChip>{item.descripcion}</AppChip>}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Dialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            backgroundColor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: palette.radius.modal,
            overflow: "hidden",
          },
        }}
      >
        <Box sx={{ p: 1.1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, borderBottom: `1px solid ${palette.borderSoft}` }}>
          <Typography sx={{ fontSize: "14px", fontWeight: 800 }}>
            Escanear ticket
          </Typography>
          <IconButton onClick={() => setScannerOpen(false)} sx={{ color: palette.muted }}>
            <X size={18} />
          </IconButton>
        </Box>
        <Box sx={{ p: 1.2, display: "grid", gap: 1 }}>
          <Box sx={{ position: "relative", width: "100%", aspectRatio: "3 / 4", overflow: "hidden", borderRadius: palette.radius.control, backgroundColor: "#05070a", border: `1px solid ${palette.border}` }}>
            <video
              ref={scannerVideoRef}
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <Box sx={{ position: "absolute", inset: "22% 12%", border: `2px solid ${palette.accent}`, borderRadius: palette.radius.control, boxShadow: "0 0 0 999px rgba(0,0,0,.35)" }} />
          </Box>
          {scannerError && (
            <Typography sx={{ color: palette.warning || palette.accent, fontSize: "12.5px", lineHeight: 1.35 }}>
              {scannerError}
            </Typography>
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
