import { apiClientAuth, getApiBaseUrl } from '../services/api';
import { CompraDetalle, CompraItem, FiltroCompras, PaginaCompras } from '../models/Compra';
import { validarPedido } from './pedidosRepository';
import { resolveServicioImagenUrl } from '../utils/resolveServicioImagenUrl';

const imagen = (item: CompraItem): CompraItem => ({ ...item, imagen: resolveServicioImagenUrl(item.imagen, getApiBaseUrl().replace(/\/api\/?$/, '')) });
const estados = ['vigente','vencida','sin_registro','no_disponible'];
export const ComprasRepository = {
  async listar(filtro: FiltroCompras, cursor: number | null): Promise<PaginaCompras> {
    const pagina = await apiClientAuth<PaginaCompras>(`/compras?filtro=${filtro}${cursor === null ? '' : `&cursor=${cursor}`}`);
    if (!pagina || !Array.isArray(pagina.compras) || pagina.compras.length > 3
      || (pagina.siguienteCursor !== null && (!Number.isSafeInteger(pagina.siguienteCursor) || pagina.siguienteCursor <= 0))
      || pagina.compras.some(c => !Number.isSafeInteger(c.id) || c.id <= 0 || !Number.isFinite(c.total) || !Array.isArray(c.items) || !estados.includes(c.estadoRecogida)
        || c.items.some(i => !Number.isFinite(i.precioUnitario) || !Number.isInteger(i.cantidad) || i.cantidad <= 0 || !Number.isFinite(i.subtotal)))) throw new Error('No se recibió un historial válido. Intenta actualizar.');
    if ((cursor !== null && (pagina.compras.some(c => c.id >= cursor) || (pagina.siguienteCursor !== null && pagina.siguienteCursor >= cursor)))
      || (pagina.siguienteCursor !== null && pagina.siguienteCursor !== pagina.compras.at(-1)?.id)) throw new Error('No se pudo avanzar en el historial. Actualiza tus compras.');
    return { ...pagina, compras: pagina.compras.map(c => ({ ...c, items: c.items.map(imagen) })) };
  },
  async obtener(id: number): Promise<CompraDetalle> {
    const compra = await apiClientAuth<CompraDetalle>(`/compras/${id}`);
    validarPedido(compra);
    if (compra.id !== id || typeof compra.comprobanteDisponible !== 'boolean' || !compra.recogida
      || !estados.includes(compra.recogida.estado) || typeof compra.negocio?.nombre !== 'string' || typeof compra.zonaHoraria !== 'string') throw new Error('No se recibió el detalle de tu compra.');
    if (compra.comprobanteDisponible && (!compra.compraConfirmada || !compra.pagoAprobado || !compra.recogida.aprobadoEn || !compra.recogida.limiteEn)) throw new Error('El comprobante no tiene evidencia de pago suficiente.');
    return { ...compra, items: compra.items.map(imagen) };
  },
};
