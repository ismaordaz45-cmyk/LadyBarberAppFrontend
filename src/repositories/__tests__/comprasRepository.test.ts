import { apiClientAuth } from '../../services/api';
import { ComprasRepository } from '../comprasRepository';
import { compraPrueba, resumenCompra } from '../../../test/fixtures/compra';
jest.mock('../../services/api', () => ({ apiClientAuth: jest.fn(), getApiBaseUrl: () => 'https://backend.test/api' }));
const api = jest.mocked(apiClientAuth);
beforeEach(() => { api.mockReset(); });
it('combina filtro y cursor con páginas limitadas a tres y normaliza las imágenes', async () => {
  api.mockResolvedValue({ compras: [resumenCompra(6)], siguienteCursor: 6 });
  const pagina = await ComprasRepository.listar('vigentes', 9);
  expect(api).toHaveBeenCalledWith('/compras?filtro=vigentes&cursor=9'); expect(pagina.compras[0].items[0].imagen).toBe('https://example.test/gel.jpg');
});
it('rechaza una página que no avanza y un pedido ajeno devuelto por error', async () => {
  api.mockResolvedValue({ compras: [resumenCompra(9)], siguienteCursor: 9 });
  await expect(ComprasRepository.listar('todas', 9)).rejects.toThrow('avanzar');
  api.mockResolvedValue(compraPrueba); await expect(ComprasRepository.obtener(10)).rejects.toThrow('detalle');
});
it('no acepta un comprobante sin fecha de aprobación o sin evidencia coincidente', async () => {
  api.mockResolvedValue({ ...compraPrueba, recogida: { ...compraPrueba.recogida, aprobadoEn: null } });
  await expect(ComprasRepository.obtener(9)).rejects.toThrow('evidencia');
  api.mockResolvedValue(compraPrueba); expect((await ComprasRepository.obtener(9)).recogida.limiteEn).toBe(compraPrueba.recogida.limiteEn);
});
