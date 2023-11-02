import {Grid,Card,TextField,Select, InputLabel, FormControl, MenuItem} from '@mui/material'
import React, { useState } from 'react';

const AsientoCompraImportacion = ({ formData, isSmallScreen, onFormDataChange }) => {
  const handleChange = (name, value) => {
    onFormDataChange({ ...formData, [name]: value });
  };

  const [moneda_select] = useState([
    {r_moneda:'PEN'},
    {r_moneda:'USD'},
    {r_moneda:'EUR'},
  ]);

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
                            moneda_select.map(elemento => (
                            <MenuItem key={elemento.r_moneda} value={elemento.r_moneda}>
                            {elemento.r_moneda}
                            </MenuItem>)) 
                        }
                </Select>
                </FormControl>

                <FormControl fullWidth>
                <InputLabel id="simple-select-label" 
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'white'} }}
                            sx={{mt:1, color:'#5DADE2'}}
                >PAIS</InputLabel>
                <Select
                        labelId="pais_select"
                        //id={formData.tipo_op}
                        value={formData.r_id_pais}
                        size='small'
                        name="r_id_pais"
                        fullWidth
                        sx={{display:'block',
                        margin:'.5rem 0', color:"white"}}
                        label="Bien Servicio"
                        onChange={(e) => handleChange('r_id_pais', e.target.value)}
                    >
                        {   
                            moneda_select.map(elemento => (
                            <MenuItem key={elemento.r_moneda} value={elemento.r_moneda}>
                            {elemento.r_moneda}
                            </MenuItem>)) 
                        }
                </Select>
                </FormControl>

                <FormControl fullWidth>
                <InputLabel id="simple-select-label" 
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'white'} }}
                            sx={{mt:1, color:'#5DADE2'}}
                >ADUANA</InputLabel>
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
                            moneda_select.map(elemento => (
                            <MenuItem key={elemento.r_moneda} value={elemento.r_moneda}>
                            {elemento.r_moneda}
                            </MenuItem>)) 
                        }
                </Select>
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
