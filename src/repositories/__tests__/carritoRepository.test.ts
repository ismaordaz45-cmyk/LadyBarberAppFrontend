import { CarritoRepository } from '../carritoRepository';
const mockArchivo = { exists: false, text: jest.fn(), create: jest.fn(), write: jest.fn() };
const mockFile = jest.fn<typeof mockArchivo, unknown[]>(() => mockArchivo);
jest.mock('expo-file-system', () => ({ File: function Archivo(...args: unknown[]) { return mockFile(...args); }, Paths: { document: 'file:///documentos-app/' } }));
beforeEach(() => { jest.clearAllMocks(); mockArchivo.exists = false; });
it('recupera vacío si todavía no se ha guardado un carrito', async () => {
  expect(await CarritoRepository.leer(10)).toEqual([]);
  expect(mockFile).toHaveBeenCalledWith('file:///documentos-app/', 'carrito-10.json');
});
it('separa los archivos por usuario y guarda solo identificadores y cantidades', async () => {
  await CarritoRepository.guardar(20, [{ productoId: '7', cantidad: 2 }]);
  expect(mockFile).toHaveBeenCalledWith('file:///documentos-app/', 'carrito-20.json');
  expect(JSON.parse(mockArchivo.write.mock.calls[0][0])).toEqual([{ productoId: '7', cantidad: 2 }]);
});
it('no confía en cantidades, duplicados o campos adicionales almacenados', async () => {
  mockArchivo.exists = true;
  mockArchivo.text.mockResolvedValue(JSON.stringify([{ productoId: '7', cantidad: 2, precio: 0 }, { productoId: '7', cantidad: 1 }, { productoId: '8', cantidad: -1 }, { productoId: '9', cantidad: 1.5 }]));
  expect(await CarritoRepository.leer(10)).toEqual([{ productoId: '7', cantidad: 2 }]);
});
it('tolera JSON corrupto y propaga errores de almacenamiento', async () => {
  mockArchivo.exists = true; mockArchivo.text.mockResolvedValue('{roto');
  expect(await CarritoRepository.leer(10)).toEqual([]);
  mockArchivo.write.mockImplementationOnce(() => { throw new Error('Disco lleno'); });
  await expect(CarritoRepository.guardar(10, [])).rejects.toThrow('Disco lleno');
});
it.each([0, -1, 1.5, Number.NaN])('rechaza identidades inválidas (%s)', async id => {
  await expect(CarritoRepository.guardar(id, [])).rejects.toThrow('Inicia sesión');
});
