import React, { useState, useRef } from 'react';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import TaskIcon from '@mui/icons-material/Task';

const AsientoFileInput = ({datosCarga}) => {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleDelete = () => {
    setSelectedFile(null);

    // Resetear el valor del input para permitir seleccionar el mismo archivo después de eliminarlo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    // Aquí puedes realizar la lógica de carga del archivo, como enviarlo a un servidor.
    // Por ahora, solo mostraremos la información del archivo seleccionado en la consola.
    if (selectedFile) {
      // Construye un objeto FormData con el archivo y el registro
      const formData = new FormData();
      formData.append('archivoExcel', selectedFile);
      formData.append('datosCarga', JSON.stringify(datosCarga));
      console.log(datosCarga);

      // Obtén el nombre del archivo
      const fileName = selectedFile.name;
          
      // Obtén la extensión del archivo
      const fileExtension = fileName.split('.').pop().toLowerCase();

      // Aquí puedes agregar la lógica para enviar el archivo a un API.
      try {
        // Realiza la llamada a la API
        if (datosCarga.id_libro = '014'){
          if (fileExtension === 'xls') {
            await fetch(`${back_host}/asientoexcelventas`, {
              method: 'POST',
              body: formData,
            });
          }
          if (fileExtension === 'txt') {
            await fetch(`${back_host}/asientosireventas`, {
              method: 'POST',
              body: formData,
            });
          }
        }

        if (datosCarga.id_libro = '008'){
          if (fileExtension === 'xls') {
            await fetch(`${back_host}/asientoexcelcompras`, {
              method: 'POST',
              body: formData,
            });
          }
          if (fileExtension === 'txt') {
            await fetch(`${back_host}/asientosirecompras`, {
              method: 'POST',
              body: formData,
            });
          }
        }
      } catch (error) {
        // Manejo de errores
        console.error('Error al enviar la solicitud a la API:', error);
      }
    } else {
      console.log('No se ha seleccionado ningún archivo.');
    }
  };

  const handleClick = () => {
    // Abre el cuadro de diálogo del selector de archivos al hacer clic en el área del recuadro punteado
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Paper
      elevation={3}
      style={{
        padding: '0px',
        border: '1px dashed #aaa',
        position: 'relative',
        textAlign: 'left',
        backgroundColor:'#1e272e',
        cursor: 'pointer', // Cambia el cursor al pasar sobre el área del recuadro
        height:'33px'
      }}
      onClick={handleClick}
    >
      <input
        type="file"
        name="archivoExcel"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt, .xlsx"
        style={{ display: 'none' }}
      />
      {selectedFile ? (
        <div>
          <IconButton color="warning" 
                      onClick={(e) => {
                        e.stopPropagation(); // Detiene la propagación del evento
                        handleDelete();
                      }}                      
          >
            <DeleteIcon fontSize="medium" />
          </IconButton>


          <Typography variant="caption" color="white">
            {selectedFile.name}
          </Typography>
          
          <IconButton color="primary" 
                      onClick={(e) => {
                        e.stopPropagation(); // Detiene la propagación del evento
                        handleUpload();
                      }}
          >
            <SystemUpdateAltIcon fontSize="medium" />
          </IconButton>
        </div>
      ) : (
        <div>
          <IconButton color="black" 
          >
            <TaskIcon fontSize="medium" />
          </IconButton>

          <Typography variant="caption" color="white">
            Importar 
          </Typography>
        </div>
      )}
    </Paper>
  );
};

export default AsientoFileInput;
