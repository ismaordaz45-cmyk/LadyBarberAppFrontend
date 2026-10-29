import { useState, useEffect, useMemo, useRef } from 'react';
import { ProductoItem, CategoriaProducto } from '../models/Producto';
import { ProductosRepository } from '../repositories/productosRepository';

const CATEGORIAS: CategoriaProducto[] = [
  'Todos',
  'Tratamientos',
  'Pomadas & Styling',
  'Cuidado Diario',
  'Herramientas',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const stringValue = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizeProducto = (value: unknown): ProductoItem | null => {
  if (!isRecord(value)) return null;

  const id = stringValue(value.id);
  const nombre = stringValue(value.nombre);
  const categoria = stringValue(value.categoria);
  if (!id || !nombre || !CATEGORIAS.includes(categoria as CategoriaProducto) || categoria === 'Todos') {
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
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoriasDisponibles = CATEGORIAS;

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
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, []);

  const productosFiltrados = useMemo(() => {
    let lista = productos.filter((p) => {
      const cumpleCategoria =
        categoriaActiva === 'Todos' || p.categoria === categoriaActiva;

      const q = busqueda.trim().toLowerCase();
      const cumpleBusqueda =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.categoriaEtiqueta.toLowerCase().includes(q) ||
        p.subtitulo.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q);

      return cumpleCategoria && cumpleBusqueda;
    });

    if (ordenAscendente !== null) {
      lista = [...lista].sort((a, b) =>
        ordenAscendente ? a.precioMXN - b.precioMXN : b.precioMXN - a.precioMXN
      );
    }

    return lista;
  }, [productos, categoriaActiva, busqueda, ordenAscendente]);

  const agregarAlCarrito = (producto: ProductoItem) => {
    setCarrito((prev) => ({
      ...prev,
      [producto.id]: (prev[producto.id] || 0) + 1,
    }));

    setMensajeFeedback(`"${producto.nombre.slice(0, 24)}..." agregado.`);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setMensajeFeedback(null);
      feedbackTimerRef.current = null;
    }, 2000);
  };

  const toggleOrden = () => {
    setOrdenAscendente((prev) => {
      if (prev === null) return true; // Menor a mayor
      if (prev === true) return false; // Mayor a menor
      return null; // Original
    });
  };

  const totalItemsCarrito = useMemo(() => {
    return Object.values(carrito).reduce((acc, qty) => acc + qty, 0);
  }, [carrito]);

  return {
    isLoading,
    error,
    categoriaActiva,
    setCategoriaActiva,
    busqueda,
    setBusqueda,
    categoriasDisponibles,
    productos: productosFiltrados,
    totalArticulos: productosFiltrados.length,
    ordenAscendente,
    toggleOrden,
    agregarAlCarrito,
    totalItemsCarrito,
    mensajeFeedback,
  };
};
