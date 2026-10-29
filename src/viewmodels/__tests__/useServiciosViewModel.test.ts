import React from 'react';
import { act } from 'react-test-renderer';
import { useServiciosViewModel } from '../useServiciosViewModel';
import { ServiciosRepository } from '../../repositories/serviciosRepository';
import { ServicioItem } from '../../models/Servicio';

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

const servicios: ServicioItem[] = [
  {
    id: '1', nombre: 'Corte Fade', descripcion: 'Corte moderno', precioMXN: 250,
    duracionMin: 45, categoria: 'Corte', imagenUrl: null, estaActivo: true,
  },
  {
    id: '2', nombre: 'Tinte Premium', descripcion: 'Color duradero', precioMXN: 600,
    duracionMin: 90, categoria: 'Color', imagenUrl: null, estaActivo: true,
  },
  {
    id: '3', nombre: 'Corte Clasico', descripcion: 'Estilo tradicional', precioMXN: 220,
    duracionMin: 40, categoria: 'Corte', imagenUrl: null, estaActivo: true,
  },
];

const mountedRenderers: any[] = [];

const renderHook = () => {
  const result = {} as { current: ReturnType<typeof useServiciosViewModel> };
  const Component = () => {
    result.current = useServiciosViewModel();
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

const renderLoaded = async (items: ServicioItem[] = servicios) => {
  jest.spyOn(ServiciosRepository, 'getServicios').mockResolvedValueOnce(items);
  const hook = renderHook();
  await act(async () => { await Promise.resolve(); });
  return hook;
};

describe('HU-12 useServiciosViewModel', () => {
  beforeEach(() => jest.restoreAllMocks());

  afterEach(() => {
    act(() => mountedRenderers.splice(0).forEach((renderer) => renderer.unmount()));
    jest.restoreAllMocks();
  });

  it('inicia cargando, sin errores y solicita el catalogo una sola vez', () => {
    const deferred = createDeferred<ServicioItem[]>();
    const repositorySpy = jest.spyOn(ServiciosRepository, 'getServicios')
      .mockReturnValueOnce(deferred.promise);

    const { result } = renderHook();

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.servicios).toEqual([]);
    expect(result.current.categoriaActiva).toBe('Todos');
    expect(repositorySpy).toHaveBeenCalledTimes(1);
  });

  it('carga servicios y finaliza el estado de carga', async () => {
    const { result } = await renderLoaded();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.servicios).toEqual(servicios);
    expect(result.current.totalServicios).toBe(3);
  });

  it('maneja lista vacia', async () => {
    const { result } = await renderLoaded([]);
    expect(result.current.servicios).toEqual([]);
    expect(result.current.totalServicios).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('expone el error del repository y restaura isLoading', async () => {
    jest.spyOn(ServiciosRepository, 'getServicios')
      .mockRejectedValueOnce(new Error('Sin conexion'));
    const { result } = renderHook();

    await act(async () => { await Promise.resolve(); });

    expect(result.current.error).toBe('Sin conexion');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.servicios).toEqual([]);
  });

  it('usa el mensaje alternativo para un rechazo sin mensaje', async () => {
    jest.spyOn(ServiciosRepository, 'getServicios').mockRejectedValueOnce({});
    const { result } = renderHook();
    await act(async () => { await Promise.resolve(); });
    expect(result.current.error).toBe('No se pudieron cargar los servicios');
  });

  it('deriva categorias unicas, recortadas y ordenadas', async () => {
    const items = [
      servicios[0],
      servicios[1],
      { ...servicios[2], categoria: '  Tratamiento  ' },
      { ...servicios[2], id: '4', categoria: 'Corte' },
    ];
    const { result } = await renderLoaded(items);

    expect(result.current.categoriasDisponibles).toEqual([
      'Todos', 'Color', 'Corte', 'Tratamiento',
    ]);
  });

  it.each([
    ['nombre', '  FADE ', ['1']],
    ['descripcion', 'duradero', ['2']],
    ['categoria', 'cOlOr', ['2']],
  ])('busca por %s ignorando mayusculas y espacios', async (_field, query, ids) => {
    const { result } = await renderLoaded();
    act(() => result.current.setBusqueda(query));
    expect(result.current.servicios.map((item) => item.id)).toEqual(ids);
  });

  it('combina categoria y busqueda', async () => {
    const { result } = await renderLoaded();
    act(() => {
      result.current.setCategoriaActiva('Corte');
      result.current.setBusqueda('clasico');
    });
    expect(result.current.servicios.map((item) => item.id)).toEqual(['3']);
  });

  it('devuelve lista vacia cuando no existen coincidencias', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.setBusqueda('servicio inexistente'));
    expect(result.current.servicios).toEqual([]);
    expect(result.current.totalServicios).toBe(0);
  });

  it('abre y cierra el detalle conservando el objeto exacto', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.abrirDetalle(servicios[1]));
    expect(result.current.modalDetalleVisible).toBe(true);
    expect(result.current.servicioSeleccionado).toBe(servicios[1]);

    act(() => result.current.cerrarDetalle());
    expect(result.current.modalDetalleVisible).toBe(false);
    expect(result.current.servicioSeleccionado).toBeNull();
  });

  it('no actualiza el estado si la solicitud termina despues del desmontaje', async () => {
    const deferred = createDeferred<ServicioItem[]>();
    jest.spyOn(ServiciosRepository, 'getServicios').mockReturnValueOnce(deferred.promise);
    const { renderer } = renderHook();

    act(() => renderer.unmount());
    await act(async () => {
      deferred.resolve(servicios);
      await deferred.promise;
    });

    expect(ServiciosRepository.getServicios).toHaveBeenCalledTimes(1);
  });
});
