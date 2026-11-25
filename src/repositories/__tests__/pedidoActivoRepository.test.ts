import { PedidoActivoRepository } from '../pedidoActivoRepository';
import { guardarTextoPrivado } from '../archivoPrivado';
const mockArchivo = { exists: false, text: jest.fn() };
const mockFile = jest.fn<typeof mockArchivo, unknown[]>(() => mockArchivo);
jest.mock('expo-file-system', () => ({ File: function Archivo(...args: unknown[]) { return mockFile(...args); }, Paths: { document: 'file:///app/' } }));
jest.mock('../archivoPrivado', () => ({ guardarTextoPrivado: jest.fn() }));
beforeEach(() => { jest.clearAllMocks(); mockArchivo.exists = false; });
it('recupera por cuenta y reconoce cuando no hay pedido activo', async () => {
  expect(await PedidoActivoRepository.leer(21)).toBeNull();
  expect(mockFile).toHaveBeenCalledWith('file:///app/', 'pedido-activo-21.json');
  mockArchivo.exists = true; mockArchivo.text.mockResolvedValue('9');
  expect(await PedidoActivoRepository.leer(21)).toBe(9);
});
it('si el archivo está corrupto detiene un nuevo pago en lugar de olvidar el anterior', async () => {
  mockArchivo.exists = true; mockArchivo.text.mockResolvedValue('{roto');
  await expect(PedidoActivoRepository.leer(21)).rejects.toThrow('No se pudo recuperar');
});
it('solo guarda un identificador válido, sin token ni enlace de checkout', async () => {
  await PedidoActivoRepository.guardar(22, 9);
  expect(guardarTextoPrivado).toHaveBeenCalledWith('pedido-activo-22.json', '9');
  await expect(PedidoActivoRepository.guardar(22, -1)).rejects.toThrow('inválido');
});
