import React from "react";
import { TrModuloBase } from "./encomienda/TrEncomiendaList";

export default function TrBoletosList() {
  return (
    <TrModuloBase
      tipoOperacionFijo="B"
      titulo="Control de Boletos"
      contadorTexto="boletos registrados"
      nuevoTexto="Nuevo boleto"
      buscarTexto="Buscar boleto..."
      modalNuevoTitulo="Nuevo boleto"
      modalEditarTitulo="Editar boleto"
      sinDatosTexto="Sin boletos para el filtro actual"
      footerTexto="Boletos de viaje registrados en mve_transventa."
      basePath="/ad_transportesboletos"
    />
  );
}
