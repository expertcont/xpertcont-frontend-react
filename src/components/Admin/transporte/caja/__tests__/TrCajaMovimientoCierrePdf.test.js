import { PDFDocument } from "pdf-lib";
import zlib from "zlib";

import crearCierreCajaMovimientoPdf from "../TrCajaMovimientoCierrePdf";

// theme.danger del tema Carbon (#c2857a) y la tinta con la que se dibuja el resto.
const ROJO = [194 / 255, 133 / 255, 122 / 255];
const TINTA = [0.1, 0.12, 0.14];

const coincide = (color, base) => Math.abs(color[0] - base[0]) < 0.01
  && Math.abs(color[1] - base[1]) < 0.01
  && Math.abs(color[2] - base[2]) < 0.01;

const esRojo = (color) => coincide(color, ROJO);
const esTinta = (color) => coincide(color, TINTA);

// Recorre los streams del PDF y se queda con los de contenido de pagina (los que
// dibujan texto). El test genera un PDF de una sola pagina, asi que no hay ambiguedad.
const leerFlujos = (pdf) => {
  const flujos = [];
  pdf.context.enumerateIndirectObjects().forEach(([, obj]) => {
    if (!obj || typeof obj.getContents !== 'function') return;
    try {
      const texto = zlib.inflateSync(obj.getContents()).toString('latin1');
      if (texto.includes('Tj') || texto.includes('TJ')) {
        flujos.push(texto);
      }
    } catch (e) {
      // No es un stream comprimido con flate: no es contenido de pagina.
    }
  });
  return flujos.join('\n');
};

// Devuelve, en orden de dibujo, el color de relleno vigente y el texto dibujado
// con ese color. pdf-lib escribe el texto en hexadecimal (<43494552...> Tj).
const leerTextos = async (bytes) => {
  const pdf = await PDFDocument.load(bytes);
  const flujo = leerFlujos(pdf);
  const salida = [];
  const re = /([\d.]+) ([\d.]+) ([\d.]+) rg|<([0-9A-Fa-f]+)>\s*Tj|\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
  let color = null;
  let m = re.exec(flujo);

  while (m !== null) {
    if (m[1] !== undefined) {
      color = [Number(m[1]), Number(m[2]), Number(m[3])];
    } else if (color) {
      const crudo = m[4] !== undefined ? Buffer.from(m[4], 'hex').toString('latin1') : m[5];
      // toLocaleString("es-PE") pone espacio duro (U+00A0) entre "S/" y el monto.
      const texto = crudo ? crudo.replace(/\u00a0/g, ' ') : crudo;
      if (texto) {
        salida.push({ color, texto });
      }
    }
    m = re.exec(flujo);
  }

  return salida;
};

const bytesDelPdf = async () => {
  let blob = null;
  const original = URL.createObjectURL;
  URL.createObjectURL = jest.fn((b) => {
    blob = b;
    return "blob:test";
  });

  await crearCierreCajaMovimientoPdf({
    ingresos: [
      {
        fecha_caja: "2026-09-20T10:30:00",
        r_serie: "F001",
        r_numero: "123",
        punto_venta_dest_nombre: "AGENCIA SUR",
        cliente: "JUAN PEREZ",
        destinatario: "MARIA LOPEZ",
        tipo_ingreso: "ORIGEN_POR_COBRAR_REFERENCIA",
        contabiliza: false,
        registrado: 1,
        r_monto_total: 150.5,
        descripcion: "CAJA CON DOCUMENTOS",
      },
      {
        fecha_caja: "2026-09-21T09:00:00",
        r_serie: "F001",
        r_numero: "124",
        punto_venta_dest_nombre: "AGENCIA SUR",
        cliente: "ANA TORRES",
        tipo_ingreso: "ORIGEN",
        contabiliza: true,
        registrado: 1,
        r_monto_total: 80,
        descripcion: "PAQUETE SIMPLE",
      },
    ],
    ingresosManuales: [],
    salidas: [],
  });

  URL.createObjectURL = original;
  // jsdom no implementa blob.arrayBuffer(): se lee con FileReader.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};

const indiceDe = (textos, fragmento) => textos.findIndex((t) => t.texto.includes(fragmento));

test("la fila por cobrar se dibuja completa en rojo", async () => {
  const textos = await leerTextos(await bytesDelPdf());

  const iniPorCobrar = indiceDe(textos, "2026-09-20 10:30");
  const finPorCobrar = indiceDe(textos, "2026-09-21 09:00");
  expect(iniPorCobrar).toBeGreaterThan(-1);
  expect(finPorCobrar).toBeGreaterThan(iniPorCobrar);

  // Todo lo que se dibuja en la fila por cobrar tiene que ir en rojo: fecha,
  // numero, detalle, monto de referencia, cajita + descripcion, ingreso y salida.
  const fila = textos.slice(iniPorCobrar, finPorCobrar);
  expect(fila.map((t) => t.texto)).toEqual([
    "2026-09-20 10:30",
    "F001-123 AGENCIA SUR",
    "Rem.: JUAN PEREZ | Dest.: MARIA LOPEZ",
    "S/ 150.50",
    "CAJA CON DOCUMENTOS",
    "Por cobrar",
    "-",
    "S/ 0.00",
  ]);

  // El saldo es el ultimo dibujo de la fila y queda en tinta: es una columna
  // acumulada, no un dato de la encomienda por cobrar.
  const [saldo] = fila.slice(-1);
  expect(saldo.texto).toBe("S/ 0.00");
  expect(esTinta(saldo.color)).toBe(true);

  fila.slice(0, -1).forEach((t) => {
    const esRojoReal = esRojo(t.color);
    expect(`${t.texto} en rojo: ${esRojoReal}`).toBe(`${t.texto} en rojo: true`);
  });

  // La fila normal se queda en tinta: el rojo no se contagia.
  const filaNormal = textos.slice(finPorCobrar, indiceDe(textos, "Encargado de caja"));
  const detalleNormal = filaNormal.find((t) => t.texto.includes("F001-124"));
  const ingresoNormal = filaNormal.find((t) => t.texto.includes("S/ 80.00"));
  expect(detalleNormal).toBeTruthy();
  expect(ingresoNormal).toBeTruthy();
  expect(esTinta(detalleNormal.color)).toBe(true);
  expect(esTinta(ingresoNormal.color)).toBe(true);
  expect(esTinta(textos[indiceDe(textos, "2026-09-21 09:00")].color)).toBe(true);
});
