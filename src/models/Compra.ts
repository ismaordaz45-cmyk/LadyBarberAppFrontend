import { Pedido, PedidoItem } from './Pedido';
export type FiltroCompras = 'todas' | 'vigentes' | 'vencidas';
export type EstadoRecogida = 'vigente' | 'vencida' | 'sin_registro' | 'no_disponible';
export interface CompraItem extends PedidoItem { imagen: string | null }
export interface CompraResumen {
  id: number; fecha: string; aprobadoEn: string | null; total: number; moneda: 'MXN'; paymentStatus: string | null;
  estadoRecogida: EstadoRecogida; totalProductos: number; totalUnidades: number; items: CompraItem[];
}
export interface CompraDetalle extends Pedido {
  items: CompraItem[]; compradorNombre: string | null;
  negocio: { nombre: string; direccion: string | null; telefono: string | null };
  comprobanteDisponible: boolean; zonaHoraria: string;
  recogida: { estado: EstadoRecogida; aprobadoEn: string | null; limiteEn: string | null };
}
export interface PaginaCompras { compras: CompraResumen[]; siguienteCursor: number | null }
export const etiquetasRecogida: Record<EstadoRecogida, string> = { vigente: 'Plazo vigente', vencida: 'Plazo vencido', sin_registro: 'Consultar en el salón', no_disponible: 'En revisión' };

export function fechaCompra(value: string | null, zona = 'America/Mexico_City'): string {
  if (!value) return 'Fecha no disponible';
  const literal = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value);
  const fecha = new Date(literal ? value.replace(' ', 'T') + 'Z' : value);
  if (!Number.isFinite(fecha.getTime())) return 'Fecha no disponible';
  try { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: literal ? 'UTC' : zona }).format(fecha); }
  catch { return fecha.toISOString(); }
}
