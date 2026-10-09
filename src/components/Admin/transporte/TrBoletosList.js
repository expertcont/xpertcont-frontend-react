import React from "react";
import { TrModuloBase } from "./encomienda/TrEncomiendaList";

export default function TrBoletosList({ panoramicMode = false, super: superUsuario = "0", supervisor = "0" }) {
  return (
    <TrModuloBase
      tipoOperacionFijo="B"
      titulo="Control de Manifiestos"
      contadorTexto="boletos registrados"
      nuevoTexto="Añadir manifiesto"
      buscarTexto="Buscar boleto o pasajero..."
      modalNuevoTitulo="Nuevo boleto"
      modalEditarTitulo="Editar boleto"
      sinDatosTexto="Sin boletos para el filtro actual"
      footerTexto="Manifiestos de viaje y boletos registrados en mve_transventa."
      basePath="/ad_transportesboletos"
      superUsuario={superUsuario}
      supervisorUsuario={supervisor}
      panoramicMode={panoramicMode}
    />
  );
}
