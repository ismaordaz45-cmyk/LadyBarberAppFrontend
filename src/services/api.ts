import { Platform } from 'react-native';
import Constants from 'expo-constants';

// IP local de respaldo de tu máquina en la red Wi-Fi
const DEV_MACHINE_IP = '192.168.0.111';

/**
 * Resuelve la URL base del API en tiempo de ejecución.
 * Se llama en cada petición para garantizar que siempre usa la IP
 * correcta del host de Expo, incluso si el bundle fue compilado antes
 * de que Metro asignara la dirección.
 */
export const getApiBaseUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api';
    }

    // hostUri está disponible en runtime (Expo Go / dev client)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0].trim();
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3000/api`;
      }
    }

    return `http://${DEV_MACHINE_IP}:3000/api`;
  }
  return 'https://salonladybarberbackend.onrender.com/api';
};

/**
 * URL estática para compatibilidad con código que la importa como constante.
 * Para peticiones reales usa siempre getApiBaseUrl() en apiClient.
 */
export const API_URL = getApiBaseUrl();

/**
 * Cliente HTTP base para peticiones públicas (sin token).
 * Resuelve la URL en tiempo de ejecución en cada llamada.
 */
export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Resolución en runtime — no usa la constante estática
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    let data: any = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const errorMsg =
        data.error ||
        data.message ||
        `Error del servidor (${response.status})`;
      const error = new Error(errorMsg);
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data as T;
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    const netError = new Error(
      `No se pudo conectar con el servidor (${url}). Verifica que el backend esté activo y en la misma red Wi-Fi.`
    );
    (netError as any).originalError = err;
    throw netError;
  }
};

/**
 * Cliente HTTP para peticiones protegidas (con token JWT).
 * Inyecta automáticamente el Bearer token del SessionStore.
 */
export const apiClientAuth = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Import lazy para evitar circular dependency
  const { sessionStore } = await import('./sessionStore');
  const token = sessionStore.token;

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Error en la petición a la API');
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data;
};
