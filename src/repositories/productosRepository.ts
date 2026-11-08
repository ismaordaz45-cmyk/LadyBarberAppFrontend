import { ProductoAPI, ProductoItem } from '../models/Producto';
import { apiClient, getApiBaseUrl } from '../services/api';
import { resolveServicioImagenUrl } from '../utils/resolveServicioImagenUrl';

const stringValue = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const numberValue = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const isActiveProduct = (value: unknown): value is ProductoAPI => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;

  const product = value as Partial<ProductoAPI> & { id?: unknown };
  const hasId = typeof product.id === 'number' || typeof product.id === 'string';
  const active = product.estaActivo === 1 || product.estaActivo === true;
  return hasId && typeof product.nombre === 'string' && product.nombre.trim().length > 0 && active;
};

const getApiOrigin = (): string => getApiBaseUrl().replace(/\/api\/?$/, '');

const normalizeProduct = (api: ProductoAPI): ProductoItem => {
  const unit = stringValue(api.unidad);
  const imageUrl = resolveServicioImagenUrl(api.imagen, getApiOrigin()) ?? '';

  return {
    id: String(api.id),
    nombre: api.nombre.trim(),
    categoria: 'Productos',
    categoriaEtiqueta: unit ? unit.toUpperCase() : 'PRODUCTO',
    subtitulo: unit ? `Presentación: ${unit}` : 'Producto disponible en salón',
    precioMXN: numberValue(api.precio),
    imagenUrl: imageUrl,
    descripcion: stringValue(api.descripcion),
    ...(unit ? { volumen: unit } : {}),
    stockActual: numberValue(api.stockActual),
  };
};

/** Repositorio real del catalogo publico GET /api/insumos. */
export const ProductosRepository = {
  async getProductos(): Promise<ProductoItem[]> {
    const data = await apiClient<ProductoAPI[]>('/insumos');
    if (!Array.isArray(data)) return [];
    return data.filter(isActiveProduct).map(normalizeProduct);
  },

  async getProductoById(id: string): Promise<ProductoItem | undefined> {
    const products = await this.getProductos();
    return products.find((product) => product.id === id);
  },
};
