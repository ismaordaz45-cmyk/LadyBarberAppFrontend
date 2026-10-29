import React from 'react';
import { act } from 'react-test-renderer';
import { AuthRepository } from '../../repositories/authRepository';
import { useRegistroViewModel } from '../useRegistroViewModel';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
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

type RegistroHook = ReturnType<typeof useRegistroViewModel>;

const fillValidForm = (
  result: { current: RegistroHook },
  overrides: Partial<RegistroHook['formData']> = {}
) => {
  const values = {
    nombre: '  Cliente QA  ',
    apellidoPaterno: '  Prueba  ',
    apellidoMaterno: '',
    telefono: '5512345678',
    correo: '  CLIENTE@EXAMPLE.INVALID  ',
    password: 'Clave123',
    passwordConfirm: 'Clave123',
    preguntaSecreta: '',
    respuestaSecreta: '',
    ...overrides,
  };

  act(() => {
    Object.entries(values).forEach(([field, value]) => {
      result.current.updateField(field as keyof typeof values, value);
    });
  });
};

describe('HU-01 useRegistroViewModel', () => {
  beforeEach(() => jest.restoreAllMocks());

  afterEach(() => {
    act(() => mountedRenderers.splice(0).forEach((renderer) => renderer.unmount()));
    jest.restoreAllMocks();
  });

  it('inicia con formulario vacio y estados inactivos', () => {
    const { result } = testHook(() => useRegistroViewModel());

    expect(Object.values(result.current.formData).every((value) => value === '')).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.exitoso).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.canSubmit).toBe(false);
  });

  it.each([
    ['nombre', '', 'El nombre completo es obligatorio.'],
    ['correo', '', 'El correo electrónico es obligatorio.'],
    ['password', '', 'La contraseña es obligatoria.'],
    ['passwordConfirm', '', 'Debes confirmar tu contraseña.'],
  ] as const)('rechaza el campo obligatorio %s sin llamar al repository', async (field, value, message) => {
    const registroSpy = jest.spyOn(AuthRepository, 'registro')
      .mockRejectedValue(new Error('Llamada inesperada al repository'));
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result, { [field]: value });

    await act(async () => {
      await expect(result.current.handleRegistro()).resolves.toBe(false);
    });
    expect(result.current.error).toBe(message);
    expect(registroSpy).not.toHaveBeenCalled();
  });

  it('rechaza correo con formato incorrecto', async () => {
    const registroSpy = jest.spyOn(AuthRepository, 'registro')
      .mockRejectedValue(new Error('Llamada inesperada al repository'));
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result, { correo: 'correo-invalido' });

    await act(async () => { await result.current.handleRegistro(); });
    expect(result.current.error).toContain('formato válido');
    expect(registroSpy).not.toHaveBeenCalled();
  });

  it('elimina caracteres no numericos y limita el telefono a diez digitos', () => {
    const { result } = testHook(() => useRegistroViewModel());

    act(() => result.current.updateField('telefono', '55a 12-34x567890'));
    expect(result.current.formData.telefono).toBe('5512345678');
    expect(result.current.isTelefonoValid).toBe(true);
  });

  it('rechaza un telefono con longitud incorrecta', async () => {
    const registroSpy = jest.spyOn(AuthRepository, 'registro')
      .mockRejectedValue(new Error('Llamada inesperada al repository'));
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result, { telefono: '55123' });

    await act(async () => { await result.current.handleRegistro(); });
    expect(result.current.error).toContain('exactamente 10 dígitos');
    expect(registroSpy).not.toHaveBeenCalled();
  });

  it.each(['corta1A', 'clavelarga1', 'CLAVELARGA'])(
    'rechaza una contrasena que incumple reglas: %s',
    async (password) => {
      const registroSpy = jest.spyOn(AuthRepository, 'registro')
        .mockRejectedValue(new Error('Llamada inesperada al repository'));
      const { result } = testHook(() => useRegistroViewModel());
      fillValidForm(result, { password, passwordConfirm: password });

      await act(async () => { await result.current.handleRegistro(); });
      expect(result.current.error).toContain('al menos 8 caracteres');
      expect(registroSpy).not.toHaveBeenCalled();
    }
  );

  it('rechaza una confirmacion de contrasena diferente', async () => {
    const registroSpy = jest.spyOn(AuthRepository, 'registro')
      .mockRejectedValue(new Error('Llamada inesperada al repository'));
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result, { passwordConfirm: 'OtraClave1' });

    await act(async () => { await result.current.handleRegistro(); });
    expect(result.current.error).toContain('no coincide');
    expect(registroSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['Pregunta', '', 'pregunta secreta'],
    ['', 'Respuesta', 'respuesta secreta'],
  ])('exige pregunta y respuesta juntas', async (pregunta, respuesta, expectedPart) => {
    const registroSpy = jest.spyOn(AuthRepository, 'registro')
      .mockRejectedValue(new Error('Llamada inesperada al repository'));
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result, { preguntaSecreta: pregunta, respuestaSecreta: respuesta });

    await act(async () => { await result.current.handleRegistro(); });
    expect(result.current.error).toContain(expectedPart);
    expect(registroSpy).not.toHaveBeenCalled();
  });

  it('normaliza, fija rol CLIENTE y omite opcionales vacios', async () => {
    const registroSpy = jest.spyOn(AuthRepository, 'registro').mockResolvedValueOnce({
      message: 'Registro correcto',
      userId: 19,
    });
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result, { telefono: '' });

    await act(async () => {
      await expect(result.current.handleRegistro()).resolves.toBe(true);
    });
    expect(registroSpy).toHaveBeenCalledTimes(1);
    expect(registroSpy).toHaveBeenCalledWith({
      nombre: 'Cliente QA',
      apellidoPaterno: 'Prueba',
      apellidoMaterno: undefined,
      correo: 'cliente@example.invalid',
      telefono: undefined,
      password: 'Clave123',
      rol: 'CLIENTE',
      preguntaSecreta: undefined,
      respuestaSecreta: undefined,
    });
    expect(result.current.exitoso).toBe(true);
    expect(result.current.mensajeExito).toBe('Registro correcto');
    expect(result.current.isLoading).toBe(false);
  });

  it('incluye pregunta y respuesta cuando ambas estan presentes', async () => {
    const registroSpy = jest.spyOn(AuthRepository, 'registro').mockResolvedValueOnce({
      message: 'Registro correcto',
    });
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result, {
      preguntaSecreta: '  Nombre de mascota  ',
      respuestaSecreta: '  Luna  ',
    });

    await act(async () => { await result.current.handleRegistro(); });
    expect(registroSpy).toHaveBeenCalledWith(expect.objectContaining({
      preguntaSecreta: 'Nombre de mascota',
      respuestaSecreta: 'Luna',
    }));
  });

  it.each([
    [400, { data: { error: 'Solicitud invalida' } }, 'Solicitud invalida'],
    [409, { data: { message: 'El correo ya existe' } }, 'El correo ya existe'],
    [500, Object.assign(new Error('Error interno'), { status: 500 }), 'Error interno'],
    ['red', new Error('No se pudo conectar'), 'No se pudo conectar'],
  ])('maneja un fallo %s sin marcar exito', async (_kind, failure, expectedMessage) => {
    jest.spyOn(AuthRepository, 'registro').mockRejectedValueOnce(failure);
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result);

    await act(async () => {
      await expect(result.current.handleRegistro()).resolves.toBe(false);
    });
    expect(result.current.error).toBe(expectedMessage);
    expect(result.current.exitoso).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('rechaza una respuesta exitosa sin el message exigido por RegistroResponse', async () => {
    jest.spyOn(AuthRepository, 'registro').mockResolvedValueOnce({} as any);
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result);

    await act(async () => {
      await expect(result.current.handleRegistro()).resolves.toBe(false);
    });
    expect(result.current.error).toBe('Respuesta de registro inválida.');
    expect(result.current.exitoso).toBe(false);
  });

  it('mantiene isLoading durante la solicitud y lo restaura al terminar', async () => {
    const deferred = createDeferred<{ message: string }>();
    jest.spyOn(AuthRepository, 'registro').mockReturnValueOnce(deferred.promise);
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result);

    let request!: Promise<boolean>;
    act(() => { request = result.current.handleRegistro(); });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      deferred.resolve({ message: 'Registro correcto' });
      await request;
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.exitoso).toBe(true);
  });

  it('impide solicitudes de registro simultaneas', async () => {
    const deferred = createDeferred<{ message: string }>();
    const registroSpy = jest.spyOn(AuthRepository, 'registro').mockReturnValue(deferred.promise);
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result);

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.handleRegistro();
      second = result.current.handleRegistro();
    });
    expect(registroSpy).toHaveBeenCalledTimes(1);
    await expect(second).resolves.toBe(false);
    await act(async () => {
      deferred.resolve({ message: 'Registro correcto' });
      await first;
    });
  });

  it('restablece todos los campos y estados del formulario', async () => {
    jest.spyOn(AuthRepository, 'registro').mockResolvedValueOnce({ message: 'Registro correcto' });
    const { result } = testHook(() => useRegistroViewModel());
    fillValidForm(result);

    await act(async () => { await result.current.handleRegistro(); });
    act(() => result.current.resetFormulario());
    expect(Object.values(result.current.formData).every((value) => value === '')).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.exitoso).toBe(false);
    expect(result.current.mensajeExito).toBeNull();
  });
});
