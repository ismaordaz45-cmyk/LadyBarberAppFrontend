import { guardarTextoPrivado } from '../archivoPrivado';
const mockArchivo = { create: jest.fn(), write: jest.fn(), move: jest.fn() };
const mockFile = jest.fn<typeof mockArchivo, unknown[]>(() => mockArchivo);
jest.mock('expo-file-system', () => ({ File: function Archivo(...args: unknown[]) { return mockFile(...args); }, Paths: { document: 'file:///app/' } }));
beforeEach(() => { jest.clearAllMocks(); mockArchivo.move.mockResolvedValue(undefined); });
it('escribe el temporal antes de reemplazar el archivo anterior', async () => {
  await guardarTextoPrivado('carrito-21.json', '{"items":[]}');
  expect(mockFile).toHaveBeenNthCalledWith(1, 'file:///app/', 'carrito-21.json.tmp');
  expect(mockFile).toHaveBeenNthCalledWith(2, 'file:///app/', 'carrito-21.json');
  expect(mockArchivo.write.mock.invocationCallOrder[0]).toBeLessThan(mockArchivo.move.mock.invocationCallOrder[0]);
  expect(mockArchivo.move).toHaveBeenCalledWith(mockArchivo, { overwrite: true });
});
it('si falla escribir no reemplaza el contenido guardado anterior', async () => {
  mockArchivo.write.mockImplementationOnce(() => { throw new Error('Sin espacio'); });
  await expect(guardarTextoPrivado('pedido-activo-21.json', '9')).rejects.toThrow('Sin espacio');
  expect(mockArchivo.move).not.toHaveBeenCalled();
});
