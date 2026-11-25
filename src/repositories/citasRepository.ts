import { apiClient, apiClientAuth } from '../services/api';
import { DiaHorario, Empleada, Ocupacion, CitaPayload, PreferenciaPagoResponse, EstadoPagoCita, CitaResumen, CitaDetalle } from '../models/Cita';
import { ServicioItem } from '../models/Servicio';
import { ServiciosRepository } from './serviciosRepository';

export const CitasRepository = {
  getServicios: async (): Promise<ServicioItem[]> => {
    return ServiciosRepository.getServicios({ categoriaGenerica: false });
  },

  getHorarioNegocio: async (): Promise<DiaHorario[]> => {
    try {
      const data = await apiClient<{ dias: DiaHorario[] }>('/horario-negocio');
      return data?.dias || [];
    } catch {
      return [];
    }
  },

  getEmpleadasPorServicio: async (servicioId: number): Promise<Empleada[]> => {
    try {
      const data = await apiClient<Empleada[]>(`/empleadas/por-servicio/${servicioId}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getOcupacion: async (fecha: string, empleadaId: number): Promise<Ocupacion[]> => {
    return apiClientAuth<Ocupacion[]>(`/citas/ocupacion?fecha=${fecha}&empleadaId=${empleadaId}`);
  },

  getMisCitas: async (offset = 0): Promise<CitaResumen[]> =>
    apiClientAuth<CitaResumen[]>(`/citas/mis-citas?offset=${offset}`),

  getDetalle: async (citaId: string): Promise<CitaDetalle> =>
    apiClientAuth<CitaDetalle>(`/citas/${encodeURIComponent(citaId)}`),

  crearCita: async (payload: CitaPayload): Promise<{ citaId: string }> => {
    // Requires auth according to web implementation (actually the web uses api.post, but if it is an authenticated user, we should use apiClientAuth)
    // Wait, the web's MisCitasCliente implies the user is logged in. 
    return apiClientAuth<{ citaId: string }>('/citas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  cancelarCita: async (citaId: string): Promise<void> => {
    await apiClientAuth(`/citas/${citaId}`, {
      method: 'DELETE',
    });
  },

  crearPreferenciaPago: async (citaId: string): Promise<PreferenciaPagoResponse> => {
    return apiClientAuth<PreferenciaPagoResponse>(`/citas/${encodeURIComponent(citaId)}/pago/preferencia`, {
      method: 'POST',
    });
  },

  getEstadoPago: async (citaId: string): Promise<EstadoPagoCita> => {
    return apiClientAuth<EstadoPagoCita>(`/citas/${encodeURIComponent(citaId)}/pago/estado`);
  },
};
