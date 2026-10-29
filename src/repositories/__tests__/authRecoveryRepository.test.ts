import { AuthRepository } from '../authRepository';
import { apiClient } from '../../services/api';

jest.mock('../../services/api', () => ({
  apiClient: jest.fn(),
}));

const apiClientMock = apiClient as jest.Mock;

describe('AuthRepository HU-02', () => {
  beforeEach(() => apiClientMock.mockReset());

  it('solicita recuperacion con endpoint, metodo y payload exactos', async () => {
    const response = { message: 'Instrucciones enviadas' };
    apiClientMock.mockResolvedValueOnce(response);

    await expect(AuthRepository.solicitarRecuperacion('cliente@example.invalid'))
      .resolves.toBe(response);
    expect(apiClientMock).toHaveBeenCalledTimes(1);
    expect(apiClientMock).toHaveBeenCalledWith('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ correo: 'cliente@example.invalid' }),
    });
  });

  it('restablece password con endpoint, metodo y payload exactos', async () => {
    const response = { message: 'Password actualizado' };
    apiClientMock.mockResolvedValueOnce(response);

    await expect(AuthRepository.restablecerPassword('token_ficticio', 'NuevaClave1'))
      .resolves.toBe(response);
    expect(apiClientMock).toHaveBeenCalledTimes(1);
    expect(apiClientMock).toHaveBeenCalledWith('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'token_ficticio', newPassword: 'NuevaClave1' }),
    });
  });

  it.each([400, 404, 429, 500])(
    'propaga sin modificar error HTTP %i al solicitar recuperacion',
    async (status) => {
      const error = Object.assign(new Error(`Fallo ${status}`), {
        status,
        data: { error: `Fallo ${status}` },
      });
      apiClientMock.mockRejectedValueOnce(error);

      await expect(AuthRepository.solicitarRecuperacion('cliente@example.invalid'))
        .rejects.toBe(error);
      expect(apiClientMock).toHaveBeenCalledTimes(1);
    }
  );

  it.each([400, 401, 404, 429, 500])(
    'propaga sin modificar error HTTP %i al restablecer password',
    async (status) => {
      const error = Object.assign(new Error(`Fallo ${status}`), {
        status,
        data: { message: `Fallo ${status}` },
      });
      apiClientMock.mockRejectedValueOnce(error);

      await expect(AuthRepository.restablecerPassword('token_ficticio', 'NuevaClave1'))
        .rejects.toBe(error);
      expect(apiClientMock).toHaveBeenCalledTimes(1);
    }
  );

  it('propaga un error de red sin realizar reintentos', async () => {
    const error = Object.assign(new Error('Sin conexion'), {
      originalError: new TypeError('Failed to fetch'),
    });
    apiClientMock.mockRejectedValueOnce(error);

    await expect(AuthRepository.solicitarRecuperacion('cliente@example.invalid'))
      .rejects.toBe(error);
    expect(apiClientMock).toHaveBeenCalledTimes(1);
  });
});
