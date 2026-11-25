import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { usePreferenciaApariencia } from '../usePreferenciaApariencia';
import { AparienciaRepository } from '../../repositories/aparienciaRepository';

jest.mock('../../repositories/aparienciaRepository', () => ({ AparienciaRepository: { leer: jest.fn(), guardar: jest.fn() } }));
let renderer: ReactTestRenderer;
async function montar() {
  const result = {} as { current: ReturnType<typeof usePreferenciaApariencia> };
  function Probe() { result.current = usePreferenciaApariencia(); return null; }
  await act(async () => { renderer = create(React.createElement(Probe)); });
  return result;
}
beforeEach(() => {
  jest.resetAllMocks();
  (AparienciaRepository.leer as jest.Mock).mockResolvedValue('system');
  (AparienciaRepository.guardar as jest.Mock).mockResolvedValue(undefined);
});
afterEach(() => { act(() => renderer?.unmount()); });

it('recupera la preferencia guardada y cambia inmediatamente sin llamadas al backend', async () => {
  (AparienciaRepository.leer as jest.Mock).mockResolvedValue('dark');
  const result = await montar();
  expect(result.current.lista).toBe(true);
  expect(result.current.modo).toBe('dark');
  await act(async () => { await result.current.seleccionar('light'); });
  expect(result.current.modo).toBe('light');
  expect(AparienciaRepository.guardar).toHaveBeenCalledWith('light');
});
it('no sobrescribe una elección del usuario si termina después la lectura inicial', async () => {
  let resolver!: (value: string) => void;
  (AparienciaRepository.leer as jest.Mock).mockReturnValue(new Promise(resolve => { resolver = resolve; }));
  const result = await montar();
  await act(async () => { await result.current.seleccionar('dark'); });
  await act(async () => { resolver('light'); });
  expect(result.current.modo).toBe('dark');
  expect(result.current.lista).toBe(true);
});
it('serializa selecciones rápidas para que la última sea la persistida', async () => {
  let resolver!: () => void;
  (AparienciaRepository.guardar as jest.Mock).mockImplementationOnce(() => new Promise<void>(resolve => { resolver = resolve; }));
  const result = await montar();
  let primera!: Promise<void>, segunda!: Promise<void>;
  await act(async () => { primera = result.current.seleccionar('dark'); segunda = result.current.seleccionar('light'); });
  expect(result.current.modo).toBe('light');
  expect(AparienciaRepository.guardar).toHaveBeenCalledTimes(1);
  await act(async () => { resolver(); await Promise.all([primera, segunda]); });
  expect(AparienciaRepository.guardar).toHaveBeenNthCalledWith(1, 'dark');
  expect(AparienciaRepository.guardar).toHaveBeenNthCalledWith(2, 'light');
});
it('conserva el tema elegido si falla guardar y permite reintentar', async () => {
  (AparienciaRepository.guardar as jest.Mock).mockRejectedValueOnce(new Error('Sin espacio'));
  const result = await montar();
  await act(async () => { await result.current.seleccionar('dark'); });
  expect(result.current.modo).toBe('dark');
  expect(result.current.error).toContain('no pudo guardarse');
  await act(async () => { await result.current.seleccionar('dark'); });
  expect(result.current.error).toBeNull();
});
it('permite abrir la app siguiendo el dispositivo cuando no puede leer preferencias', async () => {
  (AparienciaRepository.leer as jest.Mock).mockRejectedValue(new Error('Archivo no accesible'));
  const result = await montar();
  expect(result.current.lista).toBe(true);
  expect(result.current.modo).toBe('system');
  expect(result.current.error).toContain('dispositivo');
});
