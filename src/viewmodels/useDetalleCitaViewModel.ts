import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { CitaDetalle } from '../models/Cita';
import { CitasRepository } from '../repositories/citasRepository';
import { guardarComprobanteCita } from '../services/comprobanteCitaService';
import { usePagoCitaViewModel } from './usePagoCitaViewModel';

export function useDetalleCitaViewModel(citaId: string) {
  const [detalle, setDetalle] = useState<CitaDetalle | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const pago = usePagoCitaViewModel(citaId);
  const cargar = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true); setError(null);
    try {
      const result = await CitasRepository.getDetalle(citaId);
      if (request === generation.current) setDetalle(result);
    } catch (e) {
      if (request === generation.current) setError(e instanceof Error ? e.message : 'No se pudo cargar la cita.');
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [citaId]);

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) void cargar(); });
    return () => { active = false; generation.current += 1; };
  }, [cargar]));
  useEffect(() => {
    let active = true;
    if (pago.pagoAprobado) void Promise.resolve().then(() => { if (active) void cargar(); });
    return () => { active = false; };
  }, [pago.pagoAprobado, cargar]);

  const ejecutar = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setOcupado(true); setError(null); setMensaje(null);
    try { await action(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la acción.'); }
    finally { lock.current = false; setOcupado(false); }
  };
  const actual = detalle?.id === citaId ? detalle : null;
  const actualizar = () => ejecutar(async () => { await pago.consultarPago(); await cargar(); });
  return { detalle: actual, isLoading, error: error || pago.errorPago, ocupado, mensaje,
    actualizar,
    guardar: () => ejecutar(async () => {
      const request = generation.current;
      const verificado = await CitasRepository.getDetalle(citaId);
      if (request !== generation.current) return;
      setDetalle(verificado);
      const resultado = await guardarComprobanteCita(verificado);
      if (request !== generation.current) return;
      setMensaje(resultado.cancelado ? 'Guardado cancelado. No se descargó ningún archivo.'
        : `PDF guardado en ${resultado.carpeta}: ${resultado.nombre}`);
    }),
    pagar: () => {
      if (isLoading || !actual || actual.estado !== 'APARTADA') return;
      return ejecutar(async () => { await pago.abrirCheckout(); await cargar(); });
    },
    cancelar: () => Alert.alert('Cancelar cita', 'La cita se cancelará y el horario quedará libre. Esta acción no solicita una devolución del anticipo.', [
      { text: 'Conservar cita', style: 'cancel' },
      { text: 'Cancelar cita', style: 'destructive', onPress: () => void ejecutar(async () => {
        await CitasRepository.cancelarCita(citaId); await cargar();
      }) },
    ]),
  };
}
