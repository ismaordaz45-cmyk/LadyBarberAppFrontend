import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import TabLayout from '../(tabs)/_layout';

let mockBottom = 0;
let mockOpciones: any;
let mockPantallas: any[] = [];
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: mockBottom, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => {
  const Tabs = ({ screenOptions, children }: any) => { mockOpciones = screenOptions; mockPantallas = jest.requireActual('react').Children.toArray(children); return null; };
  Tabs.Screen = function TabScreen() { return null; };
  return { Tabs };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
it('expone Carrito con acceso directo aunque ya estuviera abierto el catálogo', () => {
  let renderer!: ReactTestRenderer;
  act(() => { renderer = create(<TabLayout />); });
  try {
    const visibles = mockPantallas.filter(screen => screen.props.options?.href !== null);
    expect(visibles.map(screen => screen.props.options.title)).toEqual(['Inicio', 'Citas', 'Carrito', 'Historial', 'Perfil']);
    const carrito = visibles.find(screen => screen.props.name === 'tienda').props;
    expect(carrito.initialParams).toEqual({ seccion: 'carrito' });
    const navigation = { setParams: jest.fn() };
    carrito.listeners({ navigation }).tabPress();
    expect(navigation.setParams).toHaveBeenCalledWith({ seccion: 'carrito', visita: expect.any(String) });
    expect(carrito.options.tabBarIcon({ color: '#000', focused: false }).props.name).toBe('cart-outline');
  } finally { act(() => renderer.unmount()); }
});

it('mantiene espacio para las pestañas al alternar entre gestos, botones y un nuevo tamaño del área segura', () => {
  let renderer!: ReactTestRenderer;
  mockBottom = 0;
  act(() => { renderer = create(<TabLayout />); });
  const inicial = mockOpciones.tabBarStyle;
  const espacioControles = inicial.height - inicial.paddingBottom;
  try {
    for (const areaSistema of [24, 48, 16, 0]) {
      mockBottom = areaSistema;
      act(() => { renderer.update(<TabLayout />); });
      const barra = mockOpciones.tabBarStyle;
      expect(barra.paddingBottom).toBeGreaterThanOrEqual(areaSistema + 12);
      expect(barra.height - barra.paddingBottom).toBe(espacioControles);
      expect(barra.height - inicial.height).toBe(areaSistema);
      expect(mockOpciones.tabBarActiveTintColor).toBe('#1E3A5F');
    }
  } finally { act(() => renderer.unmount()); }
});
