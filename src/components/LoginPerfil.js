import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';

const LoginPerfil = () => {
    const {user, isAuthenticated } = useAuth0();
    /* <h2>{user.name}</h2>
        <p>{extraerNombreDeCorreo(user.email)}</p>
    */
    function extraerNombreDeCorreo(correoElectronico) {
        var indiceArroba = correoElectronico.indexOf('@');
        
        if (indiceArroba !== -1) {
          var nombre = correoElectronico.substring(0, indiceArroba);
          return nombre;
        } else {
          return "";
        }
    }

    return(
    isAuthenticated && (
    <div>
      <Tooltip title={extraerNombreDeCorreo(user.email)}>
        <Avatar src={user.picture} alt={user.name}></Avatar>  
      </Tooltip>
    </div>
    )
    );
};

export default LoginPerfil;