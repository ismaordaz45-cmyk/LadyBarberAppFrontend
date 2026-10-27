import { normalizeApiBaseUrl, resolveApiBaseUrl } from '../api';

describe('configuracion de URL del API', () => {
  describe('normalizeApiBaseUrl', () => {
    it('elimina espacios y barras finales', () => {
      expect(normalizeApiBaseUrl('  https://qa.example.com/api///  ', true))
        .toBe('https://qa.example.com/api');
    });

    it.each([
      '',
      'qa.example.com/api',
      'ftp://qa.example.com/api',
      'https://qa.example.com',
      'https://usuario:password@qa.example.com/api',
      'https://qa.example.com/api?token=secreto',
      'https://qa.example.com/api#seccion',
    ])('rechaza una configuracion insegura o invalida: %s', (url) => {
      expect(() => normalizeApiBaseUrl(url)).toThrow();
    });

    it('exige HTTPS para un build firmado', () => {
      expect(() => normalizeApiBaseUrl('http://qa.example.com/api', true))
        .toThrow('HTTPS');
    });
  });

  describe('resolveApiBaseUrl', () => {
    it('prioriza y normaliza EXPO_PUBLIC_API_URL', () => {
      expect(resolveApiBaseUrl({
        configuredUrl: 'https://qa.example.com/api/',
        isDev: false,
        platform: 'android',
      })).toBe('https://qa.example.com/api');
    });

    it('resuelve localhost para desarrollo web', () => {
      expect(resolveApiBaseUrl({ isDev: true, platform: 'web' }))
        .toBe('http://localhost:3000/api');
    });

    it('resuelve el host de Expo para desarrollo Android', () => {
      expect(resolveApiBaseUrl({
        isDev: true,
        platform: 'android',
        hostUri: '192.168.1.25:8081',
      })).toBe('http://192.168.1.25:3000/api');
    });

    it('usa la IP local de respaldo en desarrollo', () => {
      expect(resolveApiBaseUrl({
        isDev: true,
        platform: 'android',
        devMachineIp: '192.168.1.50',
      })).toBe('http://192.168.1.50:3000/api');
    });

    it('impide iniciar un build firmado sin URL publica', () => {
      expect(() => resolveApiBaseUrl({
        isDev: false,
        platform: 'android',
      })).toThrow('Falta EXPO_PUBLIC_API_URL');
    });
  });
});
