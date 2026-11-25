import React from 'react';
import { FlatList, Text, TextInput, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { ServiciosSection } from '../ServiciosSection';
import { ServicioItem } from '../../../models/Servicio';

const mockUseServiciosViewModel = jest.fn();

jest.mock('../../../viewmodels/useServiciosViewModel', () => ({
  useServiciosViewModel: () => mockUseServiciosViewModel(),
}));

jest.mock('../ServicioCard', () => {
  const ReactModule = jest.requireActual('react');
  const { View: NativeView, Text: NativeText, TouchableOpacity: NativeButton } = jest.requireActual('react-native');
  return {
    ServicioCard: ({ item, onDetalle, onAgendar }: any) => ReactModule.createElement(
      NativeView,
      null,
      ReactModule.createElement(NativeText, null, `card:${item.id}`),
      ReactModule.createElement(NativeButton, {
        testID: `detail:${item.id}`,
        onPress: () => onDetalle(item),
      }),
      ReactModule.createElement(NativeButton, {
        testID: `schedule:${item.id}`,
        onPress: () => onAgendar(item),
      })
    ),
  };
});

jest.mock('../ServicioDetalleModal', () => {
  const ReactModule = jest.requireActual('react');
  const { View: NativeView, Text: NativeText, TouchableOpacity: NativeButton } = jest.requireActual('react-native');
  return {
    ServicioDetalleModal: ({ visible, servicio, onClose, onAgendar }: any) => ReactModule.createElement(
      NativeView,
      null,
      ReactModule.createElement(NativeText, null, `modal:${visible}:${servicio?.id ?? 'none'}`),
      ReactModule.createElement(NativeButton, { testID: 'modal-close', onPress: onClose }),
      servicio
        ? ReactModule.createElement(NativeButton, {
          testID: 'modal-schedule',
          onPress: () => onAgendar(servicio),
        })
        : null
    ),
  };
});

jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual('react');
  const { Text: NativeText } = jest.requireActual('react-native');
  const Icon = (props: any) => ReactModule.createElement(NativeText, props, props.name);
  return { Feather: Icon, MaterialCommunityIcons: Icon };
});

const servicio: ServicioItem = {
  id: '30', nombre: 'Manicure', descripcion: 'Cuidado integral', precioMXN: 300,
  duracionMin: 50, categoria: 'Uñas', imagenUrl: null, estaActivo: true,
};

const baseViewModel = {
  isLoading: false,
  error: null,
  categoriaActiva: 'Todos',
  setCategoriaActiva: jest.fn(),
  busqueda: '',
  setBusqueda: jest.fn(),
  categoriasDisponibles: ['Todos', 'Uñas'],
  servicios: [servicio],
  totalServicios: 1,
  pagina: 1, totalPaginas: 1, cambiarPagina: jest.fn(), reintentar: jest.fn(),
  servicioSeleccionado: null,
  modalDetalleVisible: false,
  abrirDetalle: jest.fn(),
  cerrarDetalle: jest.fn(),
};

const renderSection = (overrides: Record<string, unknown> = {}, onAgendar = jest.fn()) => {
  mockUseServiciosViewModel.mockReturnValue({ ...baseViewModel, ...overrides });
  let renderer: any;
  act(() => { renderer = create(<ServiciosSection onAgendarServicio={onAgendar} />); });
  return { renderer, onAgendar };
};

const textContent = (renderer: any) => renderer.root.findAllByType(Text)
  .map((node: any) => String(node.props.children).replace(/,/g, ''))
  .join('|');

describe('HU-12 ServiciosSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [{ isLoading: true, servicios: [] }, 'Cargando servicios...'],
    [{ error: 'Servidor no disponible', servicios: [] }, 'Servidor no disponible'],
    [{ servicios: [] }, 'No se encontraron servicios'],
  ])('presenta el estado correspondiente', (overrides, expectedText) => {
    const { renderer } = renderSection(overrides);
    expect(textContent(renderer)).toContain(expectedText);
    act(() => renderer.unmount());
  });

  it('renderiza servicios y conecta busqueda y categorias con el ViewModel', () => {
    const setBusqueda = jest.fn();
    const setCategoriaActiva = jest.fn();
    const { renderer } = renderSection({ setBusqueda, setCategoriaActiva });

    expect(textContent(renderer)).toContain('card:30');
    const input = renderer.root.findByType(TextInput);
    act(() => input.props.onChangeText('mani'));
    expect(setBusqueda).toHaveBeenCalledWith('mani');

    const category = renderer.root.findAllByType(TouchableOpacity)
      .find((node: any) => node.findAllByType(Text)
        .some((text: any) => text.props.children === 'Uñas'));
    act(() => category.props.onPress());
    expect(setCategoriaActiva).toHaveBeenCalledWith('Uñas');
    act(() => renderer.unmount());
  });

  it('abre el detalle y entrega el objeto exacto al agendar', () => {
    const abrirDetalle = jest.fn();
    const onAgendar = jest.fn();
    const { renderer } = renderSection({ abrirDetalle }, onAgendar);

    act(() => renderer.root.findByProps({ testID: 'detail:30' }).props.onPress());
    act(() => renderer.root.findByProps({ testID: 'schedule:30' }).props.onPress());

    expect(abrirDetalle).toHaveBeenCalledWith(servicio);
    expect(onAgendar).toHaveBeenCalledWith(servicio);
    act(() => renderer.unmount());
  });
  it('mantiene los controles fijos en una sola lista virtualizada y permite cambiar de página', () => {
    const cambiarPagina = jest.fn();
    const { renderer } = renderSection({ pagina: 1, totalPaginas: 2, totalServicios: 7, cambiarPagina });
    const lista = renderer.root.findByType(FlatList);
    expect(lista.props.stickyHeaderIndices).toEqual([1]);
    expect(lista.props.data).toHaveLength(2); // Controles y un servicio de la página simulada.
    expect(textContent(renderer)).not.toContain('Bespoke');
    const siguiente = renderer.root.findAllByType(TouchableOpacity).find((n: any) => n.findAllByType(Text).some((t: any) => t.props.children === 'Siguiente'));
    act(() => siguiente.props.onPress());
    expect(cambiarPagina).toHaveBeenCalledWith(2);
    act(() => renderer.unmount());
  });
});
