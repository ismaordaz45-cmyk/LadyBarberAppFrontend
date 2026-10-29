import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { sessionStore } from './sessionStore';

// IP local de respaldo de tu máquina en la red Wi-Fi
const DEV_MACHINE_IP = '192.168.0.111';

type ApiBaseUrlOptions = {
  configuredUrl?: string;
  isDev: boolean;
  platform: string;
  hostUri?: string | null;
  devMachineIp?: string;
};

/**
 * Valida y normaliza una URL base sin permitir credenciales, query o fragmentos.
 * En builds firmados se exige HTTPS para evitar trafico de autenticacion en claro.
 */
export const normalizeApiBaseUrl = (
  rawUrl: string,
  requireHttps = false
): string => {
  const candidate = rawUrl.trim();
  if (!candidate) {
    throw new Error('EXPO_PUBLIC_API_URL no puede estar vacia.');
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL debe ser una URL absoluta valida.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('EXPO_PUBLIC_API_URL debe utilizar http o https.');
  }
  if (requireHttps && parsed.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL debe utilizar HTTPS en builds firmados.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('EXPO_PUBLIC_API_URL no debe contener credenciales.');
  }
  if (parsed.search || parsed.hash) {
    throw new Error('EXPO_PUBLIC_API_URL no debe contener query ni fragmentos.');
  }

  const pathname = parsed.pathname.replace(/\/+$/, '');
  if (pathname !== '/api') {
    throw new Error('EXPO_PUBLIC_API_URL debe terminar exactamente en /api.');
  }
  return `${parsed.origin}${pathname}`;
};

/** Resuelve la URL del API con entradas explicitas para facilitar su prueba. */
export const resolveApiBaseUrl = ({
  configuredUrl,
  isDev,
  platform,
  hostUri,
  devMachineIp = DEV_MACHINE_IP,
}: ApiBaseUrlOptions): string => {
  if (configuredUrl?.trim()) {
    return normalizeApiBaseUrl(configuredUrl, !isDev);
  }

  if (!isDev) {
    throw new Error(
      'Falta EXPO_PUBLIC_API_URL para conectar un build firmado con el backend.'
    );
  }

  if (platform === 'web') {
    return 'http://localhost:3000/api';
  }

  const host = hostUri?.split(':')[0].trim();
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3000/api`;
  }

  return `http://${devMachineIp}:3000/api`;
};

/**
 * Resuelve la URL base del API en tiempo de ejecución.
 * Se llama en cada petición para garantizar que siempre usa la IP
 * correcta del host de Expo, incluso si el bundle fue compilado antes
 * de que Metro asignara la dirección.
 */
export const getApiBaseUrl = (): string => {
  return resolveApiBaseUrl({
    configuredUrl: process.env.EXPO_PUBLIC_API_URL,
    isDev: __DEV__,
    platform: Platform.OS,
    hostUri: Constants.expoConfig?.hostUri,
  });
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
      `No se pudo conectar con el servidor (${url}). Verifica la URL configurada y la disponibilidad del backend.`
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

  try {
    const response = await fetch(url, { ...options, headers });
    let data: any = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error = new Error(
        data.message || data.error || 'Error en la petición a la API'
      );
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
      `No se pudo conectar con el servidor (${url}). Verifica la URL configurada y la disponibilidad del backend.`
    );
    (netError as any).originalError = err;
    throw netError;
  }
};
