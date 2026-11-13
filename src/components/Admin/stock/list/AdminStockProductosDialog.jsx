import React, { useEffect, useState } from 'react';
import { Alert, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import axios from 'axios';
import AdminVentaRecaudacionDialog from '../../venta/list/AdminVentaRecaudacionDialog';
import palette from '../../../../theme/palette';

const formatoCantidad = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 });
const columnas = ['Producto', 'Unidad', 'Entradas', 'Salidas'];
const contenido = {
  titulo: 'Resumen de productos',
  subtitulo: 'Cantidades por producto y unidad de los comprobantes vigentes visibles',
  ancho: 680,
};
const celdaSx = {
  color: palette.text,
  borderColor: palette.borderSoft,
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums',
};

export default function AdminStockProductosDialog({ url, comprobantes, onClose }) {
  const [productos, setProductos] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    axios.post(url, { comprobantes }, { signal: controller.signal })
      .then(({ data }) => {
        if (!data.success || !Array.isArray(data.data)) throw new Error('Respuesta inválida');
        if (!controller.signal.aborted) setProductos(data.data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [url, comprobantes]);

  return (
    <AdminVentaRecaudacionDialog open onClose={onClose} contenidoPersonalizado={contenido}>
      {error ? (
        <Alert severity="error">No se pudo cargar el resumen de productos.</Alert>
      ) : !productos?.length ? (
        <Typography role="status" sx={{ color: palette.muted, fontSize: 13, textAlign: 'center', py: 2 }}>
          {productos ? 'No hay productos para los filtros seleccionados.' : 'Cargando productos…'}
        </Typography>
      ) : (
        <TableContainer sx={{ border: `1px solid ${palette.borderSoft}`, borderRadius: 1.5 }}>
          <Table size="small" aria-label="Resumen de productos">
            <TableHead sx={{ backgroundColor: palette.surfaceAlt }}>
              <TableRow>
                {columnas.map((columna, index) => (
                  <TableCell key={columna} align={index > 1 ? 'right' : 'left'} sx={{ ...celdaSx, color: palette.muted, fontWeight: 800 }}>
                    {columna}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.map((producto, index) => (
                <TableRow key={JSON.stringify([producto.id_producto, producto.cont_und])} sx={{ backgroundColor: index % 2 === 0 ? palette.bg : 'transparent' }}>
                  <TableCell component="th" scope="row" sx={{ ...celdaSx, fontWeight: 700 }}>
                    {producto.descripcion || producto.id_producto}
                    {producto.id_producto && producto.id_producto !== producto.descripcion && (
                      <Box component="span" sx={{ display: 'block', color: palette.muted, fontSize: 11 }}>{producto.id_producto}</Box>
                    )}
                  </TableCell>
                  <TableCell sx={celdaSx}>{producto.cont_und}</TableCell>
                  <TableCell align="right" sx={celdaSx}>{formatoCantidad.format(Number(producto.ingreso ?? 0))}</TableCell>
                  <TableCell align="right" sx={celdaSx}>{formatoCantidad.format(Number(producto.egreso ?? 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </AdminVentaRecaudacionDialog>
  );
}
