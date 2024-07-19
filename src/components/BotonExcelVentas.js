import React, { useState } from "react";
import { Spinner } from "reactstrap";
import * as XLSX from "xlsx";
import { Button,IconButton } from "@mui/material";
import ViewCompactIcon from '@mui/icons-material/ViewCompact';
import Tooltip from '@mui/material/Tooltip';
//import ExcelJS from "exceljs"; // Importa la biblioteca exceljs en lugar: Caso Doc Contable

const BotonExcelVentas = ({ registrosdet }) => {
  const [loading, setLoading] = useState(false);

  const titulo = [{ A: "Reporte" }, {}];

  const informacionAdicional = {
    A: "Doc Negocios Web  >>>  email:ovivasar@gmail.com  whathsapp +51 954807980",
  };

  const longitudes = [12, 10, 12, 10, 15, 15, 12, 15];

  const handleDownload = () => {
    setLoading(true);

    let tabla = [
      {
        A: "Origen",
        B: "Fecha",
        C: "Comprobante",
        D: "Id",
        E: "Documento",
        F: "Razon Social",
        G: "Total",
        H: "Moneda",
        I: "TC",

      },
    ];

    const newData = registrosdet.map((item) => ({
        ...item,
        r_monto_total: parseFloat(item.r_monto_total),
        r_tc: parseFloat(item.r_tc),
      }));
  
      newData.forEach((item) => {
      tabla.push({
        A: item.resultado,
        B: item.r_fecemi,
        C: item.comprobante,
        D: item.r_id_doc,
        E: item.r_documento_id,
        F: item.r_razon_social,
        G: item.r_monto_total,
        H: item.r_moneda,
        I: item.r_tc,
      });
    });

    const dataFinal = [...titulo, ...tabla, informacionAdicional];

    setTimeout(() => {
      //creandoArchivo(dataFinal);
      creandoArchivoEstilizado(dataFinal);
      setLoading(false);
    }, 1000);
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
    link.download = "Reporteee.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };
    
  
  return (
    <>
      {!loading ? (

        //<Button variant='contained' 
        //color='success' 
        //fullWidth
        //sx={{display:'block',
        //margin:'.0rem 0'}}
        //onClick={handleDownload}>        
        //</>EXPORT
        //</Button>
      <Tooltip title='EXPORTAR HOJA XLS' >
        <IconButton color="success" 
                        //style={{ padding: '0px'}}
                        style={{ padding: '0px', color: 'green' }}
                        onClick={() => {
                              handleDownload();
                        }}
        >
              <ViewCompactIcon style={{ fontSize: '40px' }}/>
        </IconButton>
      </Tooltip>
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
