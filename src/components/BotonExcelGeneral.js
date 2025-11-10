import React, { useState } from "react";
import { Spinner } from "reactstrap";
import * as XLSX from "xlsx";
import { Button,IconButton } from "@mui/material";
import ViewCompactIcon from '@mui/icons-material/ViewCompact';
import Tooltip from '@mui/material/Tooltip';

const BotonExcelGeneral = ({ 
  datos, 
  nombreArchivo = "Reporte",
  tituloReporte = "Reporte",
  columnasConfig = null, // Opcional: para personalizar nombres y orden
  columnasNumericas = [], // Array con las keys de columnas numéricas: ['r_monto_total', 'r_tc']
  columnasExcluidas = [], // Array con las keys de columnas a excluir: ['id', 'password', 'token']
  infoAdicional = "expertcont.pe || ovivasar@gmail.com || whatsapp: +51 903041110"
}) => {
  const [loading, setLoading] = useState(false);

  // Función para generar encabezados automáticamente
  const generarEncabezados = (datos) => {
    if (!datos || datos.length === 0) return [];
    
    const primeraFila = datos[0];
    
    // Si hay configuración personalizada, usarla
    if (columnasConfig) {
      return columnasConfig
        .filter(col => !columnasExcluidas.includes(col.key)) // Aplicar exclusiones
        .map(col => ({
          key: col.key,
          nombre: col.nombre || col.key,
          formato: col.formato || null
        }));
    }
    
    // Si no, generar automáticamente desde las keys del objeto
    return Object.keys(primeraFila)
      .filter(key => !columnasExcluidas.includes(key)) // Aplicar exclusiones
      .map(key => ({
        key: key,
        nombre: formatearNombreColumna(key),
        formato: null
      }));
  };

  // Función para formatear nombres de columnas automáticamente
  const formatearNombreColumna = (key) => {
    // Eliminar prefijos comunes como "r_", "c_", etc.
    let nombre = key.replace(/^[a-z]_/i, '');
    
    // Reemplazar guiones bajos por espacios
    nombre = nombre.replace(/_/g, ' ');
    
    // Capitalizar primera letra de cada palabra
    nombre = nombre.split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
      .join(' ');
    
    return nombre;
  };

  // Función para aplicar formato a valores
  const aplicarFormato = (valor, formato, esColumnaNumeric = false) => {
    if (valor === null || valor === undefined) return '';
    
    // Si está marcada como columna numérica, convertir a número
    if (esColumnaNumeric) {
      const numero = parseFloat(valor);
      return isNaN(numero) ? 0 : numero;
    }
    
    if (formato === 'numero' || formato === 'moneda') {
      return parseFloat(valor) || 0;
    }
    
    if (formato === 'fecha') {
      // Intentar parsear fecha si es string
      if (typeof valor === 'string' && valor.includes('-')) {
        return valor;
      }
    }
    
    return valor;
  };

  const handleDownload = () => {
    if (!datos || datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    setLoading(true);

    const titulo = [{ A: tituloReporte }, {}];
    const encabezados = generarEncabezados(datos);
    
    // Crear objeto de encabezados
    const filaEncabezados = {};
    encabezados.forEach((col, index) => {
      const letra = String.fromCharCode(65 + index); // A, B, C, etc.
      filaEncabezados[letra] = col.nombre;
    });

    let tabla = [filaEncabezados];

    // Procesar datos
    datos.forEach((item) => {
      const fila = {};
      encabezados.forEach((col, index) => {
        const letra = String.fromCharCode(65 + index);
        const esNumerico = columnasNumericas.includes(col.key);
        fila[letra] = aplicarFormato(item[col.key], col.formato, esNumerico);
      });
      tabla.push(fila);
    });

    const informacionAdicional = { A: infoAdicional };
    const dataFinal = [...titulo, ...tabla, informacionAdicional];

    setTimeout(() => {
      creandoArchivoEstilizado(dataFinal, nombreArchivo);
      setLoading(false);
    }, 1000);
  };

  const creandoArchivoEstilizado = (dataFinal, nombre) => {
    const workbook = XLSX.utils.book_new();
    const worksheetData = dataFinal.map((item) => Object.values(item));
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Aplicar formato numérico a las columnas especificadas
    const encabezados = generarEncabezados(datos);
    const filaInicioDatos = 3; // Fila donde empiezan los datos (después de título, vacía y encabezados)
    
    // Crear índice de columnas numéricas
    const columnasNumericasIndices = [];
    encabezados.forEach((col, index) => {
      if (columnasNumericas.includes(col.key)) {
        columnasNumericasIndices.push(index);
      }
    });

    // Aplicar formato numérico a las celdas
    const rangoColumnas = XLSX.utils.decode_range(worksheet['!ref']);
    for (let row = filaInicioDatos; row <= rangoColumnas.e.r - 1; row++) { // -1 para no formatear la última fila de info adicional
      columnasNumericasIndices.forEach(colIndex => {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: colIndex });
        const cell = worksheet[cellAddress];
        
        if (cell && typeof cell.v === 'number') {
          cell.t = 'n'; // Tipo número
          cell.z = '#,##0.00'; // Formato con 2 decimales
        }
      });
    }

    const estiloFila = {
      fill: { fgColor: { rgb: "0000FF" } },
      font: { color: { rgb: "FFFFFF" } },
    };

    // Aplicar estilo a la fila de encabezados (fila 3, después del título)
    const filaEncabezados = 2; // Índice 2 porque hay título y línea vacía
    
    for (let col = rangoColumnas.s.c; col <= rangoColumnas.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: filaEncabezados, c: col });
      const cell = worksheet[cellAddress];

      if (cell) {
        cell.s = estiloFila;
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { 
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nombre}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {!loading ? (
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

export default BotonExcelGeneral;