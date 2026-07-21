import React from 'react';
import { useEffect, useState } from "react";
import { Grid, IconButton, TextField, InputAdornment, Tooltip, useMediaQuery } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import FindIcon from '@mui/icons-material/FindInPage';
import AddBoxIcon from '@mui/icons-material/AddBox';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Checkbox from '@mui/material/Checkbox';
import { blueGrey } from '@mui/material/colors';
import swal from 'sweetalert';
import Datatable, { createTheme } from 'react-data-table-component';
import { useAuth0 } from '@auth0/auth0-react';
import BotonExcelVentas from '../BotonExcelVentas';
import '../../App.css';
import 'styled-components';

export default function AdminUsuariosGrupoList() {
  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";

  createTheme('solarized', {
    text: {
      primary: '#ffffff',
      secondary: '#2aa198',
    },
    background: {
      default: '#1e272e'
    },
    context: {
      background: '#cb4b16',
      text: '#FFFFFF',
    },
    divider: {
      default: '#073642',
    },
    action: {
      button: 'rgba(0,0,0,.54)',
      hover: 'rgba(0,0,0,.08)',
      disabled: 'rgba(0,0,0,.12)',
    },
  }, 'dark');

  const navigate = useNavigate();
  const params = useParams();
  const { user, isAuthenticated } = useAuth0();

  const [updateTrigger, setUpdateTrigger] = useState({});
  const [toggleCleared, setToggleCleared] = useState(false);
  const [registrosdet, setRegistrosdet] = useState([]);
  const [tabladet, setTabladet] = useState([]);
  const [valorBusqueda, setValorBusqueda] = useState("");

  const [pUsuarioGrupo0101, setPUsuarioGrupo0101] = useState(false);
  const [pUsuarioGrupo0102, setPUsuarioGrupo0102] = useState(false);
  const [pUsuarioGrupo0103, setPUsuarioGrupo0103] = useState(false);

  const usuariosGrupoEjemplo = [
    {
      id_usuario: 'admin@xpertcont.com',
      id_invitado: 'contador01@gmail.com',
      fecha_ingreso: '2026-07-17T08:30:00',
      ultimo_login: '2026-07-17T18:05:00',
      activo: true,
      sin_restriccion: false,
      turno1_inicio: '08:00:00',
      turno1_fin: '12:30:00',
      turno2_inicio: '14:00:00',
      turno2_fin: '18:00:00',
      turno3_inicio: null,
      turno3_fin: null,
    },
    {
      id_usuario: 'admin@xpertcont.com',
      id_invitado: 'ventas.xpert@gmail.com',
      fecha_ingreso: '2026-07-16T09:15:00',
      ultimo_login: '2026-07-17T10:20:00',
      activo: true,
      sin_restriccion: true,
      turno1_inicio: null,
      turno1_fin: null,
      turno2_inicio: null,
      turno2_fin: null,
      turno3_inicio: null,
      turno3_fin: null,
    },
    {
      id_usuario: 'admin@xpertcont.com',
      id_invitado: 'almacen.turno@gmail.com',
      fecha_ingreso: '2026-07-15T07:45:00',
      ultimo_login: null,
      activo: false,
      sin_restriccion: false,
      turno1_inicio: '07:00:00',
      turno1_fin: '11:00:00',
      turno2_inicio: '12:00:00',
      turno2_fin: '16:00:00',
      turno3_inicio: '18:00:00',
      turno3_fin: '21:00:00',
    },
  ];

  const encodePath = (value) => encodeURIComponent(value || '');
  const formatBoolean = (value) => value ? 'SI' : 'NO';
  const formatDateTime = (value) => value ? String(value).replace('T', ' ').substring(0, 19) : '';
  const formatTime = (value) => value ? String(value).substring(0, 5) : '';

  const columnas = [
    {
      name: '',
      width: '40px',
      cell: (row) => (
        pUsuarioGrupo0102 ? (
          <DriveFileRenameOutlineIcon
            onClick={() => handleUpdate(row.id_invitado)}
            style={{
              cursor: 'pointer',
              color: 'skyblue',
              transition: 'color 0.3s ease',
            }}
          />
        ) : null
      ),
      allowOverflow: true,
      button: true,
    },
    {
      name: '',
      width: '40px',
      cell: (row) => (
        pUsuarioGrupo0103 ? (
          <DeleteIcon
            onClick={() => handleDelete(row.id_invitado)}
            style={{
              cursor: 'pointer',
              color: 'orange',
              transition: 'color 0.3s ease',
            }}
          />
        ) : null
      ),
      allowOverflow: true,
      button: true,
    },
    {
      name: 'USUARIO',
      selector: row => row.id_usuario,
      sortable: true,
      width: '260px',
    },
    {
      name: 'INVITADO',
      selector: row => row.id_invitado,
      sortable: true,
      width: '260px',
    },
    {
      name: 'INGRESO',
      selector: row => formatDateTime(row.fecha_ingreso),
      sortable: true,
      width: '165px',
    },
    {
      name: 'ULT. LOGIN',
      selector: row => formatDateTime(row.ultimo_login),
      sortable: true,
      width: '165px',
    },
    {
      name: 'ACTIVO',
      selector: row => formatBoolean(row.activo),
      sortable: true,
      width: '95px',
    },
    {
      name: 'SIN RESTR.',
      selector: row => formatBoolean(row.sin_restriccion),
      sortable: true,
      width: '120px',
    },
    {
      name: 'TURNO 1',
      selector: row => `${formatTime(row.turno1_inicio)} - ${formatTime(row.turno1_fin)}`,
      sortable: true,
      width: '140px',
    },
    {
      name: 'TURNO 2',
      selector: row => `${formatTime(row.turno2_inicio)} - ${formatTime(row.turno2_fin)}`,
      sortable: true,
      width: '140px',
    },
    {
      name: 'TURNO 3',
      selector: row => `${formatTime(row.turno3_inicio)} - ${formatTime(row.turno3_fin)}`,
      sortable: true,
      width: '140px',
    },
  ];

  const handleUpdate = (id_invitado) => {
    navigate(`/ad_usuariogrupo/${params.id_anfitrion}/${params.id_invitado}/${encodePath(id_invitado)}/edit`);
  };

  const handleDelete = (id_invitado) => {
    confirmaEliminacion(params.id_anfitrion, id_invitado);
  };

  const confirmaEliminacion = async (sUsuario, sInvitado) => {
    await swal({
      title: "Eliminar Registro",
      text: "Seguro ?",
      icon: "warning",
      buttons: ["No", "Si"]
    }).then(respuesta => {
      if (respuesta) {
        eliminarRegistroSeleccionado(sUsuario, sInvitado);
        setToggleCleared(!toggleCleared);
        setRegistrosdet(registrosdet.filter(registro => registro.id_invitado !== sInvitado));
        setTimeout(() => {
          setUpdateTrigger(Math.random());
        }, 200);

        swal({
          text: "Usuario invitado se ha eliminado con exito",
          icon: "success",
          timer: "2000"
        });
      }
    });
  };

  const eliminarRegistroSeleccionado = async (sUsuario, sInvitado) => {
    await fetch(`${back_host}/ad_usuariogrupo/${encodePath(sUsuario)}/${encodePath(sInvitado)}`, {
      method: "DELETE"
    });
  };

  const cargaRegistro = async () => {
    const usarJsonEjemplo = true;
    let data = usuariosGrupoEjemplo;

    if (!usarJsonEjemplo) {
      const response = await fetch(`${back_host}/ad_usuariogrupo/${encodePath(params.id_anfitrion)}`);
      data = await response.json();
    }

    setRegistrosdet(data);
    setTabladet(data);
  };

  const actualizaValorFiltro = e => {
    setValorBusqueda(e.target.value);
    filtrar(e.target.value);
  };

  const filtrar = (strBusca) => {
    const texto = strBusca.toLowerCase();
    const resultadosBusqueda = tabladet.filter((elemento) => {
      const idUsuario = elemento.id_usuario?.toString().toLowerCase() || '';
      const idInvitado = elemento.id_invitado?.toString().toLowerCase() || '';
      return idUsuario.includes(texto) || idInvitado.includes(texto);
    });

    setRegistrosdet(resultadosBusqueda);
  };

  const cargaPermisosMenuComando = async (idMenu) => {
    if (params.id_anfitrion === params.id_invitado) {
      setPUsuarioGrupo0101(true);
      setPUsuarioGrupo0102(true);
      setPUsuarioGrupo0103(true);
    } else {
      fetch(`${back_host}/seguridad/${params.id_anfitrion}/${params.id_invitado}/${idMenu}`, {
        method: 'GET'
      })
        .then(response => response.json())
        .then(permisosData => {
          setPUsuarioGrupo0101(permisosData.some(permiso => permiso.id_comando === '01-01'));
          setPUsuarioGrupo0102(permisosData.some(permiso => permiso.id_comando === '01-02'));
          setPUsuarioGrupo0103(permisosData.some(permiso => permiso.id_comando === '01-03'));
        })
        .catch(error => {
          console.log('Error al obtener los permisos:', error);
        });
    }
  };

  useEffect(() => {
    cargaRegistro();

    if (isAuthenticated && user && user.email) {
      cargaPermisosMenuComando('10');
    }
  }, [isAuthenticated, user, updateTrigger]);

  return (
    <>
      <Grid container spacing={0}
        direction={isSmallScreen ? 'row' : 'row'}
        alignItems={isSmallScreen ? 'center' : 'left'}
        justifyContent={isSmallScreen ? 'left' : 'left'}
      >
        <Grid item xs={isSmallScreen ? 1.2 : 0.5}>
          {pUsuarioGrupo0101 && (
            <Tooltip title='AGREGAR NUEVO'>
              <IconButton
                color="primary"
                style={{ padding: '0px', color: blueGrey[700] }}
                onClick={() => {
                  navigate(`/ad_usuariogrupo/${params.id_anfitrion}/${params.id_invitado}/new`);
                }}
              >
                <AddBoxIcon style={{ fontSize: '40px' }} />
              </IconButton>
            </Tooltip>
          )}
        </Grid>

        <Grid item xs={isSmallScreen ? 1.2 : 0.5}>
          <Tooltip title='EXPORTAR XLS'>
            <BotonExcelVentas registrosdet={registrosdet} />
          </Tooltip>
        </Grid>

        <Grid item xs={isSmallScreen ? 12 : 11}></Grid>

        <Grid item xs={12}>
          <TextField fullWidth variant="outlined" color="success" size="small"
            sx={{ display: 'block', margin: '.0rem 0' }}
            name="busqueda"
            value={valorBusqueda}
            placeholder='FILTRAR: CORREO USUARIO / CORREO INVITADO'
            onChange={actualizaValorFiltro}
            inputProps={{ style: { color: 'white' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FindIcon />
                </InputAdornment>
              ),
              style: { color: 'white' },
              inputProps: { style: { fontSize: '14px', color: 'gray' } }
            }}
          />
        </Grid>
      </Grid>

      <Datatable
        theme="solarized"
        columns={columnas}
        data={registrosdet}
        clearSelectedRows={toggleCleared}
        pagination
        paginationPerPage={15}
        paginationRowsPerPageOptions={[15, 50, 100]}
        selectableRowsComponent={Checkbox}
        sortIcon={<ArrowDownward />}
        dense={true}
      />
    </>
  );
}
