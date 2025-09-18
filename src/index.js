import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Auth0Provider } from '@auth0/auth0-react';
import BienvenidaXpert from './components/BienvenidaXpert'; // Importa el componente de bienvenida


const domain = "dev-i4ndxhhmhmbyd4tt.us.auth0.com"; //auth0 propio expertcontperu@gmail.com

//Version Local
//const clientId = "sRVhE9SzcBOGmeDSncrECCLuGA88O8FQ"; //auth0 propio expertcontperu@gmail.com

//Version Web Ralwaiy
//const clientId = "cVGIEcCJEINGNoLG9khMuXeErdZ3C8jm"; //auth0 propio expertcontperu@gmail.com

//Version Web expertcont.pe
const clientId = "vFKcLZ6SHdwEWUWrMzkty0PDVjLbTZrW"; //auth0 propio expertcontperu@gmail.com

const root = ReactDOM.createRoot(document.getElementById('root'));

function Main() {
  // Define un estado para controlar si se muestra la pantalla de bienvenida o la aplicación principal.
  const [showApp, setShowApp] = React.useState(false);
  const [idAnfitrion, setIdAnfitrion] = React.useState(null);
  const [idInvitado, setIdInvitado] = React.useState(null);

  // Función para cambiar al contenido de la aplicación principal
  const startApp = (usuario, invitado) => {
    setIdAnfitrion(usuario);
    setIdInvitado(invitado);    
    setShowApp(true);
  };

  return (
    <React.StrictMode>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          //redirect_uri: "http://localhost:3000"
          //redirect_uri: "https://expertcont.up.railway.app/"
          redirect_uri: "https://expertcont.pe/"
        }}
      >
        {/* Renderiza la pantalla de bienvenida o la aplicación principal según el estado */}
        {showApp ? (
          <App idAnfitrion={idAnfitrion} idInvitado={idInvitado} />
        ) : (
          <BienvenidaXpert onStartClick={startApp} />
        )}
      </Auth0Provider>
    </React.StrictMode>
  );
}

root.render(
  <Main />,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();