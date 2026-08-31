import React from "react";

import TrModuloBase from "../common/TrModuloBase";

export default function TrEncomiendaList() {
  /*
    Formulario: TrEncomiendaList

    Ruta usada por App.js:
    /ad_transportesencomienda/:id_anfitrion/:id_invitado/:periodo/:documento_id

    Este archivo solo configura la pantalla de encomiendas.
    La funcionalidad comun vive en TrModuloBase.
  */
  return (
    <TrModuloBase
      tipoOperacionFijo="E"
      titulo="Control de Encomiendas"
      contadorTexto="encomiendas registradas"
      nuevoTexto="Nueva encomienda"
      buscarTexto="Buscar encomienda..."
      modalNuevoTitulo="Nueva encomienda"
      modalEditarTitulo="Editar encomienda"
      sinDatosTexto="Sin encomiendas para el filtro actual"
      footerTexto="Envio de encomiendas registrado en mve_transventa."
      basePath="/ad_transportesencomienda"
    />
  );
}

export { default as TrModuloBase } from "../common/TrModuloBase";
