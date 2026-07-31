export const costoRecurso = (recurso) => {
  if (recurso.tipo === "MANO_OBRA" || recurso.tipo === "OPERARIO") {
    return Number(recurso.horas || 0) * Number(recurso.operarios || 1) * Number(recurso.costo_hora || 0);
  }
  if (recurso.tipo === "SERVICIO") {
    return Number(recurso.largo || 0) * Number(recurso.ancho || 0) * Number(recurso.cantidad || 1) * Number(recurso.costo_m2 || 0);
  }
  return Number(recurso.cantidad || 0) * Number(recurso.costo_unitario || 0);
};

export const totalRecursosTrabajo = (trabajo) => (trabajo.materiales || []).reduce(
  (acc, recurso) => acc + costoRecurso(recurso),
  0,
);

export const utilidadTrabajo = (trabajo) => {
  const recursos = totalRecursosTrabajo(trabajo);
  return recursos * (Number(trabajo.utilidad_pct || 0) / 100);
};

export const totalCosteadoTrabajo = (trabajo) => (
  totalRecursosTrabajo(trabajo) + utilidadTrabajo(trabajo)
);

export const totalTrabajo = (trabajo) => {
  const recursos = totalRecursosTrabajo(trabajo);
  if (recursos > 0) {
    return totalCosteadoTrabajo(trabajo);
  }
  return Number(trabajo.cantidad || 0) * Number(trabajo.precio_unitario || 0);
};

export const subtotalPresupuesto = (presupuesto) => (presupuesto.trabajos || []).reduce(
  (acc, trabajo) => acc + totalTrabajo(trabajo),
  0,
);

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const totalPresupuesto = (presupuesto) => (presupuesto.trabajos || []).reduce(
  (acc, trabajo) => acc + round2(totalTrabajo(trabajo) * 1.18),
  0,
);

export const detalleRecurso = (recurso, formatMoney) => {
  if (recurso.tipo === "MANO_OBRA" || recurso.tipo === "OPERARIO") {
    return `${recurso.horas || 0} h x ${recurso.operarios || 1} oper. x ${formatMoney(recurso.costo_hora)}`;
  }
  if (recurso.tipo === "SERVICIO") {
    return `${recurso.largo || 0} x ${recurso.ancho || 0} m x ${recurso.cantidad || 1} und x ${formatMoney(recurso.costo_m2)}`;
  }
  return `${recurso.cantidad || 0} ${recurso.unidad || ""} x ${formatMoney(recurso.costo_unitario)}`;
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
    numero: "PP-0001-321321",
    fecha: "2026-01-04",
    cliente_documento: "20505567890",
    cliente_nombre: "MALL PLAZA PERU S.A.",
    cliente: "MALL PLAZA PERU S.A.",
    direccion: "AV. ALFREDO MENDIOLA 1400 - INDEPENDENCIA",
    moneda: "PEN",
    forma_pago: "Contado",
    vigencia_dias: 15,
    contacto: "Operaciones",
    celular: "51954807980",
    campana: "Mantenimiento grafico",
    trabajos: [
      { id: 1, producto: "TR-001", codigo: "TR-001", numero: "TR-001", descripcion: "Mantenimiento de senaletica", cantidad: 1, unidad: "SERV", precio_unitario: 480, materiales: [] },
      { id: 2, producto: "TR-002", codigo: "TR-002", numero: "TR-002", descripcion: "Revision de puntos", cantidad: 1, unidad: "SERV", precio_unitario: 240, materiales: [] },
    ],
  },
  {
    id: 2,
    numero: "PP-0002-654321",
    fecha: "2026-01-05",
    cliente_documento: "20467534026",
    cliente_nombre: "AMERICA MOVIL PERU S.A.C.",
    cliente: "AMERICA MOVIL PERU S.A.C.",
    direccion: "AV. NICOLAS ARRIOLA 480 - LA VICTORIA",
    moneda: "PEN",
    forma_pago: "Contado",
    vigencia_dias: 15,
    contacto: "Area Comercial",
    celular: "51999888777",
    campana: "Campana viniles Arequipa",
    trabajos: [
      {
        id: 5,
        producto: "PORONGOCHE 1",
        codigo: "PORONGOCHE 1",
        numero: "PORONGOCHE 1",
        descripcion: "VINIL MESH IMPRESO CON RETIRO DEL ANTERIOR, LIMPIEZA E INSTALACION DE NUEVO. TAMANO: FIT MAMA 2 X 3 M / FULL ZAMBITA 1.8 X 1.4 M",
        cantidad: 1,
        unidad: "SERV",
        precio_unitario: 0,
        utilidad_pct: 40,
        materiales: [
          { id: 501, tipo: "MATERIAL", grupo: "01-MATERIALES", codigo: "SOLVENTE", descripcion: "THINNER STANDART", cantidad: 0.12, unidad: "GLN", costo_unitario: 35 },
          { id: 502, tipo: "OPERARIO", grupo: "02-FABRICACION OPERADORES", codigo: "GENERAL", descripcion: "OPERARIO VINILISTA N", horas: 2.5, operarios: 3, costo_hora: 35 },
          { id: 503, tipo: "VIATICO", grupo: "03-VIATICOS INSTALACION", codigo: "GENERAL", descripcion: "TRASLADOS", cantidad: 1, unidad: "UND", costo_unitario: 80 },
          { id: 504, tipo: "SERVICIO", grupo: "05-IMPRESIONES", codigo: "GENERAL", descripcion: "IMPRESION VINIL BLANCO MATE 1.40 X 50 MTS", largo: 1.4, ancho: 1.8, cantidad: 1, unidad: "UND", costo_m2: 116.90873015873015 },
        ],
      },
      {
        id: 6,
        producto: "CAC AREQUIPA",
        codigo: "CAC AREQUIPA",
        numero: "CAC AREQUIPA",
        descripcion: "VINIL NORMAL IMPRESO CON RETIRO DEL ANTERIOR, LIMPIEZA E INSTALACION DE NUEVO. TAMANO: FIT MAMA 3X3 M / FULL ZAMBITA 3X3 M / MARCO BLANCO 2.42 X 4.39 / MARCO ROJO 2.42 X 4.39",
        cantidad: 1,
        unidad: "SERV",
        precio_unitario: 0,
        utilidad_pct: 35,
        materiales: [
          { id: 601, tipo: "MATERIAL", grupo: "01-MATERIALES", codigo: "SOLVENTE", descripcion: "THINNER STANDART", cantidad: 0.12, unidad: "GLN", costo_unitario: 35 },
          { id: 602, tipo: "OPERARIO", grupo: "02-FABRICACION OPERADORES", codigo: "GENERAL", descripcion: "OPERARIO VINILISTA N", horas: 4, operarios: 3, costo_hora: 35 },
          { id: 603, tipo: "VIATICO", grupo: "03-VIATICOS INSTALACION", codigo: "GENERAL", descripcion: "TRASLADOS", cantidad: 1, unidad: "UND", costo_unitario: 120 },
          { id: 604, tipo: "TERCERIZACION", grupo: "04-TERCERIZACIONES", codigo: "GENERAL", descripcion: "ANDAMIO", cantidad: 1, unidad: "UND", costo_unitario: 180 },
          { id: 605, tipo: "SERVICIO", grupo: "05-IMPRESIONES", codigo: "GENERAL", descripcion: "IMPRESION VINIL BLANCO MATE 1.40 X 50 MTS", largo: 3.49, ancho: 2.42, cantidad: 2, unidad: "UND", costo_m2: 43.99843780092473 },
        ],
      },
    ],
  },
  {
    id: 3,
    numero: "PP-0003-777777",
    fecha: "2026-01-06",
    cliente_documento: "20111111111",
    cliente_nombre: "FABRICA DE EMBUTIDOS LA ALEMANA S.A.C.",
    cliente: "FABRICA DE EMBUTIDOS LA ALEMANA S.A.C.",
    direccion: "-",
    moneda: "USD",
    forma_pago: "Credito",
    vigencia_dias: 7,
    contacto: "Compras",
    celular: "51911111111",
    campana: "Servicio grafico",
    trabajos: [
      { id: 7, producto: "TR-007", codigo: "TR-007", numero: "TR-007", descripcion: "Servicio grafico", cantidad: 1, unidad: "SERV", precio_unitario: 980, materiales: [] },
    ],
  },
  {
    id: 4,
    numero: "PP-0003-5798798",
    fecha: "2026-01-06",
    cliente_documento: "20400000001",
    cliente_nombre: "CLARO",
    cliente: "CLARO",
    direccion: "-",
    moneda: "PEN",
    forma_pago: "Contado",
    vigencia_dias: 10,
    contacto: "Marketing",
    celular: "51922222222",
    campana: "Instalacion comercial",
    trabajos: [
      { id: 8, producto: "TR-107", codigo: "TR-107", numero: "TR-107", descripcion: "Instalacion grafica", cantidad: 1, unidad: "SERV", precio_unitario: 500, utilidad_pct: 40, materiales: [{ id: 801, tipo: "VIATICO", codigo: "GENERAL", descripcion: "TRASLADOS", cantidad: 1, unidad: "UND", costo_unitario: 90 }] },
    ],
  },
];

export const presupuestoNuevoDemo = presupuestosDemo[0];

export const getPresupuestoDemo = (numero) => (
  presupuestosDemo.find((presupuesto) => presupuesto.numero === numero)
);
