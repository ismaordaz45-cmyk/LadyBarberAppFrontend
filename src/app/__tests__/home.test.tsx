import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import HomeScreen from '../(tabs)/index';

const mockPush = jest.fn();
const mockUseHomeViewModel = jest.fn();
const mockScrollTo = jest.fn();

jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => {
  const ReactModule = require('react');
  const MockScrollView = ReactModule.forwardRef((props: any, ref: any) => {
    ReactModule.useImperativeHandle(ref, () => ({ scrollTo: mockScrollTo }));
    return ReactModule.createElement('ScrollView', props, props.children);
  });
  return { __esModule: true, default: MockScrollView };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../viewmodels/useHomeViewModel', () => ({
  useHomeViewModel: () => mockUseHomeViewModel(),
}));

jest.mock('../../components/servicios/ServiciosSection', () => {
  const ReactModule = require('react');
  const { Text: NativeText } = require('react-native');
  return {
    ServiciosSection: () => ReactModule.createElement(NativeText, null, 'Sección Servicios simulada'),
  };
});

jest.mock('@expo/vector-icons', () => {
  const ReactModule = require('react');
  const { Text: NativeText } = require('react-native');
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
    expect(allText(renderer)).not.toContain('¡Hola, Diana! ✨');
    act(() => renderer.unmount());
  });

  it('muestra la bienvenida personalizada sin exponer tokens', () => {
    const { renderer } = renderHome({ userNombre: 'Diana' });
    const text = allText(renderer);
    expect(text).toContain('¡Hola, Diana! ✨');
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

  it('oculta estadisticas cuando el total es cero', () => {
    const { renderer } = renderHome();
    expect(allText(renderer)).not.toContain('Total citas');
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
    expect(text).toContain('Mar 10 Nov • 6:30 PM');
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

  it('presenta el estado sin proxima cita y permite agendar', () => {
    const { renderer } = renderHome();
    expect(allText(renderer)).toContain('No tienes citas próximas');
    act(() => findButton(renderer, 'Agendar ahora').props.onPress());
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/citas');
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
    expect(mockPush).toHaveBeenNthCalledWith(1, '/(tabs)/citas');
    expect(mockPush).toHaveBeenNthCalledWith(2, '/productos');
    act(() => renderer.unmount());
  });

  it('desplaza el Home hacia la seccion Servicios', () => {
    const { renderer } = renderHome();
    const layoutTarget = renderer.root.findAll((node: any) => typeof node.props.onLayout === 'function')[0];
    act(() => layoutTarget.props.onLayout({ nativeEvent: { layout: { y: 240 } } }));
    act(() => findButton(renderer, 'Servicios').props.onPress());
    expect(mockScrollTo).toHaveBeenCalledWith({ y: 220, animated: true });
    act(() => renderer.unmount());
  });
});
