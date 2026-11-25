import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { sessionStore } from '../services/sessionStore';
import { CarritoRepository } from '../repositories/carritoRepository';
import { ArticuloCarrito, limiteProducto, modificarCantidad } from '../models/Carrito';
import { ProductoItem } from '../models/Producto';
import { Pedido } from '../models/Pedido';

const usuarioActual = () => sessionStore.isAuthenticated ? sessionStore.userId : null;

export function useCarritoViewModel(productos: ProductoItem[]) {
  const usuarioId = useSyncExternalStore(sessionStore.subscribe, usuarioActual, () => null);
  const [estado, setEstado] = useState<{ usuarioId: number | null; items: ArticuloCarrito[]; pedidosAplicados: number[]; listo: boolean }>({ usuarioId: null, items: [], pedidosAplicados: [], listo: false });
  const actual = useRef(estado);
  const cola = useRef(Promise.resolve());
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const generacion = useRef(0);
  const escritura = useRef(0);
  const secuenciaAgregado = useRef(0);
  const [ultimoAgregado, setUltimoAgregado] = useState<{ clave: number; nombre: string; usuarioId: number } | null>(null);
  useEffect(() => {
    if (!ultimoAgregado) return;
    const timer = setTimeout(() => setUltimoAgregado(null), 4500);
    return () => clearTimeout(timer);
  }, [ultimoAgregado]);
  useEffect(() => {
    let vigente = true;
    generacion.current += 1;
    const inicial = { usuarioId, items: [] as ArticuloCarrito[], pedidosAplicados: [] as number[], listo: false };
    actual.current = inicial;
    void cola.current.then(async () => {
      if (!vigente) return;
      setUltimoAgregado(null);
      setError(null);
      setEstado(inicial);
      if (usuarioId === null) return;
      const guardado = await CarritoRepository.leerEstado(usuarioId);
      if (!vigente) return;
      actual.current = { usuarioId, ...guardado, listo: true };
      setEstado(actual.current);
    }).catch(() => {
      if (vigente) setError('No pudimos recuperar tu carrito. Pulsa Reintentar para volver a cargarlo.');
    });
    return () => { vigente = false; generacion.current += 1; };
  }, [usuarioId, revision]);

  const listo = estado.usuarioId === usuarioId && estado.listo && usuarioId !== null;
  const items = estado.usuarioId === usuarioId ? estado.items : [];
  function guardar(nuevos: ArticuloCarrito[], pedidosAplicados = actual.current.pedidosAplicados): Promise<boolean> {
    if (!listo || usuarioId === null || actual.current.usuarioId !== usuarioId || usuarioActual() !== usuarioId) return Promise.resolve(false);
    actual.current = { usuarioId, items: nuevos, pedidosAplicados, listo: true };
    setEstado(actual.current);
    setError(null);
    const turno = ++escritura.current;
    const sesion = generacion.current;
    let exito = true;
    cola.current = cola.current.then(() => CarritoRepository.guardarEstado(usuarioId, { items: nuevos, pedidosAplicados }))
      .then(() => {
        if (generacion.current === sesion && turno === escritura.current) setError(null);
      }).catch(() => {
        exito = false;
        if (generacion.current === sesion && turno === escritura.current && usuarioActual() === usuarioId) {
          setError('El carrito está disponible en esta sesión, pero no pudimos guardarlo en el dispositivo.');
        }
      });
    return cola.current.then(() => exito);
  }
  function cambiar(producto: ProductoItem, cantidad: number) {
    try { guardar(modificarCantidad(actual.current.items, producto, cantidad)); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo actualizar el carrito.'); }
  }
  const lineas = items.map(item => {
    const producto = productos.find(p => p.id === item.productoId);
    const limite = limiteProducto(producto);
    return { ...item, producto, limite, requiereAjuste: !producto || item.cantidad > limite,
      subtotal: producto ? Math.round(producto.precioMXN * 100) * item.cantidad / 100 : 0 };
  });
  return {
    listo, sinSesion: usuarioId === null, error, lineas,
    ultimoAgregado: ultimoAgregado?.usuarioId === usuarioId ? ultimoAgregado : null,
    reintentar: () => listo ? guardar(actual.current.items) : setRevision(prev => prev + 1),
    cantidad: items.reduce((total, item) => total + item.cantidad, 0),
    total: lineas.reduce((total, item) => total + Math.round(item.subtotal * 100), 0) / 100,
    agregar: async (producto: ProductoItem): Promise<boolean> => {
      if (!listo || usuarioId === null || usuarioActual() !== usuarioId) return false;
      setUltimoAgregado(null);
      const sesion = generacion.current;
      try {
        const cantidad = (actual.current.items.find(i => i.productoId === producto.id)?.cantidad ?? 0) + 1;
        const guardado = await guardar(modificarCantidad(actual.current.items, producto, cantidad));
        if (guardado && generacion.current === sesion && usuarioActual() === usuarioId) {
          setUltimoAgregado({ clave: ++secuenciaAgregado.current, nombre: producto.nombre, usuarioId });
          return true;
        }
      } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo agregar el producto.'); }
      return false;
    },
    cambiar, quitar: (id: string) => guardar(actual.current.items.filter(item => item.productoId !== id)),
    vaciar: () => guardar([]),
    aplicarPedido: async (pedido: Pedido): Promise<boolean> => {
      if (!pedido.compraConfirmada || !pedido.pagoAprobado || !listo) return false;
      if (actual.current.pedidosAplicados.includes(pedido.id)) return guardar(actual.current.items);
      const comprados = new Map(pedido.items.map(i => [String(i.insumoId), i.cantidad]));
      const restantes = actual.current.items.map(i => ({ ...i, cantidad: Math.max(0, i.cantidad - (comprados.get(i.productoId) ?? 0)) })).filter(i => i.cantidad > 0);
      return guardar(restantes, [...actual.current.pedidosAplicados, pedido.id].slice(-200));
    },
  };
}
