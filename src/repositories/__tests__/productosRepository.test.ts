import { apiClient, getApiBaseUrl } from '../../services/api';
import { ProductosRepository } from '../productosRepository';

jest.mock('../../services/api', () => ({
  apiClient: jest.fn(),
  getApiBaseUrl: jest.fn(),
}));

const apiClientMock = apiClient as jest.MockedFunction<typeof apiClient>;
const getApiBaseUrlMock = getApiBaseUrl as jest.MockedFunction<typeof getApiBaseUrl>;

const rawWebp = 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAUAmJQBOgCHwAP7+4AAA';
const activeProduct = {
  id: 7,
  nombre: ' Shampoo Profesional ',
  descripcion: 'Limpieza profunda',
  unidad: '500 ml',
  stockActual: '8',
  stockMinimo: 2,
  precio: '245.50',
  estaActivo: 1,
  imagen: rawWebp,
};

describe('HU-04 ProductosRepository real', () => {
  beforeEach(() => {
    apiClientMock.mockReset();
    getApiBaseUrlMock.mockReset();
    getApiBaseUrlMock.mockReturnValue('https://backend.example.test/api');
  });

  it('consulta GET /insumos y normaliza el contrato del backend', async () => {
    apiClientMock.mockResolvedValueOnce([activeProduct] as never);

    await expect(ProductosRepository.getProductos()).resolves.toEqual([{
      id: '7',
      nombre: 'Shampoo Profesional',
      categoria: 'Productos',
      categoriaEtiqueta: '500 ML',
      subtitulo: 'Presentación: 500 ml',
      precioMXN: 245.5,
      imagenUrl: `data:image/webp;base64,${rawWebp}`,
      descripcion: 'Limpieza profunda',
      volumen: '500 ml',
      stockActual: 8,
    }]);
    expect(apiClientMock).toHaveBeenCalledTimes(1);
    expect(apiClientMock).toHaveBeenCalledWith('/insumos');
  });

  it('conserva URLs Cloudinary y normaliza campos opcionales', async () => {
    apiClientMock.mockResolvedValueOnce([{
      ...activeProduct,
      id: 'prod-8',
      descripcion: null,
      unidad: null,
      stockActual: null,
      precio: 'invalido',
      imagen: 'https://res.cloudinary.com/demo/producto.webp',
    }] as never);

    await expect(ProductosRepository.getProductos()).resolves.toEqual([
      expect.objectContaining({
        id: 'prod-8',
        categoriaEtiqueta: 'PRODUCTO',
        subtitulo: 'Producto disponible en salón',
        precioMXN: 0,
        imagenUrl: 'https://res.cloudinary.com/demo/producto.webp',
        descripcion: '',
        stockActual: 0,
      }),
    ]);
  });

  it('excluye inactivos y registros malformados', async () => {
    apiClientMock.mockResolvedValueOnce([
      null,
      {},
      { ...activeProduct, id: 8, estaActivo: 0 },
      activeProduct,
    ] as never);

    const result = await ProductosRepository.getProductos();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('7');
  });

  it.each([[], {}, null, 'respuesta inesperada'])(
    'convierte respuestas no-array o vacias en lista vacia: %p',
    async (response) => {
      apiClientMock.mockResolvedValueOnce(response as never);
      await expect(ProductosRepository.getProductos()).resolves.toEqual([]);
    }
  );

  it('busca por ID dentro del catalogo real sin usar datos estaticos', async () => {
    apiClientMock.mockResolvedValueOnce([activeProduct] as never);

    await expect(ProductosRepository.getProductoById('7')).resolves.toEqual(
      expect.objectContaining({ id: '7', nombre: 'Shampoo Profesional' })
    );
  });

  it('propaga errores HTTP y de red sin inventar productos de respaldo', async () => {
    const failure = Object.assign(new Error('No fue posible cargar productos'), { status: 500 });
    apiClientMock.mockRejectedValueOnce(failure);

    await expect(ProductosRepository.getProductos()).rejects.toBe(failure);
    expect(apiClientMock).toHaveBeenCalledTimes(1);
  });
});
