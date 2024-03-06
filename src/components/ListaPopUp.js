import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { TextField, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText } from '@mui/material';
import Datatable, {createTheme} from 'react-data-table-component';

const ListaPopUp = ({ registroPopUp, showModal, setShowModal, registro,setRegistro, idCodigoKey, descripcionKey,auxiliarKey }) => {
    const [searchText, setSearchText] = useState('');
    const textFieldRef = useRef(null);
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
          width: '250px'
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
            //maxWidth="md"
            fullWidth
            PaperProps={{
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: '10vh',
                    background: '#1e272e',
                    color: 'white'
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

export default ListaPopUp;
