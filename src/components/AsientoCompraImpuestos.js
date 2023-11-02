import {Grid,Card,TextField,Select,MenuItem,InputLabel, FormControl, useMediaQuery} from '@mui/material'
import React, { useState } from 'react';

const AsientoCompraImpuestos = ({ formData, isSmallScreen, onFormDataChange }) => {
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
                marginTop: "3px",
                //margin:'auto',
                borderRadius: '10px',
                padding:'1rem'
            }}
        >
                <Grid container spacing={0.5} style={{ marginTop: "-5px" }}
                direction={isSmallScreen ? 'column' : 'column'}
                alignItems={isSmallScreen ? 'center' : 'center'}
                //justifyContent={isSmallScreen ? 'center' : 'center'}
                >
                    <TextField variant="outlined" 
                            label="IGV(a)"
                            sx={{ display:'block',
                                    margin:'.5rem 0',
                                }}
                            name="r_igv001"
                            size='small'
                            fullWidth
                            value={formData.r_igv001} 
                            onChange={(e) => handleChange('r_igv001', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                    />
                    <TextField variant="outlined" 
                            label="IGV(b)"
                            sx={{ display:'block',
                                    margin:'.5rem 0',
                                }}
                            name="r_igv002"
                            size='small'
                            fullWidth
                            value={formData.r_igv002} 
                            onChange={(e) => handleChange('r_igv002', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                    />
                    <TextField variant="outlined" 
                            label="IGV(c)"
                            sx={{ display:'block',
                                    margin:'.5rem 0',
                                }}
                            name="r_igv003"
                            size='small'
                            fullWidth
                            value={formData.r_igv003} 
                            onChange={(e) => handleChange('r_igv003', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                    />
                    <TextField variant="outlined" 
                            label="OTROS"
                            sx={{ display:'block',
                                    margin:'.5rem 0',
                                }}
                            name="r_monto_otros"
                            size='small'
                            fullWidth
                            value={formData.r_monto_otros} 
                            onChange={(e) => handleChange('r_monto_otros', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                    />
                    <Select
                            labelId="moneda_select"
                            //id={formData.tipo_op}
                            value={formData.tipo_op}
                            size='small'
                            name="r_moneda"
                            fullWidth
                            sx={{display:'block',
                            margin:'.5rem 0', color:"white"}}
                            label="Moneda"
                            onChange={(e) => handleChange('r_moneda', e.target.value)}
                        >
                            {   
                                moneda_select.map(elemento => (
                                <MenuItem key={elemento.r_moneda} value={elemento.r_moneda}>
                                {elemento.r_moneda}
                                </MenuItem>)) 
                            }
                    </Select>
                    <TextField variant="outlined" 
                            label="TOTAL"
                            sx={{ display:'block',
                                    margin:'.5rem 0',
                                }}
                            name="r_monto_total"
                            fullWidth
                            size='small'
                            value={formData.r_monto_total} 
                            onChange={(e) => handleChange('r_monto_total', e.target.value)}
                            inputProps={{ style:{color:'white'} }}
                            InputLabelProps={{ style:{color:'skyblue'} }}
                    />
                </Grid>
        </Card>
    </div>
  );
};

export default AsientoCompraImpuestos;