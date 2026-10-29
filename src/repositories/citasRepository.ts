import { apiClient, apiClientAuth } from '../services/api';
import { DiaHorario, Empleada, Ocupacion, CitaPayload, PreferenciaPagoResponse } from '../models/Cita';
import { ServicioItem } from '../models/Servicio';
import { ServiciosRepository } from './serviciosRepository';

export const CitasRepository = {
  getServicios: async (): Promise<ServicioItem[]> => {
    return ServiciosRepository.getServicios();
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
    try {
      const data = await apiClient<Ocupacion[]>(`/citas/ocupacion?fecha=${fecha}&empleadaId=${empleadaId}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

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
    return apiClientAuth<PreferenciaPagoResponse>('/mercado-pago/crear-preferencia-cita', {
      method: 'POST',
      body: JSON.stringify({ citaId }),
    });
  }
};
