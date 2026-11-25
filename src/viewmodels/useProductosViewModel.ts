import { useState, useEffect, useMemo, useCallback } from 'react';
import { ProductoItem, CategoriaProducto } from '../models/Producto';
import { ProductosRepository } from '../repositories/productosRepository';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const stringValue = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizeProducto = (value: unknown): ProductoItem | null => {
  if (!isRecord(value)) return null;

  const id = stringValue(value.id);
  const nombre = stringValue(value.nombre);
  const categoria = stringValue(value.categoria);
  if (!id || !nombre || !categoria || categoria === 'Todos') {
    return null;
  }

  const precio = value.precioMXN;
  const precioMXN = typeof precio === 'number' && Number.isFinite(precio) && precio >= 0
    ? precio
    : 0;
  const badge = isRecord(value.badge)
    && ['topseller', 'tamano'].includes(String(value.badge.tipo))
    && stringValue(value.badge.texto)
    ? {
      texto: stringValue(value.badge.texto),
      tipo: value.badge.tipo as 'topseller' | 'tamano',
    }
    : undefined;

  return {
    id,
    nombre,
    categoria: categoria as CategoriaProducto,
    categoriaEtiqueta: stringValue(value.categoriaEtiqueta) || categoria.toUpperCase(),
    subtitulo: stringValue(value.subtitulo),
    precioMXN,
    imagenUrl: stringValue(value.imagenUrl),
    descripcion: stringValue(value.descripcion),
    ...(typeof value.stockActual === 'number' && Number.isFinite(value.stockActual)
      ? { stockActual: Math.max(0, value.stockActual) } : {}),
    ...(stringValue(value.volumen) ? { volumen: stringValue(value.volumen) } : {}),
    ...(badge ? { badge } : {}),
  };
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error && error.message.trim()
    ? error.message
    : 'No se pudieron cargar los productos.';

export const useProductosViewModel = () => {
  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaProducto>('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [ordenAscendente, setOrdenAscendente] = useState<boolean | null>(null);
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [limite, setLimite] = useState(6);
  const [revision, setRevision] = useState(0);
  const [productoDetalleId, setProductoDetalleId] = useState<string | null>(null);

  const categoriasDisponibles = useMemo<CategoriaProducto[]>(() => [
    'Todos',
    ...Array.from(new Set(productos.map((product) => product.categoria))),
  ], [productos]);

  useEffect(() => {
    let cancel = false;
    const cargarProductos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data: unknown = await ProductosRepository.getProductos();
        if (!cancel) {
          if (!Array.isArray(data)) {
            setProductos([]);
            setError('La información de productos no es válida.');
            return;
          }
          setProductos(data.map(normalizeProducto).filter((item): item is ProductoItem => item !== null));
        }
      } catch (loadError) {
        if (!cancel) {
          setProductos([]);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancel) setIsLoading(false);
      }
    };

    cargarProductos();
    return () => {
      cancel = true;
    };
  }, [revision]);

  const productosFiltrados = useMemo(() => {
    let lista = productos.filter((p) => {
      const cumpleCategoria =
        categoriaActiva === 'Todos' || p.categoria === categoriaActiva;

      const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const q = normalizar(busqueda.trim());
      const cumpleBusqueda =
        !q ||
        normalizar(p.nombre).includes(q) ||
        normalizar(p.categoriaEtiqueta).includes(q) ||
        normalizar(p.subtitulo).includes(q) ||
        normalizar(p.descripcion).includes(q);

      return cumpleCategoria && cumpleBusqueda && (!soloDisponibles || (p.stockActual ?? 0) >= 1);
    });

    if (ordenAscendente !== null) {
      lista = [...lista].sort((a, b) =>
        ordenAscendente ? a.precioMXN - b.precioMXN : b.precioMXN - a.precioMXN
      );
    }

    return lista;
  }, [productos, categoriaActiva, busqueda, ordenAscendente, soloDisponibles]);

  const toggleOrden = () => {
    setLimite(6);
    setOrdenAscendente((prev) => {
      if (prev === null) return true; // Menor a mayor
      if (prev === true) return false; // Mayor a menor
      return null; // Original
    });
  };

  const recargar = useCallback(() => setRevision(prev => prev + 1), []);
  return {
    isLoading,
    error,
    categoriaActiva,
    setCategoriaActiva: (categoria: CategoriaProducto) => { setCategoriaActiva(categoria); setLimite(6); },
    busqueda,
    setBusqueda: (texto: string) => { setBusqueda(texto); setLimite(6); },
    categoriasDisponibles,
    productos: productosFiltrados,
    catalogo: productos,
    productoDetalle: productos.find(producto => producto.id === productoDetalleId) ?? null,
    abrirDetalle: (producto: ProductoItem) => setProductoDetalleId(producto.id),
    cerrarDetalle: () => setProductoDetalleId(null),
    productosVisibles: productosFiltrados.slice(0, limite),
    hayMas: limite < productosFiltrados.length,
    verMas: () => setLimite(prev => prev + 6),
    soloDisponibles, setSoloDisponibles: (valor: boolean) => { setSoloDisponibles(valor); setLimite(6); },
    recargar,
    totalArticulos: productosFiltrados.length,
    ordenAscendente,
    toggleOrden,
  };
};
