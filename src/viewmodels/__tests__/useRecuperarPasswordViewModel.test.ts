import React from 'react';
import { act } from 'react-test-renderer';
import { AuthRepository } from '../../repositories/authRepository';
import { useRecuperarPasswordViewModel } from '../useRecuperarPasswordViewModel';

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

const mountedRenderers: any[] = [];

function testHook<T>(hook: () => T) {
  const result = {} as { current: T };
  function Component() {
    result.current = hook();
    return null;
  }
  let renderer: any;
  act(() => {
    const ReactTestRenderer = require('react-test-renderer');
    renderer = ReactTestRenderer.create(React.createElement(Component));
  });
  mountedRenderers.push(renderer);
  return { result };
}

describe('HU-02 useRecuperarPasswordViewModel', () => {
  beforeEach(() => jest.restoreAllMocks());

  afterEach(() => {
    act(() => mountedRenderers.splice(0).forEach((renderer) => renderer.unmount()));
    jest.restoreAllMocks();
  });

  it('inicia con estado limpio', () => {
    const { result } = testHook(() => useRecuperarPasswordViewModel());

    expect(result.current.correo).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.enviado).toBe(false);
    expect(result.current.mensajeExito).toBeNull();
  });

  it.each([
    ['', 'Ingresa tu correo electrónico.'],
    ['   ', 'Ingresa tu correo electrónico.'],
    ['correo-invalido', 'Ingresa un correo electrónico válido.'],
  ])('rechaza correo no valido sin llamar al repository', async (correo, expectedError) => {
    const repositorySpy = jest.spyOn(AuthRepository, 'solicitarRecuperacion')
      .mockRejectedValue(new Error('Llamada inesperada al repository'));
    const { result } = testHook(() => useRecuperarPasswordViewModel());
    act(() => result.current.setCorreo(correo));

    await act(async () => {
      await expect(result.current.handleSolicitarRecuperacion()).resolves.toBe(false);
    });

    expect(result.current.error).toBe(expectedError);
    expect(repositorySpy).not.toHaveBeenCalled();
    expect(result.current.enviado).toBe(false);
  });

  it('normaliza el correo y conserva el message valido', async () => {
    const repositorySpy = jest.spyOn(AuthRepository, 'solicitarRecuperacion')
      .mockResolvedValueOnce({ message: 'Revisa tu bandeja de entrada' });
    const { result } = testHook(() => useRecuperarPasswordViewModel());
    act(() => result.current.setCorreo('  CLIENTE@EXAMPLE.INVALID  '));

    await act(async () => {
      await expect(result.current.handleSolicitarRecuperacion()).resolves.toBe(true);
    });

    expect(repositorySpy).toHaveBeenCalledTimes(1);
    expect(repositorySpy).toHaveBeenCalledWith('cliente@example.invalid');
    expect(result.current.enviado).toBe(true);
    expect(result.current.mensajeExito).toBe('Revisa tu bandeja de entrada');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it.each([
    ['sin message', {}],
    ['message vacio', { message: '   ' }],
  ])('rechaza respuesta exitosa malformada: %s', async (_case, response) => {
    jest.spyOn(AuthRepository, 'solicitarRecuperacion').mockResolvedValueOnce(response as any);
    const { result } = testHook(() => useRecuperarPasswordViewModel());
    act(() => result.current.setCorreo('cliente@example.invalid'));

    await act(async () => {
      await expect(result.current.handleSolicitarRecuperacion()).resolves.toBe(false);
    });

    expect(result.current.error).toBe('Respuesta de recuperación inválida.');
    expect(result.current.enviado).toBe(false);
    expect(result.current.mensajeExito).toBeNull();
  });

  it.each([
    [400, Object.assign(new Error('Solicitud inválida'), { status: 400 })],
    [404, Object.assign(new Error('Respuesta genérica del servidor'), {
      status: 404,
      data: { message: 'Respuesta genérica del servidor' },
    })],
    [429, Object.assign(new Error('Demasiadas solicitudes'), { status: 429 })],
    [500, Object.assign(new Error('Error interno'), { status: 500 })],
    ['red', new Error('No se pudo conectar')],
  ])('maneja fallo %s sin marcar la solicitud como enviada', async (_kind, failure) => {
    jest.spyOn(AuthRepository, 'solicitarRecuperacion').mockRejectedValueOnce(failure);
    const { result } = testHook(() => useRecuperarPasswordViewModel());
    act(() => result.current.setCorreo('cliente@example.invalid'));

    await act(async () => {
      await expect(result.current.handleSolicitarRecuperacion()).resolves.toBe(false);
    });

    expect(result.current.error).toBe(failure.message);
    expect(result.current.enviado).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('mantiene isLoading durante la promesa y lo restaura al resolver', async () => {
    const deferred = createDeferred<{ message: string }>();
    jest.spyOn(AuthRepository, 'solicitarRecuperacion').mockReturnValueOnce(deferred.promise);
    const { result } = testHook(() => useRecuperarPasswordViewModel());
    act(() => result.current.setCorreo('cliente@example.invalid'));

    let request!: Promise<boolean>;
    act(() => { request = result.current.handleSolicitarRecuperacion(); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      deferred.resolve({ message: 'Solicitud aceptada' });
      await request;
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.enviado).toBe(true);
  });

  it('restaura isLoading despues de un rechazo diferido', async () => {
    const deferred = createDeferred<{ message: string }>();
    jest.spyOn(AuthRepository, 'solicitarRecuperacion').mockReturnValueOnce(deferred.promise);
    const { result } = testHook(() => useRecuperarPasswordViewModel());
    act(() => result.current.setCorreo('cliente@example.invalid'));

    let request!: Promise<boolean>;
    act(() => { request = result.current.handleSolicitarRecuperacion(); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      deferred.reject(new Error('Fallo diferido'));
      await request;
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Fallo diferido');
  });

  it('impide dos solicitudes simultaneas', async () => {
    const deferred = createDeferred<{ message: string }>();
    const repositorySpy = jest.spyOn(AuthRepository, 'solicitarRecuperacion')
      .mockReturnValue(deferred.promise);
    const { result } = testHook(() => useRecuperarPasswordViewModel());
    act(() => result.current.setCorreo('cliente@example.invalid'));

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.handleSolicitarRecuperacion();
      second = result.current.handleSolicitarRecuperacion();
    });

    expect(repositorySpy).toHaveBeenCalledTimes(1);
    await expect(second).resolves.toBe(false);
    await act(async () => {
      deferred.resolve({ message: 'Solicitud aceptada' });
      await first;
    });
  });

  it('restablece correo, errores y estado de exito', async () => {
    jest.spyOn(AuthRepository, 'solicitarRecuperacion')
      .mockResolvedValueOnce({ message: 'Solicitud aceptada' });
    const { result } = testHook(() => useRecuperarPasswordViewModel());
    act(() => result.current.setCorreo('cliente@example.invalid'));
    await act(async () => { await result.current.handleSolicitarRecuperacion(); });

    act(() => result.current.resetFormulario());
    expect(result.current.correo).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.enviado).toBe(false);
    expect(result.current.mensajeExito).toBeNull();
  });

  it('no imprime correos ni informacion de cuenta en consola', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(AuthRepository, 'solicitarRecuperacion')
      .mockResolvedValueOnce({ message: 'Solicitud aceptada' });
    const { result } = testHook(() => useRecuperarPasswordViewModel());
    act(() => result.current.setCorreo('cliente@example.invalid'));

    await act(async () => { await result.current.handleSolicitarRecuperacion(); });

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
