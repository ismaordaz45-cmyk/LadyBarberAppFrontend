import { apiClientAuth } from '../api';
import { sessionStore } from '../sessionStore';

type MockResponseOptions = {
  ok: boolean;
  status: number;
  body?: unknown;
  jsonError?: Error;
};

const createMockResponse = ({
  ok,
  status,
  body = {},
  jsonError,
}: MockResponseOptions): Response => ({
  ok,
  status,
  json: jest.fn(() => (
    jsonError ? Promise.reject(jsonError) : Promise.resolve(body)
  )),
} as unknown as Response);

describe('apiClientAuth REST autenticado', () => {
  const fetchMock = jest.fn();
  const originalFetch = globalThis.fetch;
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;

  beforeAll(() => {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });
  });

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.invalid/api';
    sessionStore.clearSession();
    fetchMock.mockReset();
  });

  afterEach(() => {
    sessionStore.clearSession();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalFetch) {
      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        writable: true,
        value: originalFetch,
      });
    } else {
      Reflect.deleteProperty(globalThis, 'fetch');
    }

    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it('agrega el JWT como Bearer y conserva metodo, body y headers personalizados', async () => {
    sessionStore.setSession('jwt_ficticio_uno', 1, 'Persona QA', 'CLIENTE');
    const requestBody = JSON.stringify({ estado: 'CONFIRMADA' });
    const responseBody = { ok: true };
    fetchMock.mockResolvedValueOnce(createMockResponse({
      ok: true,
      status: 200,
      body: responseBody,
    }));

    const result = await apiClientAuth<typeof responseBody>('/citas/17', {
      method: 'PATCH',
      headers: { 'X-Prueba': 'jest' },
      body: requestBody,
    });

    expect(result).toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.invalid/api/citas/17',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Prueba': 'jest',
          Authorization: 'Bearer jwt_ficticio_uno',
        },
        body: requestBody,
      }
    );
  });

  it('no agrega Authorization cuando no existe sesion', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({
      ok: true,
      status: 200,
      body: { ok: true },
    }));

    await apiClientAuth('/cliente/resumen');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
    });
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('lee el token actual en cada solicitud y no conserva un JWT anterior', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ ok: true, status: 200 }))
      .mockResolvedValueOnce(createMockResponse({ ok: true, status: 200 }));

    sessionStore.setSession('jwt_ficticio_uno', 1, 'Persona Uno', 'CLIENTE');
    await apiClientAuth('/primera');

    sessionStore.setSession('jwt_ficticio_dos', 2, 'Persona Dos', 'CLIENTE');
    await apiClientAuth('/segunda');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].headers.Authorization)
      .toBe('Bearer jwt_ficticio_uno');
    expect(fetchMock.mock.calls[1][1].headers.Authorization)
      .toBe('Bearer jwt_ficticio_dos');
  });

  it.each([
    [400, { error: 'Solicitud invalida' }, 'Solicitud invalida'],
    [401, { message: 'Token invalido' }, 'Token invalido'],
    [404, {}, 'Error en la petición a la API'],
    [500, {}, 'Error en la petición a la API'],
  ])(
    'conserva status y data para un error HTTP autenticado %i',
    async (status, body, expectedMessage) => {
      sessionStore.setSession('jwt_ficticio', 1, 'Persona QA', 'CLIENTE');
      fetchMock.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status,
        body,
      }));

      try {
        await apiClientAuth('/protegido');
        throw new Error('La solicitud debio fallar');
      } catch (error: any) {
        expect(error.message).toBe(expectedMessage);
        expect(error.status).toBe(status);
        expect(error.data).toEqual(body);
      }

      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  );

  it('convierte una excepcion de fetch en error de conexion y conserva la causa', async () => {
    const networkError = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValueOnce(networkError);

    await expect(apiClientAuth('/sin-conexion'))
      .rejects.toMatchObject({
        message: expect.stringContaining(
          'No se pudo conectar con el servidor (https://api.example.invalid/api/sin-conexion)'
        ),
        originalError: networkError,
      });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('tolera JSON invalido en una respuesta autenticada exitosa', async () => {
    const jsonError = new SyntaxError('JSON invalido');
    fetchMock.mockResolvedValueOnce(createMockResponse({
      ok: true,
      status: 200,
      jsonError,
    }));

    await expect(apiClientAuth('/respuesta-no-json')).resolves.toEqual({});
  });

  it('acepta una respuesta autenticada 204 sin contenido', async () => {
    const emptyBodyError = new SyntaxError('Unexpected end of JSON input');
    fetchMock.mockResolvedValueOnce(createMockResponse({
      ok: true,
      status: 204,
      jsonError: emptyBodyError,
    }));

    await expect(apiClientAuth('/citas/17', { method: 'DELETE' }))
      .resolves.toEqual({});
  });

  it('conserva el fallback HTTP cuando el error contiene JSON invalido', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      jsonError: new SyntaxError('JSON invalido'),
    }));

    await expect(apiClientAuth('/fallo-json'))
      .rejects.toMatchObject({
        message: 'Error en la petición a la API',
        status: 500,
        data: {},
      });
  });

  it('inicia cada caso sin contaminacion de SessionStore', () => {
    expect(sessionStore.isAuthenticated).toBe(false);
    expect(sessionStore.token).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
