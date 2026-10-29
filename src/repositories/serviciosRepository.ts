import { apiClient } from '../services/api';
import { ServicioAPI, ServicioItem } from '../models/Servicio';

/**
 * Normaliza un registro crudo del API al modelo de UI ServicioItem.
 */
function normalizar(api: ServicioAPI): ServicioItem {
  return {
    id: String(api.id),
    nombre: api.nombre ?? '',
    descripcion: api.descripcion ?? '',
    precioMXN: Number(api.precio) || 0,
    duracionMin: Number(api.duracion) || 0,
    categoria: String(api.categoria ?? '').trim() || 'General',
    imagenUrl: api.imagenUrl ?? null,
    estaActivo: api.estaActivo === 1,
  };
}

/**
 * Repositorio real que consulta GET /api/servicios del backend.
 */
export const ServiciosRepository = {
  async getServicios(): Promise<ServicioItem[]> {
    const data = await apiClient<ServicioAPI[]>('/servicios');
    if (!Array.isArray(data)) return [];
    return data
      .filter((s) => s.estaActivo === 1)
      .map(normalizar);
  },
};
