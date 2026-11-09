import { PerfilRepository } from '../perfilRepository';
import { apiClientAuth } from '../../services/api';

jest.mock('../../services/api', () => ({
  apiClientAuth: jest.fn(),
}));

const apiClientAuthMock = apiClientAuth as jest.Mock;

describe('HU-03 PerfilRepository', () => {
  beforeEach(() => apiClientAuthMock.mockReset());

  it('consulta el resumen mediante el cliente autenticado', async () => {
    const response = { user: { id: 7, nombre: 'Cliente' }, clienteId: 12 };
    apiClientAuthMock.mockResolvedValueOnce(response);

    await expect(PerfilRepository.obtenerPerfil()).resolves.toBe(response);
    expect(apiClientAuthMock).toHaveBeenCalledTimes(1);
    expect(apiClientAuthMock).toHaveBeenCalledWith('/cliente/resumen');
  });

  it('envía únicamente los campos editables al actualizar', async () => {
    const datos = {
      nombre: 'María José',
      apellidoPaterno: "D'Ávila",
      apellidoMaterno: null,
      telefono: '+527710000000',
    };
    const response = { message: 'Perfil actualizado', perfil: {} };
    apiClientAuthMock.mockResolvedValueOnce(response);

    await expect(PerfilRepository.actualizarPerfil(datos)).resolves.toBe(response);
    expect(apiClientAuthMock).toHaveBeenCalledWith('/cliente/perfil', {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  });

  it.each([400, 401, 403, 404, 409, 500])(
    'propaga sin alterar un error HTTP %i',
    async (status) => {
      const error = Object.assign(new Error(`Fallo ${status}`), {
        status,
        data: { message: `Mensaje ${status}` },
      });
      apiClientAuthMock.mockRejectedValueOnce(error);

      await expect(PerfilRepository.obtenerPerfil()).rejects.toBe(error);
    }
  );

  it('propaga un error de red conservando su causa', async () => {
    const error = Object.assign(new Error('Sin conexión'), {
      originalError: new TypeError('Failed to fetch'),
    });
    apiClientAuthMock.mockRejectedValueOnce(error);

    await expect(
      PerfilRepository.actualizarPerfil({
        nombre: 'Cliente',
        apellidoPaterno: null,
        apellidoMaterno: null,
        telefono: null,
      })
    ).rejects.toBe(error);
  });
});
