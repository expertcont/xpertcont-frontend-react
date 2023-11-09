import {Grid,Card,TextField,Select, InputLabel, FormControl, MenuItem} from '@mui/material'
import React, { useState,useEffect} from 'react';
import axios from 'axios';

const AsientoCompraImportacion = ({ formData, isSmallScreen, onFormDataChange }) => {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const handleChange = (name, value) => {
    onFormDataChange({ ...formData, [name]: value });
  };
  const [bss_select,setBssSelect] = useState([]);
  const [pais_select,setPaisSelect] = useState([]);
  const [aduana_select,setAduanaSelect] = useState([]);
  const [loadingBss, setLoadingBss] = useState(true);//resuelve problemas de carga con select renderizados antes de tiempo
  const [loadingPais, setLoadingPais] = useState(true);//resuelve problemas de carga con select renderizados antes de tiempo
  const [loadingAduana, setLoadingAduana] = useState(true);//resuelve problemas de carga con select renderizados antes de tiempo

  const cargaBssSelect = () =>{
    axios
    .get(`${back_host}/bss`)
    .then((response) => {
        setLoadingBss(true);
        setBssSelect(response.data);
        setLoadingBss(false);
    })
    .catch((error) => {
        console.log(error);
        setLoadingBss(false); //cuidado si no carga, no renderiza en formulario
    });
  }
  const cargaPaisSelect = () =>{
    axios
    .get(`${back_host}/pais`)
    .then((response) => {
        setLoadingPais(true);
        setPaisSelect(response.data);
        setLoadingPais(false);
        //console.log("pais cargado desde axios");
        //console.log('r_id_pais = ',formData.r_id_pais,'  response.data =' ,response.data);
        //console.log('formData: ', formData);
    })
    .catch((error) => {
        console.log(error);
        setLoadingPais(false);//cuidado si no carga, no renderiza en formulario
    });
  }
  const cargaAduanaSelect = () =>{
    axios
    .get(`${back_host}/aduana`)
    .then((response) => {
        setLoadingAduana(true);
        setAduanaSelect(response.data);
        setLoadingAduana(false);
        //console.log("aduana cargado desde axios");
        //console.log('r_id_aduana = ',formData.r_id_aduana,'  response.data =' ,response.data);
        //console.log('formData: ', formData);
    })
    .catch((error) => {
        console.log(error);
        setLoadingAduana(false);//cuidado si no carga, no renderiza en formulario
    });
  }
  
  useEffect( ()=> {
    //cargar datos generales, cuidado cada uno tiene variable de carga, para control renderizacion
    cargaPaisSelect();
    cargaBssSelect();
    cargaAduanaSelect();
    
    //console.log('useEffect AsientoComprobanteImportacion.js formData.r_id_aduana: ',formData.r_id_aduana);
    //console.log('formData: ',formData);
   },[]);

  return (
    <div>
    <Card
        style={{
            background:'#1e272e',
            //width: '150px', // Aquí estableces el ancho
            height: '350px', // Altura del Card
            marginTop: "5px",
            //margin:'auto',
            borderRadius: '10px',
            padding:'1rem'
        }}
    >
            <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
            direction={isSmallScreen ? 'column' : 'column'}
            alignItems={isSmallScreen ? 'center' : 'center'}
            justifyContent={isSmallScreen ? 'center' : 'center'}
            >
                <FormControl fullWidth>
                <InputLabel id="simple-select-label" 
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'white'} }}
                            sx={{mt:1, color:'#5DADE2'}}
                >BSS</InputLabel>
                { loadingBss ? 
                (<div></div>)
                :
                (
                <Select
                        labelId="bss_select"
                        //id={formData.tipo_op}
                        value={formData.r_idbss}
                        size='small'
                        name="r_idbss"
                        fullWidth
                        sx={{display:'block',
                        margin:'.5rem 0', color:"white"}}
                        label="Bien Servicio"
                        onChange={(e) => handleChange('r_idbss', e.target.value)}
                    >
                        {   
                            bss_select.map(elemento => (
                            <MenuItem key={elemento.idbss} value={elemento.idbss}>
                            {elemento.nombre}
                            </MenuItem>)) 
                        }
                </Select>
                )
                }
                </FormControl>

                <FormControl fullWidth>
                <InputLabel id="simple-select-label" 
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'white'} }}
                            sx={{mt:1, color:'#5DADE2'}}
                >PAIS</InputLabel>
                { loadingPais ? 
                (<div></div>)
                :
                (
                <Select
                        labelId="pais_select"
                        //id={formData.r_id_pais}
                        value={formData.r_id_pais}
                        size='small'
                        name="r_id_pais"
                        fullWidth
                        sx={{display:'block',
                        margin:'.5rem 0', color:"white"}}
                        label="Pais"
                        onChange={(e) => handleChange('r_id_pais', e.target.value)}
                    >
                        {   
                            pais_select.map(elemento => (
                            <MenuItem key={elemento.id_pais} value={elemento.id_pais}>
                            {elemento.nombre}
                            </MenuItem>)) 
                        }
                </Select>
                )
                }
                </FormControl>

                <FormControl fullWidth>
                <InputLabel id="simple-select-label" 
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'white'} }}
                            sx={{mt:1, color:'#5DADE2'}}
                >ADUANA</InputLabel>
                { loadingAduana ? 
                (<div></div>)
                :
                (
                <Select
                        labelId="aduana_select"
                        //id={formData.tipo_op}
                        value={formData.r_id_aduana}
                        size='small'
                        name="r_id_aduana"
                        fullWidth
                        sx={{display:'block',
                        margin:'.5rem 0', color:"white"}}
                        label="Aduana"
                        onChange={(e) => handleChange('r_id_aduana', e.target.value)}
                    >
                        {   
                            aduana_select.map(elemento => (
                            <MenuItem key={elemento.id_aduana} value={elemento.id_aduana}>
                            {elemento.nombre}
                            </MenuItem>)) 
                        }
                </Select>
                )
                }
                </FormControl>

                <TextField variant="outlined" 
                        label="Año DUA"
                        sx={{ display:'block',
                                margin:'.5rem 0',
                            }}
                        name="r_ano_dam"
                        size='small'
                        fullWidth
                        value={formData.r_ano_dam} 
                        onChange={(e) => handleChange('r_ano_dam', e.target.value)}
                        inputProps={{ style:{color:'white'} }}
                        InputLabelProps={{ style:{color:'skyblue'} }}
                />

            </Grid>
    </Card>
      
    </div>
  );
};

export default AsientoCompraImportacion;
