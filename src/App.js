import {BrowserRouter,Routes,Route} from "react-router-dom";
import {Container} from "@mui/material";
import NavBar from "./components/NavBar";
import CorrentistaForm from "./components/CorrentistaForm";
import CorrentistaList from "./components/CorrentistaList";
import SeguridadList from "./components/SeguridadList";
import { useAuth0 } from '@auth0/auth0-react'; 
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

import AdminVentaList from "./components/Admin/AdminVentaList";
import AdminProductoList from "./components/Admin/AdminProductoList";
import AdminProductoForm from "./components/Admin/AdminProductoForm";
import AdminVentaForm from "./components/Admin/AdminVentaForm";
import AdminEquipoList from "./components/Admin/AdminEquipoList";
import AdminEquipoForm from "./components/Admin/AdminEquipoForm";
import AdminProductoFormPrecio from "./components/Admin/AdminProductoFormPrecio";

// 👇 Importa el ConfirmProvider
//import { DialogProvider } from "./components/Admin/AdminConfirmDialogProvider";
import { AdminConfirmDialogProvider } from "./components/Admin/AdminConfirmDialogProvider";

function App(props) {
  const {user, isAuthenticated } = useAuth0();

  useEffect( ()=> {
    if (isAuthenticated && user && user.email) {
      // lógica de verificación (NavBar)
    }  
  },[isAuthenticated, user]);

  return (
    <BrowserRouter>
      {/* 👇 Aquí envolvemos TODO dentro del ConfirmProvider */}
      <AdminConfirmDialogProvider>
        <div>
          <NavBar 
            idAnfitrion={props.idAnfitrion}
            idInvitado={props.idInvitado}
          />

          <Container>
            <Routes>
              {/* tus rutas originales, sin cambios */}
              <Route path="/ad_equipo/:id_anfitrion/:id_invitado/:documento_id" element={<AdminEquipoList />} />          
              <Route path="/ad_equipo/:id_anfitrion/:id_invitado/:documento_id/new" element={<AdminEquipoForm />} />          
              <Route path="/ad_equipo/:id_anfitrion/:id_invitado/:documento_id/:id_equipo/edit" element={<AdminEquipoForm />} />

              <Route path="/ad_venta/:id_anfitrion/:id_invitado/:periodo/:documento_id" element={<AdminVentaList />} />
              <Route path="/ad_venta/:id_anfitrion/:id_invitado/:periodo/:documento_id/new" element={<AdminVentaForm />} />
              <Route path="/ad_venta/:id_anfitrion/:id_invitado/:periodo/:documento_id/:comprobante/:comprobante_ref" element={<AdminVentaForm />} />
              <Route path="/ad_venta/:id_anfitrion/:id_invitado/:periodo/:documento_id/:comprobante/view" element={<AdminVentaForm />} />

              <Route path="/ad_producto/:id_anfitrion/:id_invitado/:documento_id" element={<AdminProductoList />} />          
              <Route path="/ad_producto/:id_anfitrion/:id_invitado/:documento_id/new" element={<AdminProductoForm />} />          
              <Route path="/ad_producto/:id_anfitrion/:id_invitado/:documento_id/:id_producto/edit" element={<AdminProductoForm />} />
              <Route path="/ad_productoprecio/:id_anfitrion/:id_invitado/:documento_id/:id_producto/:unidades/edit" element={<AdminProductoFormPrecio />} />

              <Route path="/reporte/:id_anfitrion/:id_invitado" element={<ReportesList />} />

              <Route path="/asientodet/:id_anfitrion/:id_invitado/:documento_id/:periodo/:id_libro/:num_asiento/new" element={<AsientoDetalleForm />} />
              <Route path="/asientodet/:id_anfitrion/:id_invitado/:documento_id/:periodo/:id_libro/:num_asiento/:item/edit" element={<AsientoDetalleForm />} />
              
              <Route path="/asientodet/:id_anfitrion/:id_invitado/:documento_id/:periodo/:id_libro/new" element={<AsientoDetalleList />} />
              <Route path="/asientodet/:id_anfitrion/:id_invitado/:documento_id/:periodo/:id_libro/:num_asiento/edit" element={<AsientoDetalleList />} />

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
              <Route path="/contabilidad/:id_anfitrion/:documento_id/:tipo/edit" element={<ContabilidadForm />} />
              
              <Route path="/cuentas/:id_usuario/:documento_id" element={<CuentaList />} />
              <Route path="/cuenta/:id_usuario/:documento_id/new" element={<CuentaForm />} />
              <Route path="/cuenta/:id_usuario/:documento_id/edit" element={<CuentaForm />} />

              <Route path="/correntista" element={<CorrentistaList />} />          
              <Route path="/correntista/new" element={<CorrentistaForm />} />
              <Route path="/correntista/:id/edit" element={<CorrentistaForm />} /> 

              <Route path="/:id_anfitrion/:id_invitado" element={<Inicio />} />

              <Route path="/seguridad/:id_anfitrion" element={<SeguridadList />} />          
              <Route path="/seguridad/contabilidades/:id_anfitrion/:id_invitado" element={<SeguridadContabilidad />} />          
              <Route path="/sirecomparacion/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro" element={<SireComparacionForm />} /> 
              <Route path="/asientogenerador/:id_anfitrion/:id_invitado/:periodo/:documento_id/:id_libro" element={<AsientoListPrev />} /> 
            </Routes>
          </Container>
        </div>
      </AdminConfirmDialogProvider>
    </BrowserRouter>
  );
}

export default App;
