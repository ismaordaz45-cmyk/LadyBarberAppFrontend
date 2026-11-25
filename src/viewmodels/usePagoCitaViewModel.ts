import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { EstadoPagoCita } from '../models/Cita';
import { CitasRepository } from '../repositories/citasRepository';

export const usePagoCitaViewModel = (citaId: string) => {
  const [estadoPago, setEstadoPago] = useState<EstadoPagoCita | null>(null);
  const [consultandoPago, setConsultandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const currentId = useRef(citaId);
  const mounted = useRef(true);
  const checkingId = useRef<string | null>(null);
  const opening = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const consultarPago = useCallback(async () => {
    if (!citaId || checkingId.current === citaId) return;
    checkingId.current = citaId;
    setConsultandoPago(true);
    setErrorPago(null);
    try {
      const result = await CitasRepository.getEstadoPago(citaId);
      if (mounted.current && currentId.current === citaId) setEstadoPago(result);
    } catch (error) {
      if (mounted.current && currentId.current === citaId) {
        setErrorPago(error instanceof Error ? error.message : 'No se pudo consultar el pago. Intenta nuevamente.');
      }
    } finally {
      if (checkingId.current === citaId) checkingId.current = null;
      if (mounted.current && currentId.current === citaId) setConsultandoPago(false);
    }
  }, [citaId]);

  useEffect(() => {
    let active = true;
    currentId.current = citaId;
    void Promise.resolve().then(() => {
      if (!active) return;
      setEstadoPago(null);
      setErrorPago(null);
      setConsultandoPago(false);
      return consultarPago();
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void consultarPago();
    });
    return () => { active = false; subscription.remove(); };
  }, [citaId, consultarPago]);

  const abrirCheckout = async () => {
    if (!citaId || opening.current || (estadoPago?.citaId === citaId && estadoPago.paymentStatus === 'approved')) return;
    opening.current = true;
    setErrorPago(null);
    try {
      const preference = await CitasRepository.crearPreferenciaPago(citaId);
      const url = new URL(preference.checkoutUrl);
      if (url.protocol !== 'https:' || url.username || url.password) {
        throw new Error('El enlace de pago recibido no es válido.');
      }
      if (!mounted.current || currentId.current !== citaId) return;
      // Cerrar el navegador nunca confirma el pago: se consulta al backend.
      await openBrowserAsync(url.toString());
      if (mounted.current && currentId.current === citaId) await consultarPago();
    } finally {
      opening.current = false;
    }
  };

  const estadoActual = estadoPago?.citaId === citaId ? estadoPago : null;
  return {
    estadoPago: estadoActual, consultandoPago, errorPago, consultarPago, abrirCheckout,
    pagoAprobado: estadoActual?.paymentStatus === 'approved',
  };
};
