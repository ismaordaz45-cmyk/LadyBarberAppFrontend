import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UbicacionModal } from '../UbicacionModal';
import { AparienciaContext, AparienciaContexto } from '../../../contexts/aparienciaContext';
import { colorApariencia, paletas } from '../../../constants/apariencia';
import type { useUbicacionViewModel } from '../../../viewmodels/useUbicacionViewModel';
jest.mock('../../../services/api', () => ({ API_URL: 'https://backend.example.invalid/api' }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, Ionicons: () => null }));
type VM = ReturnType<typeof useUbicacionViewModel>;
const inicial: VM = {
  visible: true, negocio: { id: 1, nombre: 'Salón real', logo: null, direccion: 'Calle publicada 10', ubicacion: null, telefono: null, horarioAtencion: null },
  direccion: 'Calle publicada 10', cargando: false, abriendo: false, error: null, puedeAbrir: true,
  abrir: jest.fn(), cerrar: jest.fn(), reintentar: jest.fn(), comoLlegar: jest.fn(),
};
let renderer: ReactTestRenderer;
function montar(overrides: Partial<VM> = {}, oscuro = false) {
  const value: AparienciaContexto = { modo: oscuro ? 'dark' : 'light', esOscuro: oscuro, lista: true, error: null,
    colors: paletas[oscuro ? 'dark' : 'light'], seleccionar: async () => {}, color: (v, rol) => colorApariencia(v, oscuro, rol) };
  act(() => { renderer = create(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 48, left: 0, right: 0 } }}>
    <AparienciaContext.Provider value={value}><UbicacionModal vm={{ ...inicial, ...overrides }} /></AparienciaContext.Provider>
  </SafeAreaProvider>); });
}
const textos = () => renderer.root.findAllByType(Text).map(n => n.props.children).join('|');
const boton = (label: string) => renderer.root.findAllByType(TouchableOpacity).find(n => n.props.accessibilityLabel === label)!;
beforeEach(() => jest.clearAllMocks());
afterEach(() => act(() => renderer?.unmount()));
it('muestra la dirección publicada y permite abrir indicaciones y cerrar sin navegar de pantalla', () => {
  montar();
  expect(textos()).toContain('Calle publicada 10');
  expect(textos()).toContain('Salón real');
  act(() => { boton('Cómo llegar al establecimiento').props.onPress(); });
  expect(inicial.comoLlegar).toHaveBeenCalledTimes(1);
  act(() => { boton('Cerrar ubicación').props.onPress(); renderer.root.findByType(Modal).props.onRequestClose(); });
  expect(inicial.cerrar).toHaveBeenCalledTimes(2);
});
it('bloquea indicaciones al cargar o cuando no hay ubicación y ofrece actualizar', () => {
  montar({ negocio: null, direccion: '', puedeAbrir: false, error: 'No se pudo consultar' });
  expect(boton('Cómo llegar al establecimiento').props.disabled).toBe(true);
  expect(textos()).toContain('No se pudo consultar');
  const actualizar = renderer.root.findAllByType(TouchableOpacity).find(n => n.findAllByType(Text).some(t => t.props.children === 'Actualizar ubicación'))!;
  act(() => actualizar.props.onPress());
  expect(inicial.reintentar).toHaveBeenCalledTimes(1);
});
it('respeta el tema oscuro y deja espacio para la barra inferior con botones', () => {
  montar({}, true);
  const titulo = renderer.root.findAllByType(Text).find(t => t.props.children === 'Nuestra ubicación')!;
  expect(StyleSheet.flatten(titulo.props.style).color).toBe(paletas.dark.text);
  expect(renderer.root.findAllByType(View).some(n => StyleSheet.flatten(n.props.style)?.paddingBottom === 130)).toBe(true);
  expect(renderer.root.findAllByType(View).some(n => StyleSheet.flatten(n.props.style)?.backgroundColor === paletas.dark.surface)).toBe(true);
});
it('no monta la ventana cuando está cerrada', () => {
  montar({ visible: false });
  expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
});
