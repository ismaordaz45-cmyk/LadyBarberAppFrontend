import React from 'react';
import { act } from 'react-test-renderer';
import { useLoginViewModel } from '../useLoginViewModel';
import { AuthRepository } from '../../repositories/authRepository';
import { sessionStore } from '../../services/sessionStore';

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
  let rendererInstance: any;
  act(() => {
    const ReactTestRenderer = require('react-test-renderer');
    rendererInstance = ReactTestRenderer.create(React.createElement(Component));
  });
  mountedRenderers.push(rendererInstance);
  return { result };
}

const validUser = {
  id: 1,
  nombre: 'Ismael Ordaz',
  apellidoPaterno: 'Ordaz',
  apellidoMaterno: 'Prueba',
  correo: 'ismael@example.invalid',
  telefono: '5512345678',
  rol: 'CLIENTE',
};

const validResponse = {
  message: 'Acceso correcto',
  token: 'jwt_ficticio_valido',
  user: validUser,
};

describe('HU-01 useLoginViewModel', () => {
  beforeEach(() => {
    sessionStore.clearSession();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    act(() => mountedRenderers.splice(0).forEach((renderer) => renderer.unmount()));
    sessionStore.clearSession();
    jest.restoreAllMocks();
  });

  it('inicia con el formulario y la sesion limpios', () => {
    const { result } = testHook(() => useLoginViewModel());

    expect(result.current.correo).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.showPassword).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(sessionStore.isAuthenticated).toBe(false);
  });

  it('alterna la visibilidad de la contrasena', () => {
    const { result } = testHook(() => useLoginViewModel());

    act(() => result.current.togglePasswordVisibility());
    expect(result.current.showPassword).toBe(true);
    act(() => result.current.togglePasswordVisibility());
    expect(result.current.showPassword).toBe(false);
  });

  it.each([
    ['', 'Clave123'],
    ['   ', 'Clave123'],
    ['cliente@example.invalid', ''],
  ])('rechaza identificador o contrasena vacios sin llamar al repository', async (correo, password) => {
    const loginSpy = jest.spyOn(AuthRepository, 'login')
      .mockRejectedValue(new Error('Llamada inesperada al repository'));
    const { result } = testHook(() => useLoginViewModel());

    act(() => {
      result.current.setCorreo(correo);
      result.current.setPassword(password);
    });
    await act(async () => {
      await expect(result.current.handleLogin()).resolves.toBe(false);
    });

    expect(result.current.error).toBe('Por favor ingresa tu correo y contraseña.');
    expect(loginSpy).not.toHaveBeenCalled();
    expect(sessionStore.isAuthenticated).toBe(false);
  });

  it('normaliza el identificador y almacena la sesion completa', async () => {
    const loginSpy = jest.spyOn(AuthRepository, 'login').mockResolvedValueOnce(validResponse);
    const { result } = testHook(() => useLoginViewModel());

    act(() => {
      result.current.setCorreo('  ISMAEL@EXAMPLE.INVALID  ');
      result.current.setPassword('Clave123');
    });
    await act(async () => {
      await expect(result.current.handleLogin()).resolves.toEqual(validUser);
    });

    expect(loginSpy).toHaveBeenCalledTimes(1);
    expect(loginSpy).toHaveBeenCalledWith('ismael@example.invalid', 'Clave123');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(sessionStore.token).toBe('jwt_ficticio_valido');
    expect(sessionStore.userId).toBe(1);
    expect(sessionStore.userNombre).toBe('Ismael Ordaz');
    expect(sessionStore.userRol).toBe('CLIENTE');
  });

  it.each([
    [400, Object.assign(new Error('Solicitud invalida'), {
      status: 400,
      data: { error: 'Solicitud invalida' },
    }), 'Solicitud invalida'],
    [401, { data: { message: 'Credenciales incorrectas' } }, 'Credenciales incorrectas'],
    [500, Object.assign(new Error('Error interno'), { status: 500 }), 'Error interno'],
    ['red', new Error('No se pudo conectar'), 'No se pudo conectar'],
  ])('maneja un fallo %s sin crear sesion', async (_kind, failure, expectedMessage) => {
    jest.spyOn(AuthRepository, 'login').mockRejectedValueOnce(failure);
    const { result } = testHook(() => useLoginViewModel());

    act(() => {
      result.current.setCorreo('cliente@example.invalid');
      result.current.setPassword('Clave123');
    });
    await act(async () => {
      await expect(result.current.handleLogin()).resolves.toBe(false);
    });

    expect(result.current.error).toBe(expectedMessage);
    expect(result.current.isLoading).toBe(false);
    expect(sessionStore.isAuthenticated).toBe(false);
  });

  it.each([
    ['token', { ...validResponse, token: '' }],
    ['usuario', { message: 'Acceso', token: 'jwt_ficticio', user: undefined }],
  ])('rechaza una respuesta exitosa sin %s', async (_missingField, response) => {
    jest.spyOn(AuthRepository, 'login').mockResolvedValueOnce(response as any);
    const { result } = testHook(() => useLoginViewModel());

    act(() => {
      result.current.setCorreo('cliente@example.invalid');
      result.current.setPassword('Clave123');
    });
    await act(async () => {
      await expect(result.current.handleLogin()).resolves.toBe(false);
    });

    expect(result.current.error).toBe('Respuesta de autenticación inválida.');
    expect(result.current.isLoading).toBe(false);
    expect(sessionStore.isAuthenticated).toBe(false);
  });

  it('mantiene isLoading durante la solicitud y lo restaura tras el exito', async () => {
    const deferred = createDeferred<typeof validResponse>();
    jest.spyOn(AuthRepository, 'login').mockReturnValueOnce(deferred.promise);
    const { result } = testHook(() => useLoginViewModel());
    act(() => {
      result.current.setCorreo('cliente@example.invalid');
      result.current.setPassword('Clave123');
    });

    let request!: Promise<unknown>;
    act(() => { request = result.current.handleLogin(); });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      deferred.resolve(validResponse);
      await request;
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('restaura isLoading tras un error diferido', async () => {
    const deferred = createDeferred<typeof validResponse>();
    jest.spyOn(AuthRepository, 'login').mockReturnValueOnce(deferred.promise);
    const { result } = testHook(() => useLoginViewModel());
    act(() => {
      result.current.setCorreo('cliente@example.invalid');
      result.current.setPassword('Clave123');
    });

    let request!: Promise<unknown>;
    act(() => { request = result.current.handleLogin(); });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      deferred.reject(new Error('Fallo diferido'));
      await request;
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Fallo diferido');
  });

  it('impide dos solicitudes simultaneas', async () => {
    const deferred = createDeferred<typeof validResponse>();
    const loginSpy = jest.spyOn(AuthRepository, 'login').mockReturnValue(deferred.promise);
    const { result } = testHook(() => useLoginViewModel());
    act(() => {
      result.current.setCorreo('cliente@example.invalid');
      result.current.setPassword('Clave123');
    });

    let first!: Promise<unknown>;
    let second!: Promise<unknown>;
    act(() => {
      first = result.current.handleLogin();
      second = result.current.handleLogin();
    });
    expect(loginSpy).toHaveBeenCalledTimes(1);
    await expect(second).resolves.toBe(false);
    await act(async () => {
      deferred.resolve(validResponse);
      await first;
    });
  });
});
