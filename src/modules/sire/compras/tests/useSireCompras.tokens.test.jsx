import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import useSireCompras from '../hooks/useSireCompras';
import SireComprasTicket from '../components/SireComprasTicket';
import { sireComprasApi } from '../services/sireComprasApi';

let mockParams;
jest.mock('react-router-dom', () => ({ useParams: () => mockParams, useNavigate: () => jest.fn() }));
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => ({ isAuthenticated: true }) }));
jest.mock('../services/sireComprasApi', () => ({ sireComprasApi: {
  catalogos: jest.fn(), recuperar: jest.fn(), generarTokenSire: jest.fn(), generarTokenLegacy: jest.fn(),
} }));

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id_anfitrion: 'HOST', id_invitado: 'OPERADOR', periodo: '2026-10', documento_id: '20111111111' };
  sireComprasApi.catalogos.mockResolvedValue([{ data: [] }, { data: [] }]);
  sireComprasApi.recuperar.mockResolvedValue({ data: { ticket: '', propuesta: null, sistema: [], comparacion: [] } });
});

const respuesta = pareja => ({ data: { via: 'sire', pareja_sol: pareja, documento_id: mockParams.documento_id, longitud: 999, migeigvDeclarado: true } });

test('presenta botones separados de primario, secundario y legacy', () => {
  const primario = jest.fn(), secundario = jest.fn(), legacy = jest.fn();
  render(<SireComprasTicket datos={{}} valido ocupado={false} onTokenSire={primario} onTokenSireSecundario={secundario} onTokenLegacy={legacy} />);
  fireEvent.click(screen.getByRole('button', { name: 'Token SIRE primario' }));
  expect(primario).toHaveBeenCalledTimes(1);
  expect(secundario).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Token SIRE secundario' }));
  expect(secundario).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Token legacy' }));
  expect(legacy).toHaveBeenCalledTimes(1);
  expect(primario).toHaveBeenCalledTimes(1);
  expect(secundario).toHaveBeenCalledTimes(1);
});

test('legacy limpia el resultado previo y llama exclusivamente a su endpoint', async () => {
  sireComprasApi.generarTokenSire.mockResolvedValueOnce(respuesta('principal'));
  const { result } = renderHook(useSireCompras);
  await waitFor(() => expect(result.current.cargando).toBe(false));
  await act(async () => { await result.current.ejecutar('tokenSire'); });
  let resolver;
  sireComprasApi.generarTokenLegacy.mockImplementationOnce(() => new Promise(resolve => { resolver = resolve; }));
  let pendiente;
  act(() => { pendiente = result.current.ejecutar('tokenLegacy'); });
  expect(result.current.tokenSire).toBeNull();
  expect(sireComprasApi.generarTokenLegacy).toHaveBeenCalledWith(expect.objectContaining({ documento_id: '20111111111' }));
  await act(async () => {
    resolver({ data: { ...respuesta('secundario').data, modo: 'legacy' } });
    await pendiente;
  });
  expect(result.current.tokenSire.modo).toBe('legacy');
  expect(sireComprasApi.generarTokenSire).toHaveBeenCalledTimes(1);
  expect(sireComprasApi.generarTokenLegacy).toHaveBeenCalledTimes(1);
});

test('cada prueba manual manda la pareja elegida y limpia el resultado antes de esperar', async () => {
  sireComprasApi.generarTokenSire.mockResolvedValueOnce(respuesta('principal'));
  const { result } = renderHook(useSireCompras);
  await waitFor(() => expect(result.current.cargando).toBe(false));
  await act(async () => { await result.current.ejecutar('tokenSire'); });
  expect(result.current.tokenSire.pareja_sol).toBe('principal');
  expect(sireComprasApi.generarTokenSire).toHaveBeenLastCalledWith(expect.objectContaining({ documento_id: '20111111111', pareja_sol: 'principal' }));

  let rechazar;
  sireComprasApi.generarTokenSire.mockImplementationOnce(() => new Promise((resolve, reject) => { rechazar = reject; }));
  let pendiente;
  act(() => { pendiente = result.current.ejecutar('tokenSireSecundario'); });
  expect(result.current.tokenSire).toBeNull();
  expect(result.current.tokenSunat).toBeNull();
  expect(result.current.mensaje).toBe('');
  expect(result.current.error).toBe('');
  expect(sireComprasApi.generarTokenSire).toHaveBeenLastCalledWith(expect.objectContaining({ pareja_sol: 'secundario' }));
  await act(async () => {
    rechazar({ response: { data: { message: 'Secundario rechazado' } } });
    await pendiente;
  });
  expect(result.current.tokenSire).toBeNull();
  expect(result.current.error).toBe('Secundario rechazado');
  expect(sireComprasApi.generarTokenSire).toHaveBeenCalledTimes(2);
});

test('cambiar RUC limpia el token anterior y descarta una respuesta tardia', async () => {
  sireComprasApi.generarTokenSire.mockResolvedValueOnce(respuesta('principal'));
  const { result, rerender } = renderHook(useSireCompras);
  await waitFor(() => expect(result.current.cargando).toBe(false));
  await act(async () => { await result.current.ejecutar('tokenSire'); });
  expect(result.current.tokenSire).not.toBeNull();
  mockParams = { ...mockParams, documento_id: '20222222222' };
  rerender();
  expect(result.current.tokenSire).toBeNull();
  await waitFor(() => expect(result.current.cargando).toBe(false));

  let resolver;
  sireComprasApi.generarTokenSire.mockImplementationOnce(() => new Promise(resolve => { resolver = resolve; }));
  let pendiente;
  act(() => { pendiente = result.current.ejecutar('tokenSireSecundario'); });
  mockParams = { ...mockParams, documento_id: '20333333333' };
  rerender();
  await act(async () => {
    resolver({ data: { via: 'sire', pareja_sol: 'secundario', documento_id: '20222222222' } });
    await pendiente;
  });
  expect(result.current.documentoId).toBe('20333333333');
  expect(result.current.tokenSire).toBeNull();
});
