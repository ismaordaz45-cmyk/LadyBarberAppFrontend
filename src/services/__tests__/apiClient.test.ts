import { apiClient } from '../api';

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

describe('apiClient REST publico', () => {
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
    fetchMock.mockReset();
  });

  afterEach(() => {
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

  it('construye una solicitud JSON exacta y devuelve la respuesta del servidor', async () => {
    const requestBody = JSON.stringify({ correo: 'persona@example.invalid', activo: true });
    const responseBody = { ok: true, id: 17 };
    fetchMock.mockResolvedValueOnce(createMockResponse({
      ok: true,
      status: 200,
      body: responseBody,
    }));

    const result = await apiClient<typeof responseBody>('/recurso', {
      method: 'POST',
      headers: { 'X-Prueba': 'jest' },
      body: requestBody,
    });

    expect(result).toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.invalid/api/recurso',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prueba': 'jest',
        },
        body: requestBody,
      }
    );
  });

  it('permite sustituir Content-Type y conserva headers personalizados', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({
      ok: true,
      status: 200,
      body: { ok: true },
    }));

    await apiClient('/texto', {
      headers: {
        'Content-Type': 'text/plain',
        'X-Correlation-Id': 'correlacion-ficticia',
      },
    });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).toEqual({
      'Content-Type': 'text/plain',
      'X-Correlation-Id': 'correlacion-ficticia',
    });
  });

  it('acepta una respuesta exitosa 204 sin cuerpo y devuelve un objeto vacio', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({
      ok: true,
      status: 204,
      jsonError: new SyntaxError('Unexpected end of JSON input'),
    }));

    await expect(apiClient('/recurso/17', { method: 'DELETE' }))
      .resolves.toEqual({});
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('tolera JSON invalido en una respuesta exitosa segun el contrato actual', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({
      ok: true,
      status: 200,
      jsonError: new SyntaxError('JSON invalido'),
    }));

    await expect(apiClient('/respuesta-no-json')).resolves.toEqual({});
  });

  it.each([
    [400, { error: 'Solicitud invalida' }, 'Solicitud invalida'],
    [401, { message: 'No autorizado' }, 'No autorizado'],
    [404, {}, 'Error del servidor (404)'],
    [500, {}, 'Error del servidor (500)'],
  ])(
    'conserva status y data para un error HTTP %i',
    async (status, body, expectedMessage) => {
      fetchMock.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status,
        body,
      }));

      try {
        await apiClient('/fallo');
        throw new Error('La solicitud debio fallar');
      } catch (error: any) {
        expect(error.message).toBe(expectedMessage);
        expect(error.status).toBe(status);
        expect(error.data).toEqual(body);
      }

      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  );

  it('usa el fallback HTTP cuando la respuesta de error contiene JSON invalido', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      jsonError: new SyntaxError('JSON invalido'),
    }));

    await expect(apiClient('/fallo-json'))
      .rejects.toMatchObject({
        message: 'Error del servidor (500)',
        status: 500,
        data: {},
      });
  });

  it('convierte una excepcion de fetch en error de conexion y conserva la causa', async () => {
    const networkError = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValueOnce(networkError);

    await expect(apiClient('/sin-conexion'))
      .rejects.toMatchObject({
        message: expect.stringContaining(
          'No se pudo conectar con el servidor (https://api.example.invalid/api/sin-conexion)'
        ),
        originalError: networkError,
      });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
