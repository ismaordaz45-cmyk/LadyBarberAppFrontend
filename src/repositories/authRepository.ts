import { apiClient } from '../services/api';
import {
  LoginResponse,
  RecuperarPasswordResponse,
  RestablecerPasswordResponse,
  RegistroRequest,
  RegistroResponse,
} from '../models/Auth';

/**
 * Repositorio de Autenticación para la aplicación móvil.
 * Encapsula el acceso a la API REST para el módulo de Auth.
 */
export const AuthRepository = {
  /**
   * Realiza la petición HTTP para iniciar sesión.
   * POST /auth/login
   */
  login: async (correo: string, password: string): Promise<LoginResponse> => {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    });
  },

  /**
   * Solicita el envío de instrucciones para recuperar contraseña.
   * POST /auth/forgot-password
   */
  solicitarRecuperacion: async (correo: string): Promise<RecuperarPasswordResponse> => {
    return apiClient<RecuperarPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ correo }),
    });
  },

  /**
   * Restablece la contraseña con el token recibido.
   * POST /auth/reset-password
   */
  restablecerPassword: async (
    token: string,
    newPassword: string
  ): Promise<RestablecerPasswordResponse> => {
    return apiClient<RestablecerPasswordResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  /**
   * Registra un nuevo cliente en el sistema.
   * POST /auth/registro
   */
  registro: async (data: RegistroRequest): Promise<RegistroResponse> => {
    return apiClient<RegistroResponse>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
