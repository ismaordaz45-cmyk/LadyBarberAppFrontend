import React from 'react';
import { act } from 'react-test-renderer';
import { CitasRepository } from '../../repositories/citasRepository';
import { useMisCitasViewModel } from '../useMisCitasViewModel';
import { CitaResumen } from '../../models/Cita';
import { AppState } from 'react-native';
import { FiltroCitas, VistaCitas } from '../../utils/listadoCitas';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => (() => void) | undefined) => {
    const ReactModule = jest.requireActual('react');
    ReactModule.useEffect(callback, [callback]);
  },
}));
jest.mock('../../repositories/citasRepository', () => ({ CitasRepository: { getMisCitas: jest.fn() } }));
const getMisCitas = CitasRepository.getMisCitas as jest.Mock;
let renderer: any;
const cita = { id: '1', fecha: '2099-11-18', horaInicio: '2099-11-18T09:00:00', horaFin: '2099-11-18T10:00:00',
  creadoEn: '2099-11-18T08:50:00Z', estado: 'CONFIRMADA', precioFinal: 120, serviciosLabel: 'Corte' } as CitaResumen;
async function renderHook(vista: VistaCitas = 'proximas', filtro: FiltroCitas = 'todas') {
  const result = {} as { current: ReturnType<typeof useMisCitasViewModel> };
  function Component() { result.current = useMisCitasViewModel(vista, filtro); return null; }
  await act(async () => { renderer = require('react-test-renderer').create(React.createElement(Component)); });
  return result;
}
describe('Reservas e historial recuperados del servidor', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  });
  afterEach(() => { act(() => renderer?.unmount()); renderer = null; });
  it('recupera las citas sin depender de la reserva en memoria y las separa por estado', async () => {
    getMisCitas.mockResolvedValue([cita, { ...cita, id: '2', estado: 'CANCELADA' }]);
    const result = await renderHook();
    expect(result.current.proximas.map(c => c.id)).toEqual(['1']);
    expect(result.current.historial.map(c => c.id)).toEqual(['2']);
    expect(getMisCitas).toHaveBeenCalledWith(0);
  });
  it('lee todas las páginas sin duplicados y presenta solo seis, sin otra petición al ver más', async () => {
    getMisCitas.mockResolvedValueOnce(Array.from({ length: 40 }, (_, i) => ({ ...cita, id: String(i) })));
    getMisCitas.mockResolvedValueOnce([cita, { ...cita, id: '40' }]);
    const result = await renderHook();
    expect(getMisCitas).toHaveBeenLastCalledWith(40);
    expect(result.current.citas).toHaveLength(41);
    expect(result.current.resultados).toHaveLength(6);
    await act(async () => { await result.current.cargarMas(); });
    expect(result.current.resultados).toHaveLength(12);
    expect(getMisCitas).toHaveBeenCalledTimes(2);
    expect(result.current.hayMas).toBe(true);
    await act(async () => { result.current.verMenos(); });
    expect(result.current.resultados).toHaveLength(6);
  });
  it('permite reintentar tras un error sin perder las citas', async () => {
    getMisCitas.mockResolvedValue([cita]);
    const result = await renderHook();
    getMisCitas.mockRejectedValue(new Error('Sin conexión'));
    await act(async () => { await result.current.actualizar(); });
    expect(result.current.error).toBe('Sin conexión');
    expect(result.current.citas).toHaveLength(1);
    getMisCitas.mockResolvedValue([]);
    await act(async () => { await result.current.actualizar(); });
    expect(result.current.error).toBeNull();
    expect(result.current.citas).toEqual([]);
  });
  it('restablece seis resultados al cambiar filtro u orden y no mezcla historial con próximas', async () => {
    getMisCitas.mockResolvedValue(Array.from({ length: 15 }, (_, i) => ({ ...cita, id: String(i), estado: i < 8 ? 'CONFIRMADA' : 'EN_PROCESO' })));
    const result = await renderHook();
    await act(async () => { await result.current.cargarMas(); });
    expect(result.current.resultados).toHaveLength(12);
    await act(async () => { result.current.cambiarFiltro('confirmadas'); });
    expect(result.current.totalFiltradas).toBe(8);
    expect(result.current.resultados).toHaveLength(6);
    await act(async () => { await result.current.cargarMas(); });
    expect(result.current.resultados).toHaveLength(8);
    expect(result.current.hayMas).toBe(false);
    await act(async () => { result.current.cambiarOrden('creacionDesc'); });
    expect(result.current.resultados).toHaveLength(6);
    await act(async () => { result.current.cambiarFiltro('todas'); });
    expect(result.current.totalFiltradas).toBe(15);
    expect(result.current.filtros.map(f => f.label)).toEqual(['Todas', 'Confirmadas', 'Por pagar']);
  });
  it('en historial ordena las visitas más recientes primero y filtra las canceladas', async () => {
    getMisCitas.mockResolvedValue([
      { ...cita, id: 'vieja', estado: 'COMPLETADA', horaInicio: '2026-01-01T09:00:00' },
      { ...cita, id: 'reciente', estado: 'CANCELADA', horaInicio: '2026-11-01T09:00:00' },
      cita,
    ]);
    const result = await renderHook('historial');
    expect(result.current.resultados.map(c => c.id)).toEqual(['reciente', 'vieja']);
    await act(async () => { result.current.cambiarFiltro('canceladas'); });
    expect(result.current.resultados.map(c => c.id)).toEqual(['reciente']);
  });
  it('interrumpe una paginación que no avanza en vez de consultar indefinidamente', async () => {
    getMisCitas.mockResolvedValue(Array.from({ length: 40 }, (_, i) => ({ ...cita, id: String(i) })));
    const result = await renderHook();
    expect(getMisCitas).toHaveBeenCalledTimes(2);
    expect(result.current.error).toMatch(/completar/);
    expect(result.current.isLoading).toBe(false);
  });
  it('recupera un apartado desde Por pagar y lo retira al vencer el plazo original aunque la pantalla siga abierta', async () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date('2026-11-17T18:00:00Z'));
      getMisCitas.mockResolvedValue([{ ...cita, estado: 'APARTADA', creadoEn: '2026-11-17T17:59:00Z' }]);
      const result = await renderHook('proximas', 'pendientes');
      expect(result.current.filtro).toBe('pendientes');
      expect(result.current.resultados.map(c => c.id)).toEqual(['1']);
      act(() => { jest.advanceTimersByTime(29 * 60 * 1000); });
      expect(result.current.resultados).toEqual([]);
      expect(result.current.historial.map(c => c.id)).toEqual(['1']);
      expect(getMisCitas).toHaveBeenCalledTimes(1);
    } finally { jest.useRealTimers(); }
  });
});
