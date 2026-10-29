import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { ProductoItem } from '../../models/Producto';
import ProductosScreen from '../productos';

const mockBack = jest.fn();
const mockUseProductosViewModel = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('../../viewmodels/useProductosViewModel', () => ({
  useProductosViewModel: () => mockUseProductosViewModel(),
}));

jest.mock('../../components/productos/ProductoCard', () => {
  const ReactModule = require('react');
  const { Text: NativeText, TouchableOpacity: NativeButton } = require('react-native');
  return {
    ProductoCard: ({ item, onAgregar }: any) => ReactModule.createElement(
      NativeButton,
      { testID: `producto-${item.id}`, onPress: () => onAgregar(item) },
      ReactModule.createElement(NativeText, null, item.nombre)
    ),
  };
});

jest.mock('../../components/productos/PromoBanner', () => {
  const ReactModule = require('react');
  const { Text: NativeText } = require('react-native');
  return { PromoBanner: () => ReactModule.createElement(NativeText, null, 'Banner estático') };
});

jest.mock('@expo/vector-icons', () => {
  const ReactModule = require('react');
  const { Text: NativeText } = require('react-native');
  const Icon = (props: any) => ReactModule.createElement(NativeText, props, props.name);
  return { Feather: Icon, MaterialCommunityIcons: Icon };
});

const producto: ProductoItem = {
  id: 'p1', nombre: 'Aceite Premium', categoriaEtiqueta: 'TRATAMIENTO',
  categoria: 'Tratamientos', subtitulo: 'Brillo', precioMXN: 420,
  imagenUrl: '', descripcion: 'Nutrición',
};

const baseState = {
  isLoading: false,
  error: null,
  categoriaActiva: 'Todos',
  setCategoriaActiva: jest.fn(),
  busqueda: '',
  setBusqueda: jest.fn(),
  categoriasDisponibles: ['Todos', 'Tratamientos', 'Herramientas'],
  productos: [producto],
  totalArticulos: 1,
  toggleOrden: jest.fn(),
  ordenAscendente: null,
  agregarAlCarrito: jest.fn(),
  totalItemsCarrito: 0,
  mensajeFeedback: null,
};

const renderScreen = (overrides: Record<string, unknown> = {}) => {
  const state = { ...baseState, ...overrides };
  mockUseProductosViewModel.mockReturnValue(state);
  let renderer: any;
  act(() => { renderer = create(<ProductosScreen />); });
  return { renderer, state };
};

const allText = (renderer: any): string => renderer.root.findAllByType(Text)
  .map((node: any) => {
    const children = Array.isArray(node.props.children) ? node.props.children : [node.props.children];
    return children.filter((child: unknown) => ['string', 'number'].includes(typeof child)).join('');
  })
  .join('|');

const findButton = (renderer: any, label: string) => renderer.root
  .findAllByType(TouchableOpacity)
  .find((node: any) => node.findAllByType(Text)
    .some((text: any) => text.props.children === label));

describe('HU-04 ProductosScreen', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockUseProductosViewModel.mockReset();
    baseState.setCategoriaActiva.mockClear();
    baseState.setBusqueda.mockClear();
    baseState.toggleOrden.mockClear();
    baseState.agregarAlCarrito.mockClear();
  });

  it('presenta el encabezado y el catalogo disponible', () => {
    const { renderer } = renderScreen();
    const text = allText(renderer);
    expect(text).toContain('Catálogo de Productos');
    expect(text).toContain('1 ARTÍCULOS SELECTOS');
    expect(text).toContain('Aceite Premium');
    act(() => renderer.unmount());
  });

  it('presenta un estado de carga sin tarjetas de producto', () => {
    const { renderer } = renderScreen({ isLoading: true, productos: [] });
    expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(1);
    expect(allText(renderer)).toContain('Cargando productos...');
    expect(renderer.root.findAllByProps({ testID: 'producto-p1' })).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it('presenta el error entregado por el ViewModel', () => {
    const { renderer } = renderScreen({
      error: 'No fue posible cargar productos', productos: [], totalArticulos: 0,
    });
    expect(allText(renderer)).toContain('No fue posible cargar productos');
    act(() => renderer.unmount());
  });

  it('conecta las categorias con el ViewModel', () => {
    const setCategoriaActiva = jest.fn();
    const { renderer } = renderScreen({ setCategoriaActiva });
    act(() => findButton(renderer, 'Tratamientos').props.onPress());
    expect(setCategoriaActiva).toHaveBeenCalledWith('Tratamientos');
    act(() => renderer.unmount());
  });

  it('conecta la busqueda con el ViewModel', () => {
    const setBusqueda = jest.fn();
    const { renderer } = renderScreen({ setBusqueda });
    act(() => renderer.root.findByType(TextInput).props.onChangeText('aceite'));
    expect(setBusqueda).toHaveBeenCalledWith('aceite');
    act(() => renderer.unmount());
  });

  it('conecta el control de ordenamiento con el ViewModel', () => {
    const toggleOrden = jest.fn();
    const { renderer } = renderScreen({ toggleOrden });
    act(() => findButton(renderer, 'Ordenar').props.onPress());
    expect(toggleOrden).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });

  it('presenta el estado sin resultados', () => {
    const { renderer } = renderScreen({ productos: [], totalArticulos: 0 });
    expect(allText(renderer)).toContain('No hay productos que coincidan');
    act(() => renderer.unmount());
  });

  it('permite regresar a la pantalla anterior', () => {
    const { renderer } = renderScreen();
    act(() => findButton(renderer, 'arrow-left').props.onPress());
    expect(mockBack).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });

  it('conecta la accion agregar sin afirmar que existe un carrito real', () => {
    const agregarAlCarrito = jest.fn();
    const { renderer } = renderScreen({ agregarAlCarrito });
    act(() => renderer.root.findByProps({ testID: 'producto-p1' }).props.onPress());
    expect(agregarAlCarrito).toHaveBeenCalledWith(producto);
    act(() => renderer.unmount());
  });

  it('muestra el contador local y el mensaje temporal', () => {
    const { renderer } = renderScreen({
      totalItemsCarrito: 2,
      mensajeFeedback: 'Producto agregado localmente',
    });
    const text = allText(renderer);
    expect(text).toContain('2');
    expect(text).toContain('Producto agregado localmente');
    act(() => renderer.unmount());
  });

  it('renderiza de forma segura la salida ya saneada del ViewModel', () => {
    const { renderer } = renderScreen({ productos: [], totalArticulos: 0 });
    expect(() => renderer.toJSON()).not.toThrow();
    act(() => renderer.unmount());
  });
});
