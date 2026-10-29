import { AuthRepository } from '../authRepository';
import { apiClient } from '../../services/api';
import { RegistroRequest } from '../../models/Auth';

jest.mock('../../services/api', () => ({
  apiClient: jest.fn(),
}));

const apiClientMock = apiClient as jest.Mock;

describe('AuthRepository HU-01', () => {
  beforeEach(() => apiClientMock.mockReset());

  it('envia el login una sola vez al endpoint y con el payload exactos', async () => {
    const response = {
      message: 'Acceso correcto',
      token: 'jwt_ficticio',
      user: { id: 7, nombre: 'Cliente QA', rol: 'CLIENTE' },
    };
    apiClientMock.mockResolvedValueOnce(response);

    await expect(AuthRepository.login('cliente@example.invalid', 'Clave123'))
      .resolves.toBe(response);
    expect(apiClientMock).toHaveBeenCalledTimes(1);
    expect(apiClientMock).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo: 'cliente@example.invalid', password: 'Clave123' }),
    });
  });

  it('envia el registro una sola vez sin alterar su payload', async () => {
    const payload: RegistroRequest = {
      nombre: 'Cliente QA',
      apellidoPaterno: 'Prueba',
      correo: 'cliente@example.invalid',
      telefono: '5512345678',
      password: 'Clave123',
      rol: 'CLIENTE',
    };
    const response = { message: 'Registro correcto', userId: 19 };
    apiClientMock.mockResolvedValueOnce(response);

    await expect(AuthRepository.registro(payload)).resolves.toBe(response);
    expect(apiClientMock).toHaveBeenCalledTimes(1);
    expect(apiClientMock).toHaveBeenCalledWith('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });

  it.each([400, 401, 409, 500])(
    'propaga sin modificar un error HTTP %i de login',
    async (status) => {
      const error = Object.assign(new Error(`HTTP ${status}`), {
        status,
        data: { error: `Fallo ${status}` },
      });
      apiClientMock.mockRejectedValueOnce(error);

      await expect(AuthRepository.login('cliente@example.invalid', 'Clave123'))
        .rejects.toBe(error);
      expect(apiClientMock).toHaveBeenCalledTimes(1);
    }
  );

  it('propaga sin modificar un error de red durante el registro', async () => {
    const error = Object.assign(new Error('Sin conexion'), {
      originalError: new TypeError('Failed to fetch'),
    });
    apiClientMock.mockRejectedValueOnce(error);

    await expect(AuthRepository.registro({
      nombre: 'Cliente QA',
      correo: 'cliente@example.invalid',
      password: 'Clave123',
    })).rejects.toBe(error);
    expect(apiClientMock).toHaveBeenCalledTimes(1);
  });
});
