import React from 'react';
import { act } from 'react-test-renderer';
import { ProductoItem } from '../../models/Producto';
import { ProductosRepository } from '../../repositories/productosRepository';
import { useProductosViewModel } from '../useProductosViewModel';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const productos: ProductoItem[] = [
  {
    id: 'p1', nombre: 'Aceite Premium', categoriaEtiqueta: 'TRATAMIENTO',
    categoria: 'Tratamientos', subtitulo: 'Brillo intenso', precioMXN: 420,
    imagenUrl: 'https://example.invalid/aceite.jpg', descripcion: 'Nutrición profunda',
  },
  {
    id: 'p2', nombre: 'Pomada Mate', categoriaEtiqueta: 'POMADAS & STYLING',
    categoria: 'Pomadas & Styling', subtitulo: 'Fijación flexible', precioMXN: 290,
    imagenUrl: 'https://example.invalid/pomada.jpg', descripcion: 'Acabado sin residuos',
  },
  {
    id: 'p3', nombre: 'Peine Profesional', categoriaEtiqueta: 'HERRAMIENTAS',
    categoria: 'Herramientas', subtitulo: 'Fibra de carbón', precioMXN: 180,
    imagenUrl: '', descripcion: 'Tecnología antiestática',
  },
];

const mountedRenderers: any[] = [];

const renderHook = () => {
  const result = {} as { current: ReturnType<typeof useProductosViewModel> };
  const Component = () => {
    result.current = useProductosViewModel();
    return null;
  };
  let renderer: any;
  act(() => {
    const TestRenderer = require('react-test-renderer');
    renderer = TestRenderer.create(React.createElement(Component));
  });
  mountedRenderers.push(renderer);
  return { result, renderer };
};

const renderLoaded = async (items: unknown = productos) => {
  jest.spyOn(ProductosRepository, 'getProductos').mockResolvedValueOnce(items as ProductoItem[]);
  const hook = renderHook();
  await act(async () => { await Promise.resolve(); });
  return hook;
};

describe('HU-04 useProductosViewModel', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    act(() => mountedRenderers.splice(0).forEach((renderer) => renderer.unmount()));
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('inicia cargando, sin error y solicita el catalogo una sola vez', () => {
    const deferred = createDeferred<ProductoItem[]>();
    const repositorySpy = jest.spyOn(ProductosRepository, 'getProductos')
      .mockReturnValueOnce(deferred.promise);
    const { result } = renderHook();

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.productos).toEqual([]);
    expect(result.current.categoriaActiva).toBe('Todos');
    expect(repositorySpy).toHaveBeenCalledTimes(1);
  });

  it('carga productos validos y finaliza la carga', async () => {
    const { result } = await renderLoaded();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.productos).toEqual(productos);
    expect(result.current.totalArticulos).toBe(3);
  });

  it('acepta una lista vacia como resultado valido', async () => {
    const { result } = await renderLoaded([]);
    expect(result.current.productos).toEqual([]);
    expect(result.current.totalArticulos).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('expone el error del repositorio y conserva un estado seguro', async () => {
    jest.spyOn(ProductosRepository, 'getProductos')
      .mockRejectedValueOnce(new Error('No fue posible cargar productos'));
    const { result } = renderHook();
    await act(async () => { await Promise.resolve(); });

    expect(result.current.error).toBe('No fue posible cargar productos');
    expect(result.current.productos).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('rechaza una respuesta que no sea un arreglo', async () => {
    const { result } = await renderLoaded({ productos });
    expect(result.current.error).toBe('La información de productos no es válida.');
    expect(result.current.productos).toEqual([]);
  });

  it('descarta registros null o sin identidad y normaliza campos inseguros', async () => {
    const respuesta = [
      productos[0],
      null,
      { nombre: 'Sin ID' },
      {
        ...productos[1], id: 'p4', precioMXN: Number.NaN,
        subtitulo: null, descripcion: null, imagenUrl: null,
      },
    ];
    const { result } = await renderLoaded(respuesta);

    expect(result.current.productos).toHaveLength(2);
    expect(result.current.productos[1]).toEqual(expect.objectContaining({
      id: 'p4', precioMXN: 0, subtitulo: '', descripcion: '', imagenUrl: '',
    }));
  });

  it.each([
    ['nombre', '  ACEITE  ', ['p1']],
    ['categoria', 'tratamiento', ['p1']],
    ['subtitulo', 'FLEXIBLE', ['p2']],
    ['descripcion', '  antiestática ', ['p3']],
  ])('busca por %s ignorando mayusculas y espacios externos', async (_campo, query, ids) => {
    const { result } = await renderLoaded();
    act(() => result.current.setBusqueda(query));
    expect(result.current.productos.map((producto) => producto.id)).toEqual(ids);
  });

  it('combina busqueda y categoria', async () => {
    const { result } = await renderLoaded();
    act(() => {
      result.current.setCategoriaActiva('Pomadas & Styling');
      result.current.setBusqueda('mate');
    });
    expect(result.current.productos.map((producto) => producto.id)).toEqual(['p2']);
  });

  it('filtra por una categoria existente', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.setCategoriaActiva('Herramientas'));
    expect(result.current.productos.map((producto) => producto.id)).toEqual(['p3']);
  });

  it('produce una lista vacia para una categoria sin coincidencias', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.setCategoriaActiva('Cuidado Diario'));
    expect(result.current.productos).toEqual([]);
  });

  it('alterna orden original, precio ascendente, descendente y original', async () => {
    const { result } = await renderLoaded();
    expect(result.current.productos.map((producto) => producto.id)).toEqual(['p1', 'p2', 'p3']);

    act(() => result.current.toggleOrden());
    expect(result.current.productos.map((producto) => producto.id)).toEqual(['p3', 'p2', 'p1']);
    act(() => result.current.toggleOrden());
    expect(result.current.productos.map((producto) => producto.id)).toEqual(['p1', 'p2', 'p3']);
    act(() => result.current.toggleOrden());
    expect(result.current.productos.map((producto) => producto.id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('ordena de forma segura precios cero o invalidos ya normalizados', async () => {
    const { result } = await renderLoaded([
      productos[0],
      { ...productos[1], precioMXN: Number.NaN },
      { ...productos[2], precioMXN: 0 },
    ]);
    act(() => result.current.toggleOrden());
    expect(result.current.productos.map((producto) => producto.precioMXN)).toEqual([0, 0, 420]);
  });

  it('incrementa el contador local ante adiciones repetidas', async () => {
    jest.useFakeTimers();
    const { result } = await renderLoaded();
    act(() => {
      result.current.agregarAlCarrito(productos[0]);
      result.current.agregarAlCarrito(productos[0]);
      result.current.agregarAlCarrito(productos[1]);
    });
    expect(result.current.totalItemsCarrito).toBe(3);
  });

  it('mantiene el mensaje de la adicion mas reciente y lo limpia a los dos segundos', async () => {
    jest.useFakeTimers();
    const { result } = await renderLoaded();

    act(() => result.current.agregarAlCarrito(productos[0]));
    expect(result.current.mensajeFeedback).toContain('Aceite Premium');
    act(() => jest.advanceTimersByTime(1000));
    act(() => result.current.agregarAlCarrito(productos[1]));
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.mensajeFeedback).toContain('Pomada Mate');
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.mensajeFeedback).toBeNull();
  });

  it('limpia el temporizador de feedback al desmontarse', async () => {
    jest.useFakeTimers();
    const { result, renderer } = await renderLoaded();
    const timersAntesDeAgregar = jest.getTimerCount();
    act(() => result.current.agregarAlCarrito(productos[0]));
    expect(jest.getTimerCount()).toBe(timersAntesDeAgregar + 1);
    act(() => renderer.unmount());
    expect(jest.getTimerCount()).toBe(timersAntesDeAgregar);
  });

  it('no actualiza estado si la carga termina despues del desmontaje', async () => {
    const deferred = createDeferred<ProductoItem[]>();
    jest.spyOn(ProductosRepository, 'getProductos').mockReturnValueOnce(deferred.promise);
    const { renderer } = renderHook();
    act(() => renderer.unmount());

    await act(async () => {
      deferred.resolve(productos);
      await deferred.promise;
    });
    expect(ProductosRepository.getProductos).toHaveBeenCalledTimes(1);
  });
});
