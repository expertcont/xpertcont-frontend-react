import React, { useState, useRef } from 'react';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
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
      //console.log(formData);
      /*const formDataObj = {};
      for (const [key, value] of formData) {
        formDataObj[key] = value;
      }
      console.log('Contenido de formData:', formDataObj);*/

      // Aquí puedes agregar la lógica para enviar el archivo a un API.
      try {
        // Realiza la llamada a la API
        if (datosCarga.id_libro = '014'){
          await fetch(`${back_host}/asientoexcelventas`, {
            method: 'POST',
            body: formData,
          });
        }
        if (datosCarga.id_libro = '008'){
          await fetch(`${back_host}/asientoexcelcompras`, {
            method: 'POST',
            body: formData,
          });
        }
        /*if (res.ok) {
          // Maneja la respuesta de la API, si es necesario
          const data = await res.json();
          console.log('Respuesta de la API:', data);
        } else {
          // Maneja el caso en que la respuesta no sea exitosa
          console.error('Error al enviar la solicitud a la API:', res.status, res.statusText);
        }*/
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
        border: '2px dashed #aaa',
        position: 'relative',
        textAlign: 'center',
        backgroundColor:'skyblue',
        cursor: 'pointer', // Cambia el cursor al pasar sobre el área del recuadro
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

          <Typography variant="caption" color="textSecondary">
            {selectedFile.name}
          </Typography>
          <IconButton color="success" 
          >
            <TaskIcon fontSize="medium" />
          </IconButton>
          <IconButton color="success" 
                      onClick={(e) => {
                        e.stopPropagation(); // Detiene la propagación del evento
                        handleUpload();
                      }}
          >
            <SendIcon fontSize="medium" />
          </IconButton>
        </div>
      ) : (
        <div>
          <Typography variant="caption" color="textSecondary">
            Haz click para seleccionar un archivo (Carga Masiva)
          </Typography>
          <IconButton color="black" 
          >
            <TaskIcon fontSize="medium" />
          </IconButton>
        </div>
      )}
    </Paper>
  );
};

export default AsientoFileInput;
