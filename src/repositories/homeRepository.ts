import { apiClient, apiClientAuth } from '../services/api';
import { Servicio, Producto, ResumenCliente } from '../models/Catalogo';

/**
 * HomeRepository — capa de acceso a datos para la pantalla de inicio.
 * Los ViewModels consumen este repositorio; nunca llaman a apiClient directamente.
 */
export const HomeRepository = {
  /**
   * Obtiene los servicios activos del catálogo.
   * GET /api/servicios  (público — sin token)
   */
  getServicios: async (): Promise<Servicio[]> => {
    const data = await apiClient<Servicio[]>('/servicios');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene los insumos/productos activos del catálogo.
   * GET /api/insumos  (público — sin token)
   */
  getProductos: async (): Promise<Producto[]> => {
    const data = await apiClient<Producto[]>('/insumos');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene el resumen del cliente autenticado (perfil + stats + próxima cita).
   * GET /api/cliente/resumen  (protegido — requiere token)
   */
  getResumenCliente: async (): Promise<ResumenCliente> => {
    return apiClientAuth<ResumenCliente>('/cliente/resumen');
  },
};
