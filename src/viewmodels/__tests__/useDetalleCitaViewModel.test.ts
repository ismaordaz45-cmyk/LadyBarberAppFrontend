import React from 'react';
import { act } from 'react-test-renderer';
import { CitasRepository } from '../../repositories/citasRepository';
import { guardarComprobanteCita } from '../../services/comprobanteCitaService';
import { useDetalleCitaViewModel } from '../useDetalleCitaViewModel';

jest.mock('expo-router', () => ({ useFocusEffect: (callback: () => (() => void) | undefined) => {
  const ReactModule = jest.requireActual('react'); ReactModule.useEffect(callback, [callback]);
} }));
jest.mock('../../repositories/citasRepository', () => ({ CitasRepository: { getDetalle: jest.fn(), cancelarCita: jest.fn() } }));
jest.mock('../../services/comprobanteCitaService', () => ({ guardarComprobanteCita: jest.fn() }));
const mockAbrirCheckout = jest.fn();
jest.mock('../usePagoCitaViewModel', () => ({ usePagoCitaViewModel: () => ({ pagoAprobado: false, errorPago: null, consultarPago: jest.fn(), abrirCheckout: mockAbrirCheckout }) }));
let renderer: any;
const getDetalle = CitasRepository.getDetalle as jest.Mock;
const detalle = { id: 'cita-test', estado: 'CONFIRMADA', comprobanteDisponible: true, anticipoPagado: 60 };
async function renderHook() {
  const result = {} as { current: ReturnType<typeof useDetalleCitaViewModel> };
  function Component() { result.current = useDetalleCitaViewModel('cita-test'); return null; }
  await act(async () => { renderer = require('react-test-renderer').create(React.createElement(Component)); });
  return result;
}
describe('Detalle y comprobante de la cita', () => {
  beforeEach(() => { jest.clearAllMocks(); getDetalle.mockResolvedValue(detalle); (guardarComprobanteCita as jest.Mock).mockResolvedValue({ cancelado: true }); });
  afterEach(() => { act(() => renderer?.unmount()); renderer = null; });
  it('continúa el pago del apartado sin otra aceptación y bloquea dobles pulsaciones', async () => {
    getDetalle.mockResolvedValue({ ...detalle, estado: 'APARTADA' });
    const result = await renderHook();
    let resolver!: () => void;
    mockAbrirCheckout.mockReturnValueOnce(new Promise<void>(resolve => { resolver = resolve; }));
    let pendiente: Promise<void> | undefined;
    act(() => { pendiente = result.current.pagar(); });
    await act(async () => { await result.current.pagar(); });
    expect(mockAbrirCheckout).toHaveBeenCalledTimes(1);
    await act(async () => { resolver(); await pendiente; });
    expect(result.current.error).toBeNull();
  });
  it('no abre un pago cuando la cita ya está confirmada', async () => {
    const result = await renderHook();
    await act(async () => { await result.current.pagar(); });
    expect(mockAbrirCheckout).not.toHaveBeenCalled();
  });
  it('vuelve a consultar la cita al generar el PDF y bloquea acciones duplicadas', async () => {
    const result = await renderHook();
    let resolve: (value: unknown) => void = () => {};
    getDetalle.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    let pending: Promise<void> | undefined;
    await act(async () => { pending = result.current.guardar(); await result.current.guardar(); });
    expect(getDetalle).toHaveBeenCalledTimes(2);
    const nuevo = { ...detalle, anticipoPagado: 61 };
    await act(async () => { resolve(nuevo); await pending; });
    expect(guardarComprobanteCita).toHaveBeenCalledTimes(1);
    expect(guardarComprobanteCita).toHaveBeenCalledWith(nuevo);
    expect(result.current.ocupado).toBe(false);
  });
  it('muestra errores y no abre el PDF cuando falla la verificación', async () => {
    const result = await renderHook();
    getDetalle.mockRejectedValueOnce(new Error('Cita no encontrada'));
    await act(async () => { await result.current.guardar(); });
    expect(result.current.error).toBe('Cita no encontrada');
    expect(guardarComprobanteCita).not.toHaveBeenCalled();
  });
  it('descarta la respuesta de comprobante si se abandona la pantalla', async () => {
    const result = await renderHook();
    let resolve: (value: unknown) => void = () => {};
    getDetalle.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    let pending: Promise<void> | undefined;
    await act(async () => { pending = result.current.guardar(); });
    act(() => { renderer.unmount(); renderer = null; });
    await act(async () => { resolve(detalle); await pending; });
    expect(guardarComprobanteCita).not.toHaveBeenCalled();
  });
  it('verifica otra vez el anticipo antes de guardar y confirma solo un guardado real', async () => {
    const result = await renderHook();
    (guardarComprobanteCita as jest.Mock).mockResolvedValue({ cancelado: false, nombre: 'Comprobante.pdf', carpeta: 'Documentos' });
    await act(async () => { await result.current.guardar(); });
    expect(getDetalle).toHaveBeenCalledTimes(2);
    expect(guardarComprobanteCita).toHaveBeenCalledWith(detalle);
    expect(result.current.mensaje).toBe('PDF guardado en Documentos: Comprobante.pdf');
    (guardarComprobanteCita as jest.Mock).mockResolvedValue({ cancelado: true });
    await act(async () => { await result.current.guardar(); });
    expect(result.current.mensaje).toMatch(/cancelado/);
    expect(result.current.mensaje).not.toContain('PDF guardado');
  });
  it('mantiene un error de guardado visible sin mostrar éxito', async () => {
    const result = await renderHook();
    (guardarComprobanteCita as jest.Mock).mockRejectedValue(new Error('Sin permiso para guardar'));
    await act(async () => { await result.current.guardar(); });
    expect(result.current.error).toBe('Sin permiso para guardar');
    expect(result.current.mensaje).toBeNull();
  });
});
