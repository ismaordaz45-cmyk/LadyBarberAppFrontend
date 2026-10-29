import { HomeRepository } from '../homeRepository';
import { apiClient, apiClientAuth } from '../../services/api';
import { ResumenCliente } from '../../models/Catalogo';

jest.mock('../../services/api', () => ({
  apiClient: jest.fn(),
  apiClientAuth: jest.fn(),
}));

const apiClientMock = apiClient as jest.MockedFunction<typeof apiClient>;
const apiClientAuthMock = apiClientAuth as jest.MockedFunction<typeof apiClientAuth>;

const resumenValido: ResumenCliente = {
  user: {
    id: 9,
    nombre: 'Diana',
    apellidoPaterno: 'Palacios',
    apellidoMaterno: 'QA',
    correo: 'diana@example.invalid',
    telefono: '0000000000',
    rol: 'CLIENTE',
  },
  clienteId: 4,
  stats: { total: 5, pendientes: 2, completadas: 3 },
  nextCita: null,
  actualizadoEn: '2026-10-29T12:00:00.000Z',
};

describe('HU-11 HomeRepository', () => {
  beforeEach(() => {
    apiClientMock.mockReset();
    apiClientAuthMock.mockReset();
  });

  it('consulta exactamente /cliente/resumen mediante el cliente autenticado', async () => {
    apiClientAuthMock.mockResolvedValueOnce(resumenValido);

    await expect(HomeRepository.getResumenCliente()).resolves.toBe(resumenValido);
    expect(apiClientAuthMock).toHaveBeenCalledTimes(1);
    expect(apiClientAuthMock).toHaveBeenCalledWith('/cliente/resumen');
    expect(apiClientMock).not.toHaveBeenCalled();
  });

  it.each([null, {}, [], 'respuesta inesperada'])(
    'conserva la respuesta para que el ViewModel la valide: %p',
    async (response) => {
      apiClientAuthMock.mockResolvedValueOnce(response as never);
      await expect(HomeRepository.getResumenCliente()).resolves.toBe(response);
      expect(apiClientAuthMock).toHaveBeenCalledTimes(1);
    }
  );

  it.each([
    Object.assign(new Error('No autorizado'), { status: 401, data: { message: 'Sesión expirada' } }),
    Object.assign(new Error('Error interno'), { status: 500 }),
    new TypeError('Failed to fetch'),
  ])('propaga errores HTTP y de red sin repetir solicitudes', async (failure) => {
    apiClientAuthMock.mockRejectedValueOnce(failure);

    await expect(HomeRepository.getResumenCliente()).rejects.toBe(failure);
    expect(apiClientAuthMock).toHaveBeenCalledTimes(1);
    expect(apiClientMock).not.toHaveBeenCalled();
  });
});
