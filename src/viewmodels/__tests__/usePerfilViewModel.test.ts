import React from 'react';
import { act } from 'react-test-renderer';
import { ResumenPerfilCliente } from '../../models/Perfil';
import { CuentaRepository } from '../../repositories/cuentaRepository';
import { PerfilRepository } from '../../repositories/perfilRepository';
import { sessionStore } from '../../services/sessionStore';
import { usePerfilViewModel } from '../usePerfilViewModel';

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

const validProfile: ResumenPerfilCliente = {
  user: {
    id: 7,
    nombre: 'Cliente',
    apellidoPaterno: 'Prueba',
    apellidoMaterno: null,
    correo: 'cliente@example.invalid',
    telefono: '7710000000',
    rol: 'CLIENTE',
  },
  clienteId: 12,
  stats: { total: 3, pendientes: 1, completadas: 2 },
  nextCita: null,
  actualizadoEn: '2026-11-07T00:00:00.000Z',
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
    renderer = require('react-test-renderer').create(React.createElement(Component));
  });
  mountedRenderers.push(renderer);
  return { result };
}

const renderLoaded = async (response: unknown = validProfile) => {
  jest.spyOn(PerfilRepository, 'obtenerPerfil').mockResolvedValueOnce(response as any);
  const hook = testHook(() => usePerfilViewModel());
  await act(async () => { await Promise.resolve(); });
  return hook;
};

describe('HU-03 usePerfilViewModel', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    sessionStore.setSession('jwt_ficticio', 7, 'Cliente', 'CLIENTE');
  });

  afterEach(() => {
    act(() => mountedRenderers.splice(0).forEach((renderer) => renderer.unmount()));
    sessionStore.clearSession();
    jest.restoreAllMocks();
  });

  it('carga el perfil autenticado y calcula el nombre completo', async () => {
    const { result } = await renderLoaded();

    expect(PerfilRepository.obtenerPerfil).toHaveBeenCalledTimes(1);
    expect(result.current.perfil).toEqual(validProfile);
    expect(result.current.nombreCompleto).toBe('Cliente Prueba');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.profileError).toBe('');
  });

  it('expone el error del backend y permite reintentar', async () => {
    const failure = { data: { message: 'Perfil no encontrado' } };
    jest.spyOn(PerfilRepository, 'obtenerPerfil')
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(validProfile);
    const { result } = testHook(() => usePerfilViewModel());
    await act(async () => { await Promise.resolve(); });

    expect(result.current.perfil).toBeNull();
    expect(result.current.profileError).toBe('Perfil no encontrado');
    await act(async () => {
      await expect(result.current.cargarPerfil()).resolves.toBe(true);
    });
    expect(result.current.perfil).toEqual(validProfile);
  });

  it('rechaza una respuesta de perfil incompleta', async () => {
    const { result } = await renderLoaded({ user: { nombre: 'Incompleto' } });

    expect(result.current.perfil).toBeNull();
    expect(result.current.profileError).toBe(
      'El servidor devolvió un perfil inesperado.'
    );
  });

  it('no consulta el perfil cuando la sesión terminó', async () => {
    sessionStore.clearSession();
    const repositorySpy = jest.spyOn(PerfilRepository, 'obtenerPerfil');
    const { result } = testHook(() => usePerfilViewModel());
    await act(async () => { await Promise.resolve(); });

    expect(repositorySpy).not.toHaveBeenCalled();
    expect(result.current.profileError).toBe(
      'Tu sesión terminó. Inicia sesión nuevamente.'
    );
  });

  it('impide cargas simultáneas', async () => {
    const deferred = createDeferred<ResumenPerfilCliente>();
    const repositorySpy = jest
      .spyOn(PerfilRepository, 'obtenerPerfil')
      .mockReturnValue(deferred.promise);
    const { result } = testHook(() => usePerfilViewModel());

    await expect(result.current.cargarPerfil()).resolves.toBe(false);
    expect(repositorySpy).toHaveBeenCalledTimes(1);
    await act(async () => {
      deferred.resolve(validProfile);
      await deferred.promise;
    });
    expect(result.current.perfil).toEqual(validProfile);
  });

  it('conserva los datos actuales si falla una actualización manual', async () => {
    const { result } = await renderLoaded();
    jest.spyOn(PerfilRepository, 'obtenerPerfil').mockRejectedValueOnce(
      new Error('No fue posible actualizar')
    );

    await act(async () => {
      await expect(result.current.cargarPerfil(true)).resolves.toBe(false);
    });

    expect(result.current.perfil).toEqual(validProfile);
    expect(result.current.profileError).toBe('No fue posible actualizar');
    expect(result.current.isRefreshing).toBe(false);
  });

  it('abre el formulario con los datos actuales y puede cerrarlo', async () => {
    const { result } = await renderLoaded();

    act(() => result.current.openEditModal());
    expect(result.current.isEditModalVisible).toBe(true);
    expect(result.current.nombre).toBe('Cliente');
    expect(result.current.apellidoPaterno).toBe('Prueba');
    expect(result.current.apellidoMaterno).toBe('');
    expect(result.current.telefono).toBe('7710000000');

    act(() => result.current.closeEditModal());
    expect(result.current.isEditModalVisible).toBe(false);
  });

  it.each([
    ['', '7710000000', 'El nombre es obligatorio.'],
    ['Cliente123', '7710000000', 'El nombre contiene caracteres no permitidos.'],
    ['Cliente', '12345', 'El teléfono debe contener entre 10 y 15 dígitos y puede iniciar con +.'],
  ])('valida el formulario sin llamar al repositorio', async (
    nombre,
    telefono,
    expectedError
  ) => {
    const updateSpy = jest.spyOn(PerfilRepository, 'actualizarPerfil');
    const { result } = await renderLoaded();
    act(() => {
      result.current.openEditModal();
      result.current.updateNombre(nombre);
      result.current.updateTelefono(telefono);
    });

    await act(async () => {
      await expect(result.current.handleGuardarPerfil()).resolves.toBe(false);
    });
    expect(updateSpy).not.toHaveBeenCalled();
    expect(result.current.editError).toBe(expectedError);
  });

  it('normaliza, guarda y actualiza la sesión', async () => {
    const updatedProfile: ResumenPerfilCliente = {
      ...validProfile,
      user: {
        ...validProfile.user,
        nombre: 'María José',
        apellidoPaterno: "D'Ávila",
        telefono: '+527710000000',
      },
    };
    const updateSpy = jest.spyOn(PerfilRepository, 'actualizarPerfil').mockResolvedValueOnce({
      message: 'Perfil actualizado correctamente',
      perfil: updatedProfile,
    });
    const { result } = await renderLoaded();
    act(() => {
      result.current.openEditModal();
      result.current.updateNombre('  María   José  ');
      result.current.updateApellidoPaterno(" D'Ávila ");
      result.current.updateApellidoMaterno('');
      result.current.updateTelefono('+52 (771) 000-0000');
    });

    await act(async () => {
      await expect(result.current.handleGuardarPerfil()).resolves.toBe(true);
    });

    expect(updateSpy).toHaveBeenCalledWith({
      nombre: 'María José',
      apellidoPaterno: "D'Ávila",
      apellidoMaterno: null,
      telefono: '+527710000000',
    });
    expect(result.current.perfil).toEqual(updatedProfile);
    expect(result.current.isEditModalVisible).toBe(false);
    expect(result.current.successMessage).toBe('Perfil actualizado correctamente');
    expect(sessionStore.userNombre).toBe('María José');
  });

  it.each([
    [{ data: { message: 'Datos inválidos' } }, 'Datos inválidos'],
    [new Error('No se pudo conectar'), 'No se pudo conectar'],
  ])('conserva el error de guardado y mantiene el formulario', async (
    failure,
    expectedMessage
  ) => {
    jest.spyOn(PerfilRepository, 'actualizarPerfil').mockRejectedValueOnce(failure);
    const { result } = await renderLoaded();
    act(() => result.current.openEditModal());

    await act(async () => {
      await expect(result.current.handleGuardarPerfil()).resolves.toBe(false);
    });
    expect(result.current.editError).toBe(expectedMessage);
    expect(result.current.isEditModalVisible).toBe(true);
    expect(result.current.isSaving).toBe(false);
  });

  it('rechaza una actualización perteneciente a otro usuario', async () => {
    jest.spyOn(PerfilRepository, 'actualizarPerfil').mockResolvedValueOnce({
      message: 'Perfil actualizado',
      perfil: {
        ...validProfile,
        user: { ...validProfile.user, id: 99 },
      },
    });
    const { result } = await renderLoaded();
    act(() => result.current.openEditModal());

    await act(async () => { await result.current.handleGuardarPerfil(); });
    expect(result.current.editError).toBe(
      'El servidor devolvió una actualización inesperada.'
    );
    expect(sessionStore.userId).toBe(7);
  });

  it('impide guardados simultáneos', async () => {
    const deferred = createDeferred<{ message: string; perfil: ResumenPerfilCliente }>();
    const updateSpy = jest
      .spyOn(PerfilRepository, 'actualizarPerfil')
      .mockReturnValue(deferred.promise);
    const { result } = await renderLoaded();
    act(() => result.current.openEditModal());

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.handleGuardarPerfil();
      second = result.current.handleGuardarPerfil();
    });
    expect(updateSpy).toHaveBeenCalledTimes(1);
    await expect(second).resolves.toBe(false);
    await act(async () => {
      deferred.resolve({ message: 'Perfil actualizado', perfil: validProfile });
      await first;
    });
    expect(result.current.isSaving).toBe(false);
  });

  it('limpia la sesión al cerrar sesión', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.handleCerrarSesion());
    expect(sessionStore.isAuthenticated).toBe(false);
    expect(result.current.perfil).toBeNull();
  });

  it('valida la eliminación sin llamar a la API', async () => {
    const deleteSpy = jest.spyOn(CuentaRepository, 'eliminarCuenta');
    const { result } = await renderLoaded();
    act(() => {
      result.current.openDeleteModal();
      result.current.updatePassword('ClaveSegura1');
      result.current.updateConfirmation('eliminar');
    });

    await act(async () => {
      await expect(result.current.handleEliminarCuenta()).resolves.toBe(false);
    });
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(result.current.deleteError).toBe(
      'Escribe ELIMINAR exactamente para confirmar.'
    );
  });

  it('elimina la cuenta y limpia la sesión', async () => {
    jest.spyOn(CuentaRepository, 'eliminarCuenta').mockResolvedValueOnce({
      ok: true,
      message: 'Cuenta eliminada',
    });
    const { result } = await renderLoaded();
    act(() => {
      result.current.openDeleteModal();
      result.current.updatePassword('ClaveSegura1');
      result.current.updateConfirmation('ELIMINAR');
    });

    await act(async () => {
      await expect(result.current.handleEliminarCuenta()).resolves.toBe(true);
    });
    expect(sessionStore.isAuthenticated).toBe(false);
    expect(result.current.perfil).toBeNull();
    expect(result.current.isDeleteModalVisible).toBe(false);
  });

  it('conserva el perfil y la sesión si la eliminación falla', async () => {
    jest.spyOn(CuentaRepository, 'eliminarCuenta').mockRejectedValueOnce({
      data: { message: 'La contraseña es incorrecta' },
    });
    const { result } = await renderLoaded();
    act(() => {
      result.current.openDeleteModal();
      result.current.updatePassword('ClaveIncorrecta');
      result.current.updateConfirmation('ELIMINAR');
    });

    await act(async () => { await result.current.handleEliminarCuenta(); });
    expect(result.current.deleteError).toBe('La contraseña es incorrecta');
    expect(sessionStore.isAuthenticated).toBe(true);
    expect(result.current.perfil).toEqual(validProfile);
  });
});
