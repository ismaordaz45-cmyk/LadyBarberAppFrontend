import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { useUbicacionViewModel } from '../useUbicacionViewModel';
import { NegocioRepository } from '../../repositories/negocioRepository';
import { abrirIndicaciones } from '../../services/ubicacionService';

jest.mock('expo-router', () => ({ useFocusEffect: (callback: () => (() => void) | undefined) => { jest.requireActual('react').useEffect(callback, [callback]); } }));
jest.mock('../../repositories/negocioRepository', () => ({ NegocioRepository: { obtener: jest.fn() } }));
jest.mock('../../services/ubicacionService', () => ({ abrirIndicaciones: jest.fn() }));
const negocio = { id: 1, nombre: 'Salón de prueba', logo: null, direccion: 'Calle de prueba 10, Centro', ubicacion: '21.14,-98.42', telefono: null, horarioAtencion: null };
let renderer: ReactTestRenderer;
async function montar() {
  const result = {} as { current: ReturnType<typeof useUbicacionViewModel> };
  function Probe() { result.current = useUbicacionViewModel(); return null; }
  await act(async () => { renderer = create(React.createElement(Probe)); });
  return result;
}
beforeEach(() => {
  jest.resetAllMocks();
  (NegocioRepository.obtener as jest.Mock).mockResolvedValue(negocio);
  (abrirIndicaciones as jest.Mock).mockResolvedValue(undefined);
});
afterEach(() => { act(() => renderer?.unmount()); });
it('no consulta hasta abrir el panel y recupera datos actualizados del negocio', async () => {
  const result = await montar();
  expect(NegocioRepository.obtener).not.toHaveBeenCalled();
  await act(async () => { result.current.abrir(); });
  expect(result.current.visible).toBe(true);
  expect(result.current.direccion).toBe(negocio.direccion);
  expect(NegocioRepository.obtener).toHaveBeenCalledWith({ actualizar: true });
  await act(async () => { await result.current.comoLlegar(); });
  expect(new URL((abrirIndicaciones as jest.Mock).mock.calls[0][0]).searchParams.get('destination')).toBe('21.14,-98.42');
  expect(result.current.visible).toBe(true);
  act(() => result.current.cerrar());
  expect(result.current.visible).toBe(false);
});
it('permite reintentar después de un fallo de carga', async () => {
  (NegocioRepository.obtener as jest.Mock).mockRejectedValueOnce(new Error('Sin red'));
  const result = await montar();
  await act(async () => { result.current.abrir(); });
  expect(result.current.error).toContain('No pudimos consultar');
  expect(result.current.puedeAbrir).toBe(false);
  await act(async () => { await result.current.reintentar(); });
  expect(result.current.error).toBeNull();
  expect(result.current.puedeAbrir).toBe(true);
});
it('no utiliza una respuesta tardía después de cerrar y volver a abrir', async () => {
  let resolver!: (value: typeof negocio) => void;
  (NegocioRepository.obtener as jest.Mock).mockReturnValueOnce(new Promise(resolve => { resolver = resolve; }));
  const result = await montar();
  act(() => result.current.abrir());
  act(() => result.current.cerrar());
  await act(async () => { result.current.abrir(); });
  await act(async () => { resolver({ ...negocio, direccion: 'Dirección antigua' }); });
  expect(result.current.direccion).toBe(negocio.direccion);
});
it('evita abrir dos veces Maps al pulsar rápidamente', async () => {
  let resolver!: () => void;
  (abrirIndicaciones as jest.Mock).mockReturnValueOnce(new Promise<void>(resolve => { resolver = resolve; }));
  const result = await montar();
  await act(async () => { result.current.abrir(); });
  let apertura!: Promise<void>;
  await act(async () => { apertura = result.current.comoLlegar(); void result.current.comoLlegar(); });
  expect(abrirIndicaciones).toHaveBeenCalledTimes(1);
  expect(result.current.abriendo).toBe(true);
  await act(async () => { resolver(); await apertura; });
  expect(result.current.abriendo).toBe(false);
});
it('no abre Maps cuando no hay datos y conserva la dirección para consultar aunque falle abrir', async () => {
  (NegocioRepository.obtener as jest.Mock).mockResolvedValueOnce({ ...negocio, direccion: null, ubicacion: null });
  const result = await montar();
  await act(async () => { result.current.abrir(); await result.current.comoLlegar(); });
  expect(result.current.puedeAbrir).toBe(false);
  expect(abrirIndicaciones).not.toHaveBeenCalled();
  await act(async () => { await result.current.reintentar(); });
  (abrirIndicaciones as jest.Mock).mockRejectedValueOnce(new Error('No se pudo abrir Maps'));
  await act(async () => { await result.current.comoLlegar(); });
  expect(result.current.error).toBe('No se pudo abrir Maps');
  expect(result.current.direccion).toBe(negocio.direccion);
});
