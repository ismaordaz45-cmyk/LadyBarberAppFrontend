import { EliminarCuentaResponse } from '../models/Cuenta';
import { apiClientAuth } from '../services/api';

export const CuentaRepository = {
  eliminarCuenta: async (
    password: string,
    confirmacion: 'ELIMINAR'
  ): Promise<EliminarCuentaResponse> => {
    return apiClientAuth<EliminarCuentaResponse>('/auth/cuenta', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirmacion }),
    });
  },
};
