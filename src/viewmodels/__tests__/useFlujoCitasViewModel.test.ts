import React from 'react';
import { act } from 'react-test-renderer';
import { BackHandler } from 'react-native';
import { useAtrasCitas, useFlujoCitasViewModel } from '../useFlujoCitasViewModel';

const mockListeners = new Map<string, () => void>();
const mockNavigation = { addListener: jest.fn((event: string, callback: () => void) => {
  mockListeners.set(event, callback); return () => mockListeners.delete(event);
}) };
jest.mock('expo-router', () => ({ useNavigation: () => mockNavigation,
  useFocusEffect: (callback: () => (() => void) | undefined) => {
    jest.requireActual('react').useEffect(callback, [callback]);
  },
}));

let renderer: any;
const reserva = { citaCreadaId: '', pagoAprobado: false, isGuardando: false,
  nuevaCita: jest.fn(), cancelarApartado: jest.fn() };
async function renderHook(actual = reserva) {
  const result = {} as { current: ReturnType<typeof useFlujoCitasViewModel> };
  function Component() {
    const vm = useFlujoCitasViewModel(); result.current = vm;
    useAtrasCitas(vm.vista === 'agendar', () => vm.solicitarSalida(actual));
    return null;
  }
  await act(async () => { renderer = jest.requireActual('react-test-renderer').create(React.createElement(Component)); });
  return result;
}

describe('Salida del asistente de citas', () => {
  beforeEach(() => { jest.clearAllMocks(); mockListeners.clear(); reserva.cancelarApartado.mockResolvedValue(undefined); });
  afterEach(() => { act(() => renderer?.unmount()); jest.restoreAllMocks(); });
  it('vuelve al listado al salir de la pestaña y siempre inicia una nueva selección al agendar', async () => {
    const result = await renderHook();
    expect(result.current.vista).toBe('reservas');
    act(() => result.current.agendar(reserva));
    expect(result.current.vista).toBe('agendar');
    act(() => mockListeners.get('blur')?.());
    expect(result.current.vista).toBe('reservas');
    act(() => result.current.agendar(reserva));
    expect(reserva.nuevaCita).toHaveBeenCalledTimes(2);
    expect(reserva.cancelarApartado).not.toHaveBeenCalled();
  });
  it('el botón físico atrás regresa a mis citas sin navegar a Inicio', async () => {
    const listener = jest.spyOn(BackHandler, 'addEventListener');
    const result = await renderHook();
    act(() => result.current.agendar(reserva));
    const callback = listener.mock.calls.at(-1)![1];
    let consumido;
    act(() => { consumido = callback({ type: 'hardwareBackPress', timeStamp: Date.now() }); });
    expect(consumido).toBe(true);
    expect(result.current.vista).toBe('reservas');
  });
  it('conserva la reserva y abre Por pagar sin cancelar, recrear ni reiniciar el plazo', async () => {
    const pendiente = { ...reserva, citaCreadaId: 'persistida' };
    const result = await renderHook(pendiente);
    act(() => result.current.agendar(pendiente));
    act(() => result.current.solicitarSalida(pendiente));
    expect(result.current.mostrarSalida).toBe(true);
    act(() => result.current.seguirPagando());
    expect(result.current.vista).toBe('agendar');
    act(() => result.current.solicitarSalida(pendiente));
    act(() => result.current.conservar());
    expect(result.current.vista).toBe('reservas');
    expect(result.current.filtroInicial).toBe('pendientes');
    expect(reserva.nuevaCita).toHaveBeenCalledTimes(1);
    expect(reserva.cancelarApartado).not.toHaveBeenCalled();
  });
  it('espera la cancelación, bloquea dobles pulsaciones y no ofrece conservar mientras se cancela', async () => {
    let resolver!: () => void;
    reserva.cancelarApartado.mockReturnValue(new Promise<void>(resolve => { resolver = resolve; }));
    const pendiente = { ...reserva, citaCreadaId: 'persistida' };
    const result = await renderHook(pendiente);
    act(() => result.current.agendar(pendiente));
    act(() => result.current.solicitarSalida(pendiente));
    let accion!: Promise<void>;
    act(() => { accion = result.current.cancelar(pendiente); result.current.conservar(); void result.current.cancelar(pendiente); });
    expect(result.current.cancelando).toBe(true);
    expect(result.current.vista).toBe('agendar');
    expect(reserva.cancelarApartado).toHaveBeenCalledTimes(1);
    await act(async () => { resolver(); await accion; });
    expect(result.current.vista).toBe('reservas');
    expect(result.current.mostrarSalida).toBe(false);
  });
  it('si falla la cancelación, conserva el apartado y permite reintentar o volver a Por pagar', async () => {
    reserva.cancelarApartado.mockRejectedValueOnce(new Error('Sin conexión'));
    const pendiente = { ...reserva, citaCreadaId: 'persistida' };
    const result = await renderHook(pendiente);
    act(() => result.current.agendar(pendiente));
    act(() => result.current.solicitarSalida(pendiente));
    await act(async () => { await result.current.cancelar(pendiente); });
    expect(result.current.vista).toBe('agendar');
    expect(result.current.mostrarSalida).toBe(true);
    expect(result.current.errorSalida).toBe('Sin conexión');
    act(() => result.current.conservar());
    expect(result.current.filtroInicial).toBe('pendientes');
  });
  it('una cita pagada vuelve directamente al listado y no puede provocar cancelación desde atrás', async () => {
    const pagada = { ...reserva, citaCreadaId: 'pagada', pagoAprobado: true };
    const result = await renderHook(pagada);
    act(() => result.current.agendar(pagada));
    act(() => result.current.solicitarSalida(pagada));
    expect(result.current.vista).toBe('reservas');
    expect(result.current.mostrarSalida).toBe(false);
    expect(reserva.cancelarApartado).not.toHaveBeenCalled();
  });
});
