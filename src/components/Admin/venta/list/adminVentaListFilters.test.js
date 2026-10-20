import { esVentaAnulada, esVentaPendienteSunat, filtrarVentas } from './adminVentaListFilters';

const rows = [
  { comprobante: '01-F001-1', r_cod: '01', registrado: 1, r_razon_social: 'Cliente Uno', r_documento_id: '201', r_vfirmado: null },
  { comprobante: '03-B001-2', r_cod: '03', registrado: 1, r_razon_social: 'Cliente Dos', numero_rdi: 'RDI-1' },
  { comprobante: '07-F001-3', r_cod: '01', r_cod_ref: '07', registrado: 1, r_vfirmado: 'firma', cdr_pendiente: '1' },
  { comprobante: '01-F001-4', r_cod: '01', registrado: 0, r_razon_social: 'Cliente Uno' },
  { comprobante: 'NV-0001-5', r_cod: 'NV', registrado: 1 },
  { comprobante: '01-F001-6', r_cod: '01', registrado: 1, cdr_nivel: 'ACEPTADO' },
];

test('Pendientes SUNAT incluye CPE y NC pendientes, y excluye anulados, ventas internas y documentos ya enviados', () => {
  expect(rows.filter(esVentaPendienteSunat).map(row => row.comprobante)).toEqual(['01-F001-1', '07-F001-3']);
  expect(esVentaAnulada({ registrado: '0' })).toBe(true);
  expect(esVentaAnulada({})).toBe(false);
});

test('la busqueda se combina con el estado y se conserva al limpiar el filtro', () => {
  expect(filtrarVentas(rows, ' cliente uno ', 'sunat')).toEqual([rows[0]]);
  expect(filtrarVentas(rows, 'CLIENTE UNO', 'anulados')).toEqual([rows[3]]);
  expect(filtrarVentas(rows, 'cliente uno', '')).toEqual([rows[0], rows[3]]);
  expect(filtrarVentas(rows, '201', '')).toEqual([rows[0]]);
  expect(filtrarVentas(rows, '', '')).toEqual(rows);
});

test('busca por descripción y código de productos aunque no estén en las dos líneas visibles', () => {
  const ventas = [{ ...rows[0], detalle_busqueda: 'P001 Cemento P002 Ladrillos P003 Arena' }, rows[3]];
  expect(filtrarVentas(ventas, 'arena', 'sunat')).toEqual([ventas[0]]);
  expect(filtrarVentas(ventas, 'p003', '')).toEqual([ventas[0]]);
  expect(filtrarVentas(ventas, 'arena', 'anulados')).toEqual([]);
});
