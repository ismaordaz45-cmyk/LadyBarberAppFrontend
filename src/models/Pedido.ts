export interface PedidoItem {
  insumoId: number; nombre: string; cantidad: number; precioUnitario: number; subtotal: number;
}
export interface Pedido {
  id: number; total: number; moneda: 'MXN'; fecha: string; estado: 'pendiente' | 'pagado' | 'cancelado';
  paymentId: string | null; paymentStatus: string | null; pagoAprobado: boolean; compraConfirmada: boolean;
  requiereRevision: boolean; vencido: boolean; items: PedidoItem[];
}
export interface PreferenciaPedido { pedidoId: number; checkoutUrl: string; preferenceId: string; total: number; moneda: 'MXN' }

export function mensajePedido(pedido: Pedido): string {
  if (pedido.requiereRevision) return 'Pago recibido. El salón está revisando las existencias de tu pedido. No vuelvas a pagar; comunícate con el establecimiento.';
  if (pedido.compraConfirmada) return 'Compra confirmada. Recoge tus productos en el salón y presenta el folio de tu pedido.';
  if (['refunded','partially_refunded','charged_back'].includes(pedido.paymentStatus ?? '')) return 'El pago tiene una devolución o revisión. Contacta al salón para conocer el detalle.';
  if (['pending','in_process','authorized'].includes(pedido.paymentStatus ?? '')) return 'Mercado Pago está procesando el pago. Consulta su estado antes de volver a intentarlo.';
  if (pedido.estado === 'cancelado') return 'Este pedido está cancelado.';
  if (pedido.vencido) return 'El plazo para iniciar el pago de este pedido venció. Consulta el estado antes de preparar otro.';
  if (pedido.paymentStatus === 'rejected') return 'El pago fue rechazado. Puedes consultar su estado y volver a intentarlo.';
  return 'Revisa los productos y el total antes de continuar a Mercado Pago. La entrega es únicamente en el salón.';
}
export function permitePagarPedido(pedido: Pedido): boolean {
  return pedido.estado === 'pendiente' && !pedido.vencido && !pedido.pagoAprobado
    && ['mobile_created','mobile_checkout','rejected','cancelled'].includes(pedido.paymentStatus ?? '');
}
export function permiteCancelarPedido(pedido: Pedido): boolean {
  return pedido.estado === 'pendiente' && !pedido.pagoAprobado && !pedido.compraConfirmada && !pedido.requiereRevision
    && ['mobile_created','mobile_checkout','rejected','cancelled'].includes(pedido.paymentStatus ?? '');
}
