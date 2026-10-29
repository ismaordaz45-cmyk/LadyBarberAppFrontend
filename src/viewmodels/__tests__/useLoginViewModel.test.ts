import React from 'react';
import { act } from 'react-test-renderer';
import { useLoginViewModel } from '../useLoginViewModel';
import { AuthRepository } from '../../repositories/authRepository';
import { sessionStore } from '../../services/sessionStore';

// Hook test runner ligero y nativo para React 19 sin dependencias externas
function testHook<T>(hook: () => T) {
  let result = {} as { current: T };
  function Component() {
    result.current = hook();
    return null;
  }
  let rendererInstance: any;
  act(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ReactTestRenderer = require('react-test-renderer');
    rendererInstance = ReactTestRenderer.create(React.createElement(Component));
  });
  return { result, unmount: () => rendererInstance.unmount() };
}

describe('Pruebas Unitarias de Arquitectura MVVM: useLoginViewModel', () => {
  beforeEach(() => {
    sessionStore.clearSession();
    jest.clearAllMocks();
  });

  it('debe inicializar el estado del ViewModel con valores predeterminados', () => {
    const { result } = testHook(() => useLoginViewModel());

    expect(result.current.correo).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.showPassword).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debe alternar la visibilidad de la contraseña al invocar togglePasswordVisibility', () => {
    const { result } = testHook(() => useLoginViewModel());

    expect(result.current.showPassword).toBe(false);
    act(() => {
      result.current.togglePasswordVisibility();
    });
    expect(result.current.showPassword).toBe(true);
    act(() => {
      result.current.togglePasswordVisibility();
    });
    expect(result.current.showPassword).toBe(false);
  });

  it('debe rechazar el submit y asignar error si correo o contraseña están vacíos', async () => {
    const { result } = testHook(() => useLoginViewModel());

    let loginResult: any;
    await act(async () => {
      loginResult = await result.current.handleLogin();
    });

    expect(loginResult).toBe(false);
    expect(result.current.error).toBe('Por favor ingresa tu correo y contraseña.');
    expect(sessionStore.isAuthenticated).toBe(false);
  });

  it('debe autenticar exitosamente y guardar la sesión si el repositorio responde con éxito', async () => {
    const mockUser = { id: 1, nombre: 'Ismael Ordaz', rol: 'CLIENTE', correo: 'ismael@ladybarber.com' };
    const mockResponse = { token: 'mocked_jwt_token', user: mockUser };

    jest.spyOn(AuthRepository, 'login').mockResolvedValueOnce(mockResponse as any);

    const { result } = testHook(() => useLoginViewModel());

    act(() => {
      result.current.setCorreo('ismael@ladybarber.com');
      result.current.setPassword('Password123');
    });

    let loginResult: any;
    await act(async () => {
      loginResult = await result.current.handleLogin();
    });

    expect(loginResult).toEqual(mockUser);
    expect(result.current.error).toBeNull();
    expect(sessionStore.isAuthenticated).toBe(true);
    expect(sessionStore.token).toBe('mocked_jwt_token');
    expect(sessionStore.userId).toBe(1);
  });

  it('debe manejar errores del servidor y asignar el mensaje correspondiente', async () => {
    jest.spyOn(AuthRepository, 'login').mockRejectedValueOnce({
      data: { message: 'Correo o contraseña incorrectos' },
    });

    const { result } = testHook(() => useLoginViewModel());

    act(() => {
      result.current.setCorreo('usuario@invalido.com');
      result.current.setPassword('WrongPass123');
    });

    let loginResult: any;
    await act(async () => {
      loginResult = await result.current.handleLogin();
    });

    expect(loginResult).toBe(false);
    expect(result.current.error).toBe('Correo o contraseña incorrectos');
    expect(sessionStore.isAuthenticated).toBe(false);
  });
});
