import React from "react";
import { MenuItem, Select } from "@mui/material";

import palette from "../../../../../theme/palette";

// ===========================================================================
// SELECT DE RUTA, compartido entre boleto y manifiesto.
//
// Vive aca y no en uno de los dos modulos porque los dos lo necesitan con la
// misma forma: un desplegable en linea, no un picker modal. Un picker tiene
// sentido para listas largas (placas, licencias, zonas); las rutas de salida de
// pasajeros de una agencia son pocas y se eligen de un vistazo.
//
// El texto por defecto es el DESTINO, no el nombre de la ruta: el chofer y el
// pasajero piensan en "a donde voy", y de donde sale ya se sabe por la agencia en
// la que esta trabajando. El nombre de la ruta ("Ruta A", "Lima - Cusco") no le
// dice nada nuevo al que ya conoce su agencia.
//
// `detalle` es para el manifiesto: alla el viaje se identifica por nombre de ruta,
// destino y pasaje, y son datos que todavia no estan en pantalla.
// ===========================================================================
export default function TrRutaSelect({ value, onChange, rutas = [], detalle = false, placeholder = "Selecciona", selectRef, onKeyDown }) {
  return (
    <Select
      ref={selectRef}
      variant="standard"
      disableUnderline
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      sx={{
        color: palette.text,
        fontSize: "12.5px",
        width: "100%",
        "& .MuiSelect-icon": { color: palette.muted },
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            bgcolor: palette.surface,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            "& .MuiMenuItem-root": { fontSize: "12.5px" },
          },
        },
      }}
    >
      <MenuItem value={placeholder === "Selecciona" ? "" : placeholder}>{placeholder}</MenuItem>

      {rutas.map((ruta) => (
        <MenuItem key={ruta.id_ruta} value={ruta.id_ruta}>
          {detalle
            ? [
                ruta.nombre || ruta.nombre_ruta || ruta.id_punto_venta_dest,
                ruta.punto_venta_dest_nombre || ruta.id_punto_venta_dest || "",
                Number(ruta.precio_pasaje || 0) > 0
                  ? `S/ ${Number(ruta.precio_pasaje).toFixed(2)}`
                  : "",
              ].filter(Boolean).join("  -  ")
            : (ruta.punto_venta_dest_nombre || ruta.id_punto_venta_dest || ruta.nombre || ruta.id_ruta)}
        </MenuItem>
      ))}
    </Select>
  );
}
