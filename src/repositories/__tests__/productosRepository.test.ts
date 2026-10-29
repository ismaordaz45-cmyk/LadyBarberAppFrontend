import { ProductosRepository } from '../productosRepository';

describe('HU-04 ProductosRepository', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const obtenerProductos = async () => {
    const promise = ProductosRepository.getProductos();
    jest.advanceTimersByTime(50);
    return promise;
  };

  it('obtiene asincronamente los seis productos estaticos sin usar HTTP', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    let settled = false;
    const promise = ProductosRepository.getProductos().then((value) => {
      settled = true;
      return value;
    });

    await Promise.resolve();
    expect(settled).toBe(false);
    jest.advanceTimersByTime(50);

    const productos = await promise;
    expect(productos).toHaveLength(6);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('entrega productos con la estructura minima valida', async () => {
    const productos = await obtenerProductos();

    productos.forEach((producto) => {
      expect(producto).toEqual(expect.objectContaining({
        id: expect.any(String),
        nombre: expect.any(String),
        categoria: expect.any(String),
        categoriaEtiqueta: expect.any(String),
        subtitulo: expect.any(String),
        descripcion: expect.any(String),
        precioMXN: expect.any(Number),
        imagenUrl: expect.any(String),
      }));
      expect(producto.id.trim()).not.toBe('');
      expect(producto.nombre.trim()).not.toBe('');
      expect(Number.isFinite(producto.precioMXN)).toBe(true);
    });
  });

  it('obtiene un producto por ID sin realizar solicitudes externas', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const producto = await ProductosRepository.getProductoById('prod-3');

    expect(producto?.nombre).toBe('Mascarilla Oro Líquido Infusion');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('devuelve undefined para un ID inexistente', async () => {
    await expect(ProductosRepository.getProductoById('no-existe')).resolves.toBeUndefined();
  });

  it('protege la coleccion interna frente a mutaciones del consumidor', async () => {
    const primeraLectura = await obtenerProductos();
    primeraLectura[0].nombre = 'Producto alterado';
    primeraLectura[0].badge = { texto: 'Alterado', tipo: 'tamano' };
    primeraLectura.pop();

    const segundaLecturaPromise = ProductosRepository.getProductos();
    jest.advanceTimersByTime(50);
    const segundaLectura = await segundaLecturaPromise;

    expect(segundaLectura).toHaveLength(6);
    expect(segundaLectura[0].nombre).toBe('Aceite de Argán & Elixir Sublime');
    expect(segundaLectura[0].badge?.texto).toBe('⭐ Top Seller');
  });
});
