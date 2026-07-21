import { Grid, Card, CardContent, Typography, TextField, Button, CircularProgress, FormControlLabel, Checkbox } from '@mui/material';
import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function AdminUsuariosGrupoForm() {
  const back_host = process.env.BACK_HOST || "https://xpertcont-backend-js-production-50e6.up.railway.app";

  const [usuarioGrupo, setUsuarioGrupo] = useState({
    id_usuario: '',
    id_invitado: '',
    fecha_ingreso: '',
    ultimo_login: '',
    activo: true,
    sin_restriccion: false,
    turno1_inicio: '',
    turno1_fin: '',
    turno2_inicio: '',
    turno2_fin: '',
    turno3_inicio: '',
    turno3_fin: '',
  });

  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState(false);

  const navigate = useNavigate();
  const params = useParams();

  const encodePath = (value) => encodeURIComponent(value || '');

  const normalizaFechaIngreso = (value) => {
    if (!value) return '';
    return String(value).replace('T', ' ').substring(0, 16).replace(' ', 'T');
  };

  const normalizaHora = (value) => value ? String(value).substring(0, 5) : '';

  const limpiaVacios = (registro) => ({
    ...registro,
    fecha_ingreso: registro.fecha_ingreso || null,
    ultimo_login: registro.ultimo_login || null,
    turno1_inicio: registro.turno1_inicio || null,
    turno1_fin: registro.turno1_fin || null,
    turno2_inicio: registro.turno2_inicio || null,
    turno2_fin: registro.turno2_fin || null,
    turno3_inicio: registro.turno3_inicio || null,
    turno3_fin: registro.turno3_fin || null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    const payload = limpiaVacios({
      ...usuarioGrupo,
      id_usuario: usuarioGrupo.id_usuario || params.id_anfitrion,
    });

    if (editando) {
      await fetch(`${back_host}/ad_usuariogrupo/${encodePath(params.id_anfitrion)}/${encodePath(params.id_invitado_grupo)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });
    } else {
      await fetch(`${back_host}/ad_usuariogrupo`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });
    }

    setCargando(false);
    navigate(`/ad_usuariogrupo/${params.id_anfitrion}/${params.id_invitado}`);
  };

  useEffect(() => {
    if (params.id_invitado_grupo) {
      mostrarUsuarioGrupo(params.id_anfitrion, params.id_invitado_grupo);
      setEditando(true);
    } else {
      setUsuarioGrupo(prevState => ({ ...prevState, id_usuario: params.id_anfitrion }));
      setEditando(false);
    }
  }, []);

  const handleChange = e => {
    setUsuarioGrupo({ ...usuarioGrupo, [e.target.name]: devuelveValor(e) });
  };

  const devuelveValor = e => {
    if (e.target.type === "checkbox") {
      return e.target.checked;
    }
    return e.target.value;
  };

  const mostrarUsuarioGrupo = async (sUsuario, sInvitado) => {
    const res = await fetch(`${back_host}/ad_usuariogrupo/${encodePath(sUsuario)}/${encodePath(sInvitado)}`);
    const data = await res.json();

    setUsuarioGrupo({
      id_usuario: data.id_usuario || '',
      id_invitado: data.id_invitado || '',
      fecha_ingreso: normalizaFechaIngreso(data.fecha_ingreso),
      ultimo_login: normalizaFechaIngreso(data.ultimo_login),
      activo: data.activo ?? true,
      sin_restriccion: data.sin_restriccion ?? false,
      turno1_inicio: normalizaHora(data.turno1_inicio),
      turno1_fin: normalizaHora(data.turno1_fin),
      turno2_inicio: normalizaHora(data.turno2_inicio),
      turno2_fin: normalizaHora(data.turno2_fin),
      turno3_inicio: normalizaHora(data.turno3_inicio),
      turno3_fin: normalizaHora(data.turno3_fin),
    });
    setEditando(true);
  };

  return (
    <Grid container
      direction="column"
      alignItems="center"
      justifyContent="center"
    >
      <Grid item xs={12}>
        <Card
          sx={{ minWidth: 275 }}
          style={{
            background: '#1e272e',
            padding: '.1rem'
          }}
        >
          <Typography variant='subtitle2' color='white' textAlign='center'>
            {editando ? "EDITAR USUARIO GRUPO" : "CREAR USUARIO GRUPO"}
          </Typography>
          <CardContent>
            <form onSubmit={handleSubmit} autoComplete="off">
              <TextField variant="outlined"
                label="Correo usuario"
                fullWidth
                size='small'
                sx={{ display: 'block', margin: '.5rem 0' }}
                name="id_usuario"
                value={usuarioGrupo.id_usuario}
                onChange={handleChange}
                disabled={editando}
                inputProps={{ style: { color: 'white' } }}
                InputLabelProps={{ style: { color: 'white' } }}
              />

              <TextField variant="outlined"
                label="Correo invitado"
                fullWidth
                size='small'
                sx={{ display: 'block', margin: '.5rem 0' }}
                name="id_invitado"
                value={usuarioGrupo.id_invitado}
                onChange={handleChange}
                disabled={editando}
                inputProps={{ style: { color: 'white' } }}
                InputLabelProps={{ style: { color: 'white' } }}
              />

              <TextField variant="outlined"
                label="Fecha ingreso"
                fullWidth
                size='small'
                type="datetime-local"
                sx={{ display: 'block', margin: '.5rem 0' }}
                name="fecha_ingreso"
                value={usuarioGrupo.fecha_ingreso}
                onChange={handleChange}
                inputProps={{ style: { color: 'white' } }}
                InputLabelProps={{ style: { color: 'white' }, shrink: true }}
              />

              <TextField variant="outlined"
                label="Ultimo login"
                fullWidth
                size='small'
                type="datetime-local"
                sx={{ display: 'block', margin: '.5rem 0' }}
                name="ultimo_login"
                value={usuarioGrupo.ultimo_login}
                onChange={handleChange}
                inputProps={{ style: { color: 'white' } }}
                InputLabelProps={{ style: { color: 'white' }, shrink: true }}
              />

              <FormControlLabel
                sx={{ color: 'white', display: 'block' }}
                control={
                  <Checkbox
                    checked={usuarioGrupo.activo}
                    onChange={handleChange}
                    name="activo"
                    sx={{ color: 'white' }}
                  />
                }
                label="Activo"
              />

              <FormControlLabel
                sx={{ color: 'white', display: 'block' }}
                control={
                  <Checkbox
                    checked={usuarioGrupo.sin_restriccion}
                    onChange={handleChange}
                    name="sin_restriccion"
                    sx={{ color: 'white' }}
                  />
                }
                label="Sin restriccion"
              />

              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <TextField variant="outlined"
                    label="Turno 1 inicio"
                    fullWidth
                    size='small'
                    type="time"
                    sx={{ display: 'block', margin: '.5rem 0' }}
                    name="turno1_inicio"
                    value={usuarioGrupo.turno1_inicio}
                    onChange={handleChange}
                    inputProps={{ style: { color: 'white' } }}
                    InputLabelProps={{ style: { color: 'white' }, shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField variant="outlined"
                    label="Turno 1 fin"
                    fullWidth
                    size='small'
                    type="time"
                    sx={{ display: 'block', margin: '.5rem 0' }}
                    name="turno1_fin"
                    value={usuarioGrupo.turno1_fin}
                    onChange={handleChange}
                    inputProps={{ style: { color: 'white' } }}
                    InputLabelProps={{ style: { color: 'white' }, shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField variant="outlined"
                    label="Turno 2 inicio"
                    fullWidth
                    size='small'
                    type="time"
                    sx={{ display: 'block', margin: '.5rem 0' }}
                    name="turno2_inicio"
                    value={usuarioGrupo.turno2_inicio}
                    onChange={handleChange}
                    inputProps={{ style: { color: 'white' } }}
                    InputLabelProps={{ style: { color: 'white' }, shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField variant="outlined"
                    label="Turno 2 fin"
                    fullWidth
                    size='small'
                    type="time"
                    sx={{ display: 'block', margin: '.5rem 0' }}
                    name="turno2_fin"
                    value={usuarioGrupo.turno2_fin}
                    onChange={handleChange}
                    inputProps={{ style: { color: 'white' } }}
                    InputLabelProps={{ style: { color: 'white' }, shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField variant="outlined"
                    label="Turno 3 inicio"
                    fullWidth
                    size='small'
                    type="time"
                    sx={{ display: 'block', margin: '.5rem 0' }}
                    name="turno3_inicio"
                    value={usuarioGrupo.turno3_inicio}
                    onChange={handleChange}
                    inputProps={{ style: { color: 'white' } }}
                    InputLabelProps={{ style: { color: 'white' }, shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField variant="outlined"
                    label="Turno 3 fin"
                    fullWidth
                    size='small'
                    type="time"
                    sx={{ display: 'block', margin: '.5rem 0' }}
                    name="turno3_fin"
                    value={usuarioGrupo.turno3_fin}
                    onChange={handleChange}
                    inputProps={{ style: { color: 'white' } }}
                    InputLabelProps={{ style: { color: 'white' }, shrink: true }}
                  />
                </Grid>
              </Grid>

              <Button variant='contained'
                color='primary'
                type='submit'
                disabled={!usuarioGrupo.id_usuario || !usuarioGrupo.id_invitado}
              >
                {cargando ? (
                  <CircularProgress color="inherit" size={24} />
                ) : (
                  editando ? 'Modificar' : 'Grabar'
                )}
              </Button>

              <Button variant='contained'
                color='success'
                onClick={() => {
                  navigate(-1, { replace: true });
                }}
              >
                ANTERIOR
              </Button>
            </form>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
