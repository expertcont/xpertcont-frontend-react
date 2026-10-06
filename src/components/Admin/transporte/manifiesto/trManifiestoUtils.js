// Registro de navegacion por teclado del MANIFIESTO.
//
// OJO: este array es propio a proposito. El de encomienda
// (trEncomiendaModalUtils.focusableRefs) tambien es un array de modulo, y las dos
// formas pueden estar montadas a la vez: si compartieran la lista, el
// `focusableRefs.length = 0` de una borraria los campos de la otra y las flechas
// moverian el foco al control equivocado.
//
// Se llena durante el render, no en un efecto, para que el orden coincida con el
// orden visual del formulario. Los campos condicionados se saltan solos porque su
// ref.current queda en null.
//
// Orden (de arriba hacia abajo):
//   1. Viaje  : Fecha, Destino
//   2. Vehiculo: Placa, Licencia, Observacion
//   3. Pasajero: Busqueda, Grabar
export const focusableRefsManifiesto = [];

export const emptyManifiesto = () => ({
  fecha: "",
  id_punto_venta: "",
  id_punto_venta_dest: "",
  id_ruta: "",
  placa: "",
  licencia: "",
  observacion: "",
});

const campo = (v) => String(v ?? "").trim().toUpperCase();

// Busqueda de pasajero: un solo texto con todo lo que el chofer podria escribir
// (DNI, nombre, serie, numero, asiento, placa del boleto). Se compara con
// "includes" en minusculas, igual que el buscador de encomiendas.
export const textoBusquedaPasajero = (fila) => [
  fila.cliente,
  fila.cliente_documento_id,
  fila.cliente_documento,
  fila.id_documento,
  fila.r_serie,
  fila.r_numero,
  fila.asiento,
  fila.placa,
].map(campo).join(" ").toLowerCase();

// La clave con la que el backend identifica un boleto dentro del manifiesto. Son
// los mismos campos que usa el resto del modulo, mas el elemento.
export const clavePasajero = (fila) => ({
  periodo: fila.periodo,
  id_usuario: fila.id_usuario,
  documento_id: fila.documento_id,
  r_cod: fila.r_cod,
  r_serie: fila.r_serie,
  r_numero: fila.r_numero,
  elemento: fila.elemento === undefined || fila.elemento === null ? 1 : fila.elemento,
});

export const dosDecimales = (valor) => Number(valor || 0).toFixed(2);

// La fecha se maneja como AAAA-MM-DD porque es lo que espera el backend
// (el service rechaza cualquier otro formato con 400). Se valida antes de enviar.
export const FECHA_AAAA_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

export const normalizarFechaManifiesto = (fecha) => {
  const texto = String(fecha || "").trim();
  const candidata = texto.slice(0, 10);
  return FECHA_AAAA_MM_DD.test(candidata) ? candidata : "";
};

export const periodoDeFecha = (fecha) => String(fecha || "").slice(0, 7);
