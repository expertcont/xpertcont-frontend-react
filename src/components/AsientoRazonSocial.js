import {Grid,Card,TextField,Select, InputLabel, FormControl, MenuItem} from '@mui/material'
import React, { useState,useEffect} from 'react';
import IconButton from '@mui/material/IconButton';
import FindIcon from '@mui/icons-material/FindInPage';
import axios from 'axios';

const AsientoRazonSocial = ({ formData, isSmallScreen, onFormDataChange }) => {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";
  const handleChange = (name, value) => {
    //console.log("datos en componente: ",name, value);
    onFormDataChange({ ...formData, [name]: value });
    
    //Actualizar var estado, sino vista no se actualiza
    if (name==="r_id_doc") {
      setIdDocBusca(value);
    }
  };
  const [doc_select,setDocSelect] = useState([]);
  const cargaDocSelect = () =>{
    axios
    .get(`${back_host}/iddoc`)
    .then((response) => {
        setDocSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  };

  useEffect( ()=> {
    //cargar datos generales
    cargaDocSelect();
  },[]);
  
  const [razonSocialBusca, setRazonSocialBusca] = useState("");
  const [id_docBusca, setIdDocBusca] = useState("");
  
  const mostrarRazonSocialBusca = async (documento_id) => {
    let datosjson;

    //primero buscar en base de datos, para no agotar consultas API
    const resInterno = await fetch(`${back_host}/correntista/${formData.id_anfitrion}/${documento_id}`, {
      method: "GET",
      headers: {"Content-Type":"application/json",
                }
    });
    datosjson = await resInterno.json();
    //consulta si existe resultado interno
    if (datosjson.id_doc) {
      setRazonSocialBusca(datosjson.razon_social);
      formData.r_razon_social = datosjson.razon_social;
      setIdDocBusca(datosjson.id_doc);
      formData.r_id_doc = datosjson.id_doc;
    } //Caso contrario consumir API externa
    else {
      let tipo;
      if (documento_id.length===11) {tipo = 'ruc';} else {tipo='dni';}

      const res = await fetch(`https://apiperu.dev/api/${tipo}/${documento_id}`, {
        method: "GET",
        headers: {"Content-Type":"application/json",
                  //Aqui urgente variable entorno token: API externo
                  "Authorization": "Bearer " + "f03875f81da6f2c2f2e29f48fdf798f15b7a2811893ad61a1e97934a665acc8b"
                  }
      });
      datosjson = await res.json();
      console.log(datosjson);
      if (documento_id.length===11) {
        setIdDocBusca('6');
        formData.r_id_doc = '6';
        if (datosjson.success){
          setRazonSocialBusca(datosjson.data.nombre_o_razon_social);
          formData.r_razon_social = datosjson.data.nombre_o_razon_social;    
        }
        else{
          setRazonSocialBusca('RUC INVALIDO');
          formData.r_razon_social = 'RUC INVALIDO';    
        }
      }
      else {
        //el nombre del json cambia cuando es dni
        setIdDocBusca('1');
        formData.r_id_doc = '1';
        if (datosjson.success){
          setRazonSocialBusca(datosjson.data.nombre_completo);
          formData.r_razon_social = datosjson.data.nombre_completo;    
        }
        else {
          setRazonSocialBusca('DNI INVALIDO');
          formData.r_razon_social = 'DNI INVALIDO';    
        }
      }

    }    
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
                <Grid item xs={2} >
                <TextField variant="outlined" 
                            label="DOC IDENTIDAD"
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
                <Grid item xs={0.5} >
                  <IconButton color="warning" aria-label="upload picture" component="label" size="small"
                                //sx={{display:'block',
                                //margin:'1rem 0'}}
                                sx={{mt:-1}}
                                onClick = { () => {
                                    formData.r_razon_social = "";
                                    mostrarRazonSocialBusca(formData.r_documento_id);
                                  }
                                }
                              >
                      <FindIcon />
                  </IconButton>
                </Grid>

                <Grid item xs={2} >
                    <FormControl fullWidth>
                    <InputLabel id="simple-select-label" 
                                inputProps={{ style:{color:'white'} }}
                                InputLabelProps={{ style:{color:'white'} }}
                                sx={{mt:1, color:'#5DADE2'}}
                    >TIPO</InputLabel>
                    <Select
                            labelId="comprobante_select"
                            //id={formData.r_id_doc}
                            value={ id_docBusca || formData.r_id_doc}  // 
                            size='small'
                            name="r_id_doc"
                            fullWidth
                            sx={{display:'block',
                            margin:'.5rem 0', color:"white"}}
                            label="Cod"
                            onChange={(e) => handleChange('r_id_doc', e.target.value)}
                        >
                            {   
                                doc_select.map(elemento => (
                                <MenuItem key={elemento.id_doc} value={elemento.id_doc}>
                                {elemento.nombre}
                                </MenuItem>)) 
                            }
                    </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={7.5} >
                <TextField variant="outlined" 
                            label="RAZON SOCIAL"
                            fullWidth
                            sx={{display:'block',
                                margin:'.5rem 0'}}
                            name="r_razon_social"
                            size='small'
                            value={razonSocialBusca || formData.r_razon_social} 
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
