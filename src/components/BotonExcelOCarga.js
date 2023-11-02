import React, { useState } from "react";
import { Spinner } from "reactstrap";
import * as XLSX from "xlsx";
import { Button } from "@mui/material";

const BotonExcelOCarga = ({ registrosdet }) => {
  const [loading, setLoading] = useState(false);

  const titulo = [{ A: "Reporte de Ordenes Carga - Ejecucion" }, {}];

  const informacionAdicional = {
    A: "Doc Negocios Web  >>>  email:ovivasar@gmail.com  whathsapp +51 954807980",
  };

  const longitudes = [12, 10, 12, 10, 15, 15, 12, 15];

  const handleDownload = () => {
    setLoading(true);

    let tabla = [
      {
        A: "Zona",
        B: "Fecha",
        C: "Pedido",
        D: "Vendedor",
        E: "Codigo Cliente",
        F: "Cliente",
        G: "Ruc",
        H: "Razon Social",
        I: "P. Llegada",
        J: "Producto",
        
        K: "Cantidad",
        
        L: "Peso Guia01",
        M: "Guia01",
        N: "Peso Guia02",
        O: "Guia02",     
        P: "Peso Guia03", 
        Q: "Guia03",

        R: "Estado",
        S: "Operacion",
        T: "Sacos Real",
        U: "Lote Asig.",
        V: "Lote Proced.",
        W: "Ticket",
        X: "Sacos Ticket",
        Y: "Peso Ticket",

        Z: "Monto S/ Guia01",
        AA: "Monto S/ Guia02",
        AB: "Monto S/ Guia03",

        AC: "Hora Ini",
        AD: "Hora Fin",
        AE: "Estibadores",
        AF: "Observaciones",
        AG: "RH",
        
        AH: "Fecha Venta",  //new
        AI: "Precio Unit",  //new
        AJ: "Moneda",       //new
        AK: "IGV%",         //new
      },
    ];

    const newData = registrosdet.map((item) => ({
        ...item,
        cantidad: parseFloat(item.cantidad),
        e_peso01: parseFloat(item.e_peso01),
        e_peso02: parseFloat(item.e_peso02),
        e_peso03: parseFloat(item.e_peso03),
        sacos_real: parseFloat(item.sacos_real),
        sacos_ticket: parseFloat(item.sacos_ticket),
        peso_ticket: parseFloat(item.peso_ticket),
        e_monto01: parseFloat(item.e_monto01),
        e_monto02: parseFloat(item.e_monto02),
        e_monto03: parseFloat(item.e_monto03),
        precio_unitario: parseFloat(item.precio_unitario),  //new
        porc_igv: parseFloat(item.porc_igv),                //new
      }));
  
      newData.forEach((item) => {
      tabla.push({
        A: item.zona_venta,
        B: item.fecha,
        C: item.pedido,
        D: item.vendedor,
        E: item.codigo, //codigo_cliente porque les gustara a alsa
        F: item.ref_razon_social, //nombre cliente
        G: item.fact_documento_id, //datos fact (ruc)
        H: item.fact_razon_social, //datos fact (razon sunat)
        I: item.zona_entrega,
        J: item.descripcion,
        K: item.cantidad,
        
        L: item.e_peso01,
        M: item.guia01,
        
        N: item.e_peso02,
        O: item.guia02,
        
        P: item.e_peso03,
        Q: item.guia03,

        R: item.estado,
        S: item.operacion,
        T: item.sacos_real,
        U: item.lote_asignado,
        V: item.lote_procedencia,
        W: item.ticket,
        X: item.sacos_ticket,
        Y: item.peso_ticket,

        Z: item.e_monto01,
        AA: item.e_monto02,
        AB: item.e_monto03,

        AC: item.e_hora_ini,
        AD: item.e_hora_fin,
        AE: item.e_estibadores,
        AF: item.e_observacion,
        AG: item.e_rh,
        
        AH: item.fecha_venta,     //new
        AI: item.precio_unitario, //new
        AJ: item.moneda,          //new
        AK: item.porc_igv,        //new
      });
    });

    const dataFinal = [...titulo, ...tabla, informacionAdicional];

    setTimeout(() => {
      //creandoArchivo(dataFinal);
      creandoArchivoEstilizado(dataFinal);
      setLoading(false);
    }, 1000);
  };

  const creandoArchivo = (dataFinal) => {
    const libro = XLSX.utils.book_new();

    const hoja = XLSX.utils.json_to_sheet(dataFinal, { skipHeader: true });

    hoja["!merges"] = [
      XLSX.utils.decode_range("A1:G1"),
      XLSX.utils.decode_range("A2:G2"),
    ];

    let propiedades = [];

    longitudes.forEach((col) => {
      propiedades.push({
        width: col,
      });
    });

    hoja["!cols"] = propiedades;

    XLSX.utils.book_append_sheet(libro, hoja, "Productos");

    XLSX.writeFile(libro, "ProductosEstilizado.xlsx");
  };

  const creandoArchivoEstilizado = (dataFinal) => {
    const workbook = XLSX.utils.book_new();
    const worksheetData = dataFinal.map((item) => Object.values(item));
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
    const estiloFila = {
      fill: { fgColor: { rgb: "0000FF" } }, // Color de fondo en formato RGB (Azul)
      font: { color: { rgb: "FFFFFF" } }, // Color de texto en formato RGB (Blanco)
    };
  
    // Aplicar el estilo a la primera fila
    const primeraFila = XLSX.utils.decode_range("A1:Z1");
    for (let col = primeraFila.s.c; col <= primeraFila.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
  
      if (cell) {
        cell.s = estiloFila;
      }
    }
  
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
  
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ProductosEstilizado.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };
    
  
  return (
    <>
      {!loading ? (

        <Button variant='contained' 
        fullWidth
        color='success' 
        sx={{display:'block',
        margin:'.0rem 0'}}
        onClick={handleDownload}>        
        EXCEL
        </Button>
      ) : (
        <Button color="success" disabled>
          <Spinner size="sm">Loading...</Spinner>
          <span> Generando...</span>
        </Button>
      )}
    </>
  );
};

export default BotonExcelOCarga;
