import React from 'react';
import { act } from 'react-test-renderer';
import { AppState, AppStateStatus } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { CitasRepository } from '../../repositories/citasRepository';
import { usePagoCitaViewModel } from '../usePagoCitaViewModel';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('../../repositories/citasRepository', () => ({
  CitasRepository: { getEstadoPago: jest.fn(), crearPreferenciaPago: jest.fn() },
}));

const getStatus = CitasRepository.getEstadoPago as jest.Mock;
const createPreference = CitasRepository.crearPreferenciaPago as jest.Mock;
const openBrowser = openBrowserAsync as jest.Mock;
const initial = {
  citaId: 'cita-test', estado: 'APARTADA', precioFinal: '200.00',
  preferenceId: null, paymentId: null, paymentStatus: null,
};
let renderer: any;
let onAppState: (state: AppStateStatus) => void;
const removeListener = jest.fn();

const renderHook = async (initialId = 'cita-test') => {
  const result = {} as { current: ReturnType<typeof usePagoCitaViewModel> };
  function Component({ id }: { id: string }) {
    result.current = usePagoCitaViewModel(id);
    return null;
  }
  await act(async () => {
    renderer = require('react-test-renderer').create(React.createElement(Component, { id: initialId }));
  });
  return { result, Component };
};

describe('Pago de cita desde Expo Go', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    getStatus.mockResolvedValue(initial);
    createPreference.mockResolvedValue({ preferenceId: 'pref-test', checkoutUrl: 'https://checkout.example.test/', amount: 100, currency: 'MXN' });
    openBrowser.mockResolvedValue({ type: 'opened' });
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      onAppState = listener;
      return { remove: removeListener };
    });
  });

  afterEach(() => {
    act(() => renderer?.unmount());
    renderer = undefined;
    jest.restoreAllMocks();
  });

  it('no consulta ni abre un checkout sin cita', async () => {
    const { result } = await renderHook('');
    await act(async () => { await result.current.abrirCheckout(); });
    expect(getStatus).not.toHaveBeenCalled();
    expect(createPreference).not.toHaveBeenCalled();
  });

  it('abre checkoutUrl y cerrar el navegador no confirma un pago pendiente', async () => {
    const { result } = await renderHook();
    getStatus.mockResolvedValue({ ...initial, paymentStatus: 'pending' });
    await act(async () => { await result.current.abrirCheckout(); });
    expect(openBrowser).toHaveBeenCalledWith('https://checkout.example.test/');
    expect(result.current.estadoPago?.paymentStatus).toBe('pending');
    expect(result.current.pagoAprobado).toBe(false);
  });

  it('consulta al volver al primer plano y confirma solo con el estado aprobado del servidor', async () => {
    const { result } = await renderHook();
    getStatus.mockResolvedValue({ ...initial, estado: 'CONFIRMADA', paymentStatus: 'approved' });
    await act(async () => { onAppState('active'); });
    expect(result.current.pagoAprobado).toBe(true);
    await act(async () => { await result.current.abrirCheckout(); });
    expect(createPreference).not.toHaveBeenCalled();
  });

  it('permite reconsultar después de un error sin inventar un aprobado', async () => {
    const { result } = await renderHook();
    getStatus.mockRejectedValueOnce(new Error('No hay conexión'));
    await act(async () => { await result.current.consultarPago(); });
    expect(result.current.errorPago).toBe('No hay conexión');
    expect(result.current.pagoAprobado).toBe(false);
    getStatus.mockResolvedValue({ ...initial, paymentStatus: 'rejected' });
    await act(async () => { await result.current.consultarPago(); });
    expect(result.current.errorPago).toBeNull();
    expect(result.current.estadoPago?.paymentStatus).toBe('rejected');
    expect(result.current.pagoAprobado).toBe(false);
  });

  it('rechaza enlaces inseguros y propaga errores al abrir el navegador', async () => {
    const { result } = await renderHook();
    createPreference.mockResolvedValueOnce({ checkoutUrl: 'http://checkout.example.test/' });
    await act(async () => { await expect(result.current.abrirCheckout()).rejects.toThrow('no es válido'); });
    expect(openBrowser).not.toHaveBeenCalled();
    openBrowser.mockRejectedValueOnce(new Error('Navegador no disponible'));
    await act(async () => { await expect(result.current.abrirCheckout()).rejects.toThrow('Navegador no disponible'); });
  });

  it('evita abrir dos preferencias con pulsaciones simultáneas', async () => {
    const { result } = await renderHook();
    await act(async () => {
      await Promise.all([result.current.abrirCheckout(), result.current.abrirCheckout()]);
    });
    expect(createPreference).toHaveBeenCalledTimes(1);
    expect(openBrowser).toHaveBeenCalledTimes(1);
  });

  it('ignora una respuesta tardía de una cita anterior', async () => {
    let resolvePrevious!: (value: unknown) => void;
    getStatus.mockReturnValueOnce(new Promise((resolve) => { resolvePrevious = resolve; }));
    const { result, Component } = await renderHook();
    getStatus.mockResolvedValue({ ...initial, citaId: 'otra-cita', paymentStatus: 'pending' });
    await act(async () => {
      renderer.update(React.createElement(Component, { id: 'otra-cita' }));
    });
    await act(async () => {
      resolvePrevious({ ...initial, estado: 'CONFIRMADA', paymentStatus: 'approved' });
    });
    expect(result.current.estadoPago?.citaId).toBe('otra-cita');
    expect(result.current.pagoAprobado).toBe(false);
    expect(removeListener).toHaveBeenCalled();
  });
});
