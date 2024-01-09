import {Grid,Card,TextField,Select, InputLabel, FormControl, MenuItem} from '@mui/material'
import React, { useState,useEffect} from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';

const AsientoComprobante = ({ formData, isSmallScreen, onFormDataChange }) => {
    const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
    const theme = createTheme({
    components: {
        MuiTextField: {
        styleOverrides: {
            root: {
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'gray', // Cambia 'red' al color que desees
            },
            },
        },
        },
    },
    });  
      
    const handleChange = (name, value) => {
        onFormDataChange({ ...formData, [name]: value });
    };
    
    const [comprobante_select,setComprobanteSelect] = useState([]);
    const cargaComprobanteSelect = () =>{
        axios
        .get(`${back_host}/comprobante/c`)
        .then((response) => {
            setComprobanteSelect(response.data);
        })
        .catch((error) => {
            console.log(error);
        });
    };

    useEffect( ()=> {
        //cargar datos generales
        cargaComprobanteSelect();
    },[]);

  return (
    <div>
        <Card
            style={{
                background:'#1e272e',
                //width: '210px', // Aquí estableces el ancho
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
                >COD</InputLabel>
                <Tooltip title={formData.r_cod ? 'COMPROBANTE = ' + formData.r_cod : ''}
                >
                <Select
                        labelId="comprobante_select"
                        //id={formData.tipo_op}
                        value={formData.r_cod}
                        size='small'
                        name="r_cod"
                        fullWidth
                        sx={{display:'block',
                        margin:'.5rem 0', color:"white"}}
                        label="Cod"
                        onChange={(e) => handleChange('r_cod', e.target.value)}
                    >
                        {   
                            comprobante_select.map(elemento => (
                            <MenuItem key={elemento.cod} value={elemento.cod}>
                            {elemento.nombre}
                            </MenuItem>)) 
                        }
                </Select>
                </Tooltip>
                </FormControl>

                <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
                    direction={isSmallScreen ? 'row' : 'row'}
                    alignItems={isSmallScreen ? 'center' : 'center'}
                    justifyContent={isSmallScreen ? 'center' : 'center'}
                >
                    <Grid item xs={5} >
                    <TextField variant="outlined" 
                            label="SERIE"
                            sx={{ display:'block',
                                    margin:'.5rem 0',
                                }}
                            name="r_serie"
                            size='small'
                            fullWidth
                            value={formData.r_serie} 
                            onChange={(e) => handleChange('r_serie', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                    />
                    </Grid>
                    <Grid item xs={7} >
                    <TextField variant="outlined" 
                            //label="NUMERO"
                            placeholder="NUMERO"
                            sx={{ display:'block',
                                    margin:'.5rem 0',
                                }}
                            name="r_numero"
                            size='small'
                            fullWidth
                            value={formData.r_numero} 
                            onChange={(e) => handleChange('r_numero', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                    />
                    </Grid>
                </Grid>

                <TextField variant="outlined" 
                            label="FECMI"
                            sx={{display:'block',
                                margin:'.5rem 0'}}
                            name="r_fecemi"
                            size='small'
                            fullWidth
                            type="date"
                            value={formData.fecemi} 
                            onChange={(e) => handleChange('fecemi', e.target.value)}
                            inputProps={{ style:{color:'white', textAlign: 'center'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                />

                <TextField variant="outlined" 
                        label="VCTO"
                        sx={{display:'block',
                            margin:'.5rem 0'}}
                        name="r_fecvcto"
                        size='small'
                        fullWidth
                        type="date"
                        //format="yyyy/MM/dd"
                        value={formData.fecvcto} 
                        onChange={(e) => handleChange('fecvcto', e.target.value)}
                        inputProps={{ style:{color:'white',textAlign: 'center'} }}
                        InputLabelProps={{ style:{color:'skyblue'} }}
                />
                
                <ThemeProvider theme={theme}>
                <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
                    direction={isSmallScreen ? 'row' : 'row'}
                    alignItems={isSmallScreen ? 'center' : 'center'}
                    justifyContent={isSmallScreen ? 'center' : 'center'}
                >
                    <Grid item xs={3} >
                        <TextField variant="outlined" 
                                label="COD"
                                sx={{ display:'block',
                                        margin:'.5rem 0',
                                    }}
                                name="r_cod_ref"
                                size='small'
                                fullWidth
                                value={formData.r_cod_ref} 
                                onChange={(e) => handleChange('r_cod_ref', e.target.value)}
                                inputProps={{ style:{color:'white'} }}
                                InputLabelProps={{ style:{color:'skyblue'} }}
                        />
                    </Grid>
                    <Grid item xs={3.3} >
                        <TextField variant="outlined" 
                                label="SERIE"
                                sx={{ display:'block',
                                    margin:'.5rem 0',
                                    }}
                                name="r_serie_ref"
                                size='small'
                                fullWidth
                                value={formData.r_serie_ref} 
                                onChange={(e) => handleChange('r_serie_ref', e.target.value)}
                                inputProps={{ style:{color:'white'} }}
                                InputLabelProps={{ style:{color:'skyblue'} }}
                        />
                    </Grid>
                    <Grid item xs={5.7} >
                        <TextField variant="outlined" 
                                label="NUM Ref"
                                sx={{ display:'block',
                                        margin:'.5rem 0',
                                    }}
                                name="r_numero_ref"
                                size='small'
                                fullWidth
                                value={formData.r_numero_ref} 
                                onChange={(e) => handleChange('r_numero_ref', e.target.value)}
                                inputProps={{ style:{color:'white'} }}
                                InputLabelProps={{ style:{color:'skyblue'} }}
                        />
                    </Grid>
                </Grid>

                <TextField variant="outlined" 
                        //label="EMI Ref."
                        sx={{display:'block',
                                margin:'.5rem 0'}}
                        name="r_fecemi_ref"
                        size='small'
                        fullWidth
                        type="date"
                        //format="yyyy/MM/dd"
                        value={formData.fecemi_ref} 
                        onChange={(e) => handleChange('fecemi_ref', e.target.value)}
                        inputProps={{ style:{color:'white',textAlign: 'center'} }}
                        InputLabelProps={{ style:{color:'skyblue'} }}
                />
                </ThemeProvider>
            </Grid>
        </Card>
    </div>
  );
};

export default AsientoComprobante;
