jest.mock('../../services/api', () => ({ apiClient: jest.fn() }));

describe('Perfil público del negocio', () => {
  beforeEach(() => jest.resetModules());
  afterEach(() => jest.restoreAllMocks());
  it('comparte la petición en curso y cachea solo el perfil válido durante cinco minutos', async () => {
    const { apiClient } = jest.requireMock('../../services/api');
    const { NegocioRepository } = jest.requireActual('../negocioRepository');
    const perfil = { id: 1, nombre: 'Nombre de la base', logo: 'data:image/png;base64,prueba' };
    apiClient.mockResolvedValue(perfil);
    const [a, b] = await Promise.all([NegocioRepository.obtener(), NegocioRepository.obtener()]);
    expect(a).toEqual(perfil); expect(b).toEqual(perfil);
    await NegocioRepository.obtener();
    expect(apiClient).toHaveBeenCalledTimes(1);
    expect(apiClient).toHaveBeenCalledWith('/perfil-empresa');
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 300_001);
    await NegocioRepository.obtener();
    expect(apiClient).toHaveBeenCalledTimes(2);
  });
  it('permite reintentar un error sin conservar un perfil inventado en caché', async () => {
    const { apiClient } = jest.requireMock('../../services/api');
    const { NegocioRepository } = jest.requireActual('../negocioRepository');
    apiClient.mockResolvedValueOnce({ nombre: '' }).mockResolvedValueOnce({ id: 2, nombre: 'Nombre válido', logo: null });
    await expect(NegocioRepository.obtener()).rejects.toThrow('no disponible');
    await expect(NegocioRepository.obtener()).resolves.toMatchObject({ nombre: 'Nombre válido' });
  });
  it('consulta cambios del administrador al actualizar explícitamente sin esperar la caché', async () => {
    const { apiClient } = jest.requireMock('../../services/api');
    const { NegocioRepository } = jest.requireActual('../negocioRepository');
    apiClient.mockResolvedValueOnce({ id: 1, nombre: 'Salón', direccion: 'Dirección anterior' })
      .mockResolvedValueOnce({ id: 1, nombre: 'Salón', direccion: 'Dirección nueva', ubicacion: '21.14,-98.42' });
    await NegocioRepository.obtener();
    expect((await NegocioRepository.obtener()).direccion).toBe('Dirección anterior');
    expect((await NegocioRepository.obtener({ actualizar: true })).direccion).toBe('Dirección nueva');
    expect((await NegocioRepository.obtener()).ubicacion).toBe('21.14,-98.42');
    expect(apiClient).toHaveBeenCalledTimes(2);
  });
});
