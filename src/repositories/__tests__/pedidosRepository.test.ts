import { apiClientAuth } from '../../services/api';
import { PedidosRepository } from '../pedidosRepository';
import { Pedido } from '../../models/Pedido';
jest.mock('../../services/api', () => ({ apiClientAuth: jest.fn() }));
const api = jest.mocked(apiClientAuth);
const pedido: Pedido = { id: 9, total: 60, moneda: 'MXN', fecha: '2026-11-18', estado: 'pendiente', paymentId: null, paymentStatus: 'mobile_created', compraConfirmada: false, pagoAprobado: false, requiereRevision: false, vencido: false, items: [{ insumoId: 7, nombre: 'Gel', cantidad: 2, precioUnitario: 30, subtotal: 60 }] };
beforeEach(() => { api.mockReset(); api.mockResolvedValue(pedido); });
it('envía solo identificadores y cantidades al crear un pedido autenticado', async () => {
  await PedidosRepository.crear([{ productoId: '7', cantidad: 2 }]);
  expect(api).toHaveBeenCalledWith('/pedidos', { method: 'POST', body: JSON.stringify({ items: [{ insumoId: '7', cantidad: 2 }] }) });
});
it('reconcilia usando solo el pedido, sin enviar estado, pago o importes del navegador', async () => {
  await PedidosRepository.sincronizar(9);
  expect(api).toHaveBeenCalledWith('/pedidos/9/sincronizar', { method: 'POST' });
});
it('rechaza un detalle de otro pedido y totales que no coincidan', async () => {
  await expect(PedidosRepository.obtener(10)).rejects.toThrow('no coincide');
  api.mockResolvedValueOnce({ ...pedido, total: 0.01 });
  await expect(PedidosRepository.obtener(9)).rejects.toThrow('válido');
});
it('no acepta una compra confirmada sin evidencia aprobada o sin identificador de pago', async () => {
  for (const extra of [{ compraConfirmada: true }, { estado: 'pagado', compraConfirmada: true, pagoAprobado: true, paymentStatus: 'approved', paymentId: null }]) {
    api.mockResolvedValueOnce({ ...pedido, ...extra }); await expect(PedidosRepository.obtener(9)).rejects.toThrow('válido');
  }
});
it('solo acepta la cancelación confirmada del mismo pedido', async () => {
  api.mockResolvedValueOnce({ ...pedido, estado: 'cancelado', paymentStatus: 'mobile_cancelled' });
  expect((await PedidosRepository.cancelar(9)).estado).toBe('cancelado');
  expect(api).toHaveBeenLastCalledWith('/pedidos/9/cancelar', { method: 'POST' });
  await expect(PedidosRepository.cancelar(9)).rejects.toThrow('confirmó');
  api.mockResolvedValueOnce({ ...pedido, id: 10, estado: 'cancelado', paymentStatus: 'mobile_cancelled' });
  await expect(PedidosRepository.cancelar(9)).rejects.toThrow('confirmó');
});
