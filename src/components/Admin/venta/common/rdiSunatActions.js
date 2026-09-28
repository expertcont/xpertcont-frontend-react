import axios from "axios";

export const getRdiResponseMessage = (response) => (
  response?.data?.mensaje_usuario ||
  response?.data?.respuesta_sunat_descripcion ||
  response?.data?.message ||
  response?.mensaje_usuario ||
  response?.message ||
  "Operacion procesada."
);

export const normalizarRdiResponse = (response = {}) => {
  const data = response?.data || {};
  const nestedData = data?.data || {};

  return {
    ...response,
    ...data,
    ...nestedData,
    numero_rdi: response.numero_rdi || data.numero_rdi || nestedData.numero_rdi || response.numeroRdi || data.numeroRdi || nestedData.numeroRdi,
    ticket: response.ticket || data.ticket || nestedData.ticket,
    estado: response.estado || data.estado || nestedData.estado,
    nivel: response.nivel || data.nivel || nestedData.nivel,
    nombre_archivo: response.nombre_archivo || data.nombre_archivo || nestedData.nombre_archivo,
    ruta_cdr: response.ruta_cdr || data.ruta_cdr || nestedData.ruta_cdr,
    respuesta_sunat_descripcion: response.respuesta_sunat_descripcion || data.respuesta_sunat_descripcion || nestedData.respuesta_sunat_descripcion,
    respuesta_desc: response.respuesta_desc || data.respuesta_desc || nestedData.respuesta_desc,
    total_documentos: response.total_documentos || data.total_documentos || nestedData.total_documentos,
    mensaje_usuario: response.mensaje_usuario || data.mensaje_usuario || nestedData.mensaje_usuario,
    message: response.message || data.message || nestedData.message,
  };
};

export const consultarTicketRdiSunat = async ({
  backHost,
  resumenEndpoint,
  periodo,
  idAnfitrion,
  idInvitado,
  documentoId,
  numeroRdi,
  ctrlModUs,
}) => {
  const response = await axios.post(`${backHost}/${resumenEndpoint}/ticket`, {
    periodo,
    id_anfitrion: idAnfitrion,
    id_usuario: idAnfitrion,
    id_invitado: idInvitado,
    documento_id: documentoId,
    numero_rdi: numeroRdi,
    ctrl_mod_us: ctrlModUs || idInvitado,
  });

  return {
    raw: response,
    data: normalizarRdiResponse(response.data),
    message: getRdiResponseMessage(response),
  };
};
