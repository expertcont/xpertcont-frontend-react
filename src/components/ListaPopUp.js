import React, { useState, useEffect, useRef } from 'react';
import { TextField, Dialog, DialogTitle, DialogContent, useMediaQuery } from '@mui/material';
import Datatable, { createTheme } from 'react-data-table-component';

// ✅ Componente reutilizable de listado en ventana emergente
const ListaPopUp = ({
  registroPopUp,       // Array con la lista de productos inicial
  gruposPopUp,         // Array con la lista de grupos (ej. colores), opcional
  showModal,           // Estado: si el modal está abierto o cerrado
  setShowModal,        // Función para actualizar el estado del modal
  registro,            // Registro actual donde se guardará la selección
  setRegistro,         // Función para actualizar el registro
  idCodigoKey,         // Nombre de la propiedad donde se guarda el código en el registro
  descripcionKey,      // Nombre de la propiedad donde se guarda la descripción en el registro
  auxiliarKey          // Nombre de la propiedad auxiliar (ej. si tiene "zku")
}) => {
  // 🔎 Estado del buscador
  const [searchText, setSearchText] = useState('');
  // 🎨 Estado para manejar si estamos en la segunda lista (grupos/colores)
  const [seleccionProducto, setSeleccionProducto] = useState(null);

  // Referencia para enfocar el campo de búsqueda
  const textFieldRef = useRef(null);
  // Detectar pantallas pequeñas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  // ✅ Tema personalizado de la tabla
  createTheme(
    'solarized',
    {
      text: { primary: '#ffffff', secondary: '#2aa198' },
      background: { default: '#1e272e' },
      context: { background: '#1e272e', text: '#FFFFFF' },
      divider: { default: '#073642' },
      action: { button: 'rgba(0,0,0,.54)', hover: 'rgba(0,0,0,.08)', disabled: 'rgba(0,0,0,.12)' }
    },
    'dark'
  );

  // ✅ Columnas de la tabla
  const columnas = [
    { name: 'CODIGO', selector: row => row.codigo, sortable: true, width: '120px' },
    {
      name: 'DESCRIPCION',
      selector: row => row.descripcion,
      sortable: true,
      width: isSmallScreen ? '250px' : '450px'
    },
    { name: 'AUX', selector: row => row.auxiliar, sortable: true, width: '60px' }
  ];

  // ✅ Actualiza el buscador
  const handleSearchTextChange = event => {
    setSearchText(event.target.value.replace('+', '').replace('-', ''));
    setRegistro({ ...registro, [idCodigoKey]: event.target.value.replace('+', '').replace('-', '') });
  };

  // ✅ Selección de producto de la primera lista
  const handleProductoSelect = (codigo, descripcion, auxiliar) => {
    // Si el producto tiene "zku" → pasar a la segunda lista (grupos/colores)
    if (auxiliar && auxiliar.toLowerCase().includes('zku')) {
      setSeleccionProducto({ codigo, descripcion, auxiliar });
      setSearchText('');
    } else {
      // Caso normal: guardar producto directo
      guardarSeleccion(codigo, descripcion, auxiliar);
    }
  };

  // ✅ Selección de grupo/color
  const handleGrupoSelect = (codigoGrupo, descripcionGrupo) => {
    if (!seleccionProducto) return;

    // Concatenar producto + grupo
    const codigoFinal = `${seleccionProducto.codigo}-${codigoGrupo}`;
    const descripcionFinal = `${seleccionProducto.descripcion} ${descripcionGrupo}`;

    guardarSeleccion(codigoFinal, descripcionFinal, seleccionProducto.auxiliar);
  };

  // ✅ Guarda el valor en el registro y cierra modal
  const guardarSeleccion = (codigo, descripcion, auxiliar) => {
    let updatedRegistro;

    if (auxiliarKey !== undefined && auxiliarKey !== null) {
      updatedRegistro = {
        ...registro,
        [idCodigoKey]: codigo,
        [descripcionKey]: descripcion,
        [auxiliarKey]: auxiliar
      };
    } else {
      updatedRegistro = {
        ...registro,
        [idCodigoKey]: codigo,
        [descripcionKey]: descripcion
      };
    }

    setRegistro(updatedRegistro);
    setShowModal(false);
    setSeleccionProducto(null); // Reset para la próxima vez
  };

  // ✅ Manejo de Enter o tecla "-" para cerrar
  const handleKeyDown = event => {
    switch (event.key) {
      case '-':
        setShowModal(false);
        break;
      case 'Enter':
        if (event.target.value !== '') {
          // Si estamos en productos
          if (!seleccionProducto) {
            handleProductoSelect(filteredPopUp[0].codigo, filteredPopUp[0].descripcion, filteredPopUp[0].auxiliar);
          } else {
            // Si estamos en grupos
            handleGrupoSelect(gruposPopUp[0].codigo, gruposPopUp[0].descripcion);
          }
        }
        break;
      default:
        break;
    }
  };

  // ✅ Filtrado dinámico de productos o grupos
  const filteredPopUp = !seleccionProducto
    ? registroPopUp.filter(c => `${c.codigo} ${c.descripcion}`.toLowerCase().includes(searchText.toLowerCase()))
    : gruposPopUp.filter(c => `${c.codigo} ${c.descripcion}`.toLowerCase().includes(searchText.toLowerCase()));

  // ✅ Enfocar el buscador cuando abre modal
  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        if (textFieldRef.current) {
          textFieldRef.current.focus();
        }
      }, 0);
    }
  }, [showModal, seleccionProducto]);

  return (
    <Dialog
      open={showModal}
      onClose={() => setShowModal(false)}
      maxWidth="md"
      disableScrollLock
      PaperProps={{
        style: {
          top: isSmallScreen ? '-10vh' : '0vh',
          left: isSmallScreen ? '0%' : '0%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '10vh',
          background: '#1e272e',
          color: 'white',
          width: isSmallScreen ? '70%' : '60%'
        }
      }}
    >
      <DialogTitle>
        {seleccionProducto ? `Color: ${seleccionProducto.descripcion}` : 'Listado de Productos'}
      </DialogTitle>

      <TextField
        variant="standard"
        size="small"
        sx={{ mt: -1 }}
        inputRef={textFieldRef}
        value={searchText}
        onChange={handleSearchTextChange}
        onKeyDown={handleKeyDown}
        inputProps={{ style: { color: 'white', width: 140 } }}
        InputLabelProps={{ style: { color: 'white' } }}
      />

      <DialogContent>
        <Datatable
          columns={columnas}
          data={filteredPopUp}
          dense
          theme="solarized"
          highlightOnHover
          pointerOnHover
          pagination
          onRowClicked={row =>
            !seleccionProducto
              ? handleProductoSelect(row.codigo, row.descripcion, row.auxiliar)
              : handleGrupoSelect(row.codigo, row.descripcion)
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export default ListaPopUp;


/*import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { TextField, Dialog, DialogTitle, DialogContent, useMediaQuery, List, ListItem, ListItemText } from '@mui/material';
import Datatable, {createTheme} from 'react-data-table-component';

const ListaPopUp = ({ registroPopUp, showModal, setShowModal, registro,setRegistro, idCodigoKey, descripcionKey,auxiliarKey }) => {
    const [searchText, setSearchText] = useState('');
    const textFieldRef = useRef(null);
    const isSmallScreen = useMediaQuery('(max-width: 600px)');
    //const textFieldRef = useRef(document.getElementById('miTextField'));
    createTheme('solarized', {
        text: {
          //primary: '#268bd2',
          primary: '#ffffff',
          secondary: '#2aa198',
        },
        background: {
          //default: '#002b36',
          default: '#1e272e'
        },
        context: {
          //background: '#cb4b16',
          background: '#1e272e',
          text: '#FFFFFF',
        },
        divider: {
          default: '#073642',
        },
        action: {
          button: 'rgba(0,0,0,.54)',
          hover: 'rgba(0,0,0,.08)',
          disabled: 'rgba(0,0,0,.12)',
        },
      }, 'dark');

      const columnas = [
        { name:'CODIGO', 
          selector:row => row.codigo,
          sortable: true,
          width: '120px'
          //key:true
        },
        { name:'DESCRIPCION', 
          selector:row => row.descripcion,
          sortable: true,
          //width: '250px'
          width: isSmallScreen ? "250px" : "450px", // Ajusta la distancia desde arriba          
          //key:true
        },
        { name:'AUX', 
          selector:row => row.auxiliar,
          sortable: true,
          width: '60px'
          //key:true
        },
      ];
        
    const handleSearchTextChange = (event) => {
        setSearchText(event.target.value.replace('+', '').replace('-', ''));
        setRegistro({...registro, [idCodigoKey]:event.target.value.replace('+', '').replace('-','')});
    };

    const handlePopUpSelect = (codigo, descripcion, auxiliar) => {
        setSearchText(codigo);
        let updatedRegistro;
        //auxiliarKey llega en null, cuando no usamos el 3er parametro
        if (auxiliarKey!==undefined && auxiliarKey!==null){
            updatedRegistro = {
                ...registro,
                [idCodigoKey]: codigo,
                [descripcionKey]: descripcion,
                [auxiliarKey]: auxiliar
            };
        }else{
            updatedRegistro = {
                ...registro,
                [idCodigoKey]: codigo,
                [descripcionKey]: descripcion
            };
        }
        console.log(updatedRegistro);
        setRegistro(updatedRegistro);
        setShowModal(false);
    };

    const handleKeyDown = (event, nextRef, prevRef) => {
        switch (event.key) {
          case "-":
            setShowModal(false);
            break;
          case "Enter":
            //si tiene contenido, pasa al siguiente, en caso de campo busqueda
            if (event.target.value!==""){
            handlePopUpSelect(filteredPopUp[0].codigo, filteredPopUp[0].descripcion, filteredPopUp[0].auxiliar);
            console.log('desde ListaPopUp: ',event.target.value);
            }
            break;
          
          default:
            break;
        }
    };
    
    const filteredPopUp = registroPopUp.filter((c) =>
      `${c.codigo} ${c.descripcion}`.toLowerCase().includes(searchText.toLowerCase())
    );

    useEffect(() => {
        if (showModal) {
            setTimeout(() => {
                if (textFieldRef.current) {
                    textFieldRef.current.focus();
                }
            }, 0); // Prueba con diferentes valores de retraso
        }
    }, [showModal]);

    return (
        <Dialog
            open={showModal}
            onClose={() => setShowModal(false)}
            maxWidth="md"
            //fullWidth
            disableScrollLock // Evita que se modifique el overflow del body
            PaperProps={{
                style: {
                    top: isSmallScreen ? "-40vh" : "0vh", // Ajusta la distancia desde arriba
                    left: isSmallScreen ? "-25%" : "0%", // Centrado horizontal
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: '10vh',
                    background: '#1e272e',
                    color: 'white',
                    width: isSmallScreen ? ('40%') : ('60%'), // Ajusta este valor según tus necesidades
                },
            }}
        >
            <DialogTitle>Listado de Registro</DialogTitle>
            <TextField
                variant="standard"
                maxWidth="md"
                //autoFocus
                size="small"
                sx={{ mt: -1 }}
                name="miTextField"
                id="miTextField"
                //ref={textFieldRef} // Referencia para el TextField
                inputRef={textFieldRef} // Referencia para el TextField
                value={searchText}
                onChange={handleSearchTextChange}
                onKeyDown={(event) => handleKeyDown(event)}
                inputProps={{ style: { color: 'white', width: 140 } }}
                InputLabelProps={{ style: { color: 'white' } }}
            />

            <DialogContent>
                <Datatable
                    columns={columnas}
                    data={filteredPopUp}
                    dense
                    theme="solarized"
                    highlightOnHover
                    pointerOnHover
                    //striped
                    pagination
                    onRowClicked={(row) => handlePopUpSelect(row.codigo, row.descripcion, row.auxiliar)}
                />
            </DialogContent>

        </Dialog>
    );
};

export default ListaPopUp;*/
