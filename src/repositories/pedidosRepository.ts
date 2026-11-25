import { apiClientAuth } from '../services/api';
import { ArticuloCarrito } from '../models/Carrito';
import { Pedido, PreferenciaPedido } from '../models/Pedido';

export function validarPedido(pedido: Pedido): Pedido {
  if (!pedido || !Number.isSafeInteger(pedido.id) || pedido.id <= 0 || pedido.moneda !== 'MXN'
    || !Number.isFinite(pedido.total) || pedido.total <= 0 || !Array.isArray(pedido.items) || !pedido.items.length
    || pedido.items.some(i => !Number.isSafeInteger(i.insumoId) || i.insumoId <= 0 || !Number.isInteger(i.cantidad) || i.cantidad < 1 || i.cantidad > 9999
      || !Number.isFinite(i.precioUnitario) || i.precioUnitario <= 0 || typeof i.nombre !== 'string'
      || !Number.isFinite(i.subtotal) || Math.round(i.subtotal * 100) !== Math.round(i.precioUnitario * 100) * i.cantidad)
    || pedido.items.reduce((sum, i) => sum + Math.round(i.precioUnitario * 100) * i.cantidad, 0) !== Math.round(pedido.total * 100)
    || !['pendiente','pagado','cancelado'].includes(pedido.estado) || typeof pedido.vencido !== 'boolean'
    || typeof pedido.fecha !== 'string' || typeof pedido.compraConfirmada !== 'boolean' || typeof pedido.pagoAprobado !== 'boolean'
    || pedido.pagoAprobado !== (pedido.paymentStatus === 'approved')
    || pedido.compraConfirmada !== (pedido.estado === 'pagado' && pedido.pagoAprobado)
    || pedido.requiereRevision !== (pedido.pagoAprobado && pedido.estado !== 'pagado')
    || (pedido.pagoAprobado && !/^\d+$/.test(pedido.paymentId ?? ''))) throw new Error('No se recibió un pedido válido. Consulta de nuevo antes de pagar.');
  return pedido;
}
export const PedidosRepository = {
  async crear(items: ArticuloCarrito[]): Promise<Pedido> {
    const pedido = await apiClientAuth<Pedido>('/pedidos', { method: 'POST', body: JSON.stringify({ items: items.map(i => ({ insumoId: i.productoId, cantidad: i.cantidad })) }) });
    return validarPedido(pedido);
  },
  async obtener(id: number): Promise<Pedido> {
    const pedido = validarPedido(await apiClientAuth<Pedido>(`/pedidos/${id}`));
    if (pedido.id !== id) throw new Error('El pedido consultado no coincide.');
    return pedido;
  },
  async sincronizar(id: number): Promise<Pedido> {
    const pedido = validarPedido(await apiClientAuth<Pedido>(`/pedidos/${id}/sincronizar`, { method: 'POST' }));
    if (pedido.id !== id) throw new Error('El pedido consultado no coincide.');
    return pedido;
  },
  preferencia: (id: number): Promise<PreferenciaPedido> => apiClientAuth(`/pedidos/${id}/preferencia`, { method: 'POST' }),
  async cancelar(id: number): Promise<Pedido> {
    const pedido = validarPedido(await apiClientAuth<Pedido>(`/pedidos/${id}/cancelar`, { method: 'POST' }));
    if (pedido.id !== id || pedido.estado !== 'cancelado' || pedido.paymentStatus !== 'mobile_cancelled') throw new Error('No se confirmó la cancelación. Consulta el estado del pedido.');
    return pedido;
  },
};
