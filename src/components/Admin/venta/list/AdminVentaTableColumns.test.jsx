import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AdminVentaTableDetails, crearColumnasVenta, estadoSunatVenta, montoDocumento, numeroComprobanteVisible } from './AdminVentaTableColumns';

test('las NC se presentan como negativas sin cambiar los datos originales', () => {
  for (const row of [
    { r_cod: '01', r_cod_ref: '07', r_monto_total: 75 },
    { r_cod: '07', r_cod_ref: '01', r_monto_total: -75 },
  ]) {
    const original = { ...row };
    expect(montoDocumento(row)).toBe(-75);
    expect(row).toEqual(original);
  }
});

test('el estado distingue anulados, rechazados, pendientes de CDR, aceptados e internos', () => {
  expect(estadoSunatVenta({ r_cod: '01', registrado: 0, cdr_nivel: 'ACEPTADO' }).label).toBe('Anulado');
  expect(estadoSunatVenta({ r_cod: '01', cdr_nivel: 'RECHAZADO' }).label).toBe('Rechazado');
  expect(estadoSunatVenta({ r_cod: '01', r_vfirmado: 'firma', cdr_pendiente: '1' }).label).toBe('Pendiente');
  expect(estadoSunatVenta({ r_cod: '01', cdr_nivel: 'ACEPTADO' }).label).toBe('Aceptado');
  expect(estadoSunatVenta({ r_cod: 'NV' }).label).toBe('Interno');
});

test('el comprobante conserva la fila y su clave al abrir la vista de lectura', () => {
  const onVer = jest.fn();
  const onEnviar = jest.fn();
  const renderSunat = jest.fn(() => <button onClick={onEnviar}>Enviar SUNAT</button>);
  const row = { comprobante: '07-F001-0000007', comprobante_key: '01-F001-0000420-2', r_cod: '01', r_cod_ref: '07', r_fecemi: '2026-09-30', r_monto_total: -75, r_moneda: 'PEN' };
  const columns = crearColumnasVenta({ onVer, renderSunat, renderAcciones: jest.fn() });
  render(columns.find(col => col.id === 'comprobante').cell(row));
  fireEvent.click(screen.getByRole('button', { name: 'F001-0000007' }));
  expect(onVer).toHaveBeenCalledWith(row);
  fireEvent.click(screen.getByRole('button', { name: 'Enviar SUNAT' }));
  expect(onEnviar).toHaveBeenCalledTimes(1);
  expect(renderSunat).toHaveBeenCalledWith(row);
  expect(screen.getByText('30/09/2026')).toBeTruthy();
  expect(screen.getByText('-75.00 PEN')).toBeTruthy();
  expect(screen.queryByText('07-F001-0000007')).toBeNull();
  expect(numeroComprobanteVisible({ comprobante: '01-F001-0000420' })).toBe('F001-0000420');
  expect(numeroComprobanteVisible({ comprobante: '03-B001-0000022' })).toBe('B001-0000022');
});

test('el detalle conserva la referencia y la respuesta SUNAT sin atribuir pagos a la NC', () => {
  render(<AdminVentaTableDetails data={{ comprobante: '07-F001-7', r_cod_ref: '07', comprobante_ref: '01-F001-420', efectivo: 999, efectivo2: 888, cdr_descripcion: 'Nota aceptada' }} />);
  expect(screen.getByText('01-F001-420')).toBeTruthy();
  expect(screen.getByText('SUNAT: Nota aceptada')).toBeTruthy();
  expect(screen.getAllByText('No aplica a NC')).toHaveLength(2);
  expect(screen.queryByText(/999/)).toBeNull();
});
