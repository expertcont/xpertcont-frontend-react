import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminVentaListToolbar from './AdminVentaListToolbar';

const props = {
  contador: 6, busqueda: '', onBuscar: jest.fn(), onNuevo: jest.fn(),
  periodo: '2026-09', periodos: [{ periodo: '2026-09' }],
  contabilidad: '201', contabilidades: [{ documento_id: '201', razon_social: 'Empresa' }],
  onChange: jest.fn(), onDia: jest.fn(), onFiltro: jest.fn(),
  pendientes: 2, anulados: 1, totalVentas: 75, puedeVerTotales: true,
  onTotal: jest.fn(), onRecords: jest.fn(),
};

test('las tarjetas de totales mantienen sus acciones independientes del filtro de estado', () => {
  render(<AdminVentaListToolbar {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /Ventas Total/ }));
  fireEvent.click(screen.getByRole('button', { name: /RECORDS/ }));
  expect(props.onTotal).toHaveBeenCalledTimes(1);
  expect(props.onRecords).toHaveBeenCalledTimes(1);
  expect(props.onFiltro).not.toHaveBeenCalled();
});

test('los filtros indican su seleccion, se pueden limpiar y los importes respetan la visibilidad por permisos', () => {
  function Toolbar() {
    const [filtro, setFiltro] = useState('');
    return <AdminVentaListToolbar {...props} puedeVerTotales={false} filtro={filtro}
      onFiltro={(value) => setFiltro(actual => actual === value ? '' : value)} />;
  }
  render(<Toolbar />);
  const pendientes = screen.getByRole('button', { name: /Pendientes SUNAT/ });
  fireEvent.click(pendientes);
  expect(pendientes.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(pendientes);
  expect(pendientes.getAttribute('aria-pressed')).toBe('false');
  expect(screen.queryByRole('button', { name: /Ventas Total/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /RECORDS/ })).toBeNull();
});
