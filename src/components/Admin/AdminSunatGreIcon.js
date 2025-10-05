import { useState,useEffect } from "react";
import axios from "axios";
import { useDialog } from "./AdminConfirmDialogProvider";
import {Dialog,DialogTitle,Button,useMediaQuery,TextField,MenuItem,Select,InputLabel,FormControl,Box} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Sunat01Icon from "../../assets/images/sunatgre2.png";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CodeIcon from "@mui/icons-material/Code";
import DescriptionIcon from "@mui/icons-material/Description";
import ListaPopUp from '../ListaPopUp';
import FindIcon from '@mui/icons-material/FindInPage';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
// 🔹 Ejemplo motivos SUNAT (puedes ampliar con los oficiales)
const motivosSunat = [
  { codigo: "01", descripcion: "Venta" },
  { codigo: "02", descripcion: "Compra" },
  { codigo: "04", descripcion: "Traslado entre establecimientos" },
  { codigo: "08", descripcion: "Exportación" },
  { codigo: "13", descripcion: "Otros" },
];

const AdminSunatGreIcon = ({
  comprobante_gre, // ej. "09-T001-321321"
  comprobante_venta, // ej. "01-F001-12345"
  destinatario_venta, // ej. {destinatario_tipo,destinatario_ruc_dni,destinatario_razon_social}
  firma,
  documentoId,
  periodoTrabajo,
  idAnfitrion,
  idInvitado, //New
  contabilidadTrabajo,
  backHost,
  size = 24,
  onRefresh,
  descargasHost = "http://74.208.184.113:8080",
}) => {
  const [showModal, setShowModal] = useState(false);
  const [rutaXml, setRutaXml] = useState(null);
  const [rutaCdr, setRutaCdr] = useState(null);
  const [rutaPdf, setRutaPdf] = useState(null);
  const [comprobante_gre_grabado, setComprobanteGreGrabado] = useState(null);

  // 🔹 nuevos estados
  const [formData, setFormData] = useState({}); // datos dinámicos
  const [ubigeo_select,setUbigeoSelect] = useState([]);
  const [showModalUbigeoPartidaLista, setShowModalUbigeoPartidaLista] = useState(false);
  const [showModalUbigeoLLegadaLista, setShowModalUbigeoLLegadaLista] = useState(false);

  const { confirmDialog } = useDialog();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";

  // 🔹 useEffect para precargar datos de BD (NO SE USA), sino se generarn n-incidencias desde formulario anterior 
  const cargaPopUpUbigeo = () =>{
    axios
    .get(`${back_host}/ad_ventaubigeo`)
    .then((response) => {
        setUbigeoSelect(response.data);
    })
    .catch((error) => {
        console.log(error);
    });
  }
  const cargaRegistro = async (periodo_trabajo,id_anfitrion,contabilidad_trabajo,comprobanteGre) => {
    const [COD, SERIE, NUMERO] = comprobanteGre.split('-');
    //Cargamos datos GRE
    const response = await fetch(`${back_host}/ad_ventagre/${periodo_trabajo}/${id_anfitrion}/${contabilidad_trabajo}/${COD}/${SERIE}/${NUMERO}`);
    
    const data = await response.json();
    setFormData(data);
    //si existen filas en data
    setComprobanteGreGrabado(comprobanteGre);
    console.log("Datos GRE cargados:", data);

    //encaso exista firma, mostrar links
    if (data.vfirmado !== "" && data.vfirmado !== null) {
        console.log("Firma encontrada:", data.vfirmado);
        const baseUrl = `${descargasHost}/descargas/${documentoId}`;
        setRutaXml(`${baseUrl}/${documentoId}-${COD}-${SERIE}-${NUMERO}.xml`);
        setRutaCdr(`${baseUrl}/R-${documentoId}-${COD}-${SERIE}-${NUMERO}.xml`);
        setRutaPdf(`${baseUrl}/${documentoId}-${COD}-${SERIE}-${NUMERO}.pdf`);
    }

  };

  const cargaDatosIniciales = () => {
    if (!destinatario_venta) return;

    setFormData(prevData => ({
      ...prevData,
      ...destinatario_venta,
      guia_motivo_id: prevData.guia_motivo_id || "01", // por defecto '01'
      fecha_emision: prevData.fecha_emision || new Date().toISOString().split("T")[0],
      fecha_traslado: prevData.fecha_traslado || new Date().toISOString().split("T")[0],
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const mostrarRazonSocialGenera = (sDocumentoId) => {
    console.log("mostrarRazonSocialGenera para:", sDocumentoId);
    axios
        .post(`${back_host}/correntistagenera`, {
            ruc: sDocumentoId
        })
        .then((response) => {
            //console.log(response.data);
            const { nombre_o_razon_social,r_id_doc } = response.data;
            setFormData(prevState => ({ ...prevState, transp_razon_social: nombre_o_razon_social || '' }));
            console.log("Razon Social encontrada:", nombre_o_razon_social);
            console.log(formData);
        })
        .catch((error) => {
            console.log(error);
        });
  };

  const handleGrabarBD = async () => {
    const [R_COD, R_SERIE, R_NUMERO] = (comprobante_venta || "").split("-");

    // Confirmación
    const result = await confirmDialog({
      title: !comprobante_gre ? "Grabar GRE?" : "Actualizar GRE?",
      message: `para Venta: ${comprobante_venta}`,
      icon: "success",
      confirmText: "GRABAR",
      cancelText: "CANCELAR",
    });
    if (!result.isConfirmed) return;

    try {
      const [COD = null, SERIE = null, NUMERO = null] = (comprobante_gre ?? "").split("-").map(v => v || null);
      // 🚀 Construcción de payload
      const payload = {
        periodo: periodoTrabajo,
        id_anfitrion: idAnfitrion,
        documento_id: contabilidadTrabajo,
        id_invitado: idInvitado,
        cod: COD,
        serie: SERIE,
        numero: NUMERO,
        // 🔹 nuevos parámetros
        fecha_emision: formData.fecha_emision,
        fecha_traslado: formData.fecha_traslado,
        
        guia_motivo_id: formData.guia_motivo_id,
        guia_modalidad_id: formData.guia_modalidad_id,
        
        transp_ruc: formData.transp_ruc,
        transp_razon_social: formData.transp_razon_social,
        conductor_dni: formData.conductor_dni,
        conductor_nombres: formData.conductor_nombres,
        conductor_apellidos: formData.conductor_apellidos,
        conductor_licencia: formData.conductor_licencia,
        vehiculo_placa: formData.vehiculo_placa,

        destinatario_tipo: formData.destinatario_ruc_dni?.trim().length === 11 
                            ? 6 
                            : formData.destinatario_ruc_dni?.trim().length <= 8 
                              ? 1 
                              : null,

        destinatario_ruc_dni: formData.destinatario_ruc_dni,
        destinatario_razon_social: formData.destinatario_razon_social,

        partida_ubigeo: formData.partida_ubigeo,
        partida_direccion: formData.partida_direccion,
        llegada_ubigeo: formData.llegada_ubigeo,
        llegada_direccion: formData.llegada_direccion,
        peso_total: formData.peso_total,
        ref_cod: R_COD,
        ref_serie: R_SERIE,
        ref_numero: R_NUMERO,
        // items (el proc almacenado los inserta automatico desde venta real)
      };
      const cod_emitir = '09'; //fijo para GRE, en caso sea transportista, agregar Version
      if (!comprobante_gre_grabado) {
        //Modo Grabrar
        const response = await axios.post(`${backHost}/ad_ventagreref/${periodoTrabajo}/${idAnfitrion}/${contabilidadTrabajo}/${idInvitado}/${cod_emitir}`, payload);
        //Respuesta en axios envuelve resultado en (data) contiene cod,serie,numero de BD
        if (response.data?.cod) {
          //mostrar en controles
            await confirmDialog({
              title: "GRE Registrada en BD",
              message: `para Venta: ${comprobante_venta}`,
              icon: "success",
              confirmText: "ACEPTAR",
            });
          
          //refrescar datos
          setComprobanteGreGrabado(`${response.data.cod}-${response.data.serie}-${response.data.numero}`);
          console.log("GRE grabada:", `${response.data.cod}-${response.data.serie}-${response.data.numero}`);
          //cerrar modal
          //setShowModal(false);
          //onRefresh();
        }
      }
      else{
          //Modo Actualizar
          const response = await axios.put(`${backHost}/ad_ventagre`, payload);
          if  (response.data.success) {
            //alert(`GRE Actualizada: ${COD}-${SERIE}-${NUMERO}`);
            await confirmDialog({
              title: "GRE Actualizada",
              message: `para Venta: ${comprobante_venta}`,
              icon: "success",
              confirmText: "ACEPTAR",
            });

            //setShowModal(false);
            //onRefresh();
          }
          else {
            alert(response.data.message || "No se pudo actualizar la GRE.");
          }
          
      }      

    } catch (error) {
      await confirmDialog({
        title: "Error de insercion en BD",
        message: `para Venta: ${comprobante_venta}`,
        icon: "error",
        confirmText: "ACEPTAR",
      });
    }
   /*const cod_emitir = '09';
   alert(`${backHost}/ad_ventagreref/${periodoTrabajo}/${idAnfitrion}/${contabilidadTrabajo}/${idInvitado}/${cod_emitir}`);*/
  };

  const handleSunat = async () => {
    const [GRE_COD, GRE_SERIE, GRE_NUMERO] = (comprobante_gre_grabado || "").split("-");

    // Confirmación
    const result = await confirmDialog({
      title: "Enviar a SUNAT?",
      message: `${comprobante_gre_grabado}`,
      icon: "success",
      confirmText: "ENVIAR",
      cancelText: "CANCELAR",
    });
    if (!result.isConfirmed) return;

    try {
      // 🚀 Construcción de payload
      const payload = {
        p_periodo: periodoTrabajo,
        p_id_usuario: idAnfitrion,
        p_documento_id: contabilidadTrabajo,
        p_r_cod: GRE_COD,
        p_r_serie: GRE_SERIE,
        p_r_numero: GRE_NUMERO,
        p_comprobante: comprobante_venta,
      };

      //console.log("Payload SUNAT GRE:", payload);
      const response = await axios.post(`${backHost}/ad_ventagresunat`, payload);

      if (response.data?.codigo_hash) {
        setRutaXml(response.data.ruta_xml);
        setRutaCdr(response.data.ruta_cdr);
        setRutaPdf(response.data.ruta_pdf);
        //firma = response.data.codigo_hash;
        //setShowModal(true);

        await confirmDialog({
          title: "envío exitoso a SUNAT",
          message: `${comprobante_gre_grabado}`,
          icon: "success",
          confirmText: "ACEPTAR",
        });

      }
    } catch (error) {
      await confirmDialog({
        title: "Error de envío SUNAT",
        message: `${comprobante_gre_grabado}`,
        icon: "error",
        confirmText: "ACEPTAR",
      });
    }
  };

  const handleOpenLink = (url) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCloseModal = () => {
    setFormData({});  
    if (onRefresh) onRefresh();
    //resetar estado formData

    setShowModal(false);
  };

  const handleOpenModal = async () => {
    //cargar ubigeos
    cargaPopUpUbigeo();

    if (comprobante_gre) {
      //modo editar
      await cargaRegistro(periodoTrabajo,idAnfitrion,documentoId,comprobante_gre);
    }else{
      //modo nuevo
      cargaDatosIniciales();
    }

    setShowModal(true);
  };

  const handleLiberar = async () => {
    const [GRE_COD, GRE_SERIE, GRE_NUMERO] = (comprobante_gre_grabado || "").split("-");

    // Confirmación
    const result = await confirmDialog({
      title: "Liberar GRE?, Venta asociada quedara sin GRE",
      message: `${comprobante_gre_grabado}`,
      icon: "success",
      confirmText: "LIBERAR",
      cancelText: "CANCELAR",
    });
    if (!result.isConfirmed) return;

    try {
      // 🚀 Construcción de payload
      const payload = {
        p_periodo: periodoTrabajo,
        p_id_usuario: idAnfitrion,
        p_documento_id: contabilidadTrabajo,
        p_r_cod: GRE_COD,
        p_r_serie: GRE_SERIE,
        p_r_numero: GRE_NUMERO,
        p_comprobante: comprobante_venta,
      };

      //console.log("Payload SUNAT GRE:", payload);
      const response = await axios.put(`${backHost}/ad_ventagresunat`, payload);

      if (response.data.success) {
        setRutaXml(null);
        setRutaCdr(null);
        setRutaPdf(null);
        //firma = response.data.codigo_hash;
        //setShowModal(true);

        await confirmDialog({
          title: "Venta Liberada de: ",
          message: `${comprobante_gre_grabado}`,
          icon: "success",
          confirmText: "ACEPTAR",
        });

        setComprobanteGreGrabado(null);
      }
    } catch (error) {
      await confirmDialog({
        title: "Error de Liberación: ",
        message: `${comprobante_gre_grabado}`,
        icon: "error",
        confirmText: "ACEPTAR",
      });
    }
  };

  return (
    <>
      {/* Ícono */}
      <img
        src={Sunat01Icon}
        //onClick={() => setShowModal(true)}
        onClick={handleOpenModal}
        alt="Icono Sunat01"
        style={{
          cursor: "pointer",
          filter:
            firma == null || firma === "" ? "grayscale(0.8)" : "grayscale(0)",
          transition: "color 0.3s ease",
          width: size,
          height: size,
        }}
      />

      {/* Modal */}
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        maxWidth="md"
        disableScrollLock
        PaperProps={{
          style: {
            top: isSmallScreen ? "-10vh" : "0vh",
            left: isSmallScreen ? "-5%" : "0%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "0vh",
            background: "rgba(30, 39, 46, 0.95)",
            color: "white",
            width: isSmallScreen ? "70%" : "26%",
            padding: "1rem",
          },
        }}
      >
        <Box sx={{ width: "100%" }}>
        <DialogTitle sx={{
                          fontSize: "1.25rem",
                          fontWeight: "bold",
                          textAlign: "center",   // centrado horizontal
                          py: 0, // padding vertical
                        }}
        >Emisión GRE</DialogTitle>

        {(comprobante_gre_grabado && rutaXml !== null) && (  
          <Button
            variant="contained"
            //color="inherit"
            onClick={handleLiberar}
            sx={{ //display: "block", 
                  display: "flex",          // 🔹 asegura layout en fila
                  alignItems: "center",     // centra verticalmente
                  margin: ".0rem 0", 
                  width: 320, 
                  mt: 0, 
                  backgroundColor: "rgba(30, 49, 46, 0.9)",
                  "&:hover": { backgroundColor: "rgba(30, 49, 46, 0.9)" },
              }}
          >
            LIBERAR: {comprobante_gre_grabado}
          </Button>
        )}
        </Box>

        {/* Motivo */}
        <FormControl fullWidth sx={{ my: 1 }}>
          <InputLabel>Motivo</InputLabel>
          <Select
            value={formData.guia_motivo_id}
            //onChange={(e) => setMotivo(e.target.value)}
            onChange={handleChange}
            label="Motivo"
            name="guia_motivo_id"
            size='small'
            sx={{display:'block',
                  //margin:'.4rem 0', 
                  mt:-1,
                  width: '320px',  // Establece el ancho fijo aquí
                  textAlign: 'center',  // Centrar el texto seleccionado
                  '.MuiSelect-select': { 
                    textAlign: 'center',  // Centrar el valor dentro del Select
                  },                                                         
                  color:"white"}}
          >
            {motivosSunat.map((m) => (
              <MenuItem key={m.codigo} value={m.codigo}>
                {m.descripcion}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Modalidad */}
        <FormControl fullWidth sx={{ my: 0 }}>
          <InputLabel>Modalidad</InputLabel>
          <Select
            value={formData.guia_modalidad_id}
            //onChange={(e) => setModalidad(e.target.value)}
            onChange={handleChange}
            label="Modalidad"
            name="guia_modalidad_id"
            size='small'
            sx={{display:'block',
                  //margin:'.4rem 0', 
                  mt:-1,
                  width: '320px',  // Establece el ancho fijo aquí
                  textAlign: 'center',  // Centrar el texto seleccionado
                  '.MuiSelect-select': { 
                    textAlign: 'center',  // Centrar el valor dentro del Select
                  },                                                         
                  color:"white"}}
          >
            <MenuItem value="01">Público</MenuItem>
            <MenuItem value="02">Privado</MenuItem>
          </Select>
        </FormControl>

          <Box sx={{ width: "100%" }}>
            <TextField
              size="small"
              autoComplete="off"
              label="Emision"
              type="date"
              name="fecha_emision"
              value={formData.fecha_emision || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              size="small"
              autoComplete="off"
              label="Traslado"
              type="date"
              name="fecha_traslado"
              value={formData.fecha_traslado || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              size="small"
              autoComplete="off"
              label="Destinatario RUC"
              name="destinatario_ruc_dni"
              value={formData.destinatario_ruc_dni || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              size="small"
              autoComplete="off"
              label="Destinatario Razon Social"
              name="destinatario_razon_social"
              value={formData.destinatario_razon_social || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />

            <TextField
              size="small"
              autoComplete="off"
              label="Partida Ubigeo"
              name="partida_ubigeo"
              value={formData.partida_ubigeo || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              //inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
              InputProps={{
                style: { color: 'white', width: 320, textAlign: 'center' },
                startAdornment: (
                  <InputAdornment position="start">
                      <IconButton
                        color="primary"
                        //color = 'rgba(33, 150, 243, 0.8)'
                        aria-label="upload picture"
                        component="label"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: 0,
                          transform: 'translateY(-50%)',
                        }}
                        onClick={() => {
                          setShowModalUbigeoPartidaLista(true);
                        }}
                      >
                        <FindIcon />
                      </IconButton>
                  </InputAdornment>
                ),

                // Aquí se ajusta el padding del texto sin afectar el icono
                inputProps: {
                  style: {
                    textAlign: 'center'
                    //paddingLeft: '32px', // Mueve solo el texto a la derecha
                      //fontSize: '12px', // Ajusta el tamaño de letra aquí
                  },
                },
              }}
            />
                <ListaPopUp
                    registroPopUp={ubigeo_select}
                    showModal={showModalUbigeoPartidaLista}
                    setShowModal={setShowModalUbigeoPartidaLista}
                    registro={formData}
                    setRegistro={setFormData}
                    idCodigoKey="partida_ubigeo"
                    descripcionKey="partida_direccion"
                    auxiliarKey="auxiliar"
                />

            <TextField
              autoComplete="off"
              size="small"
              label="Partida Dirección"
              name="partida_direccion"
              value={formData.partida_direccion || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />

            <TextField
              autoComplete="off"
              size="small"
              label="Llegada Ubigeo"
              name="llegada_ubigeo"
              value={formData.llegada_ubigeo || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              //inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
              InputProps={{
                style: { color: 'white', width: 320, textAlign: 'center' },
                startAdornment: (
                  <InputAdornment position="start">
                      <IconButton
                        color="primary"
                        //color = 'rgba(33, 150, 243, 0.8)'
                        aria-label="upload picture"
                        component="label"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: 0,
                          transform: 'translateY(-50%)',
                        }}
                        onClick={() => {
                          setShowModalUbigeoLLegadaLista(true);
                        }}
                      >
                        <FindIcon />
                      </IconButton>
                  </InputAdornment>
                ),

                // Aquí se ajusta el padding del texto sin afectar el icono
                inputProps: {
                  style: {
                    textAlign: 'center'
                    //paddingLeft: '32px', // Mueve solo el texto a la derecha
                      //fontSize: '12px', // Ajusta el tamaño de letra aquí
                  },
                },
              }}
            />
                <ListaPopUp
                    registroPopUp={ubigeo_select}
                    showModal={showModalUbigeoLLegadaLista}
                    setShowModal={setShowModalUbigeoLLegadaLista}
                    registro={formData}
                    setRegistro={setFormData}
                    idCodigoKey="llegada_ubigeo"
                    descripcionKey="llegada_direccion"
                    auxiliarKey="auxiliar"
                />

            <TextField
              autoComplete="off"
              size="small"
              label="Llegada Dirección"
              name="llegada_direccion"
              value={formData.llegada_direccion || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Peso Total"
              name="peso_total"
              value={formData.peso_total || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
          </Box>

        {/* Campos dinámicos */}
        {formData.guia_modalidad_id === "01" && (
          <Box sx={{ width: "100%" }}>
            <TextField
              size="small"
              autoComplete="off"
              label="RUC Transportista"
              name="transp_ruc"
              value={formData.transp_ruc || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 255, textAlign: 'center'} }}
              //InputLabelProps={{ style:{color:'white'} }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      color="warning"
                      onClick={() => {
                        // acción del botón de búsqueda
                        mostrarRazonSocialGenera(formData.transp_ruc);
                      }}
                      edge="end"
                    >
                      <FindIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              size="small"
              autoComplete="off"
              label="Razón Social Transportista"
              name="transp_razon_social"
              value={formData.transp_razon_social || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
          </Box>
        )}

        {formData.guia_modalidad_id === "02" && (
          <Box sx={{ width: "100%" }}>
            <TextField
              //fullWidth
              size="small"
              autoComplete="off"
              label="Conductor DNI"
              name="conductor_dni"
              value={formData.conductor_dni || ''}
              onChange={handleChange}
              sx={{ my: 0 }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Conductor Nombres"
              name="conductor_nombres"
              value={formData.conductor_nombres || ''}
              onChange={handleChange}
              sx={{ my: 0 }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Conductor Apellidos"
              name="conductor_apellidos"
              value={formData.conductor_apellidos || ''}
              onChange={handleChange}
              sx={{ my: 0 }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Conductor Licencia"
              name="conductor_licencia"
              value={formData.conductor_licencia || ''}
              onChange={handleChange}
              sx={{ my: 0 }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
            <TextField
              autoComplete="off"
              size="small"
              label="Placa Vehículo"
              name="vehiculo_placa"
              value={formData.vehiculo_placa || ''}
              onChange={handleChange}
              sx={{ mt:0, }}
              inputProps={{ style:{color:'white',width: 290, textAlign: 'center'} }}
              InputLabelProps={{ style:{color:'white'} }}
            />
          </Box>
        )}

        {!comprobante_gre_grabado && (
          <Box sx={{ width: "100%" }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleGrabarBD}
            sx={{ //display: "block", 
                  display: "flex",          // 🔹 asegura layout en fila
                  alignItems: "center",     // centra verticalmente
                  margin: ".0rem 0", 
                  width: 320, 
                  mt: 0, 
                  //color: "black", 
                  //fontWeight: "bold",
              }}
            disabled={
                      !formData.partida_ubigeo 
                      || !formData.partida_direccion
                      || !formData.llegada_ubigeo 
                      || !formData.llegada_direccion
                      || !formData.peso_total
                      || !formData.guia_motivo_id
                      || !formData.guia_modalidad_id
                      || (formData.guia_modalidad_id === "01" && ( !formData.transp_ruc || !formData.transp_razon_social ))
                      || (formData.guia_modalidad_id === "02" && ( !formData.conductor_dni || !formData.conductor_nombres || !formData.conductor_apellidos || !formData.conductor_licencia || !formData.vehiculo_placa ))
                      }
          >
            Grabar GRE
          </Button>
          </Box>
        )}

        
        <Box sx={{ width: "100%" }}>

          {(comprobante_gre && rutaXml === null) && (  
          <Button
            variant="contained"
            color="warning"
            onClick={handleGrabarBD}
            sx={{ //display: "block", 
                  display: "flex",          // 🔹 asegura layout en fila
                  alignItems: "center",     // centra verticalmente
                  margin: ".0rem 0", 
                  width: 320, 
                  mt: 0, 
                  //color: "black", 
                  //fontWeight: "bold",
              }}
          >
            Modificar GRE
          </Button>
          )}

          {(comprobante_gre_grabado && rutaXml === null) && (  
          <Button
            variant="contained"
            color="primary"
            onClick={handleSunat}
            sx={{ //display: "block", 
                  display: "flex",          // 🔹 asegura layout en fila
                  alignItems: "center",     // centra verticalmente
                  margin: ".0rem 0", 
                  width: 320, 
                  mt: 0, 
                  //color: "black", 
                  //fontWeight: "bold",
              }}
          >
            Enviar GRE - SUNAT
          </Button>
          )}

        {(rutaXml !== "" && rutaXml !== null) && (
          <Box 
                sx={{ 
                    width: isSmallScreen ? "103%" : "320px", 
                    display: "flex", 
                    flexDirection: "row",   // 🔹 en fila
                    gap: 0,                 // 🔹 espacio entre botones
                    justifyContent: "left"// 🔹 centrados horizontalmente
                  }}          
          >
              <Button
                variant="contained"
                //color="primary"
                color="inherit"
                onClick={() => handleOpenLink(rutaXml)}
                sx={{ //display: "block", 
                      display: "flex",          // 🔹 asegura layout en fila
                      alignItems: "center",     // centra verticalmente
                      margin: ".5rem 0", 
                      width: 106,
                      color: "black", 
                      fontWeight: "bold",
                      }}
                startIcon={<CodeIcon />} 
              >
                XML
              </Button>

              <Button
                variant="contained"
                //color="inherit"
                color="primary"
                onClick={() => handleOpenLink(rutaCdr)}
                sx={{ //display: "block", 
                      display: "flex",          // 🔹 asegura layout en fila
                      alignItems: "center",     // centra verticalmente
                      margin: ".5rem 0", 
                      width: 106, 
                      //mt: -0.5, 
                      //color: "black", 
                      fontWeight: "bold",
                  }}
                startIcon={<TaskAltIcon />} 
              >
                CDR
              </Button>

              <Button
                variant="contained"
                color="warning"
                onClick={() => handleOpenLink(rutaPdf)}
                sx={{ //display: "block", 
                      display: "flex",          // 🔹 asegura layout en fila
                      alignItems: "center",     // centra verticalmente
                      //justifyContent: "flex-start", // texto alineado con el ícono            
                      margin: ".5rem 0", 
                      width: "100%", 
                      //mt: -0.5, 
                      fontWeight: "bold" }}
                startIcon={<DescriptionIcon />}
              >
                PDF
              </Button>

          </Box>
        )}


        <Button
          variant="contained"
          onClick={handleCloseModal}
          sx={{
            display: "block",
            margin: ".0rem 0",
            width: 320,
            backgroundColor: "rgba(30, 39, 46, 0.9)",
            "&:hover": { backgroundColor: "rgba(30, 39, 46, 0.1)" },
            mt: 0,
          }}
        >
          ESC - CERRAR
        </Button>

        </Box>

      </Dialog>
    </>
  );
};

export default AdminSunatGreIcon;
