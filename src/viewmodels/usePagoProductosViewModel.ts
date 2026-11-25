import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { sessionStore } from '../services/sessionStore';
import { ArticuloCarrito } from '../models/Carrito';
import { Pedido, permitePagarPedido, permiteCancelarPedido } from '../models/Pedido';
import { PedidosRepository } from '../repositories/pedidosRepository';
import { PedidoActivoRepository } from '../repositories/pedidoActivoRepository';

const usuarioActual = () => sessionStore.isAuthenticated ? sessionStore.userId : null;
const textoError = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la solicitud. Consulta el estado antes de pagar nuevamente.';

export function usePagoProductosViewModel(aplicarPedido: (pedido: Pedido) => Promise<boolean>, carritoListo: boolean) {
  const usuarioId = useSyncExternalStore(sessionStore.subscribe, usuarioActual, () => null);
  const [estado, setEstado] = useState<{ usuarioId: number | null; pedido: Pedido | null; listo: boolean }>({ usuarioId: null, pedido: null, listo: false });
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const generacion = useRef(0);
  const operacion = useRef(false);
  const pedidoActual = useRef<Pedido | null>(null);
  const aplicar = useRef(aplicarPedido);
  useEffect(() => { aplicar.current = aplicarPedido; }, [aplicarPedido]);
  const vigente = (usuario: number | null, turno: number) => usuario !== null && usuarioActual() === usuario && generacion.current === turno;

  useEffect(() => {
    let activo = true;
    const turno = ++generacion.current;
    operacion.current = false;
    pedidoActual.current = null;
    void Promise.resolve().then(async () => {
      if (!activo) return;
      setError(null); setCheckoutUrl(null); setOcupado(false);
      setEstado({ usuarioId, pedido: null, listo: false });
      if (usuarioId === null) return;
      try {
        const id = await PedidoActivoRepository.leer(usuarioId);
        const pedido = id === null ? null : await PedidosRepository.obtener(id);
        if (vigente(usuarioId, turno)) { pedidoActual.current = pedido; setEstado({ usuarioId, pedido, listo: true }); }
      } catch (e) { if (vigente(usuarioId, turno)) setError(textoError(e)); }
    });
    return () => { activo = false; generacion.current = turno + 1; };
  }, [usuarioId, revision]);

  const pedido = estado.usuarioId === usuarioId ? estado.pedido : null;
  const listo = estado.usuarioId === usuarioId && estado.listo && usuarioId !== null;
  useEffect(() => {
    if (!carritoListo || !pedido?.compraConfirmada) return;
    let activo = true;
    void aplicar.current(pedido).then(guardado => {
      if (activo && !guardado) setError('Tu compra está confirmada, pero falta actualizar el carrito. Reintenta guardar el carrito antes de seguir comprando.');
    });
    return () => { activo = false; };
  }, [pedido, carritoListo]);

  const consultar = useCallback(async () => {
    const id = pedidoActual.current?.id;
    if (!usuarioId || !id || operacion.current) return;
    const turno = generacion.current;
    operacion.current = true; setOcupado(true); setError(null);
    try {
      const actual = await PedidosRepository.sincronizar(id);
      if (vigente(usuarioId, turno)) { pedidoActual.current = actual; setEstado({ usuarioId, pedido: actual, listo: true }); }
    } catch (e) { if (vigente(usuarioId, turno)) setError(textoError(e)); }
    finally { if (vigente(usuarioId, turno)) { operacion.current = false; setOcupado(false); } }
  }, [usuarioId]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void consultar(); });
    return () => listener.remove();
  }, [consultar]);

  async function preparar(items: ArticuloCarrito[]) {
    if (!usuarioId || !listo || !carritoListo || pedidoActual.current || operacion.current || !items.length) return;
    const turno = generacion.current;
    operacion.current = true; setOcupado(true); setError(null);
    try {
      const nuevo = await PedidosRepository.crear(items);
      if (!vigente(usuarioId, turno)) return;
      // No abrir checkout sin poder recuperar el pedido al reiniciar la app.
      await PedidoActivoRepository.guardar(usuarioId, nuevo.id);
      if (vigente(usuarioId, turno)) { pedidoActual.current = nuevo; setEstado({ usuarioId, pedido: nuevo, listo: true }); }
    } catch (e) { if (vigente(usuarioId, turno)) setError(textoError(e)); }
    finally { if (vigente(usuarioId, turno)) { operacion.current = false; setOcupado(false); } }
  }
  async function pagar() {
    const actual = pedidoActual.current;
    if (!usuarioId || !actual || !permitePagarPedido(actual) || operacion.current) return;
    const turno = generacion.current;
    operacion.current = true; setOcupado(true); setError(null);
    let intentoAbrir = false;
    try {
      const preferencia = await PedidosRepository.preferencia(actual.id);
      const url = new URL(preferencia.checkoutUrl);
      if (preferencia.pedidoId !== actual.id || preferencia.moneda !== 'MXN' || preferencia.total !== actual.total
        || url.protocol !== 'https:' || url.username || url.password || !['www.mercadopago.com.mx','mercadopago.com.mx'].includes(url.hostname)) throw new Error('El enlace de pago no corresponde a tu pedido.');
      if (!vigente(usuarioId, turno)) return;
      setCheckoutUrl(url.toString());
      intentoAbrir = true;
      await openBrowserAsync(url.toString());
    } catch (e) { if (vigente(usuarioId, turno)) setError(textoError(e)); }
    finally {
      if (vigente(usuarioId, turno)) { operacion.current = false; setOcupado(false); }
    }
    if (intentoAbrir && vigente(usuarioId, turno)) await consultar();
  }
  async function finalizar() {
    if (!usuarioId || !pedidoActual.current || operacion.current) return;
    let actual = pedidoActual.current;
    const turno = generacion.current;
    operacion.current = true; setOcupado(true); setError(null);
    try {
      if (!actual.compraConfirmada && actual.paymentStatus !== 'mobile_created') {
        actual = await PedidosRepository.sincronizar(actual.id);
        if (!vigente(usuarioId, turno)) return;
        pedidoActual.current = actual; setEstado({ usuarioId, pedido: actual, listo: true });
      }
      const puedeCerrar = actual.compraConfirmada || actual.estado === 'cancelado'
        || ['rejected','cancelled','refunded','charged_back','partially_refunded','mobile_created'].includes(actual.paymentStatus ?? '')
        || (actual.vencido && actual.paymentStatus === 'mobile_checkout');
      if (!puedeCerrar || actual.requiereRevision) throw new Error('Conserva este pedido y consulta su estado antes de iniciar otro pago.');
      if (actual.compraConfirmada && !await aplicar.current(actual)) throw new Error('No se pudo actualizar el carrito. Reintenta antes de seguir comprando.');
      await PedidoActivoRepository.guardar(usuarioId, null);
      if (vigente(usuarioId, turno)) { pedidoActual.current = null; setEstado({ usuarioId, pedido: null, listo: true }); setCheckoutUrl(null); }
    } catch (e) { if (vigente(usuarioId, turno)) setError(textoError(e)); }
    finally { if (vigente(usuarioId, turno)) { operacion.current = false; setOcupado(false); } }
  }
  async function cancelar(idEsperado: number): Promise<boolean> {
    const actual = pedidoActual.current;
    if (!usuarioId || !actual || actual.id !== idEsperado || !permiteCancelarPedido(actual) || operacion.current) return false;
    const turno = generacion.current;
    operacion.current = true; setOcupado(true); setError(null);
    try {
      const cancelado = await PedidosRepository.cancelar(actual.id);
      if (!vigente(usuarioId, turno)) return false;
      pedidoActual.current = cancelado; setEstado({ usuarioId, pedido: cancelado, listo: true }); setCheckoutUrl(null);
      await PedidoActivoRepository.guardar(usuarioId, null);
      if (!vigente(usuarioId, turno)) return false;
      pedidoActual.current = null; setEstado({ usuarioId, pedido: null, listo: true });
      return true;
    } catch (e) {
      if (vigente(usuarioId, turno)) {
        setError(textoError(e));
        try {
          const actualizado = await PedidosRepository.obtener(actual.id);
          if (vigente(usuarioId, turno)) { pedidoActual.current = actualizado; setEstado({ usuarioId, pedido: actualizado, listo: true }); }
        } catch { /* Conservar el pedido y el error de cancelación. */ }
      }
      return false;
    } finally { if (vigente(usuarioId, turno)) { operacion.current = false; setOcupado(false); } }
  }
  return { pedido, listo, ocupado, error, checkoutUrl, preparar, pagar, consultar, finalizar, cancelar,
    puedePagar: !!pedido && permitePagarPedido(pedido),
    puedeCancelar: !!pedido && permiteCancelarPedido(pedido),
    reintentar: () => setRevision(prev => prev + 1) };
}
