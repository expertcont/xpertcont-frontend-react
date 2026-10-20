import React from 'react';
import { Box } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ProductoEditor from './ProductoEditor';

export default function AdminProductoForm() {
  const params = useParams();
  const navigate = useNavigate();
  const volver = () => navigate(`/ad_producto/${params.id_anfitrion}/${params.id_invitado}/${params.documento_id}`);
  return <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 1, md: 3 } }}><ProductoEditor embedded params={params} idProducto={params.id_producto} onClose={volver} onSaved={volver} /></Box>;
}
