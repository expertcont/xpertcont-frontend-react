import {BrowserRouter,Routes,Route} from "react-router-dom";
import {Container,useMediaQuery} from "@mui/material";
import NavBar from "./components/NavBar";
import CorrentistaForm from "./components/CorrentistaForm";
import CorrentistaList from "./components/CorrentistaList";
import SeguridadList from "./components/SeguridadList";
import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import Inicio from "./components/Inicio";
import { useEffect } from 'react';

import AsientoCompraForm from './components/AsientoCompraForm';
import AsientoList from './components/AsientoList';
import ContabilidadList from './components/ContabilidadList';
import ContabilidadForm from './components/ContabilidadForm';
import CuentaList from './components/CuentaList';
import CuentaForm from './components/CuentaForm';


function App(props) {
  //Aqui los props, seran: id_usuario(correo anfitrion),id_login(correo usuario)
  //los props llegan desde BienvenidaExpert.js
  
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";  
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const {user, isAuthenticated } = useAuth0();

  //const [periodo_trabajo, setPeriodoTrabajo] = useState("");
  //const [periodo_select,setPeriodosSelect] = useState([]);

  //const [contabilidad_trabajo, setContabilidadTrabajo] = useState("");
  //const [contabilidad_select,setContabilidadesSelect] = useState([]);
  /*const libros_select = [
    { id_libro: '014', nombre: 'VENTAS'},
    { id_libro: '008', nombre: 'COMPRAS'},
    { id_libro: '001', nombre: 'CAJA'},
    { id_libro: '005', nombre: 'DIARIO'},
    // INFO ESTATICA
  ];*/


  //Aqui se leen parametros en caso lleguen
  useEffect( ()=> {
    if (isAuthenticated && user && user.email) {
      //Verificar Estudios Contables registrados
      //Solo carga ultima contabilidad habilitada
      //todo esto fue a parar al NavBar
    }  

  },[isAuthenticated, user]);

  return (
    <BrowserRouter>

      <div>
      <NavBar idAnfitrion = {props.idAnfitrion}
              idInvitado = {props.idInvitado}
              //periodo_trabajo = {periodo_trabajo}
              //contabilidad_trabajo = {contabilidad_trabajo}
      >
      </NavBar>
      
      <Container>
        <Routes>
          
         { /* Agregar desde Panel (un registro01 Libre)
               Agregar Clonado desde Panel (un registro01 con Numero Orden y datos adicionales)
               Agregar desde Form Orden (un registro01 con Numero Orden)   */ }

          <Route path="/asiento/:id_anfitrion/:id_invitado/:periodo/:documento_id" element={<AsientoList />} />
          <Route path="/asientoc/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro/new" element={<AsientoCompraForm />} />
          <Route path="/asientoc/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro/:num_asiento/edit" element={<AsientoCompraForm />} /> 

          <Route path="/contabilidades/:id_usuario" element={<ContabilidadList />} />
          <Route path="/contabilidad/new" element={<ContabilidadForm />} />
          <Route path="/contabilidad/:id_usuario/:documento_id/edit" element={<ContabilidadForm />} />
          
          <Route path="/cuentas/:id_usuario/:documento_id" element={<CuentaList />} />
          <Route path="/cuenta/:id_usuario/:documento_id/new" element={<CuentaForm />} />
          <Route path="/cuenta/:id_usuario/:documento_id/edit" element={<CuentaForm />} />

          {/*  modo=edit, modo=clon  

          <Route path="/ventadet/:cod/:serie/:num/:elem/:fecha/new" element={<VentaFormDet />} />
          <Route path="/ventadet/:cod/:serie/:num/:elem/:item/edit" element={<VentaFormDet />} /> 

          <Route path="/venta/:fecha_ini/:fecha_proceso/:email" element={<VentaList />} />
          <Route path="/venta/new" element={<VentaForm />} />
          <Route path="/venta/:cod/:serie/:num/:elem/edit" element={<VentaForm />} /> 
          */}

          <Route path="/correntista" element={<CorrentistaList />} />          
          <Route path="/correntista/new" element={<CorrentistaForm />} />
          <Route path="/correntista/:id/edit" element={<CorrentistaForm />} /> 


          <Route path="/" element={<Inicio />} />

          <Route path="/seguridad" element={<SeguridadList />} />          
          {/*Edit Route */}
        </Routes>
      </Container>
      
      </div>
    </BrowserRouter>


    );
}

export default App;
