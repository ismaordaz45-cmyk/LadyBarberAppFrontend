import { useState, useEffect } from 'react';
import { HomeRepository } from '../repositories/homeRepository';
import { sessionStore } from '../services/sessionStore';
import { Servicio, ResumenCliente } from '../models/Catalogo';

/**
 * ViewModel de la pantalla de Inicio.
 *
 * Patrón MVVM — responsabilidades:
 * • Gestiona el estado de carga y error de la pantalla.
 * • Coordina la carga paralela de datos a través de HomeRepository.
 * • Expone solo los datos y acciones que la View necesita.
 *
 * NO contiene código HTTP. NO contiene JSX. NO llama a fetch directamente.
 */
export const useHomeViewModel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [resumen, setResumen] = useState<ResumenCliente | null>(null);

  useEffect(() => {
    let cancelled = false;

    const cargarDatos = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Cargar en paralelo: catálogo de servicios + resumen del cliente autenticado
        const [resultServicios, resultResumen] = await Promise.allSettled([
          HomeRepository.getServicios(),
          HomeRepository.getResumenCliente(),
        ]);

        if (cancelled) return;

        if (resultServicios.status === 'fulfilled') {
          setServicios(resultServicios.value);
        }

        if (resultResumen.status === 'fulfilled') {
          setResumen(resultResumen.value);
        }
        // Si el resumen falla (ej: token expirado), la pantalla igual carga el catálogo
      } catch {
        if (!cancelled) {
          setError('No se pudieron cargar los datos. Intenta de nuevo.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    cargarDatos();
    return () => { cancelled = true; };
  }, []);

  // ── Datos derivados / transformados ─────────────────────────

  /** Nombre del usuario autenticado (del Singleton o del resumen de API) */
  const userNombre = resumen?.user?.nombre ?? sessionStore.userNombre ?? 'Cliente';

  /** Primeros 6 servicios — para la sección "Servicios Populares" */
  const serviciosPopulares = servicios.slice(0, 6);

  /** Próxima cita (puede ser null si no tiene ninguna) */
  const proximaCita = resumen?.nextCita ?? null;

  /** Estadísticas del cliente */
  const stats = resumen?.stats ?? { total: 0, pendientes: 0, completadas: 0 };

  return {
    isLoading,
    error,
    userNombre,
    serviciosPopulares,
    proximaCita,
    stats,
    resumen,
  };
};
