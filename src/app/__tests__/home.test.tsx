import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import HomeScreen from '../(tabs)/index';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NegocioRepository } from '../../repositories/negocioRepository';
import { abrirIndicaciones } from '../../services/ubicacionService';
jest.mock('../../repositories/negocioRepository', () => ({ NegocioRepository: { obtener: jest.fn() } }));
jest.mock('../../services/ubicacionService', () => ({ abrirIndicaciones: jest.fn() }));

const mockPush = jest.fn();
const mockUseHomeViewModel = jest.fn();
const mockScrollTo = jest.fn();
jest.mock('../../components/compartidos/EncabezadoModulo', () => ({ EncabezadoModulo: () => null }));
jest.mock('../../viewmodels/useNegocioViewModel', () => ({ useNegocioViewModel: () => ({ negocio: null }) }));

jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => {
  const ReactModule = jest.requireActual('react');
  const MockScrollView = ReactModule.forwardRef((props: any, ref: any) => {
    ReactModule.useImperativeHandle(ref, () => ({ scrollTo: mockScrollTo }));
    return ReactModule.createElement('ScrollView', props, props.children);
  });
  return { __esModule: true, default: MockScrollView };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: mockPush }),
  useFocusEffect: (callback: () => (() => void) | undefined) => { jest.requireActual('react').useEffect(callback, [callback]); },
}));

jest.mock('../../viewmodels/useHomeViewModel', () => ({
  useHomeViewModel: () => mockUseHomeViewModel(),
}));

jest.mock('../../components/servicios/ServiciosSection', () => {
  const ReactModule = jest.requireActual('react');
  const { Text: NativeText } = jest.requireActual('react-native');
  return {
    ServiciosSection: ReactModule.forwardRef(({ cabecera }: any, ref: any) => {
      ReactModule.useImperativeHandle(ref, () => ({ mostrarServicios: mockScrollTo }));
      return ReactModule.createElement(ReactModule.Fragment, null, cabecera,
        ReactModule.createElement(NativeText, null, 'Sección Servicios simulada'));
    }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual('react');
  const { Text: NativeText } = jest.requireActual('react-native');
  const Icon = (props: any) => ReactModule.createElement(NativeText, props, props.name);
  return { Feather: Icon, Ionicons: Icon, MaterialCommunityIcons: Icon };
});

const baseState = {
  isLoading: false,
  error: null,
  userNombre: 'Diana',
  proximaCita: null,
  stats: { total: 0, pendientes: 0, completadas: 0 },
  resumen: null,
};

const renderHome = (overrides: Record<string, unknown> = {}) => {
  mockUseHomeViewModel.mockReturnValue({ ...baseState, ...overrides });
  let renderer: any;
  act(() => {
    renderer = create(<HomeScreen />);
  });
  return { renderer };
};

const allText = (renderer: any): string => renderer.root.findAllByType(Text)
  .map((node: any) => {
    const children = Array.isArray(node.props.children) ? node.props.children : [node.props.children];
    return children.filter((child: unknown) => typeof child === 'string' || typeof child === 'number').join('');
  })
  .join('|');

const findButton = (renderer: any, label: string) => renderer.root
  .findAllByType(TouchableOpacity)
  .find((node: any) => node.findAllByType(Text)
    .some((text: any) => text.props.children === label));

describe('HU-11 HomeScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseHomeViewModel.mockReset();
    mockScrollTo.mockClear();
  });

  it('presenta el estado de carga sin contenido personalizado', () => {
    const { renderer } = renderHome({ isLoading: true });
    expect(allText(renderer)).toContain('Cargando tu panel...');
    expect(allText(renderer)).not.toContain('¡Hola, Diana!');
    act(() => renderer.unmount());
  });
  it('abre Ubicación sobre Inicio y dirige a Maps con los datos publicados sin cambiar de pestaña', async () => {
    (NegocioRepository.obtener as jest.Mock).mockResolvedValue({ id: 1, nombre: 'Salón real', logo: null,
      direccion: 'Dirección publicada', ubicacion: '21.14,-98.42' });
    (abrirIndicaciones as jest.Mock).mockResolvedValue(undefined);
    mockUseHomeViewModel.mockReturnValue({ ...baseState });
    let renderer: any;
    await act(async () => { renderer = create(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><HomeScreen /></SafeAreaProvider>); });
    await act(async () => { findButton(renderer, 'Ubicación').props.onPress(); });
    expect(allText(renderer)).toContain('Dirección publicada');
    expect(mockPush).not.toHaveBeenCalled();
    await act(async () => { findButton(renderer, 'Cómo llegar').props.onPress(); });
    expect(new URL((abrirIndicaciones as jest.Mock).mock.calls[0][0]).searchParams.get('destination')).toBe('21.14,-98.42');
    expect(mockPush).not.toHaveBeenCalled();
    const cerrar = renderer.root.findAllByType(TouchableOpacity).find((n: any) => n.props.accessibilityLabel === 'Cerrar ubicación');
    act(() => cerrar.props.onPress());
    expect(allText(renderer)).not.toContain('Nuestra ubicación');
    act(() => renderer.unmount());
  });

  it('muestra la bienvenida personalizada sin exponer tokens', () => {
    const { renderer } = renderHome({ userNombre: 'Diana' });
    const text = allText(renderer);
    expect(text).toContain('¡Hola, Diana!');
    expect(text).not.toContain('✨');
    expect(JSON.stringify(renderer.toJSON())).not.toMatch(/jwt|bearer|token/i);
    act(() => renderer.unmount());
  });

  it('muestra estadisticas cuando existe actividad', () => {
    const { renderer } = renderHome({
      stats: { total: 8, pendientes: 3, completadas: 5 },
    });
    const text = allText(renderer);
    expect(text).toContain('8');
    expect(text).toContain('Total citas');
    expect(text).toContain('3');
    expect(text).toContain('Pendientes');
    expect(text).toContain('5');
    expect(text).toContain('Completadas');
    act(() => renderer.unmount());
  });

  it('presenta cero citas cuando el cliente aún no tiene reservas', () => {
    const { renderer } = renderHome();
    expect(allText(renderer)).toContain('Total citas');
    act(() => renderer.unmount());
  });

  it('presenta una proxima cita y formatea fecha, estado y precio', () => {
    const { renderer } = renderHome({
      proximaCita: {
        id: 'cita-2',
        fecha: '2026-11-10T00:00:00',
        horaInicio: '2026-11-10T18:30:00',
        horaFin: '2026-11-10T19:30:00',
        estado: 'CONFIRMADA',
        precioFinal: 450,
        serviciosLabel: 'Corte editorial',
      },
    });
    const text = allText(renderer);
    expect(text).toContain('Corte editorial');
    expect(text).toContain('10 de noviembre de 2026');
    expect(text).toContain('18:30');
    expect(text).toContain('Confirmada');
    expect(text).toContain('$450.00');
    act(() => renderer.unmount());
  });

  it('usa una salida segura para una fecha invalida', () => {
    const { renderer } = renderHome({
      proximaCita: {
        id: 'cita-3', fecha: 'fecha-invalida', horaInicio: 'hora-invalida',
        horaFin: '', estado: 'APARTADA', precioFinal: 0,
      },
    });
    const text = allText(renderer);
    expect(text).toContain('fecha-invalida');
    expect(text).not.toContain('undefined NaN');
    act(() => renderer.unmount());
  });

  it('presenta el estado sin próxima cita y reserva el acceso a agendar para la acción rápida', () => {
    const { renderer } = renderHome();
    expect(allText(renderer)).toContain('No tienes citas próximas');
    expect(findButton(renderer, 'Agendar ahora')).toBeUndefined();
    act(() => findButton(renderer, 'Agendar').props.onPress());
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/citas', params: { vista: 'agendar' } });
    act(() => renderer.unmount());
  });

  it('renderiza el mensaje de error del ViewModel', () => {
    const { renderer } = renderHome({ error: 'No se pudo cargar tu información.' });
    expect(allText(renderer)).toContain('No se pudo cargar tu información.');
    act(() => renderer.unmount());
  });

  it('navega desde los accesos rapidos a Citas y Productos', () => {
    const { renderer } = renderHome();
    act(() => findButton(renderer, 'Agendar').props.onPress());
    act(() => findButton(renderer, 'Productos').props.onPress());
    expect(mockPush).toHaveBeenNthCalledWith(1, { pathname: '/(tabs)/citas', params: { vista: 'agendar' } });
    expect(mockPush).toHaveBeenNthCalledWith(2, { pathname: '/(tabs)/tienda', params: { seccion: 'catalogo', visita: expect.any(String) } });
    act(() => renderer.unmount());
  });

  it('desplaza el Home hacia la seccion Servicios', () => {
    const { renderer } = renderHome();
    act(() => findButton(renderer, 'Servicios').props.onPress());
    expect(mockScrollTo).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });
});
