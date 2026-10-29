import React from 'react';
import { act } from 'react-test-renderer';
import { AuthRepository } from '../../repositories/authRepository';
import { useRestablecerPasswordViewModel } from '../useRestablecerPasswordViewModel';

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
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

type ResetHook = ReturnType<typeof useRestablecerPasswordViewModel>;

const fillValidPassword = (result: { current: ResetHook }) => {
  act(() => {
    result.current.setPassword('NuevaClave1');
    result.current.setPasswordConfirm('NuevaClave1');
  });
};

describe('HU-02 useRestablecerPasswordViewModel', () => {
  beforeEach(() => jest.restoreAllMocks());

  afterEach(() => {
    act(() => mountedRenderers.splice(0).forEach((renderer) => renderer.unmount()));
    jest.restoreAllMocks();
  });

  it('recibe el token inicial y permite reemplazarlo manualmente', () => {
    const { result } = testHook(() => useRestablecerPasswordViewModel('token_inicial'));

    expect(result.current.token).toBe('token_inicial');
    act(() => result.current.setToken('token_manual'));
    expect(result.current.token).toBe('token_manual');
  });

  it.each(['', '   '])('rechaza token vacio sin llamar al repository', async (token) => {
    const repositorySpy = jest.spyOn(AuthRepository, 'restablecerPassword')
      .mockRejectedValue(new Error('Llamada inesperada al repository'));
    const { result } = testHook(() => useRestablecerPasswordViewModel(token));
    fillValidPassword(result);

    await act(async () => {
      await expect(result.current.handleRestablecerPassword()).resolves.toBe(false);
    });
    expect(result.current.error).toBe('El token es obligatorio para restablecer tu contraseña.');
    expect(repositorySpy).not.toHaveBeenCalled();
  });

  it.each(['Corta1', 'clavelarga1', 'CLAVELARGA'])(
    'rechaza password que incumple reglas: %s',
    async (password) => {
      const repositorySpy = jest.spyOn(AuthRepository, 'restablecerPassword')
        .mockRejectedValue(new Error('Llamada inesperada al repository'));
      const { result } = testHook(() => useRestablecerPasswordViewModel('token_ficticio'));
      act(() => {
        result.current.setPassword(password);
        result.current.setPasswordConfirm(password);
      });

      await act(async () => { await result.current.handleRestablecerPassword(); });
      expect(result.current.error).toContain('todos los requisitos');
      expect(repositorySpy).not.toHaveBeenCalled();
    }
  );

  it('rechaza confirmacion diferente', async () => {
    const repositorySpy = jest.spyOn(AuthRepository, 'restablecerPassword')
      .mockRejectedValue(new Error('Llamada inesperada al repository'));
    const { result } = testHook(() => useRestablecerPasswordViewModel('token_ficticio'));
    act(() => {
      result.current.setPassword('NuevaClave1');
      result.current.setPasswordConfirm('OtraClave1');
    });

    await act(async () => { await result.current.handleRestablecerPassword(); });
    expect(result.current.error).toBe('Las contraseñas no coinciden.');
    expect(repositorySpy).not.toHaveBeenCalled();
  });

  it('normaliza token, envia payload exacto y conserva message', async () => {
    const repositorySpy = jest.spyOn(AuthRepository, 'restablecerPassword')
      .mockResolvedValueOnce({ message: 'Contraseña actualizada' });
    const { result } = testHook(() => useRestablecerPasswordViewModel('  token_ficticio  '));
    fillValidPassword(result);

    await act(async () => {
      await expect(result.current.handleRestablecerPassword()).resolves.toBe(true);
    });
    expect(repositorySpy).toHaveBeenCalledTimes(1);
    expect(repositorySpy).toHaveBeenCalledWith('token_ficticio', 'NuevaClave1');
    expect(result.current.exitoso).toBe(true);
    expect(result.current.mensajeExito).toBe('Contraseña actualizada');
    expect(result.current.isLoading).toBe(false);
  });

  it.each([
    ['sin message', {}],
    ['message vacio', { message: '  ' }],
  ])('rechaza respuesta exitosa malformada: %s', async (_case, response) => {
    jest.spyOn(AuthRepository, 'restablecerPassword').mockResolvedValueOnce(response as any);
    const { result } = testHook(() => useRestablecerPasswordViewModel('token_ficticio'));
    fillValidPassword(result);

    await act(async () => {
      await expect(result.current.handleRestablecerPassword()).resolves.toBe(false);
    });
    expect(result.current.error).toBe('Respuesta de restablecimiento inválida.');
    expect(result.current.exitoso).toBe(false);
  });

  it.each([
    [400, 'Token incorrecto'],
    [401, 'Token expirado'],
    [404, 'Token no encontrado'],
    [429, 'Demasiadas solicitudes'],
    [500, 'Error interno'],
    ['red', 'No se pudo conectar'],
  ])('maneja fallo %s sin marcar exito', async (status, message) => {
    const failure = Object.assign(new Error(message), {
      status: typeof status === 'number' ? status : undefined,
      data: typeof status === 'number' ? { error: message } : undefined,
    });
    jest.spyOn(AuthRepository, 'restablecerPassword').mockRejectedValueOnce(failure);
    const { result } = testHook(() => useRestablecerPasswordViewModel('token_ficticio'));
    fillValidPassword(result);

    await act(async () => {
      await expect(result.current.handleRestablecerPassword()).resolves.toBe(false);
    });
    expect(result.current.error).toBe(message);
    expect(result.current.exitoso).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('mantiene isLoading durante una solicitud pendiente', async () => {
    const deferred = createDeferred<{ message: string }>();
    jest.spyOn(AuthRepository, 'restablecerPassword').mockReturnValueOnce(deferred.promise);
    const { result } = testHook(() => useRestablecerPasswordViewModel('token_ficticio'));
    fillValidPassword(result);

    let request!: Promise<boolean>;
    act(() => { request = result.current.handleRestablecerPassword(); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      deferred.resolve({ message: 'Contraseña actualizada' });
      await request;
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.exitoso).toBe(true);
  });

  it('impide dos solicitudes simultaneas', async () => {
    const deferred = createDeferred<{ message: string }>();
    const repositorySpy = jest.spyOn(AuthRepository, 'restablecerPassword')
      .mockReturnValue(deferred.promise);
    const { result } = testHook(() => useRestablecerPasswordViewModel('token_ficticio'));
    fillValidPassword(result);

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.handleRestablecerPassword();
      second = result.current.handleRestablecerPassword();
    });
    expect(repositorySpy).toHaveBeenCalledTimes(1);
    await expect(second).resolves.toBe(false);

    await act(async () => {
      deferred.resolve({ message: 'Contraseña actualizada' });
      await first;
    });
  });

  it('alterna visibilidad de ambas contrasenas', () => {
    const { result } = testHook(() => useRestablecerPasswordViewModel('token_ficticio'));

    act(() => {
      result.current.toggleShowPassword();
      result.current.toggleShowPasswordConfirm();
    });
    expect(result.current.showPassword).toBe(true);
    expect(result.current.showPasswordConfirm).toBe(true);
  });

  it('restablece passwords y mensajes sin exponer ni eliminar el token', async () => {
    jest.spyOn(AuthRepository, 'restablecerPassword')
      .mockResolvedValueOnce({ message: 'Contraseña actualizada' });
    const { result } = testHook(() => useRestablecerPasswordViewModel('token_ficticio'));
    fillValidPassword(result);
    await act(async () => { await result.current.handleRestablecerPassword(); });

    act(() => result.current.resetFormulario());
    expect(result.current.token).toBe('token_ficticio');
    expect(result.current.password).toBe('');
    expect(result.current.passwordConfirm).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.exitoso).toBe(false);
    expect(result.current.mensajeExito).toBeNull();
  });

  it('no imprime token ni password en consola', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(AuthRepository, 'restablecerPassword')
      .mockResolvedValueOnce({ message: 'Contraseña actualizada' });
    const { result } = testHook(() => useRestablecerPasswordViewModel('token_super_secreto'));
    fillValidPassword(result);

    await act(async () => { await result.current.handleRestablecerPassword(); });

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
