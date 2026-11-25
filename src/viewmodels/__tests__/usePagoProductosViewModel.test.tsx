import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AppState, AppStateStatus } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { sessionStore } from '../../services/sessionStore';
import { PedidosRepository } from '../../repositories/pedidosRepository';
import { PedidoActivoRepository } from '../../repositories/pedidoActivoRepository';
import { Pedido } from '../../models/Pedido';
import { usePagoProductosViewModel } from '../usePagoProductosViewModel';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('../../repositories/pedidosRepository', () => ({ PedidosRepository: { crear: jest.fn(), obtener: jest.fn(), sincronizar: jest.fn(), preferencia: jest.fn(), cancelar: jest.fn() } }));
jest.mock('../../repositories/pedidoActivoRepository', () => ({ PedidoActivoRepository: { leer: jest.fn(), guardar: jest.fn() } }));
const inicial: Pedido = { id: 9, total: 60, moneda: 'MXN', fecha: '2026-11-18 12:00:00', estado: 'pendiente', paymentId: null, paymentStatus: 'mobile_created', pagoAprobado: false, compraConfirmada: false, requiereRevision: false, vencido: false,
  items: [{ insumoId: 7, nombre: 'Gel', cantidad: 2, precioUnitario: 30, subtotal: 60 }] };
const aprobado: Pedido = { ...inicial, estado: 'pagado', paymentId: '123', paymentStatus: 'approved', pagoAprobado: true, compraConfirmada: true };
const items = [{ productoId: '7', cantidad: 2 }];
let renderer: ReactTestRenderer;
let vm: ReturnType<typeof usePagoProductosViewModel>;
let appState: (estado: AppStateStatus) => void;
const aplicar = jest.fn();
function Hook({ listo = true }: { listo?: boolean }) {
  const valor = usePagoProductosViewModel(aplicar, listo);
  React.useEffect(() => { vm = valor; }); return null;
}
async function montar(listo = true) { await act(async () => { renderer = create(<Hook listo={listo} />); }); }
beforeEach(() => {
  jest.resetAllMocks(); sessionStore.setSession('jwt-test', 21, 'Comprador', 'CLIENTE');
  jest.mocked(PedidoActivoRepository.leer).mockResolvedValue(null);
  jest.mocked(PedidoActivoRepository.guardar).mockResolvedValue();
  jest.mocked(PedidosRepository.crear).mockResolvedValue(inicial);
  jest.mocked(PedidosRepository.obtener).mockResolvedValue(inicial);
  jest.mocked(PedidosRepository.sincronizar).mockResolvedValue(inicial);
  jest.mocked(PedidosRepository.preferencia).mockResolvedValue({ pedidoId: 9, total: 60, moneda: 'MXN', preferenceId: 'pref', checkoutUrl: 'https://www.mercadopago.com.mx/checkout/test' });
  jest.mocked(openBrowserAsync).mockResolvedValue({ type: 'opened' } as never);
  aplicar.mockResolvedValue(true);
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_evento, listener) => { appState = listener; return { remove: jest.fn() }; });
});
afterEach(() => { act(() => { renderer?.unmount(); sessionStore.clearSession(); }); jest.restoreAllMocks(); });
it('cancela solo tras confirmación del backend, conserva el carrito y limpia el pedido activo', async () => {
  await montar(); await act(async () => { await vm.preparar(items); });
  jest.mocked(PedidosRepository.cancelar).mockResolvedValue({ ...inicial, estado: 'cancelado', paymentStatus: 'mobile_cancelled' });
  await act(async () => { expect(await vm.cancelar(9)).toBe(true); });
  expect(PedidosRepository.cancelar).toHaveBeenCalledWith(9);
  expect(PedidoActivoRepository.guardar).toHaveBeenLastCalledWith(21, null);
  expect(vm.pedido).toBeNull(); expect(aplicar).not.toHaveBeenCalled(); expect(openBrowserAsync).not.toHaveBeenCalled();
});
it('si falla cancelar conserva el pedido y no borra el registro ni inventa un éxito', async () => {
  await montar(); await act(async () => { await vm.preparar(items); });
  jest.mocked(PedidosRepository.cancelar).mockRejectedValue(new Error('Pago en proceso'));
  await act(async () => { expect(await vm.cancelar(9)).toBe(false); });
  expect(vm.pedido?.id).toBe(9); expect(vm.error).toBe('Pago en proceso');
  expect(PedidoActivoRepository.guardar).not.toHaveBeenCalledWith(21, null);
});
it('bloquea cancelar compras aprobadas', async () => {
  jest.mocked(PedidoActivoRepository.leer).mockResolvedValue(9); jest.mocked(PedidosRepository.obtener).mockResolvedValue(aprobado);
  await montar(); await act(async () => { expect(await vm.cancelar(9)).toBe(false); });
  expect(PedidosRepository.cancelar).not.toHaveBeenCalled();
});
it('descarta una cancelación que termina después de cambiar de cuenta y no borra su pedido', async () => {
  await montar(); await act(async () => { await vm.preparar(items); });
  let resolver!: (pedido: Pedido) => void;
  jest.mocked(PedidosRepository.cancelar).mockReturnValueOnce(new Promise(resolve => { resolver = resolve; }));
  let pendiente!: Promise<boolean>;
  act(() => { pendiente = vm.cancelar(9); });
  await act(async () => { sessionStore.setSession('otra', 22, 'Otra cuenta', 'CLIENTE'); });
  await act(async () => { resolver({ ...inicial, estado: 'cancelado', paymentStatus: 'mobile_cancelled' }); await pendiente; });
  expect(PedidoActivoRepository.guardar).not.toHaveBeenCalledWith(22, null);
  expect(PedidoActivoRepository.guardar).not.toHaveBeenCalledWith(21, null);
});
it('prepara y guarda el pedido antes de abrir un pago; bloquea doble toque', async () => {
  await montar(); await act(async () => { await Promise.all([vm.preparar(items), vm.preparar(items)]); });
  expect(PedidosRepository.crear).toHaveBeenCalledTimes(1);
  expect(PedidoActivoRepository.guardar).toHaveBeenCalledWith(21, 9);
  expect(openBrowserAsync).not.toHaveBeenCalled(); expect(vm.pedido?.id).toBe(9);
});
it('si no puede guardar el pedido no ofrece checkout ni abre navegador', async () => {
  jest.mocked(PedidoActivoRepository.guardar).mockRejectedValueOnce(new Error('Sin espacio'));
  await montar(); await act(async () => { await vm.preparar(items); });
  expect(vm.error).toBe('Sin espacio'); expect(vm.pedido).toBeNull();
  await act(async () => { await vm.pagar(); }); expect(PedidosRepository.preferencia).not.toHaveBeenCalled();
});
it('cerrar el navegador no aprueba el pago ni retira artículos del carrito', async () => {
  await montar(); await act(async () => { await vm.preparar(items); });
  await act(async () => { await vm.pagar(); });
  expect(openBrowserAsync).toHaveBeenCalledTimes(1); expect(PedidosRepository.sincronizar).toHaveBeenCalledWith(9);
  expect(vm.pedido?.compraConfirmada).toBe(false); expect(aplicar).not.toHaveBeenCalled();
});
it('el servidor aprobado actualiza el carrito y permite seguir comprando', async () => {
  await montar(); await act(async () => { await vm.preparar(items); });
  jest.mocked(PedidosRepository.sincronizar).mockResolvedValue(aprobado);
  await act(async () => { await vm.consultar(); });
  expect(vm.pedido?.compraConfirmada).toBe(true); expect(aplicar).toHaveBeenCalledWith(aprobado);
  await act(async () => { await vm.finalizar(); }); expect(PedidoActivoRepository.guardar).toHaveBeenLastCalledWith(21, null); expect(vm.pedido).toBeNull();
});
it('un pago recibido sin stock queda activo y no permite otro cobro', async () => {
  jest.mocked(PedidoActivoRepository.leer).mockResolvedValue(9);
  const revision = { ...aprobado, estado: 'pendiente' as const, compraConfirmada: false, requiereRevision: true };
  jest.mocked(PedidosRepository.obtener).mockResolvedValue(revision);
  jest.mocked(PedidosRepository.sincronizar).mockResolvedValue(revision);
  await montar(); await act(async () => { await vm.pagar(); await vm.finalizar(); });
  expect(openBrowserAsync).not.toHaveBeenCalled(); expect(aplicar).not.toHaveBeenCalled(); expect(vm.pedido?.requiereRevision).toBe(true);
  expect(PedidoActivoRepository.guardar).not.toHaveBeenCalledWith(21, null);
});
it('rechaza enlaces con credenciales, destino extraño o pedido diferente', async () => {
  await montar(); await act(async () => { await vm.preparar(items); });
  jest.mocked(PedidosRepository.preferencia).mockResolvedValueOnce({ pedidoId: 9, total: 60, moneda: 'MXN', preferenceId: 'pref', checkoutUrl: 'https://mercadopago.com.mx.ejemplo.test/pagar' });
  await act(async () => { await vm.pagar(); }); expect(openBrowserAsync).not.toHaveBeenCalled(); expect(vm.error).toContain('no corresponde');
});
it('recupera pedido por cuenta, espera al carrito y consulta al volver a primer plano', async () => {
  jest.mocked(PedidoActivoRepository.leer).mockResolvedValue(9); jest.mocked(PedidosRepository.obtener).mockResolvedValue(aprobado);
  await montar(false); expect(aplicar).not.toHaveBeenCalled();
  await act(async () => { renderer.update(<Hook listo />); }); expect(aplicar).toHaveBeenCalledWith(aprobado);
  await act(async () => { appState('active'); }); expect(PedidosRepository.sincronizar).toHaveBeenCalledWith(9);
});
it('no mezcla cuentas ni abre un checkout si cambia la sesión durante la preferencia', async () => {
  await montar(); await act(async () => { await vm.preparar(items); });
  let resolver!: (valor: Awaited<ReturnType<typeof PedidosRepository.preferencia>>) => void;
  jest.mocked(PedidosRepository.preferencia).mockReturnValueOnce(new Promise(resolve => { resolver = resolve; }));
  let pendiente!: Promise<void>;
  act(() => { pendiente = vm.pagar(); });
  await act(async () => { sessionStore.setSession('otro', 22, 'Otra cuenta', 'CLIENTE'); });
  await act(async () => { resolver({ pedidoId: 9, total: 60, moneda: 'MXN', preferenceId: 'pref', checkoutUrl: 'https://www.mercadopago.com.mx/checkout/test' }); await pendiente; });
  expect(vm.pedido).toBeNull(); expect(openBrowserAsync).not.toHaveBeenCalled(); expect(PedidoActivoRepository.leer).toHaveBeenLastCalledWith(22);
});
it('antes de descartar un checkout vencido reconcilia para detectar un webhook perdido', async () => {
  jest.mocked(PedidoActivoRepository.leer).mockResolvedValue(9);
  jest.mocked(PedidosRepository.obtener).mockResolvedValue({ ...inicial, vencido: true, paymentStatus: 'mobile_checkout' });
  jest.mocked(PedidosRepository.sincronizar).mockResolvedValue(aprobado);
  await montar(); await act(async () => { await vm.finalizar(); });
  expect(PedidosRepository.sincronizar).toHaveBeenCalledWith(9); expect(aplicar).toHaveBeenCalledWith(aprobado);
});
it('si no puede recuperar el pedido bloquea uno nuevo y permite reintentar sin borrarlo', async () => {
  jest.mocked(PedidoActivoRepository.leer).mockRejectedValueOnce(new Error('Archivo inaccesible'));
  await montar(); await act(async () => { await vm.preparar(items); }); expect(PedidosRepository.crear).not.toHaveBeenCalled();
  expect(vm.error).toContain('inaccesible');
  await act(async () => { vm.reintentar(); }); expect(vm.listo).toBe(true);
});
