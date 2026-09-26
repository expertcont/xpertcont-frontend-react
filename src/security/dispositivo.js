// ============================================================================
//  Identidad del equipo
//
//  Que se puede y que no se puede hacer desde un navegador:
//   - NO se puede leer la MAC: la plataforma web lo prohibe, no hay API.
//   - NO se puede leer un identificador de hardware del equipo.
//   - Un user agent o un fingerprint guardado en localStorage se copia o se
//     borra en un segundo, asi que no sirven para autorizar una maquina.
//  Que si funciona:
//   Un par de claves ECDSA P-256 generado con WebCrypto en modo NO EXPORTABLE.
//   La clave privada vive en IndexedDB de este equipo y nunca se puede leer ni
//   copiar: si alguien copia el almacenamiento del navegador a otra PC, no
//   podra firmar el reto del servidor y el acceso se rechaza.
//
//  La "huella" es el SHA-256 de la clave publica. Ese es el codigo que el
//  administrador registra en mad_seguridad_dispositivo.
// ============================================================================

// Puesta en marcha del control de equipos.
//   false = el equipo se identifica y se avisa en pantalla, pero un equipo no
//           registrado todavia puede entrar. Evita que te quedes fuera del
//           sistema mientras registras las maquinas una por una.
//   true  = control estricto: sin equipo registrado no se entra.
// Activalo cuando todas las maquinas ya esten en la tabla.
export const CONTROL_EQUIPOS_ACTIVO = false;

// Cuando CONTROL_EQUIPOS_ACTIVO es false no se hace ninguna consulta al backend:
// la app entra directo, sin verificar nada. Es el interruptor maestro.
// CONTROL_EQUIPOS_EXIGIDO solo tiene sentido si el maestro esta en true:
//   true  = sin equipo registrado no se entra
//   false = se avisa en pantalla y se deja entrar
export const CONTROL_EQUIPOS_EXIGIDO = false;

const DB_NAME = "xpertcont_dispositivo";
const STORE_NAME = "llaves";
const CLAVE_LOCAL_HUELLA = "xpertcont_dispositivo_huella";

const abrirDb = () => new Promise((resolve, reject) => {
  if (typeof indexedDB === "undefined") {
    reject(new Error("Este navegador no soporta IndexedDB."));
    return;
  }
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error("No se pudo abrir el almacen del equipo."));
});

const leerLlave = (db, nombre) => new Promise((resolve, reject) => {
  const tx = db.transaction(STORE_NAME, "readonly");
  const req = tx.objectStore(STORE_NAME).get(nombre);
  req.onsuccess = () => resolve(req.result || null);
  req.onerror = () => reject(req.error);
});

const guardarLlave = (db, nombre, valor) => new Promise((resolve, reject) => {
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(valor, nombre);
  tx.oncomplete = () => resolve(true);
  tx.onerror = () => reject(tx.error);
});

const bytesABase64url = (bytes) => {
  let binario = "";
  const vista = new Uint8Array(bytes);
  for (let i = 0; i < vista.length; i += 1) {
    binario += String.fromCharCode(vista[i]);
  }
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const sha256Hex = async (texto) => {
  const datos = new TextEncoder().encode(texto);
  const buffer = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Crea el par de claves la primera vez; despues reutiliza el del equipo.
export const obtenerIdentidadEquipo = async () => {
  const db = await abrirDb();
  let par = await leerLlave(db, "par");

  if (!par) {
    par = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      false, // extractable = false: la clave privada no se puede exportar
      ["sign", "verify"],
    );
    await guardarLlave(db, "par", par);
  }

  const publica = await crypto.subtle.exportKey("spki", par.publicKey);
  const llavePublica = bytesABase64url(publica);
  const huella = await sha256Hex(llavePublica);

  localStorage.setItem(CLAVE_LOCAL_HUELLA, huella);

  return {
    huella,
    huellaCorta: `${huella.slice(0, 4)}-${huella.slice(4, 8)}-${huella.slice(8, 12)}`.toUpperCase(),
    llavePublica,
    plataforma: navigator.platform || (navigator.userAgentData && navigator.userAgentData.platform) || "desconocida",
    navegador: navigator.userAgent,
  };
};

const firmarNonce = async (nonce) => {
  const db = await abrirDb();
  const par = await leerLlave(db, "par");
  if (!par) {
    throw new Error("Este equipo todavia no tiene una identidad registrada.");
  }
  const firma = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    par.privateKey,
    new TextEncoder().encode(nonce),
  );
  return bytesABase64url(firma);
};

const postJson = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }
  return { ok: response.ok, status: response.status, data };
};

// 1) El equipo se anuncia. Si el backend no responde o no tiene la tabla,
//    devuelve "sin verificar" en vez de bloquear, para no dejar el sistema
//    inaccesible durante la puesta en marcha.
export const consultarEquipo = async (backHost, idUsuario, identidad) => {
  try {
    const { ok, data } = await postJson(`${backHost}/seguridad/dispositivo/consulta`, {
      id_usuario: idUsuario,
      huella: identidad.huella,
    });
    if (!ok || !data || !data.success) {
      return { disponible: false, autorizado: false, motivo: "El backend aun no valida equipos." };
    }
    return { disponible: true, autorizado: Boolean(data.autorizado), motivo: data.motivo || "", etiqueta: data.etiqueta || "" };
  } catch (error) {
    return { disponible: false, autorizado: false, motivo: "No se pudo contactar al backend." };
  }
};

// 2) Reto/respuesta: demuestra que la clave privada esta en este equipo.
export const verificarEquipoConReto = async (backHost, idUsuario, identidad) => {
  try {
    const reto = await postJson(`${backHost}/seguridad/dispositivo/reto`, {
      id_usuario: idUsuario,
      huella: identidad.huella,
    });
    if (!reto.ok || !reto.data || !reto.data.nonce) {
      return { disponible: false, autorizado: false, motivo: "El backend no genero el reto de seguridad." };
    }

    const firma = await firmarNonce(reto.data.nonce);
    const respuesta = await postJson(`${backHost}/seguridad/dispositivo/verificar`, {
      id_usuario: idUsuario,
      huella: identidad.huella,
      nonce: reto.data.nonce,
      firma,
    });

    if (respuesta.ok && respuesta.data && respuesta.data.autorizado) {
      return { disponible: true, autorizado: true, etiqueta: respuesta.data.etiqueta || "" };
    }

    return {
      disponible: true,
      autorizado: false,
      motivo: (respuesta.data && respuesta.data.message) || "El equipo no esta autorizado.",
    };
  } catch (error) {
    return { disponible: false, autorizado: false, motivo: "No se pudo completar la verificacion del equipo." };
  }
};

// 3) Alta desde la propia maquina. Ojo: este endpoint deja el equipo activo, asi
//    que debe usarse solo por un administrador, nunca como autorizacion automatica.
export const registrarEsteEquipo = async (backHost, idUsuario, identidad) => {
  const { ok, data } = await postJson(`${backHost}/seguridad/dispositivo/registrar`, {
    id_usuario: idUsuario,
    huella: identidad.huella,
    etiqueta: identidad.etiqueta || "Equipo autorizado",
    plataforma: identidad.plataforma,
    navegador: identidad.navegador,
    llave_publica: identidad.llavePublica,
  });
  return { ok, data };
};
