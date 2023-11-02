import React, { useState } from "react";
import { Spinner } from "reactstrap";
import * as XLSX from "xlsx";
import { Button } from "@mui/material";
import ExcelJS from "exceljs"; // Importa la biblioteca exceljs en lugar: Caso Doc Contable

const BotonExcelVentas = ({ registrosdet }) => {
  const [loading, setLoading] = useState(false);

  const titulo = [{ A: "Reporte de Ventas" }, {}];

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
        K: "Precio U.",
        L: "Moneda",
        M: "%IGV",
        N: "Cantidad",
        O: "Peso Guia",     //CONSULTA ADD
        P: "Guia Remision", //CONSULTA ADD
        Q: "Estado",
        R: "F/Carga",
        S: "Ruc Transp.",
        T: "Transp.",
        U: "Chofer",
        V: "Celular",
      },
    ];

    const newData = registrosdet.map((item) => ({
        ...item,
        cantidad: parseFloat(item.cantidad),
        precio_unitario: parseFloat(item.precio_unitario),
        porc_igv: parseFloat(item.porc_igv),
      }));
  
      newData.forEach((item) => {
      tabla.push({
        A: item.zona_venta,
        B: item.comprobante_original_fecemi,
        C: item.pedido,
        D: item.vendedor,
        E: item.codigo, //codigo_cliente porque les gustara a alsa
        F: item.razon_social,
        G: item.ref_documento_id,
        H: item.ref_razon_social,
        I: item.zona_entrega,
        J: item.descripcion,
        K: item.precio_unitario,
        L: item.moneda,
        M: item.porc_igv,
        N: item.cantidad,
        //O: item.peso_guia,
        //P: item.guia,
        Q: item.estado,
        R: item.tr_fecha_carga,
        S: item.tr_ruc,
        T: item.tr_razon_social,
        U: item.tr_chofer,
        V: item.tr_celular,
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
        color='success' 
        fullWidth
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

export default BotonExcelVentas;
