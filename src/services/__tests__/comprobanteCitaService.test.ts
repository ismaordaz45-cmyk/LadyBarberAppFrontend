import { guardarComprobanteCita } from '../comprobanteCitaService';
import { Platform } from 'react-native';
import { CitaDetalle } from '../../models/Cita';
import * as Print from 'expo-print';
import { Directory, File } from 'expo-file-system';

jest.mock('expo-print', () => ({ printToFileAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Directory: { pickDirectoryAsync: jest.fn() } }));
const Archivo = File as unknown as jest.Mock;
const mockCreate = jest.fn();
const mockWrite = jest.fn();
const mockGuardarWrite = jest.fn();
const mockDelete = jest.fn();
const mockCrearDestino = jest.fn();
const initialPlatform = Platform.OS;
const cita = { id: 'cita-test', fecha: '2026-11-18', horaInicio: '09:00', horaFin: '10:00', estado: 'CONFIRMADA',
  precioFinal: 120, clienteNombre: 'Cliente', empleadaNombre: 'Estilista', paymentStatus: 'approved', paymentId: 'pago-test',
  comprobanteDisponible: true, anticipoPagado: 60, saldoPendiente: 60, servicios: [] } as unknown as CitaDetalle;

describe('Servicio de PDF móvil', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///global-cache/Print/test.pdf', base64: 'JVBERi0xLjQK' });
    Archivo.mockImplementation((dir, nombre) => ({ uri: `${dir}${nombre}`, name: nombre, exists: true, size: 9, create: mockCreate, write: mockWrite, delete: mockDelete }));
    (Directory.pickDirectoryAsync as jest.Mock).mockResolvedValue({ name: 'Comprobantes', createFile: mockCrearDestino });
    mockCrearDestino.mockImplementation((nombre: string) => ({ uri: 'content://carpeta-autorizada/pdf', name: nombre, exists: true, size: 9, write: mockGuardarWrite, delete: mockDelete }));
  });
  afterEach(() => { Object.defineProperty(Platform, 'OS', { value: initialPlatform, configurable: true }); });
  it('guarda permanentemente en la carpeta autorizada de Android', async () => {
    const resultado = await guardarComprobanteCita(cita);
    expect(Directory.pickDirectoryAsync).toHaveBeenCalledTimes(1);
    expect(mockCrearDestino).toHaveBeenCalledWith(expect.stringMatching(/^Comprobante_Cita_cita-test_\d+\.pdf$/), 'application/pdf');
    expect(mockGuardarWrite).toHaveBeenCalledWith('JVBERi0xLjQK', { encoding: 'base64' });
    expect(resultado).toEqual(expect.objectContaining({ cancelado: false, carpeta: 'Comprobantes', uri: 'content://carpeta-autorizada/pdf' }));
  });
  it('guarda en la carpeta elegida de iOS usando su URI de archivo', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const carpeta = { name: 'Mis archivos', uri: 'file:///chosen/' };
    (Directory.pickDirectoryAsync as jest.Mock).mockResolvedValue(carpeta);
    const resultado = await guardarComprobanteCita(cita);
    expect(Archivo).toHaveBeenCalledWith(carpeta, expect.stringMatching(/\.pdf$/));
    expect(mockCreate).toHaveBeenCalledWith();
    expect(mockWrite).toHaveBeenCalledWith('JVBERi0xLjQK', { encoding: 'base64' });
    expect(resultado).toEqual(expect.objectContaining({ cancelado: false, carpeta: 'Mis archivos' }));
    expect(mockCrearDestino).not.toHaveBeenCalled();
  });
  it('cancelar el selector no genera PDF ni confirma un guardado', async () => {
    for (const code of ['ERR_PICKER_CANCELLED', 'ERR_FILE_PICKING_CANCELLED']) {
      (Directory.pickDirectoryAsync as jest.Mock).mockRejectedValueOnce({ code });
      await expect(guardarComprobanteCita(cita)).resolves.toEqual({ cancelado: true });
    }
    expect(Print.printToFileAsync).not.toHaveBeenCalled();
    expect(mockCrearDestino).not.toHaveBeenCalled();
  });
  it('distingue permiso rechazado de cancelación y no guarda sin evidencia aprobada', async () => {
    await expect(guardarComprobanteCita({ ...cita, comprobanteDisponible: false })).rejects.toThrow(/verificado/);
    expect(Directory.pickDirectoryAsync).not.toHaveBeenCalled();
    (Directory.pickDirectoryAsync as jest.Mock).mockRejectedValueOnce({ code: 'ERR_PERMISSION_DENIED' });
    await expect(guardarComprobanteCita(cita)).rejects.toThrow(/acceder a la carpeta/);
    expect(Print.printToFileAsync).not.toHaveBeenCalled();
  });
  it('limpia solo el archivo nuevo si falla la escritura y no anuncia éxito', async () => {
    mockGuardarWrite.mockImplementationOnce(() => { throw new Error('No space'); });
    await expect(guardarComprobanteCita(cita)).rejects.toThrow(/No se pudo guardar/);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
  it('no borra un archivo existente cuando no se pudo crear uno nuevo en iOS', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    mockCreate.mockImplementationOnce(() => { throw new Error('Already exists'); });
    await expect(guardarComprobanteCita(cita)).rejects.toThrow(/No se pudo guardar/);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
