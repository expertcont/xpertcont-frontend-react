import {Grid,Card,TextField,Select, InputLabel, FormControl, useMediaQuery} from '@mui/material'
import React, { useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const AsientoComprobante = ({ formData, isSmallScreen, onFormDataChange }) => {
    
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
                <TextField variant="outlined" 
                        label="COD"
                        sx={{ display:'block',
                                margin:'.5rem 0',
                            }}
                        name="r_cod"
                        size='small'
                        fullWidth
                        value={formData.r_cod} 
                        onChange={(e) => handleChange('r_cod', e.target.value)}
                        inputProps={{ style:{color:'white'} }}
                        InputLabelProps={{ style:{color:'skyblue'} }}
                />
                <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
                    direction={isSmallScreen ? 'column' : 'row'}
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
                            label="NUMERO"
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
                            //format="yyyy/MM/dd"
                            value={formData.fecemi} 
                            onChange={(e) => handleChange('fecemi', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
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
                        inputProps={{ style:{color:'white'} }}
                        InputLabelProps={{ style:{color:'skyblue'} }}
                />
                
                <ThemeProvider theme={theme}>
                <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
                    direction={isSmallScreen ? 'column' : 'row'}
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
                        inputProps={{ style:{color:'white'} }}
                        InputLabelProps={{ style:{color:'skyblue'} }}
                />
                </ThemeProvider>
            </Grid>
        </Card>
    </div>
  );
};

export default AsientoComprobante;
