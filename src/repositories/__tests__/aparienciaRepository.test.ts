import { AparienciaRepository } from '../aparienciaRepository';
const mockArchivo = { exists: false, text: jest.fn(), create: jest.fn(), write: jest.fn() };
const mockFile = jest.fn<typeof mockArchivo, unknown[]>(() => mockArchivo);
jest.mock('expo-file-system', () => ({ File: function Archivo(...args: unknown[]) { return mockFile(...args); }, Paths: { document: 'file:///documentos-app/' } }));

beforeEach(() => { jest.clearAllMocks(); mockArchivo.exists = false; });
it('usa el sistema cuando aún no hay preferencia en el dispositivo', async () => {
  expect(await AparienciaRepository.leer()).toBe('system');
  expect(mockFile).toHaveBeenCalledWith('file:///documentos-app/', 'apariencia.json');
});
it.each(['"dark"', '"light"', '"system"'])('lee una preferencia válida: %s', async contenido => {
  mockArchivo.exists = true; mockArchivo.text.mockResolvedValue(contenido);
  expect(await AparienciaRepository.leer()).toBe(JSON.parse(contenido));
});
it.each(['contenido roto', '"tema-desconocido"', '{}'])('tolera contenido inválido sin bloquear la aplicación: %s', async contenido => {
  mockArchivo.exists = true; mockArchivo.text.mockResolvedValue(contenido);
  expect(await AparienciaRepository.leer()).toBe('system');
});
it('guarda únicamente la preferencia dentro del espacio privado de la aplicación', async () => {
  await AparienciaRepository.guardar('dark');
  expect(mockArchivo.create).toHaveBeenCalledWith({ overwrite: true });
  expect(mockArchivo.write).toHaveBeenCalledWith('"dark"');
});
it('propaga errores de almacenamiento para informar al cliente', async () => {
  mockArchivo.write.mockImplementationOnce(() => { throw new Error('Sin espacio'); });
  await expect(AparienciaRepository.guardar('dark')).rejects.toThrow('Sin espacio');
});
