import { useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { HomeRepository } from '../repositories/homeRepository';
import { sessionStore } from '../services/sessionStore';
import { ProximaCita, ResumenCliente } from '../models/Catalogo';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const nonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const nonNegativeNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

const normalizeProximaCita = (value: unknown): ProximaCita | null => {
  if (!isRecord(value)) return null;

  const id = nonEmptyString(value.id);
  const fecha = nonEmptyString(value.fecha);
  const horaInicio = nonEmptyString(value.horaInicio);
  const horaFin = nonEmptyString(value.horaFin);
  const estado = nonEmptyString(value.estado);
  const precioFinal = typeof value.precioFinal === 'number' ||
    (typeof value.precioFinal === 'string' && value.precioFinal.trim()) ? Number(value.precioFinal) : NaN;

  if (
    !id || !fecha || !horaInicio || !horaFin || !estado
    || typeof precioFinal !== 'number'
    || !Number.isFinite(precioFinal)
    || precioFinal < 0
  ) return null;

  const serviciosLabel = nonEmptyString(value.serviciosLabel);
  return {
    id,
    fecha,
    horaInicio,
    horaFin,
    estado,
    precioFinal,
    ...(serviciosLabel ? { serviciosLabel } : {}),
  };
};

const getErrorMessage = (error: unknown): string => {
  if (isRecord(error)) {
    const data = isRecord(error.data) ? error.data : null;
    const backendMessage = data ? nonEmptyString(data.message) : null;
    const errorMessage = nonEmptyString(error.message);
    if (backendMessage) return backendMessage;
    if (errorMessage) return errorMessage;
  }
  return 'No se pudieron cargar los datos. Intenta de nuevo.';
};

/**
 * ViewModel de la pantalla de Inicio.
 *
 * Patrón MVVM — responsabilidades:
 * • Gestiona el estado de carga y error de la pantalla.
 * • Coordina la carga de datos a través de HomeRepository.
 * • Expone solo los datos y acciones que la View necesita.
 *
 * NO contiene código HTTP. NO contiene JSX. NO llama a fetch directamente.
 */
export const useHomeViewModel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenCliente | null>(null);
  const generacion = useRef(0);
  const ocupado = useRef(false);
  const cargarDatos = useCallback(async () => {
      if (ocupado.current) return;
      ocupado.current = true;
      const solicitud = ++generacion.current;
      const token = sessionStore.token;
      setIsLoading(true);
      setError(null);

      try {
        const response: unknown = await HomeRepository.getResumenCliente();

        if (solicitud !== generacion.current || token !== sessionStore.token) return;

        if (response !== null && !isRecord(response)) {
          setResumen(null);
          setError('La información del inicio no es válida.');
          return;
        }
        setResumen(response as ResumenCliente | null);
      } catch (loadError) {
        if (solicitud === generacion.current && token === sessionStore.token) {
          setResumen(null);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (solicitud === generacion.current) { ocupado.current = false; setIsLoading(false); }
      }
  }, []);
  useFocusEffect(useCallback(() => {
    void cargarDatos();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void cargarDatos(); });
    return () => { generacion.current += 1; ocupado.current = false; subscription.remove(); };
  }, [cargarDatos]));

  // ── Datos derivados / transformados ─────────────────────────

  /** Nombre del usuario autenticado (del Singleton o del resumen de API) */
  const apiUser = isRecord(resumen?.user) ? resumen.user : null;
  const userNombre = nonEmptyString(apiUser?.nombre)
    ?? nonEmptyString(sessionStore.userNombre)
    ?? 'Cliente';

  /** Próxima cita (puede ser null si no tiene ninguna) */
  const proximaCita = normalizeProximaCita(resumen?.nextCita);

  /** Estadísticas del cliente */
  const rawStats = isRecord(resumen?.stats) ? resumen.stats : null;
  const stats = {
    total: nonNegativeNumber(rawStats?.total),
    pendientes: nonNegativeNumber(rawStats?.pendientes),
    completadas: nonNegativeNumber(rawStats?.completadas),
  };

  return {
    isLoading,
    error,
    userNombre,
    proximaCita,
    stats,
    resumen,
    actualizar: cargarDatos,
  };
};
