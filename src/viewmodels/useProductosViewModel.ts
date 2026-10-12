import { useState, useEffect, useMemo } from 'react';
import { ProductoItem, CategoriaProducto } from '../models/Producto';
import { ProductosRepository } from '../repositories/productosRepository';

export const useProductosViewModel = () => {
  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaProducto>('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [ordenAscendente, setOrdenAscendente] = useState<boolean | null>(null);
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null);

  const categoriasDisponibles: CategoriaProducto[] = [
    'Todos',
    'Tratamientos',
    'Pomadas & Styling',
    'Cuidado Diario',
    'Herramientas',
  ];

  useEffect(() => {
    let cancel = false;
    const cargarProductos = async () => {
      setIsLoading(true);
      try {
        const data = await ProductosRepository.getProductos();
        if (!cancel) {
          setProductos(data);
        }
      } finally {
        if (!cancel) setIsLoading(false);
      }
    };

    cargarProductos();
    return () => {
      cancel = true;
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
    setTimeout(() => {
      setMensajeFeedback(null);
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
