import React, { useState } from "react";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { Download, FileText, Share2, X } from "lucide-react";

import AppButton from "../../../ui/AppButton";
import palette from "../../../../theme/palette";

export default function TrCajaReporteArchivoDialog({ archivo, onClose }) {
  const [compartiendo, setCompartiendo] = useState(false);
  const [error, setError] = useState("");
  const puedeCompartirPdf = Boolean(archivo && navigator.share && navigator.canShare?.({ files: [archivo.file] }));
  const botonSx = { minHeight: 50, height: "auto", py: 1, fontSize: 14, justifyContent: "center" };

  const compartirPdf = async () => {
    if (!archivo || compartiendo) return;
    setError("");
    if (!puedeCompartirPdf) {
      setError("Este navegador no permite compartir archivos PDF. Usa Descargar PDF y adjuntalo como documento en WhatsApp.");
      return;
    }
    setCompartiendo(true);
    try {
      // Compartir el archivo real, con todas sus paginas y su nombre, desde el toque.
      await navigator.share({ files: [archivo.file], title: archivo.file.name });
      onClose();
    } catch (err) {
      if (err.name !== "AbortError") setError("No se pudo compartir el PDF. Puedes descargarlo para adjuntarlo como documento en WhatsApp.");
    } finally {
      setCompartiendo(false);
    }
  };

  const descargar = () => {
    const link = document.createElement("a");
    link.href = archivo.url;
    link.download = archivo.file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    cerrar();
  };

  const verPdf = () => {
    window.open(archivo.url, "_blank", "noopener,noreferrer");
    cerrar();
  };

  const cerrar = () => {
    if (compartiendo) return;
    setError("");
    onClose();
  };

  return (
    <Dialog open={Boolean(archivo)} onClose={cerrar} maxWidth="xs" fullWidth PaperProps={{ sx: { m: { xs: 1.5, sm: 4 }, width: { xs: "calc(100% - 24px)", sm: "100%" }, maxHeight: "calc(100dvh - 24px)", backgroundColor: palette.surface, color: palette.text, borderRadius: palette.radius.modal } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 17 }}>
        Reporte de caja
        <IconButton onClick={cerrar} disabled={compartiendo} aria-label="Cerrar reporte" sx={{ color: palette.muted }}><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 13, color: palette.muted, mb: 2 }}>
          {puedeCompartirPdf ? "Toca Compartir PDF y elige WhatsApp, Email u otra aplicacion. Se adjunta el PDF completo." : "Descarga el PDF y adjuntalo como documento en WhatsApp. Este navegador no permite compartir archivos directamente."}
        </Typography>
        <Box sx={{ display: "grid", gap: 1 }}>
          <AppButton icon={<Share2 size={20} />} onClick={compartirPdf} disabled={compartiendo} sx={{ ...botonSx, backgroundColor: palette.accent, color: palette.onAccent }}>Compartir PDF</AppButton>
          <AppButton icon={<Download size={18} />} onClick={descargar} disabled={compartiendo} sx={botonSx}>Descargar PDF</AppButton>
          <AppButton icon={<FileText size={18} />} onClick={verPdf} disabled={compartiendo} sx={botonSx}>Ver PDF</AppButton>
        </Box>
        {error && <Typography role="alert" sx={{ color: palette.danger, fontSize: 12, mt: 1.5 }}>{error}</Typography>}
        {compartiendo && <Typography role="status" sx={{ color: palette.muted, fontSize: 12, mt: 1.5 }}>Preparando reporte...</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pt: 1, pb: "max(20px, env(safe-area-inset-bottom))", borderTop: `1px solid ${palette.borderSoft}` }}>
        <AppButton fullWidth icon={<X size={18} />} onClick={cerrar} disabled={compartiendo} sx={botonSx}>Cerrar</AppButton>
      </DialogActions>
    </Dialog>
  );
}
