import {BrowserRouter,Routes,Route} from "react-router-dom";
import {Container} from "@mui/material";
import NavBar from "./components/NavBar";
import CorrentistaForm from "./components/CorrentistaForm";
import CorrentistaList from "./components/CorrentistaList";
import SeguridadList from "./components/SeguridadList";
import { useAuth0 } from '@auth0/auth0-react'; //new para cargar permisos luego de verificar registro en bd
import Inicio from "./components/Inicio";
import { useEffect } from 'react';

import AsientoVentaForm from './components/AsientoVentaForm';
import AsientoCompraForm from './components/AsientoCompraForm';
import AsientoList from './components/AsientoList';
import ContabilidadList from './components/ContabilidadList';
import ContabilidadForm from './components/ContabilidadForm';
import CuentaList from './components/CuentaList';
import CuentaForm from './components/CuentaForm';
import SireComparacionForm from "./components/SireComparacionForm";
import SeguridadContabilidad from "./components/SeguridadContabilidad";
import AsientoListPrev from "./components/AsientoListPrev";
import AsientoDetalleList from "./components/AsientoDetalleList";
import AsientoDetalleForm from "./components/AsientoDetalleForm";
import ReportesList from "./components/ReportesList";
import AsientoGenericoForm from "./components/AsientoGenericoForm";

function App(props) {
  //Aqui los props, seran: id_usuario(correo anfitrion),id_login(correo usuario)
  //los props llegan desde BienvenidaExpert.js
  
  //verificamos si es pantalla pequeña y arreglamos el grid de fechas
  const {user, isAuthenticated } = useAuth0();


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

          <Route path="/reporte/:id_anfitrion/:id_invitado" element={<ReportesList />} />

          <Route path="/asientodet/:id_anfitrion/:id_invitado/:documento_id/:periodo/:id_libro/:num_asiento/new" element={<AsientoDetalleForm />} />
          <Route path="/asientodet/:id_anfitrion/:id_invitado/:documento_id/:periodo/:id_libro/:num_asiento/:item/edit" element={<AsientoDetalleForm />} />
          <Route path="/asientodet/:id_anfitrion/:id_invitado/:documento_id/:periodo/:id_libro/:num_asiento" element={<AsientoDetalleList />} />
          
          <Route path="/asiento/:id_anfitrion/:id_invitado/:periodo/:documento_id" element={<AsientoList />} />
          
          <Route path="/asientog/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro/new" element={<AsientoGenericoForm />} />
          <Route path="/asientog/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro/:num_asiento/edit" element={<AsientoGenericoForm />} /> 

          <Route path="/asientoc/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro/new" element={<AsientoCompraForm />} />
          <Route path="/asientoc/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro/:num_asiento/edit" element={<AsientoCompraForm />} /> 
          <Route path="/asientoc/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro/:num_asiento/clonar" element={<AsientoCompraForm />} /> 

          <Route path="/asientov/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro/new" element={<AsientoVentaForm />} />
          <Route path="/asientov/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro/:num_asiento/edit" element={<AsientoVentaForm />} /> 
          <Route path="/asientov/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro/:num_asiento/clonar" element={<AsientoVentaForm />} /> 

          <Route path="/contabilidades/:id_anfitrion/:id_invitado" element={<ContabilidadList />} />
          <Route path="/contabilidad/:id_anfitrion/new" element={<ContabilidadForm />} />
          <Route path="/contabilidad/:id_anfitrion/:documento_id/edit" element={<ContabilidadForm />} />
          
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

          <Route path="/:id_anfitrion/:id_invitado" element={<Inicio />} />

          <Route path="/seguridad/:id_anfitrion" element={<SeguridadList />} />          
          <Route path="/seguridad/contabilidades/:id_anfitrion/:id_invitado" element={<SeguridadContabilidad />} />          
          <Route path="/sirecomparacion/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro" element={<SireComparacionForm />} /> 
          <Route path="/asientogenerador/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro" element={<AsientoListPrev />} /> 

          {/*Edit Route */}
        </Routes>
      </Container>
      
      </div>
    </BrowserRouter>


    );
}

export default App;
