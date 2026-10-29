import { ServiciosRepository } from '../serviciosRepository';
import { apiClient } from '../../services/api';

jest.mock('../../services/api', () => ({
  apiClient: jest.fn(),
}));

const apiClientMock = apiClient as jest.MockedFunction<typeof apiClient>;

const servicioActivo = {
  id: 7,
  nombre: 'Corte editorial',
  descripcion: 'Corte personalizado',
  precio: '350.50',
  duracion: 55,
  categoria: ' Corte ',
  imagenUrl: '/uploads/servicios/corte.jpg',
  estaActivo: 1,
};

describe('HU-12 ServiciosRepository', () => {
  beforeEach(() => apiClientMock.mockReset());

  it('consulta GET /servicios una sola vez y normaliza el contrato de UI', async () => {
    apiClientMock.mockResolvedValueOnce([servicioActivo] as never);

    await expect(ServiciosRepository.getServicios()).resolves.toEqual([{
      id: '7',
      nombre: 'Corte editorial',
      descripcion: 'Corte personalizado',
      precioMXN: 350.5,
      duracionMin: 55,
      categoria: 'Corte',
      imagenUrl: '/uploads/servicios/corte.jpg',
      estaActivo: true,
    }]);
    expect(apiClientMock).toHaveBeenCalledTimes(1);
    expect(apiClientMock).toHaveBeenCalledWith('/servicios');
  });

  it('excluye servicios inactivos', async () => {
    apiClientMock.mockResolvedValueOnce([
      servicioActivo,
      { ...servicioActivo, id: 8, estaActivo: 0 },
    ] as never);

    const result = await ServiciosRepository.getServicios();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('7');
  });

  it('admite un id textual y convierte precio y duracion numericos', async () => {
    apiClientMock.mockResolvedValueOnce([{
      ...servicioActivo,
      id: 'srv-9',
      precio: 420,
      duracion: '90',
    }] as never);

    await expect(ServiciosRepository.getServicios()).resolves.toEqual([
      expect.objectContaining({ id: 'srv-9', precioMXN: 420, duracionMin: 90 }),
    ]);
  });

  it('normaliza campos opcionales sin inventar datos externos', async () => {
    apiClientMock.mockResolvedValueOnce([{
      ...servicioActivo,
      descripcion: null,
      categoria: null,
      imagenUrl: null,
      precio: 'no-numero',
      duracion: Number.NaN,
    }] as never);

    await expect(ServiciosRepository.getServicios()).resolves.toEqual([
      expect.objectContaining({
        descripcion: '',
        categoria: 'General',
        imagenUrl: null,
        precioMXN: 0,
        duracionMin: 0,
      }),
    ]);
  });

  it.each([[], {}, null, 'respuesta inesperada']) (
    'convierte una respuesta no-array o vacia en lista vacia: %p',
    async (response) => {
      apiClientMock.mockResolvedValueOnce(response as never);
      await expect(ServiciosRepository.getServicios()).resolves.toEqual([]);
    }
  );

  it('ignora elementos null o malformados y conserva los servicios validos', async () => {
    apiClientMock.mockResolvedValueOnce([
      null,
      undefined,
      {},
      { estaActivo: 1 },
      servicioActivo,
    ] as never);

    const result = await ServiciosRepository.getServicios();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('7');
  });

  it.each([
    Object.assign(new Error('Solicitud invalida'), { status: 400 }),
    Object.assign(new Error('Error interno'), { status: 500 }),
    new TypeError('Failed to fetch'),
  ])('propaga errores HTTP o de red sin realizar otra solicitud', async (failure) => {
    apiClientMock.mockRejectedValueOnce(failure);

    await expect(ServiciosRepository.getServicios()).rejects.toBe(failure);
    expect(apiClientMock).toHaveBeenCalledTimes(1);
  });
});
