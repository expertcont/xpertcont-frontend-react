import {Grid,Card,TextField,Select,MenuItem} from '@mui/material'
import React, {useState,useEffect} from 'react';

const AsientoCompraMontos = ({ formData, isSmallScreen, onFormDataChange }) => {
    //Usamos variables para control de errores
    //Si esta mal digitado, recobra valor anterior, solo por eso
    const [base001, setBase001] = useState('');
    const [base002, setBase002] = useState('');
    const [base003, setBase003] = useState('');
    const [base004, setBase004] = useState('');
    const [monto_icbp, setMontoIcbp] = useState('');
    const [igv001, setIgv001] = useState('');
    const [igv002, setIgv002] = useState('');
    const [igv003, setIgv003] = useState('');
    const [monto_otros, setMontoOtros] = useState('');
    const [monto_total, setMontoTotal] = useState('');

    const handleBase001Change = (e) => {
        const baseAnterior = base001;
        setBase001(e.target.value); //almacena valor ePeso para uso posterior
        let baseValida = Number(e.target.value);

        if (isNaN(baseValida)) {
            console.log('baseValida: ',baseValida);
            baseValida = baseAnterior;
            setBase001(baseAnterior); //almacena valor ePeso para uso posterior
        }
        //calcula igv correspondiente
        const igv =Number((baseValida*18/100).toFixed(2));
        setIgv001(igv); //almacena valor ePeso para uso posterior

        //Adiciona al total 
        let campos = Number(formData.r_base002) + Number(formData.r_base003) + Number(formData.r_base004) 
                    + Number(formData.r_igv002) + Number(formData.r_igv003) 
                    + Number(formData.r_monto_icbp) + Number(formData.r_monto_otros);
        const total = (baseValida + igv + campos).toFixed(2);
        setMontoTotal(total);
        
        //Enviar datos a useState
        let updatedData = { ...formData, ['r_base001']: baseValida, ['r_igv001']: igv, ['r_monto_total']: total };
        onFormDataChange(updatedData);    
    };
    
    const handleBase002Change = (e) => {
        const baseAnterior = base002;
        setBase002(e.target.value); //almacena valor ePeso para uso posterior
        let baseValida = Number(e.target.value);

        if (isNaN(baseValida)) {
            baseValida = baseAnterior;
            setBase002(baseAnterior); //almacena valor ePeso para uso posterior
        }
        //calcula igv correspondiente
        const igv =Number((baseValida*18/100).toFixed(2));
        setIgv002(igv); //almacena valor ePeso para uso posterior

        //Adiciona al total 
        let campos = Number(formData.r_base001) + Number(formData.r_base003) + Number(formData.r_base004) 
                    + Number(formData.r_igv001) + Number(formData.r_igv003) 
                    + Number(formData.r_monto_icbp) + Number(formData.r_monto_otros);
        const total = (baseValida + igv + campos).toFixed(2);
        setMontoTotal(total);

        //Enviar datos a useState
        let updatedData = { ...formData, ['r_base002']: baseValida, ['r_igv002']: igv, ['r_monto_total']: total };
        onFormDataChange(updatedData);    
    };
      
    const handleBase003Change = (e) => {
        const baseAnterior = base003;
        setBase003(e.target.value); //almacena valor ePeso para uso posterior
        let baseValida = Number(e.target.value);

        if (isNaN(baseValida)) {
            baseValida = baseAnterior;
            setBase003(baseAnterior); //almacena valor ePeso para uso posterior
        }
        //calcula igv correspondiente
        const igv =Number((baseValida*18/100).toFixed(2));
        setIgv003(igv); //almacena valor ePeso para uso posterior

        //Adiciona al total 
        let campos = Number(formData.r_base001) + Number(formData.r_base002) + Number(formData.r_base004) 
                    + Number(formData.r_igv001) + Number(formData.r_igv002) 
                    + Number(formData.r_monto_icbp) + Number(formData.r_monto_otros);
        const total = (baseValida + igv + campos).toFixed(2);
        setMontoTotal(total);

        //Enviar datos a useState
        let updatedData = { ...formData, ['r_base003']: baseValida, ['r_igv003']: igv, ['r_monto_total']: total };
        onFormDataChange(updatedData);    
    };
    
    const handleChangeLocal = (e) =>{
        const { name, value } = e.target;
        const parsedValue = Number(value);
        let campos = 0;
        if (name === "r_base004") {
            console.log(formData.r_base001,formData.r_base002,formData.r_base003,formData.r_igv001,formData.r_igv002,formData.r_igv003);
            campos = Number(formData.r_base001) + Number(formData.r_base002) + Number(formData.r_base003) + parsedValue
            + Number(formData.r_igv001) + Number(formData.r_igv002) +  Number(formData.r_igv003)
            + Number(formData.r_monto_icbp) + Number(formData.r_monto_otros);
            setBase004(value);
        }
        if (name === "r_monto_otros") {
            campos = Number(formData.r_base001) + Number(formData.r_base002) + Number(formData.r_base003) + Number(formData.r_base004)
            + Number(formData.r_igv001) + Number(formData.r_igv002) +  Number(formData.r_igv003)
            + Number(formData.r_monto_icbp) + parsedValue;
            setMontoOtros(value);
        }
        if (name === "r_monto_icbp") {
            campos = Number(formData.r_base001) + Number(formData.r_base002) + Number(formData.r_base003) + Number(formData.r_base004)
            + Number(formData.r_igv001) + Number(formData.r_igv002) +  Number(formData.r_igv003)
            + parsedValue + Number(formData.r_monto_otros);
            setMontoIcbp(value);
        }

        const total = (campos).toFixed(2);
        setMontoTotal(total);
    
        //Enviar datos a useState
        let updatedData = { ...formData, [name]: parsedValue };
        onFormDataChange(updatedData);    
        console.log(formData);
    }

    const [moneda_select] = useState([
        {r_moneda:'PEN'},
        {r_moneda:'USD'},
        {r_moneda:'EUR'},
    ]);

    //Aqui se leen parametros en caso lleguen
    useEffect( ()=> {
        //
        console.log("useEffect desde AsientoCompraMontos.js");
    },[]);

  return (
    <div>
        <Grid container spacing={0} 
            style={{ marginTop: "0px" }}
            direction={isSmallScreen ? 'column' : 'row'}
        >
            <Grid xs={6}>
                <Card
                style={{
                background:'#1e272e',
                //width: '150px', // Aquí estableces el ancho
                height: '350px', // Altura del Card
                marginTop: "5px",
                //marginLeft: "5px",
                //margin:'auto',
                borderRadius: '10px',
                padding:'1rem'
                }}
                >
                    <Grid container spacing={0.1} style={{ marginTop: "-5px" }}
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
                                    value={ base001 || formData.r_base001} 
                                    onChange={handleBase001Change}
                                    inputProps={{
                                        style: { color: 'white' },
                                        //step: 'any', // Permite números decimales
                                        //type: 'number', // Configura el tipo de entrada como número
                                      }}
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
                                    value={ base002 || formData.r_base002} 
                                    onChange={handleBase002Change}
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
                                    value={ base003 || formData.r_base003} 
                                    onChange={handleBase003Change}
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
                                    value={ base004 || formData.r_base004} 
                                    onChange={handleChangeLocal}
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
                                    value={ monto_icbp || formData.r_monto_icbp} 
                                    onChange={handleChangeLocal}
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
                                    onChange={handleChangeLocal}
                                    inputProps={{ style:{color:'white'} }}
                                    InputLabelProps={{ style:{color:'skyblue'} }}
                        />
                    </Grid>
                </Card>
            </Grid>

            <Grid xs={6}>
                <Card
                    style={{
                        background:'#1e272e',
                        //width: '150px', // Aquí estableces el ancho
                        height: '350px', // Altura del Card
                        marginTop: "5px",
                        //margin:'auto',
                        marginLeft: "5px",
                        borderRadius: '10px',
                        padding:'1rem'
                    }}
                >
                        <Grid container spacing={0.1} style={{ marginTop: "-5px" }}
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
                                    value={ igv001 || formData.r_igv001} 
                                    onChange={handleChangeLocal}
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
                                    value={ igv002 || formData.r_igv002} 
                                    onChange={handleChangeLocal}
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
                                    value={ igv003 || formData.r_igv003} 
                                    onChange={handleChangeLocal}
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
                                    value={ monto_otros || formData.r_monto_otros} 
                                    onChange={handleChangeLocal}
                                    inputProps={{ style:{color:'white'} }}
                                    InputLabelProps={{ style:{color:'skyblue'} }}
                            />
                            <Select
                                    labelId="moneda_select"
                                    //id={formData.r_moneda}
                                    value={formData.r_moneda}
                                    size='small'
                                    name="r_moneda"
                                    fullWidth
                                    sx={{display:'block',
                                    margin:'.5rem 0', color:"white"}}
                                    label="Moneda"
                                    onChange={handleChangeLocal}
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
                                    value={ monto_total || formData.r_monto_total} 
                                    onChange={handleChangeLocal}
                                    inputProps={{ style:{color:'white'} }}
                                    InputLabelProps={{ style:{color:'skyblue'} }}
                            />
                        </Grid>
                    </Card>
                </Grid>
        </Grid>                                
    </div>
  );
};

export default AsientoCompraMontos;
