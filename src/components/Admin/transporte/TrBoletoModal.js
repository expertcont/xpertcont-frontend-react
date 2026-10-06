"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Dialog, Grid, IconButton, InputBase, Typography } from "@mui/material";
import { Bus, Save, ScanBarcode, Search, UserRound, X } from "lucide-react";

import AppButton from "../../ui/AppButton";
import AppIconBox from "../../ui/AppIconBox";
import palette from "../../../theme/palette";

const documentoTipoDesdeNumero = (documento) => {
  const limpio = String(documento || "").replace(/\D/g, "");
  return limpio.length === 11 ? "6" : "1";
};

const soloDigitos = (value) => String(value || "").replace(/\D/g, "");

const extraerDocumentoDesdeCodigo = (codigo) => {
  const texto = String(codigo || "").trim();
  const digitos = soloDigitos(texto);

  if (digitos.length === 8 || digitos.length === 11) {
    return digitos;
  }

  const coincidencia = texto.match(/\b\d{8}\b/) || texto.match(/\b\d{11}\b/);
  return coincidencia?.[0] || "";
};

// El boleto solo necesita estos datos del pasajero. La agencia, el destino y el
// total NO se piden: salen de la ruta elegida, y el precio lo aplica el backend
// desde mve_transruta.precio_pasaje, nunca desde este formulario.
const crearDraft = (operacion, periodoTrabajo, fechaOperacion) => ({
  tipo_operacion: "B",
  r_fecemi: String(operacion?.r_fecemi || fechaOperacion || `${periodoTrabajo}-01`).slice(0, 10),
  r_cod: operacion?.r_cod || "03",
  r_serie: operacion?.r_serie || "B001",
  r_numero: operacion?.r_numero || "",
  id_documento: operacion?.id_documento || documentoTipoDesdeNumero(operacion?.cliente_documento),
  cliente: operacion?.cliente || "",
  cliente_documento: operacion?.cliente_documento || "",
  cliente_telefono: operacion?.cliente_telefono || "",
  id_ruta: operacion?.id_ruta || "",
  id_punto_venta: operacion?.id_punto_venta || "",
  id_punto_venta_dest: operacion?.id_punto_venta_dest || "",
  asiento: operacion?.asiento || "",
});

const fieldSx = {
  height: 33,
  px: 1,
  display: "flex",
  alignItems: "center",
  backgroundColor: palette.bg,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
};

const inputSx = {
  color: palette.text,
  fontSize: "12.5px",
  width: "100%",
  "& input::placeholder": { color: palette.muted, opacity: 1 },
};

function Field({ label, children }) {
  return (
    <Box sx={fieldSx}>
      <Typography component="span" sx={{ color: palette.muted, fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase", mr: 0.75, whiteSpace: "nowrap" }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

function CaptureInput({
  value,
  onChange,
  inputRef,
  nextRef,
  prevRef,
  placeholder,
  type = "text",
  inputMode,
  pattern,
  align = "left",
  onPlus,
}) {
  const focusControl = (ref) => {
    ref?.current?.focus?.();
    ref?.current?.select?.();
  };

  return (
    <InputBase
      inputRef={inputRef}
      type={type}
      inputMode={inputMode}
      inputProps={{ pattern }}
      value={value || ""}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if ((event.key === "+" || event.key === "=") && onPlus) {
          event.preventDefault();
          onPlus();
          return;
        }

        if ((event.key === "Enter" || event.key === "ArrowDown") && nextRef?.current) {
          event.preventDefault();
          focusControl(nextRef);
          return;
        }

        if (event.key === "ArrowUp" && prevRef?.current) {
          event.preventDefault();
          focusControl(prevRef);
        }
      }}
      sx={{ ...inputSx, "& input": { textAlign: align } }}
    />
  );
}

export default function TrBoletoModal({
  open,
  operacion,
  back_host,
  periodoTrabajo,
  fechaOperacion,
  rutasDisponibles = [],
  modalNuevoTitulo = "Nuevo boleto",
  modalEditarTitulo = "Editar boleto",
  onClose,
  onSubmit,
  guardarActionId,
}) {
  const esEdicion = Boolean(operacion);
  const [draft, setDraft] = useState(() => crearDraft(operacion, periodoTrabajo, fechaOperacion));
  const [error, setError] = useState("");
  const [buscandoPasajero, setBuscandoPasajero] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const documentoRef = useRef(null);
  const nombreRef = useRef(null);
  const telefonoRef = useRef(null);
  const guardarRef = useRef(null);
  const scannerVideoRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scannerFrameRef = useRef(null);

  // Solo hay una ruta de salida de pasajeros: se toma sola y no se pregunta.
  // `precio_pasaje > 0` ya filtro la lista (el backend lo aplica con
  // ?solo_pasaje=true), asi que este caso es "esta agencia tiene un solo destino".
  // Con dos o mas rutas se conserva la ruta recibida desde el contexto.
  const rutasPasaje = useMemo(
    () => rutasDisponibles.filter((ruta) => Number(ruta.precio_pasaje || 0) > 0),
    [rutasDisponibles]
  );

  useEffect(() => {
    if (open) {
      const inicial = crearDraft(operacion, periodoTrabajo, fechaOperacion);

      // Al editar se respeta la ruta ya guardada. Al crear, si hay una sola ruta
      // de pasaje se preselecciona para no obligar a elegir algo que no tiene
      // alternativa.
      if (!operacion && !inicial.id_ruta && rutasPasaje.length === 1) {
        inicial.id_ruta = rutasPasaje[0].id_ruta;
        inicial.id_punto_venta = rutasPasaje[0].id_punto_venta || inicial.id_punto_venta;
        inicial.id_punto_venta_dest = rutasPasaje[0].id_punto_venta_dest || "";
      }

      setDraft(inicial);
      setError("");
      window.setTimeout(() => {
        documentoRef.current?.focus?.();
        documentoRef.current?.select?.();
      }, 60);
    }
  }, [open, operacion, periodoTrabajo, fechaOperacion, rutasPasaje]);

  const rutaSeleccionada = useMemo(
    () => rutasDisponibles.find((ruta) => ruta.id_ruta === draft.id_ruta),
    [draft.id_ruta, rutasDisponibles],
  );
  const destinoLabel = (
    rutaSeleccionada?.punto_venta_dest_nombre ||
    rutaSeleccionada?.punto_venta_destino_nombre ||
    rutaSeleccionada?.destino_nombre ||
    rutaSeleccionada?.nombre ||
    operacion?.punto_venta_dest_nombre ||
    operacion?.punto_venta_destino_nombre ||
    operacion?.destino_nombre ||
    draft.id_punto_venta_dest ||
    draft.id_ruta ||
    "Destino"
  );
  const tituloBoleto = esEdicion
    ? modalEditarTitulo
    : draft.asiento
      ? `Boleto #${draft.asiento}`
      : modalNuevoTitulo || "Boleto";

  const updateDraft = (name, value) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const buscarPasajero = useCallback(async (documentoManual) => {
    const documento = String(documentoManual || draft.cliente_documento || "").trim();

    if (!documento) {
      setError("Indica DNI/RUC del pasajero.");
      documentoRef.current?.focus();
      return;
    }

    if (!back_host) {
      setError("No se encontro la configuracion para consultar el DNI/RUC.");
      nombreRef.current?.focus();
      return;
    }

    setBuscandoPasajero(true);
    setError("");

    try {
      const response = await fetch(`${back_host}/correntistagenera`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruc: documento }),
      });

      if (!response.ok) {
        throw new Error(`Consulta DNI/RUC fallo con estado ${response.status}`);
      }

      const data = await response.json();
      const { nombre_o_razon_social, r_id_doc } = data || {};

      setDraft((prev) => ({
        ...prev,
        id_documento: r_id_doc || documentoTipoDesdeNumero(documento),
        cliente: nombre_o_razon_social || prev.cliente,
      }));

      window.setTimeout(() => {
        const nextRef = nombre_o_razon_social ? telefonoRef : nombreRef;
        nextRef.current?.focus();
        nextRef.current?.select?.();
      }, 60);
    } catch (err) {
      console.log(err);
      setError("No se pudo consultar el DNI/RUC del pasajero.");
      nombreRef.current?.focus();
      nombreRef.current?.select?.();
    } finally {
      setBuscandoPasajero(false);
    }
  }, [back_host, draft.cliente_documento]);

  // El total se LEE de la ruta elegida. No se edita y no se envia: el backend toma
  // el precio de mve_transruta.precio_pasaje, asi que escribir un total aqui no
  // cambiaria lo que se guarda.
  const precioPasaje = Number(rutaSeleccionada?.precio_pasaje || 0);
  const precioLabel = rutaSeleccionada ? `S/ ${precioPasaje.toFixed(2)}` : "S/ 0.00";

  const handleSubmit = () => {
    if (!draft.cliente_documento || !draft.cliente) {
      setError("Indica documento y nombres del pasajero.");
      return;
    }

    if (!draft.id_ruta) {
      setError("Indica la ruta del boleto.");
      return;
    }

    // El asiento NO se pide: lo asigna la funcion como correlativo de los boletos
    // sueltos del mismo viaje (COUNT(manifiesto_id IS NULL) + 1). Si lo pidiera
    // aca, dos agentes grabando en el mismo momento podrian elegir el mismo.

    onSubmit({
      ...draft,
      tipo_operacion: "B",
      cantidad: 1,
      condicion_pago: "PAGADO",
    });
  };

  useEffect(() => {
    const guardarControl = guardarRef.current;

    if (!guardarControl) {
      return undefined;
    }

    const handleGuardarKeyDown = (event) => {
      if (event.key === "ArrowUp" && telefonoRef.current) {
        event.preventDefault();
        telefonoRef.current?.focus?.();
        telefonoRef.current?.select?.();
      }
    };

    guardarControl.addEventListener("keydown", handleGuardarKeyDown);

    return () => guardarControl.removeEventListener("keydown", handleGuardarKeyDown);
  }, [open]);

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
          const documento = extraerDocumentoDesdeCodigo(codes?.[0]?.rawValue);

          if (documento) {
            setDraft((prev) => ({
              ...prev,
              cliente_documento: documento,
              id_documento: documentoTipoDesdeNumero(documento),
            }));
            setScannerOpen(false);
            cerrarStream();
            buscarPasajero(documento);
            return;
          }
        }
      } catch (err) {
        console.log("Error leyendo codigo de DNI:", err);
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
          formats: ["pdf417", "code_128", "code_39", "ean_13", "qr_code"],
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        scannerStreamRef.current = stream;

        if (scannerVideoRef.current) {
          scannerVideoRef.current.srcObject = stream;
          await scannerVideoRef.current.play();
        }

        scannerFrameRef.current = requestAnimationFrame(leerFrame);
      } catch (err) {
        console.log("Error abriendo scanner de DNI:", err);
        setScannerError("No se pudo abrir la camara. Revisa permisos del navegador.");
      }
    };

    iniciarScanner();

    return () => {
      cancelado = true;
      cerrarStream();
    };
  }, [buscarPasajero, scannerOpen]);

  // Vertical y angosto, como el modal de encomienda: los datos son simples
  // (documento, nombre, telefono, destino, asiento y total) y entran comodos en
  // una columna. Un campo por fila.
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: "calc(100vw - 12px)", sm: 390 },
          maxWidth: "calc(100vw - 12px)",
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: palette.radius.modal,
        },
      }}
    >
      <Box sx={{ p: { xs: 0.9, md: 1.15 }, maxHeight: "calc(100vh - 32px)", overflowY: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
            <AppIconBox><Bus size={16} /></AppIconBox>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "15px" }}>{tituloBoleto}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, minWidth: 0 }}>
                <Typography sx={{ color: palette.muted, fontSize: "11px", fontWeight: 700, minWidth: 0 }} noWrap>
                  {`Destino: ${destinoLabel}`}
                </Typography>
                <Typography sx={{
                  color: palette.accent,
                  fontSize: "10.5px",
                  fontWeight: 900,
                  lineHeight: "18px",
                  px: 0.65,
                  borderRadius: 999,
                  border: `1px solid ${palette.accentSoft}`,
                  backgroundColor: palette.accentSoft,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                  {precioLabel}
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: palette.muted }}><X size={18} /></IconButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5, mb: 0.55 }}>
          <UserRound size={15} color={palette.accent} />
          <Typography sx={{ color: palette.text, fontSize: "12px", fontWeight: 800 }}>Pasajero</Typography>
        </Box>
        <Grid container spacing={0.85}>
          <Grid item xs={12}>
            <Field label="DNI/RUC">
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, minWidth: 0 }}>
                <IconButton
                  size="small"
                  onClick={() => buscarPasajero()}
                  disabled={buscandoPasajero}
                  title="Buscar pasajero por DNI o RUC"
                  sx={{ color: buscandoPasajero ? palette.border : palette.muted, p: 0.35 }}
                >
                  <Search size={15} />
                </IconButton>
                <CaptureInput
                  value={draft.cliente_documento}
                  onChange={(value) => {
                    const limpio = soloDigitos(value);
                    updateDraft("cliente_documento", limpio);
                    updateDraft("id_documento", documentoTipoDesdeNumero(limpio));
                  }}
                  inputRef={documentoRef}
                  nextRef={draft.cliente ? telefonoRef : nombreRef}
                  placeholder="Documento"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  align="right"
                  onPlus={() => buscarPasajero()}
                />
                <IconButton
                  size="small"
                  onClick={() => setScannerOpen(true)}
                  title="Escanear codigo de barras del DNI"
                  sx={{ color: palette.muted, p: 0.35 }}
                >
                  <ScanBarcode size={16} />
                </IconButton>
              </Box>
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="Nombres">
              <CaptureInput value={draft.cliente} onChange={(value) => updateDraft("cliente", value)} inputRef={nombreRef} prevRef={documentoRef} nextRef={telefonoRef} placeholder="Pasajero" />
            </Field>
          </Grid>
          <Grid item xs={12}>
            <Field label="Telefono">
              <CaptureInput value={draft.cliente_telefono} onChange={(value) => updateDraft("cliente_telefono", soloDigitos(value))} inputRef={telefonoRef} prevRef={nombreRef} nextRef={guardarRef} placeholder="Celular" type="tel" inputMode="numeric" pattern="[0-9]*" />
            </Field>
          </Grid>
        </Grid>

        {error && <Typography sx={{ color: palette.danger, fontSize: "12px", mt: 1 }}>{error}</Typography>}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.75, mt: 1.2, flexWrap: "wrap" }}>
          <AppButton onClick={onClose}>Cancelar</AppButton>
          <AppButton data-action-id={guardarActionId} buttonRef={guardarRef} icon={<Save size={16} />} onClick={handleSubmit} sx={{ backgroundColor: palette.accent, borderColor: palette.accent, color: palette.surface, fontWeight: 800 }}>
            {esEdicion ? "Guardar" : "Grabar boleto"}
          </AppButton>
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
            Escanear DNI
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
    </Dialog>
  );
}
