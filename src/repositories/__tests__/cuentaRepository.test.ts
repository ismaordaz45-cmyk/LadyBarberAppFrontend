import { CuentaRepository } from '../cuentaRepository';
import { apiClientAuth } from '../../services/api';

jest.mock('../../services/api', () => ({
  apiClientAuth: jest.fn(),
}));

const apiClientAuthMock = apiClientAuth as jest.Mock;

describe('Eliminación de cuenta - CuentaRepository', () => {
  beforeEach(() => apiClientAuthMock.mockReset());

  it('envía una solicitud autenticada con el contrato exacto', async () => {
    const response = { ok: true, message: 'Cuenta eliminada' };
    apiClientAuthMock.mockResolvedValueOnce(response);

    await expect(
      CuentaRepository.eliminarCuenta('ClaveSegura1', 'ELIMINAR')
    ).resolves.toBe(response);

    expect(apiClientAuthMock).toHaveBeenCalledTimes(1);
    expect(apiClientAuthMock).toHaveBeenCalledWith('/auth/cuenta', {
      method: 'DELETE',
      body: JSON.stringify({
        password: 'ClaveSegura1',
        confirmacion: 'ELIMINAR',
      }),
    });
  });

  it.each([400, 401, 403, 409, 500])(
    'propaga sin alterar un error HTTP %i',
    async (status) => {
      const error = Object.assign(new Error(`Fallo ${status}`), {
        status,
        data: { message: `Mensaje ${status}` },
      });
      apiClientAuthMock.mockRejectedValueOnce(error);

      await expect(
        CuentaRepository.eliminarCuenta('ClaveSegura1', 'ELIMINAR')
      ).rejects.toBe(error);
    }
  );

  it('propaga un error de red sin sustituir su causa', async () => {
    const error = Object.assign(new Error('Sin conexión'), {
      originalError: new TypeError('Failed to fetch'),
    });
    apiClientAuthMock.mockRejectedValueOnce(error);

    await expect(
      CuentaRepository.eliminarCuenta('ClaveSegura1', 'ELIMINAR')
    ).rejects.toBe(error);
  });
});
