import {Grid,Card,TextField,Select, InputLabel, FormControl, useMediaQuery} from '@mui/material'
import React, { useState } from 'react';

const AsientoCompraBases = ({ formData, isSmallScreen, onFormDataChange }) => {
  const handleChange = (name, value) => {
    onFormDataChange({ ...formData, [name]: value });
  };

  return (
    <div>
        <Card
        style={{
        background:'#1e272e',
        //width: '150px', // Aquí estableces el ancho
        height: '350px', // Altura del Card
        marginTop: "3px",
        //margin:'auto',
        borderRadius: '10px',
        padding:'1rem'
        }}
        >
            <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
                direction={isSmallScreen ? 'column' : 'column'}
                alignItems={isSmallScreen ? 'center' : 'left'}
                //justifyContent={isSmallScreen ? 'center' : 'center'}
            >
                <TextField variant="outlined" 
                            label="BASE(a)"
                            sx={{ display:'block',
                                margin:'.5rem 0',
                                }}
                            name="r_base001"
                            size='small'
                            fullWidth
                            value={formData.r_base001} 
                            onChange={(e) => handleChange('r_base001', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                />
                <TextField variant="outlined" 
                            label="BASE(b)"
                            sx={{ display:'block',
                                margin:'.5rem 0',
                                }}
                            name="r_base002"
                            size='small'
                            fullWidth
                            value={formData.r_base002} 
                            onChange={(e) => handleChange('r_base002', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                />
                <TextField variant="outlined" 
                            label="BASE(c)"
                            sx={{ display:'block',
                                margin:'.5rem 0',
                                }}
                            name="r_base003"
                            size='small'
                            fullWidth
                            value={formData.r_base003} 
                            onChange={(e) => handleChange('r_base003', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                />
                <TextField variant="outlined" 
                            label="NO GRAV"
                            sx={{ display:'block',
                                margin:'.5rem 0',
                                }}
                            name="r_base004"
                            size='small'
                            fullWidth
                            value={formData.r_base004} 
                            onChange={(e) => handleChange('r_base004', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                />
                <TextField variant="outlined" 
                            label="ICBP"
                            sx={{ display:'block',
                                margin:'.5rem 0',
                                }}
                            name="r_monto_icbp"
                            size='small'
                            fullWidth
                            value={formData.r_monto_icbp} 
                            onChange={(e) => handleChange('r_monto_icbp', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                />
                <TextField variant="outlined" 
                            label="TC"
                            sx={{ display:'block',
                                margin:'.5rem 0',
                                }}
                            name="r_tc"
                            size='small'
                            fullWidth
                            value={formData.r_tc} 
                            onChange={(e) => handleChange('r_tc', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                />
            </Grid>
        </Card>
    </div>
  );
};

export default AsientoCompraBases;