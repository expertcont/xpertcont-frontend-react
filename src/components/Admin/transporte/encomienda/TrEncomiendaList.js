import React from "react";

import TrModuloBase from "../common/TrModuloBase";

export default function TrEncomiendaList(props) {
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
      footerTexto=""
      basePath="/ad_transportesencomienda"
      idAnfitrionSesion={props.idAnfitrion}
      idInvitadoSesion={props.idInvitado}
      superUsuario={props.super}
      supervisorUsuario={props.supervisor}
      panoramicMode={props.panoramicMode}
    />
  );
}

export { default as TrModuloBase } from "../common/TrModuloBase";
