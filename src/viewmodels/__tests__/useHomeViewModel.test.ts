import React from 'react';
import { act } from 'react-test-renderer';
import { useHomeViewModel } from '../useHomeViewModel';
import { HomeRepository } from '../../repositories/homeRepository';
import { sessionStore } from '../../services/sessionStore';
import { ResumenCliente } from '../../models/Catalogo';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const resumenValido: ResumenCliente = {
  user: {
    id: 11,
    nombre: 'Diana',
    apellidoPaterno: 'Palacios',
    apellidoMaterno: 'QA',
    correo: 'diana@example.invalid',
    telefono: '0000000000',
    rol: 'CLIENTE',
  },
  clienteId: 5,
  stats: { total: 8, pendientes: 3, completadas: 5 },
  nextCita: {
    id: 'cita-1',
    fecha: '2026-11-10T12:00:00.000Z',
    horaInicio: '2026-11-10T18:30:00.000Z',
    horaFin: '2026-11-10T19:30:00.000Z',
    estado: 'CONFIRMADA',
    precioFinal: 450,
    serviciosLabel: 'Corte editorial',
  },
  actualizadoEn: '2026-10-29T12:00:00.000Z',
};

const mountedRenderers: any[] = [];

const renderHook = () => {
  const result = {} as { current: ReturnType<typeof useHomeViewModel> };
  const Component = () => {
    result.current = useHomeViewModel();
    return null;
  };
  let renderer: any;
  act(() => {
    const TestRenderer = require('react-test-renderer');
    renderer = TestRenderer.create(React.createElement(Component));
  });
  mountedRenderers.push(renderer);
  return { result, renderer };
};

const renderResolved = async (response: unknown = resumenValido) => {
  jest.spyOn(HomeRepository, 'getResumenCliente').mockResolvedValueOnce(response as ResumenCliente);
  const hook = renderHook();
  await act(async () => { await Promise.resolve(); });
  return hook;
};

describe('HU-11 useHomeViewModel', () => {
  beforeEach(() => {
    sessionStore.clearSession();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    act(() => mountedRenderers.splice(0).forEach((renderer) => renderer.unmount()));
    sessionStore.clearSession();
    jest.restoreAllMocks();
  });

  it('inicia cargando y realiza solo la consulta de resumen necesaria', () => {
    const deferred = createDeferred<ResumenCliente>();
    const resumenSpy = jest.spyOn(HomeRepository, 'getResumenCliente')
      .mockReturnValueOnce(deferred.promise);
    const serviciosSpy = jest.spyOn(HomeRepository, 'getServicios')
      .mockRejectedValue(new Error('No debe solicitar servicios desde Home'));

    const { result } = renderHook();

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(resumenSpy).toHaveBeenCalledTimes(1);
    expect(serviciosSpy).not.toHaveBeenCalled();
  });

  it('finaliza la carga y expone resumen, nombre, estadisticas y proxima cita', async () => {
    const { result } = await renderResolved();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.resumen).toBe(resumenValido);
    expect(result.current.userNombre).toBe('Diana');
    expect(result.current.stats).toEqual(resumenValido.stats);
    expect(result.current.proximaCita).toEqual(resumenValido.nextCita);
  });

  it('prioriza el nombre valido de API sobre el nombre de sesion', async () => {
    sessionStore.setSession('jwt-ficticio', 3, 'Nombre Sesion', 'CLIENTE');
    const { result } = await renderResolved();
    expect(result.current.userNombre).toBe('Diana');
  });

  it('usa el nombre de sesion cuando el resumen no contiene nombre util', async () => {
    sessionStore.setSession('jwt-ficticio', 3, 'Nombre Sesion', 'CLIENTE');
    const { result } = await renderResolved({
      ...resumenValido,
      user: { ...resumenValido.user, nombre: '   ' },
    });
    expect(result.current.userNombre).toBe('Nombre Sesion');
  });

  it.each([null, {}, { user: null }, { user: { nombre: null } }])(
    'usa Cliente ante un resumen vacio o incompleto: %p',
    async (response) => {
      const { result } = await renderResolved(response);
      expect(result.current.userNombre).toBe('Cliente');
      expect(result.current.stats).toEqual({ total: 0, pendientes: 0, completadas: 0 });
      expect(result.current.proximaCita).toBeNull();
    }
  );

  it('normaliza estadisticas inesperadas sin exponer valores invalidos', async () => {
    const { result } = await renderResolved({
      ...resumenValido,
      stats: { total: 'ocho', pendientes: -1, completadas: Number.NaN },
    });
    expect(result.current.stats).toEqual({ total: 0, pendientes: 0, completadas: 0 });
  });

  it.each([
    null,
    {},
    { estado: null, fecha: null, horaInicio: null, precioFinal: 'x' },
  ])('descarta una proxima cita incompleta o malformada: %p', async (nextCita) => {
    const { result } = await renderResolved({ ...resumenValido, nextCita });
    expect(result.current.proximaCita).toBeNull();
  });

  it.each([
    [Object.assign(new Error('No autorizado'), { status: 401, data: { message: 'Sesión expirada' } }), 'Sesión expirada'],
    [Object.assign(new Error('Error interno'), { status: 500 }), 'Error interno'],
    [new TypeError('Failed to fetch'), 'Failed to fetch'],
  ])('expone un error de carga y conserva valores seguros', async (failure, message) => {
    jest.spyOn(HomeRepository, 'getResumenCliente').mockRejectedValueOnce(failure);
    jest.spyOn(HomeRepository, 'getServicios').mockResolvedValueOnce([]);
    const { result } = renderHook();

    await act(async () => { await Promise.resolve(); });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(message);
    expect(result.current.resumen).toBeNull();
    expect(result.current.stats).toEqual({ total: 0, pendientes: 0, completadas: 0 });
    expect(result.current.proximaCita).toBeNull();
  });

  it('marca como error una respuesta primitiva o array malformado', async () => {
    const { result } = await renderResolved('respuesta inesperada');
    expect(result.current.error).toBe('La información del inicio no es válida.');
    expect(result.current.resumen).toBeNull();
  });

  it('no actualiza estado si la solicitud concluye despues del desmontaje', async () => {
    const deferred = createDeferred<ResumenCliente>();
    jest.spyOn(HomeRepository, 'getResumenCliente').mockReturnValueOnce(deferred.promise);
    jest.spyOn(HomeRepository, 'getServicios').mockResolvedValueOnce([]);
    const { renderer } = renderHook();

    act(() => renderer.unmount());
    await act(async () => {
      deferred.resolve(resumenValido);
      await deferred.promise;
    });

    expect(HomeRepository.getResumenCliente).toHaveBeenCalledTimes(1);
  });
});
