import React, { useEffect } from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Appearance, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AparienciaProvider } from '../../../providers/AparienciaProvider';
import { PreferenciaApariencia } from '../PreferenciaApariencia';
import { EncabezadoModulo } from '../../compartidos/EncabezadoModulo';
import { SalidaApartadoModal } from '../../citas/SalidaApartadoModal';
import { useAparienciaViewModel } from '../../../viewmodels/useAparienciaViewModel';
import { AparienciaRepository } from '../../../repositories/aparienciaRepository';
import { paletas } from '../../../constants/apariencia';

let mockSistema = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({ __esModule: true, default: () => mockSistema }));
jest.mock('../../../repositories/aparienciaRepository', () => ({ AparienciaRepository: { leer: jest.fn(), guardar: jest.fn() } }));
jest.mock('expo-system-ui', () => ({ setBackgroundColorAsync: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../../viewmodels/useNegocioViewModel', () => ({ useNegocioViewModel: () => ({ negocio: { nombre: 'Salón de prueba', logo: null } }) }));
let renderer: ReactTestRenderer;
let tema: ReturnType<typeof useAparienciaViewModel>;
function Probe() {
  const actual = useAparienciaViewModel();
  useEffect(() => { tema = actual; }, [actual]);
  return <><PreferenciaApariencia /><EncabezadoModulo titulo="Tus próximas citas" />
    <SalidaApartadoModal visible cancelando={false} error={null} onConservar={() => {}} onCancelar={() => {}} onContinuar={() => {}} /></>;
}
function Pantalla() { return <AparienciaProvider><Probe /></AparienciaProvider>; }
const texto = (value: string) => renderer.root.findAllByType(Text).find(node => node.props.children === value)!;
const radio = (value: string) => renderer.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === value)!;

beforeEach(() => {
  jest.clearAllMocks(); mockSistema = 'light';
  jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
  (AparienciaRepository.leer as jest.Mock).mockResolvedValue('light');
  (AparienciaRepository.guardar as jest.Mock).mockResolvedValue(undefined);
});
afterEach(() => { act(() => renderer?.unmount()); jest.restoreAllMocks(); });

it('cambia desde Perfil y actualiza encabezados, textos y modales sin navegar ni cerrar la app', async () => {
  await act(async () => { renderer = create(<Pantalla />); });
  expect(StyleSheet.flatten(texto('Tus próximas citas').props.style).color).toBe('#1E3A5A');
  await act(async () => { radio('Tema oscuro').props.onPress(); });
  expect(tema.esOscuro).toBe(true);
  expect(StyleSheet.flatten(texto('Tus próximas citas').props.style).color).toBe(paletas.dark.text);
  expect(StyleSheet.flatten(texto('¿Qué deseas hacer con tu apartado?').props.style).color).toBe(paletas.dark.text);
  expect(StyleSheet.flatten(texto('Conservar y ver mis citas').props.style).color).toBe('#FFF');
  expect(radio('Tema oscuro').props.accessibilityState.checked).toBe(true);
  expect(AparienciaRepository.guardar).toHaveBeenCalledWith('dark');
  expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('dark');
  await act(async () => { radio('Tema claro').props.onPress(); });
  expect(tema.esOscuro).toBe(false);
  expect(StyleSheet.flatten(texto('Tus próximas citas').props.style).color).toBe('#1E3A5A');
});
it('sigue los cambios del dispositivo solo cuando se elige la opción correspondiente', async () => {
  await act(async () => { renderer = create(<Pantalla />); });
  mockSistema = 'dark';
  act(() => renderer.update(<Pantalla />));
  expect(tema.esOscuro).toBe(false);
  await act(async () => { radio('Tema del dispositivo').props.onPress(); });
  expect(tema.esOscuro).toBe(true);
  expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('unspecified');
  mockSistema = 'light';
  act(() => renderer.update(<Pantalla />));
  expect(tema.esOscuro).toBe(false);
});
