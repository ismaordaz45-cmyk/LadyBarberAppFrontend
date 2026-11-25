import { ProductoItem } from './Producto';

export interface ArticuloCarrito { productoId: string; cantidad: number }
export interface EstadoCarrito { items: ArticuloCarrito[]; pedidosAplicados: number[] }
export function normalizarEstadoCarrito(data: unknown): EstadoCarrito {
  if (Array.isArray(data)) return { items: normalizarCarrito(data), pedidosAplicados: [] };
  if (!data || typeof data !== 'object') return { items: [], pedidosAplicados: [] };
  const estado = data as Partial<EstadoCarrito>;
  return { items: normalizarCarrito(estado.items), pedidosAplicados: Array.isArray(estado.pedidosAplicados)
    ? Array.from(new Set(estado.pedidosAplicados.filter(id => Number.isSafeInteger(id) && id > 0))).slice(-200) : [] };
}
export const MAX_CANTIDAD = 9999;

export function normalizarCarrito(data: unknown): ArticuloCarrito[] {
  if (!Array.isArray(data)) return [];
  const vistos = new Set<string>();
  return data.filter((item): item is ArticuloCarrito => {
    if (!item || typeof item !== 'object') return false;
    const { productoId, cantidad } = item;
    if (typeof productoId !== 'string' || !productoId.trim() || productoId.length > 100
      || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD || vistos.has(productoId)) return false;
    vistos.add(productoId);
    return true;
  }).slice(0, 200).map(({ productoId, cantidad }) => ({ productoId, cantidad }));
}

export function limiteProducto(producto?: ProductoItem): number {
  return producto && Number.isFinite(producto.precioMXN) && producto.precioMXN > 0
    && typeof producto.stockActual === 'number' && Number.isFinite(producto.stockActual)
    ? Math.min(MAX_CANTIDAD, Math.max(0, Math.floor(producto.stockActual))) : 0;
}

export function modificarCantidad(items: ArticuloCarrito[], producto: ProductoItem, cantidad: number): ArticuloCarrito[] {
  if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > limiteProducto(producto)) {
    throw new Error('La cantidad supera las existencias disponibles.');
  }
  const resto = items.filter(item => item.productoId !== producto.id);
  if (cantidad === 0) return resto;
  if (items.some(item => item.productoId === producto.id)) {
    return items.map(item => item.productoId === producto.id ? { ...item, cantidad } : item);
  }
  if (resto.length >= 200) throw new Error('Tu carrito alcanzó el límite de productos distintos.');
  return [...resto, { productoId: producto.id, cantidad }];
}
