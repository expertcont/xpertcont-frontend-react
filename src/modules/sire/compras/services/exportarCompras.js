import * as XLSX from "xlsx";
import { etiquetas } from "../utils/comprasView";

export const exportarCompras = (rows, tab, documentoId, periodo) => {
    const libro = XLSX.utils.book_new();
    const exportRows = rows.map(r => ({ Fecha: r.fecha_emision, Tipo: r.tipo_comprobante, Serie: r.serie, Numero: r.numero, Documento: r.documento_proveedor, Proveedor: r.proveedor, Moneda: r.moneda,
      ...((tab === 5 || tab === 6) ? { Estado: r.estado, Motivo: r.motivo, Origen: r.origen, 'Periodo origen': r.periodo_origen, 'Periodo destino': r.periodo_destino } : {}),
      ...((tab === 2 || tab === 3) ? { Resultado: etiquetas[r.resultado], 'Total SUNAT': r.total_sunat, 'Total sistema': r.total_sistema, Diferencias: r.diferencias.join(', '), 'Cantidad SUNAT': r.cantidad_sunat, 'Cantidad sistema': r.cantidad_sistema } : { 'Base A': Number(r.base001), 'IGV A': Number(r.igv001), 'Base B': Number(r.base002), 'IGV B': Number(r.igv002), 'Base C': Number(r.base003), 'IGV C': Number(r.igv003), 'No gravadas': Number(r.base004), ISC: Number(r.isc || 0), ICBP: Number(r.icbp || 0), Otros: Number(r.otros || 0), Total: Number(r.total) }),
    }));
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(exportRows), 'Compras');
    XLSX.writeFile(libro, `sire_compras_${tab === 5 ? "por_declarar_" : tab === 6 ? "revision_" : ""}${documentoId}_${periodo}.xlsx`);
};
