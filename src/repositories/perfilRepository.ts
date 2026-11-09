import {
  ActualizarPerfilRequest,
  ActualizarPerfilResponse,
  ResumenPerfilCliente,
} from '../models/Perfil';
import { apiClientAuth } from '../services/api';

export const PerfilRepository = {
  obtenerPerfil: async (): Promise<ResumenPerfilCliente> => {
    return apiClientAuth<ResumenPerfilCliente>('/cliente/resumen');
  },

  actualizarPerfil: async (
    datos: ActualizarPerfilRequest
  ): Promise<ActualizarPerfilResponse> => {
    return apiClientAuth<ActualizarPerfilResponse>('/cliente/perfil', {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },
};
