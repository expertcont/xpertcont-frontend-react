import {Grid,Card,TextField} from '@mui/material'
import React from 'react';

const AsientoRazonSocial = ({ formData, isSmallScreen, onFormDataChange }) => {
  const handleChange = (name, value) => {
    //console.log("datos en componente: ",name, value);
    onFormDataChange({ ...formData, [name]: value });
    
  };

  return (
    <div>
        <Card
            style={{
                background:'#1e272e',
                //width: '750px', // Aquí estableces el ancho
                marginTop: "5px",
                //margin:'auto',
                borderRadius: '10px',
                padding:'1rem'
            }}
        >
            <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
            direction={isSmallScreen ? 'column' : 'row'}
            alignItems={isSmallScreen ? 'center' : 'center'}
            justifyContent={isSmallScreen ? 'center' : 'center'}
            >
                <Grid item xs={2.5} >
                <TextField variant="outlined" 
                            label="RUC"
                            sx={{display:'block',
                                margin:'.5rem 0'}}
                            name="r_documento_id"
                            size='small'
                            value={formData.r_documento_id} 
                            onChange={(e) => handleChange('r_documento_id', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                />
                </Grid>
                <Grid item xs={9.5} >
                <TextField variant="outlined" 
                            label="RAZON SOCIAL"
                            fullWidth
                            sx={{display:'block',
                                margin:'.5rem 0'}}
                            name="r_razon_social"
                            size='small'
                            value={formData.r_razon_social} 
                            onChange={(e) => handleChange('r_razon_social', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                />
                </Grid>
            </Grid>
        </Card>
      
      {/* Otros controles para el Grupo C */}

    </div>
  );
};

export default AsientoRazonSocial;
