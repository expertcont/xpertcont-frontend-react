export const normalizarPeriodo = (v = "") => {
  const match = String(v).match(/^(\d{4})-?(0[1-9]|1[0-2])$/);
  return match ? `${match[1]}-${match[2]}` : "";
};
export const vacio = { ticket: "", fecha_generacion: null, propuesta: null, sistema: [], comparacion: [] };
export const etiquetas = { COINCIDE: "Coincide", DIFERENCIA: "Diferencia", SOLO_SUNAT: "Solo SUNAT", SOLO_SISTEMA: "Solo sistema", DUPLICADO: "Duplicado" };
export const money = (v) => v === null || v === undefined ? "—" : Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fechaTicket = (v) => v ? new Date(v).toLocaleString("es-PE", { timeZone: "America/Lima" }) : "Fecha no registrada";

export const columnasCompras = (tab) => {
  const columns = [
    ...(tab === 2 ? [{ name: "Resultado", selector: r => etiquetas[r.resultado], sortable: true, width: "140px" }] : []),
    { name: "Fecha", selector: r => r.fecha_emision, sortable: true, width: "112px" },
    { name: "Comprobante", selector: r => `${r.tipo_comprobante}-${r.serie}-${r.numero}`, sortable: true, minWidth: "170px" },
    { name: "Documento proveedor", selector: r => r.documento_proveedor, sortable: true, width: "165px" },
    { name: "Proveedor", selector: r => r.proveedor, sortable: true, minWidth: "240px", wrap: true },
    { name: "Moneda", selector: r => r.moneda, width: "90px" },
    ...(tab === 2 ? [
      { name: "Total SUNAT", selector: r => r.total_sunat, cell: r => money(r.total_sunat), right: true, width: "130px" },
      { name: "Total sistema", selector: r => r.total_sistema, cell: r => money(r.total_sistema), right: true, width: "130px" },
      { name: "Detalle", selector: r => r.resultado === "DUPLICADO" ? `${r.cantidad_sunat} SUNAT / ${r.cantidad_sistema} sistema` : r.diferencias.join(", "), wrap: true, minWidth: "180px" },
    ] : [
      { name: "Base gravada", selector: r => Number(r.base001 || 0) + Number(r.base002 || 0) + Number(r.base003 || 0), cell: r => money(Number(r.base001 || 0) + Number(r.base002 || 0) + Number(r.base003 || 0)), right: true, width: "130px" },
      { name: "IGV", selector: r => Number(r.igv001 || 0) + Number(r.igv002 || 0) + Number(r.igv003 || 0), cell: r => money(Number(r.igv001 || 0) + Number(r.igv002 || 0) + Number(r.igv003 || 0)), right: true, width: "115px" },
      { name: "Total", selector: r => Number(r.total), cell: r => money(r.total), right: true, width: "125px" },
    ]),
  ];
  return columns;
};

export const filtrarCompras = (rows, { dia = '*', busqueda = '', resultado = '' } = {}) => {
  const texto = busqueda.trim().toLowerCase();
  return (rows || []).filter(row =>
    (dia === '*' || String(row.fecha_emision || '').slice(8, 10) === String(dia).padStart(2, '0')) &&
    (!resultado || row.resultado === resultado) &&
    (!texto || [row.motivo, row.estado, row.periodo_destino, row.proveedor, row.documento_proveedor, row.tipo_comprobante, row.serie, row.numero,
      `${row.tipo_comprobante}-${row.serie}-${row.numero}`, etiquetas[row.resultado], (row.diferencias || []).join(' ')]
      .some(value => String(value || '').toLowerCase().includes(texto)))
  );
};
