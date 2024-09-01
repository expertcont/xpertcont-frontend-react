import React, { useState, useRef, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import TaskIcon from '@mui/icons-material/Task';
import Swal from 'sweetalert2';
import Tooltip from '@mui/material/Tooltip';

const AsientoFileProducto = ({datosCarga,onActualizaImportaOK}) => {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState(null);  //(xlsx) or (txt)
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    
    // Obtén el nombre del archivo, para actualizar tipo y modificar color y mensaje de importacion
    const fileName = file.name;
    // Obtén la extensión del archivo
    const fileExtension = fileName.split('.').pop().toLowerCase();
    //setSelectedFileType(fileExtension);
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      setSelectedFile(file);
      setSelectedFileType(fileExtension);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Formato de archivo no válido',
        text: 'Solo se permiten archivos xlsx o xls.',
      });
      handleDelete();
      return;
    }

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
      console.log(datosCarga);
      // Construye un objeto FormData con el archivo y el registro
      const formData = new FormData();
      formData.append('archivoExcel', selectedFile);
      formData.append('datosCarga', JSON.stringify(datosCarga));

      // Aquí puedes agregar la lógica para enviar el archivo a un API.
      try {
        // Realiza la llamada a la API
        console.log('filtramos excel productos');
        await fetch(`${back_host}/ad_productoexcel`, {
            method: 'POST',
            body: formData,
        });

        onActualizaImportaOK(); //activamos envento en formulario principal
      } 
      catch (error) {
        // Manejo de errores
        console.error('Error al enviar la solicitud a la API:', error);
      }
    } 
    else {
      console.log('No se ha seleccionado ningún archivo.');
    }

  };

  const handleClick = () => {
    // Abre el cuadro de diálogo del selector de archivos al hacer clic en el área del recuadro punteado
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  useEffect( ()=> {
    // Realiza acciones cuando isAuthenticated cambia
    //console.log('selectedFileType:', selectedFileType);
  },[selectedFileType]) //Aumentamos IsAuthenticated y user

  return (
    <Paper
      elevation={3}
      style={{
        padding: '3px',
        border: '1px dashed #aaa',
        position: 'relative',
        textAlign: 'left',
        backgroundColor:'#1e272e',
        cursor: 'pointer', // Cambia el cursor al pasar sobre el área del recuadro
        height:'30px'
      }}
      onClick={handleClick}
    >
      <input
        type="file"
        name="archivoExcel"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt, .xlsx, .xls"
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
          
          <Tooltip title='Importar Productos'>
            <IconButton color={selectedFileType==='xlsx' ? ('success'):('primary')} 
                        onClick={(e) => {
                          e.stopPropagation(); // Detiene la propagación del evento
                          handleUpload();
                        }}
            > 
              <SystemUpdateAltIcon fontSize="medium" />
            </IconButton>
          </Tooltip>

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

export default AsientoFileProducto;
