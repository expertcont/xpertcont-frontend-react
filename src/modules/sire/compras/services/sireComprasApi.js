import axios from "axios";
const backHost = process.env.REACT_APP_BACK_HOST || process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
const endpoint = backHost + "/sire/compras/propuesta";
export const sireComprasApi = {
  listarPersonalizada: contexto => axios.get(backHost + '/sire/compras/personalizada/' + contexto),
  importarPersonalizada: payload => axios.post(backHost + '/sire/compras/personalizada/importar', payload),
  crearPersonalizada: payload => axios.post(backHost + '/sire/compras/personalizada', payload),
  editarPersonalizada: (id, payload) => axios.put(backHost + '/sire/compras/personalizada/' + id, payload),
  eliminarPersonalizada: (id, payload) => axios.delete(backHost + '/sire/compras/personalizada/' + id, { data: payload }),
  catalogos: ({ id_anfitrion, id_invitado }) => Promise.all([
    axios.get(backHost + "/usuario/periodos/" + encodeURIComponent(id_anfitrion)),
    axios.get(backHost + "/usuario/contabilidades/" + encodeURIComponent(id_anfitrion) + "/" + encodeURIComponent(id_invitado)),
  ]),
  recuperar: contexto => axios.get(endpoint + "/" + contexto),
  ejecutar: (accion, payload) => axios.post(endpoint + "/" + (accion === "ticket" ? "ticket" : "consultar"), payload),
  descargar: contexto => axios.get(endpoint + "/archivo/" + contexto, { responseType: "blob" }),
};
