const IGV_RATE = 0.18;

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const costoRecurso = (recurso) => {
  const precioUnitario = Number(recurso.precio_unitario ?? recurso.costo_unitario ?? recurso.costo_hora ?? recurso.costo_m2 ?? 0);

  if (recurso.tipo === "MANO_OBRA" || recurso.tipo === "OPERARIO") {
    return Number(recurso.horas || 0) * Number(recurso.cantidad || recurso.operarios || 1) * precioUnitario;
  }
  if (recurso.tipo === "SERVICIO") {
    return Number(recurso.largo || 0) * Number(recurso.ancho || 0) * Number(recurso.cantidad || 1) * precioUnitario;
  }
  return Number(recurso.cantidad || 0) * precioUnitario;
};

export const totalRecursosTrabajo = (trabajo) => (trabajo.materiales || []).reduce(
  (acc, recurso) => acc + costoRecurso(recurso),
  0,
);

export const utilidadTrabajo = (trabajo) => {
  const recursos = totalRecursosTrabajo(trabajo);
  return recursos * (Number(trabajo.utilidad ?? trabajo.utilidad_pct ?? 0) / 100);
};

export const totalCosteadoTrabajo = (trabajo) => (
  totalRecursosTrabajo(trabajo) + utilidadTrabajo(trabajo)
);

export const totalTrabajo = (trabajo) => {
  if (trabajo.r_monto_total !== undefined && trabajo.r_monto_total !== null && trabajo.r_monto_total !== "") {
    return Number(trabajo.r_monto_total || 0);
  }

  const recursos = totalRecursosTrabajo(trabajo);
  if (recursos > 0) {
    return round2(totalCosteadoTrabajo(trabajo) * (1 + IGV_RATE));
  }
  return Number(trabajo.cantidad || 1) * Number(trabajo.precio_unitario || 0);
};

export const resumenTributarioServicio = (trabajo, r_moneda = "PEN") => {
  const precio_neto = round2(totalTrabajo(trabajo));
  const monto_base = round2(precio_neto / (1 + IGV_RATE));
  const igv = round2(precio_neto - monto_base);

  return {
    monto_base,
    igv,
    precio_neto,
    r_base002: monto_base,
    r_igv002: igv,
    r_monto_total: precio_neto,
    r_moneda,
  };
};

export const subtotalPresupuesto = (presupuesto) => (presupuesto.trabajos || []).reduce(
  (acc, trabajo) => acc + resumenTributarioServicio(trabajo, presupuesto.r_moneda).monto_base,
  0,
);

export const totalPresupuesto = (presupuesto) => (presupuesto.trabajos || []).reduce(
  (acc, trabajo) => acc + totalTrabajo(trabajo),
  0,
);

export const detalleRecurso = (recurso, formatMoney) => {
  const precioUnitario = recurso.precio_unitario ?? recurso.costo_unitario ?? recurso.costo_hora ?? recurso.costo_m2;
  const unidad = recurso.cont_und || recurso.unidad || "";

  if (recurso.tipo === "MANO_OBRA" || recurso.tipo === "OPERARIO") {
    return `${recurso.horas || 0} h x ${recurso.cantidad || recurso.operarios || 1} oper. x ${formatMoney(precioUnitario)}`;
  }
  if (recurso.tipo === "SERVICIO") {
    return `${recurso.largo || 0} x ${recurso.ancho || 0} m x ${recurso.cantidad || 1} und x ${formatMoney(precioUnitario)}`;
  }
  return `${recurso.cantidad || 0} ${unidad} x ${formatMoney(precioUnitario)}`;
};

export const productosPresupuestoDemo = [
  { id_producto: "VIN-MESH-140", nombre: "VINIL MESH IMPRESO 1.40 M", precio_compra: 18.5, tipo: "MATERIAL" },
  { id_producto: "VIN-BLANCO-140", nombre: "VINIL BLANCO MATE 1.40 M", precio_compra: 16.8, tipo: "MATERIAL" },
  { id_producto: "LAM-BRILL-140", nombre: "LAMINADO BRILLANTE 1.40 M", precio_compra: 9.4, tipo: "MATERIAL" },
  { id_producto: "THINNER-STD", nombre: "THINNER STANDART", precio_compra: 35, tipo: "MATERIAL" },
  { id_producto: "OJALILLOS", nombre: "OJALILLOS METALICOS", precio_compra: 0.18, tipo: "MATERIAL" },
  { id_producto: "TUBO-RECT", nombre: "TUBO RECTANGULAR FIERRO", precio_compra: 42, tipo: "MATERIAL" },
  { id_producto: "SOLDADURA", nombre: "SOLDADURA Y CONSUMIBLES", precio_compra: 12, tipo: "MATERIAL" },
  { id_producto: "PINTURA-ESM", nombre: "PINTURA ESMALTE", precio_compra: 28, tipo: "MATERIAL" },
  { id_producto: "OPER-VINIL", nombre: "OPERARIO VINILISTA", precio_compra: 35, tipo: "OPERARIO" },
  { id_producto: "OPER-INST", nombre: "OPERARIO INSTALADOR", precio_compra: 38, tipo: "OPERARIO" },
  { id_producto: "OPER-SOLD", nombre: "OPERARIO SOLDADOR", precio_compra: 45, tipo: "OPERARIO" },
  { id_producto: "SERV-IMP-VIN", nombre: "IMPRESION VINIL BLANCO MATE", precio_compra: 42, tipo: "SERVICIO" },
  { id_producto: "SERV-IMP-MESH", nombre: "IMPRESION VINIL MESH", precio_compra: 48, tipo: "SERVICIO" },
  { id_producto: "SERV-CORTE", nombre: "CORTE CNC", precio_compra: 25, tipo: "SERVICIO" },
  { id_producto: "SERV-ANDAMIO", nombre: "ALQUILER DE ANDAMIO", precio_compra: 180, tipo: "SERVICIO" },
  { id_producto: "TRASLADO", nombre: "TRASLADOS INSTALACION", precio_compra: 80, tipo: "VIATICO" },
  { id_producto: "MOVILIDAD", nombre: "MOVILIDAD LOCAL", precio_compra: 45, tipo: "VIATICO" },
  { id_producto: "TERC-GRUA", nombre: "SERVICIO DE GRUA", precio_compra: 350, tipo: "TERCERIZACION" },
  { id_producto: "TERC-ALTURA", nombre: "TRABAJO EN ALTURA TERCERIZADO", precio_compra: 280, tipo: "TERCERIZACION" },
];

export const presupuestosDemo = [
  {
    id: 1,
    r_cod: "NV",
    r_serie: "0001",
    r_numero: "0000001",
    elemento: 1,
    r_fecemi: "2026-01-04",
    r_id_doc: "6",
    r_documento_id: "20505567890",
    r_razon_social: "MALL PLAZA PERU S.A.",
    r_direccion: "AV. ALFREDO MENDIOLA 1400 - INDEPENDENCIA",
    r_moneda: "PEN",
    r_forma_pago_id: "Contado",
    vigencia_dias: 15,
    contacto_nombre: "Operaciones",
    contacto_celular: "51954807980",
    glosa: "Mantenimiento grafico",
    trabajos: [
      { id: 1, servicio: 1, descripcion: "Mantenimiento de senaletica", especificacion: "MANTENIMIENTO DE SENALETICA EXISTENTE, LIMPIEZA, REVISION DE FIJACIONES Y REPOSICION DE ELEMENTOS GRAFICOS DETERIORADOS.", cantidad: 1, cont_und: "ZZ", precio_unitario: 480, materiales: [] },
      { id: 2, servicio: 2, descripcion: "Revision de puntos", especificacion: "REVISION DE PUNTOS PUBLICITARIOS, VALIDACION DE MEDIDAS, ESTADO DE SOPORTES Y CONDICIONES PARA INSTALACION.", cantidad: 1, cont_und: "ZZ", precio_unitario: 240, materiales: [] },
    ],
  },
  {
    id: 2,
    r_cod: "NV",
    r_serie: "0001",
    r_numero: "0000002",
    elemento: 1,
    r_fecemi: "2026-01-05",
    r_id_doc: "6",
    r_documento_id: "20467534026",
    r_razon_social: "AMERICA MOVIL PERU S.A.C.",
    r_direccion: "AV. NICOLAS ARRIOLA 480 - LA VICTORIA",
    r_moneda: "PEN",
    r_forma_pago_id: "Contado",
    vigencia_dias: 15,
    contacto_nombre: "Area Comercial",
    contacto_celular: "51999888777",
    glosa: "Campana viniles Arequipa",
    trabajos: [
      {
        id: 5,
        servicio: 1,
        descripcion: "PORONGOCHE 1",
        especificacion: "VINIL MESH IMPRESO CON RETIRO DEL ANTERIOR, LIMPIEZA E INSTALACION DE NUEVO. TAMANO: FIT MAMA 2 X 3 M / FULL ZAMBITA 1.8 X 1.4 M",
        cantidad: 1,
        cont_und: "ZZ",
        precio_unitario: 0,
        utilidad: 40,
        materiales: [
          { id: 501, tipo: "MATERIAL", grupo: "01-MATERIALES", id_producto: "SOLVENTE", descripcion: "THINNER STANDART", cantidad: 0.12, cont_und: "GLN", precio_unitario: 35, porc_igv: 18 },
          { id: 502, tipo: "OPERARIO", grupo: "02-FABRICACION OPERADORES", id_producto: "GENERAL", descripcion: "OPERARIO VINILISTA N", cantidad: 3, cont_und: "HRA", horas: 2.5, precio_unitario: 35, porc_igv: 18 },
          { id: 503, tipo: "VIATICO", grupo: "03-VIATICOS INSTALACION", id_producto: "GENERAL", descripcion: "TRASLADOS", cantidad: 1, cont_und: "UND", precio_unitario: 80, porc_igv: 18 },
          { id: 504, tipo: "SERVICIO", grupo: "05-IMPRESIONES", id_producto: "GENERAL", descripcion: "IMPRESION VINIL BLANCO MATE 1.40 X 50 MTS", largo: 1.4, ancho: 1.8, cantidad: 1, cont_und: "M2", precio_unitario: 116.90873015873015, porc_igv: 18 },
        ],
      },
      {
        id: 6,
        servicio: 2,
        descripcion: "CAC AREQUIPA",
        especificacion: "VINIL NORMAL IMPRESO CON RETIRO DEL ANTERIOR, LIMPIEZA E INSTALACION DE NUEVO. TAMANO: FIT MAMA 3X3 M / FULL ZAMBITA 3X3 M / MARCO BLANCO 2.42 X 4.39 / MARCO ROJO 2.42 X 4.39",
        cantidad: 1,
        cont_und: "ZZ",
        precio_unitario: 0,
        utilidad: 35,
        materiales: [
          { id: 601, tipo: "MATERIAL", grupo: "01-MATERIALES", id_producto: "SOLVENTE", descripcion: "THINNER STANDART", cantidad: 0.12, cont_und: "GLN", precio_unitario: 35, porc_igv: 18 },
          { id: 602, tipo: "OPERARIO", grupo: "02-FABRICACION OPERADORES", id_producto: "GENERAL", descripcion: "OPERARIO VINILISTA N", cantidad: 3, cont_und: "HRA", horas: 4, precio_unitario: 35, porc_igv: 18 },
          { id: 603, tipo: "VIATICO", grupo: "03-VIATICOS INSTALACION", id_producto: "GENERAL", descripcion: "TRASLADOS", cantidad: 1, cont_und: "UND", precio_unitario: 120, porc_igv: 18 },
          { id: 604, tipo: "TERCERIZACION", grupo: "04-TERCERIZACIONES", id_producto: "GENERAL", descripcion: "ANDAMIO", cantidad: 1, cont_und: "UND", precio_unitario: 180, porc_igv: 18 },
          { id: 605, tipo: "SERVICIO", grupo: "05-IMPRESIONES", id_producto: "GENERAL", descripcion: "IMPRESION VINIL BLANCO MATE 1.40 X 50 MTS", largo: 3.49, ancho: 2.42, cantidad: 2, cont_und: "M2", precio_unitario: 43.99843780092473, porc_igv: 18 },
        ],
      },
    ],
  },
  {
    id: 3,
    r_cod: "NV",
    r_serie: "0001",
    r_numero: "0000003",
    elemento: 1,
    r_fecemi: "2026-01-06",
    r_id_doc: "6",
    r_documento_id: "20111111111",
    r_razon_social: "FABRICA DE EMBUTIDOS LA ALEMANA S.A.C.",
    r_direccion: "-",
    r_moneda: "USD",
    r_forma_pago_id: "Credito",
    vigencia_dias: 7,
    contacto_nombre: "Compras",
    contacto_celular: "51911111111",
    glosa: "Servicio grafico",
    trabajos: [
      { id: 7, servicio: 1, descripcion: "Servicio grafico", especificacion: "SERVICIO GRAFICO INTEGRAL CON PRODUCCION, ACABADOS E INSTALACION SEGUN MEDIDAS Y CONDICIONES COORDINADAS.", cantidad: 1, cont_und: "ZZ", precio_unitario: 980, materiales: [] },
    ],
  },
  {
    id: 4,
    r_cod: "NV",
    r_serie: "0001",
    r_numero: "0000004",
    elemento: 1,
    r_fecemi: "2026-01-06",
    r_id_doc: "6",
    r_documento_id: "20400000001",
    r_razon_social: "CLARO",
    r_direccion: "-",
    r_moneda: "PEN",
    r_forma_pago_id: "Contado",
    vigencia_dias: 10,
    contacto_nombre: "Marketing",
    contacto_celular: "51922222222",
    glosa: "Instalacion comercial",
    trabajos: [
      { id: 8, servicio: 1, descripcion: "Instalacion grafica", especificacion: "INSTALACION GRAFICA EN PUNTO COMERCIAL, INCLUYE TRASLADO, PREPARACION DE SUPERFICIE Y COLOCACION FINAL.", cantidad: 1, cont_und: "ZZ", precio_unitario: 500, utilidad: 40, materiales: [{ id: 801, tipo: "VIATICO", id_producto: "GENERAL", descripcion: "TRASLADOS", cantidad: 1, cont_und: "UND", precio_unitario: 90, porc_igv: 18 }] },
    ],
  },
].map((presupuesto) => ({
  ...presupuesto,
  trabajos: (presupuesto.trabajos || []).map((trabajo) => ({
    ...trabajo,
    ...resumenTributarioServicio(trabajo, presupuesto.r_moneda),
  })),
}));

export const presupuestoNuevoDemo = presupuestosDemo[0];

export const numeroPresupuestoDemo = (presupuesto) => [
  presupuesto.r_cod,
  presupuesto.r_serie,
  presupuesto.r_numero,
].filter(Boolean).join("-");

export const getPresupuestoDemo = (numero) => (
  presupuestosDemo.find((presupuesto) => (
    presupuesto.r_numero === numero || numeroPresupuestoDemo(presupuesto) === numero
  ))
);
