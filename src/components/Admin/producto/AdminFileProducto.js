import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import TaskIcon from '@mui/icons-material/Task';
import Swal from 'sweetalert2';
import Tooltip from '@mui/material/Tooltip';
import palette from '../../../theme/palette';

const uploadBoxSx = {
  height: 40,
  px: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  borderRadius: 2,
  border: '1px dashed rgba(139,154,165,0.22)',
  backgroundColor: 'rgba(139,154,165,0.06)',
  color: palette.text,
  cursor: 'pointer',
  transition: 'all .18s ease',
  '&:hover': {
    borderColor: 'rgba(125,219,211,0.32)',
    backgroundColor: 'rgba(42,161,152,0.08)',
  },
};

const uploadIconSx = {
  width: 30,
  height: 30,
  color: 'rgba(125,219,211,0.88)',
  backgroundColor: 'transparent',
  border: 0,
  '&:hover': {
    color: '#bff5ef',
    backgroundColor: 'rgba(42,161,152,0.10)',
  },
};

const dangerIconSx = {
  ...uploadIconSx,
  color: 'rgba(255,177,153,0.86)',
  backgroundColor: 'transparent',
  border: 0,
  '&:hover': {
    color: '#ffc6b1',
    backgroundColor: 'rgba(255,159,122,0.10)',
  },
};

// Carga Excel reutilizable: recibe el endpoint destino para importar productos o rangos de precios.
const AdminFileProducto = ({ datosCarga, onActualizaImportaOK, urlApiDestino }) => {
  const back_host = process.env.BACK_HOST || 'https://xpertcont-backend-js-production-50e6.up.railway.app';
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const fileInputRef = useRef(null);

  const handleDelete = () => {
    setSelectedFile(null);
    setSelectedFileType(null);

    // Permite volver a seleccionar el mismo archivo luego de limpiarlo.
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      setSelectedFile(file);
      setSelectedFileType(fileExtension);
      return;
    }

    Swal.fire({
      icon: 'error',
      title: 'Formato de archivo no valido',
      text: 'Solo se permiten archivos xlsx o xls.',
    });
    handleDelete();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      console.log('No se ha seleccionado ningun archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('archivoExcel', selectedFile);
    formData.append('datosCarga', JSON.stringify(datosCarga));

    try {
      await fetch(`${back_host}${urlApiDestino}`, {
        method: 'POST',
        body: formData,
      });

      onActualizaImportaOK();
    } catch (error) {
      console.error('Error al enviar la solicitud a la API:', error);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={uploadBoxSx} onClick={handleClick}>
      <input
        type="file"
        name="archivoExcel"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
      />

      {selectedFile ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
            <IconButton
              sx={dangerIconSx}
              onClick={(event) => {
                event.stopPropagation();
                handleDelete();
              }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>

            <Typography
              variant="caption"
              title={selectedFile.name}
              sx={{ color: palette.text, fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {selectedFile.name}
            </Typography>
          </Box>

          <Tooltip title={selectedFileType === 'xlsx' ? 'Importar XLSX' : 'Importar XLS'}>
            <IconButton
              sx={uploadIconSx}
              onClick={(event) => {
                event.stopPropagation();
                handleUpload();
              }}
            >
              <SystemUpdateAltIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
          <IconButton sx={uploadIconSx}>
            <TaskIcon sx={{ fontSize: 16 }} />
          </IconButton>

          <Typography variant="caption" sx={{ color: palette.muted, fontSize: '12.5px', fontWeight: 700 }}>
            Importar Excel
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AdminFileProducto;
