import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { Directory, File } from 'expo-file-system';
import { guardarComprobanteCompra } from '../comprobanteCompraService';
import { compraPrueba } from '../../../test/fixtures/compra';
jest.mock('expo-print', () => ({ printToFileAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ Directory: { pickDirectoryAsync: jest.fn() }, File: jest.fn() }));
const crear = jest.fn(), escribir = jest.fn(), borrar = jest.fn(), crearDestino = jest.fn();
const plataforma = Platform.OS;
beforeEach(() => {
  jest.resetAllMocks(); Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  jest.mocked(Print.printToFileAsync).mockResolvedValue({ base64: 'JVBERi0xLjQK', uri: 'file:///global-cache/comprobante.pdf', numberOfPages: 1 });
  jest.mocked(Directory.pickDirectoryAsync).mockResolvedValue({ name: 'Mis comprobantes', createFile: crearDestino } as never);
  crearDestino.mockImplementation((nombre: string) => ({ name: nombre, uri: 'content://autorizado/compra.pdf', exists: true, size: 9, write: escribir, delete: borrar }));
  jest.mocked(File).mockImplementation((_dir, nombre) => ({ name: nombre, exists: true, size: 9, uri: 'file:///elegido/compra.pdf', create: crear, write: escribir, delete: borrar }) as never);
});
afterEach(() => Object.defineProperty(Platform, 'OS', { value: plataforma, configurable: true }));
it('Android escribe bytes PDF en la URI content:// autorizada sin compartir el archivo de caché', async () => {
  const resultado = await guardarComprobanteCompra(compraPrueba);
  expect(crearDestino).toHaveBeenCalledWith(expect.stringMatching(/^Comprobante_Compra_9_\d+\.pdf$/), 'application/pdf');
  expect(escribir).toHaveBeenCalledWith('JVBERi0xLjQK', { encoding: 'base64' });
  expect(resultado).toEqual(expect.objectContaining({ cancelado: false, uri: 'content://autorizado/compra.pdf' }));
  expect(File).not.toHaveBeenCalled();
});
it('iOS usa la carpeta elegida y la cancelación no genera PDF', async () => {
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  await guardarComprobanteCompra(compraPrueba); expect(crear).toHaveBeenCalled();
  jest.clearAllMocks(); jest.mocked(Directory.pickDirectoryAsync).mockRejectedValueOnce({ code: 'ERR_PICKER_CANCELLED' });
  await expect(guardarComprobanteCompra(compraPrueba)).resolves.toEqual({ cancelado: true }); expect(Print.printToFileAsync).not.toHaveBeenCalled();
});
it('rechaza un permiso denegado y limpia solo el archivo nuevo ante fallo de escritura', async () => {
  jest.mocked(Directory.pickDirectoryAsync).mockRejectedValueOnce({ code: 'ERR_PERMISSION_DENIED' });
  await expect(guardarComprobanteCompra(compraPrueba)).rejects.toThrow('acceder a la carpeta');
  escribir.mockImplementationOnce(() => { throw new Error('Sin espacio'); });
  await expect(guardarComprobanteCompra(compraPrueba)).rejects.toThrow('No se pudo guardar'); expect(borrar).toHaveBeenCalledTimes(1);
});
it('no escribe datos si cambió la cuenta mientras se generaba el archivo', async () => {
  let vigente = true;
  jest.mocked(Print.printToFileAsync).mockImplementationOnce(async () => { vigente = false; return { base64: 'JVBERi0xLjQK', uri: 'file:///cache/test.pdf', numberOfPages: 1 }; });
  await expect(guardarComprobanteCompra(compraPrueba, () => vigente)).rejects.toThrow('No se pudo guardar'); expect(escribir).not.toHaveBeenCalled();
});
