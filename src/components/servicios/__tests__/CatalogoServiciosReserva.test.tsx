import React from 'react';
import { Dimensions, FlatList, Text, TextInput, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { act, create } from 'react-test-renderer';
import { CatalogoServiciosReserva } from '../CatalogoServiciosReserva';
import { useCatalogoReservaViewModel } from '../../../viewmodels/useCatalogoReservaViewModel';
import { ServicioItem } from '../../../models/Servicio';
import { ServicioSeleccionCard } from '../ServicioSeleccionCard';

jest.mock('../../../services/api', () => ({ API_URL: 'https://api.example.invalid/api' }));
jest.mock('expo-image', () => ({ Image: (props: any) => {
  const ReactModule = jest.requireActual('react');
  return ReactModule.createElement(jest.requireActual('react-native').Image, props);
} }));
jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual('react');
  const Icon = (props: any) => ReactModule.createElement(jest.requireActual('react-native').Text, props, props.name);
  return { Feather: Icon, Ionicons: Icon, MaterialCommunityIcons: Icon };
});

const datos: ServicioItem[] = Array.from({ length: 200 }, (_, i) => ({
  id: String(i), nombre: `Servicio ${i}`, descripcion: `Descripción completa ${i}`, precioMXN: 120, duracionMin: 45,
  categoria: i % 2 ? 'Categoría API B' : 'Categoría API A', imagenUrl: '/uploads/corte.jpg', estaActivo: true,
}));
const onSeleccionar = jest.fn(); const onContinuar = jest.fn(); const onReintentar = jest.fn();
let renderer: any;
const initialWindow = Dimensions.get('window');
const initialScreen = Dimensions.get('screen');
const cambiarPantalla = (width: number, fontScale = 1) => {
  const dimensions = { width, height: 844, scale: 3, fontScale };
  Dimensions.set({ window: dimensions, screen: dimensions });
};
function Pantalla({ servicios = datos, seleccion = ['0'], isLoading = false, error = null }: {
  servicios?: ServicioItem[]; seleccion?: string[]; isLoading?: boolean; error?: string | null;
}) {
  const catalogo = useCatalogoReservaViewModel(servicios, seleccion);
  return <CatalogoServiciosReserva catalogo={catalogo} isLoading={isLoading} error={error} onReintentar={onReintentar}
    onSeleccionar={onSeleccionar} onContinuar={onContinuar} total={{ precio: 120, duracion: 45 }} />;
}
const texto = (node: any) => Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children;
function boton(label: string) {
  let node = renderer.root.findAllByType(Text).find((n: any) => texto(n) === label);
  while (node && typeof node.props.onPress !== 'function') node = node.parent;
  if (!node) throw new Error(`Botón ausente: ${label}`);
  return node;
}
describe('Catálogo visual del paso de servicios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cambiarPantalla(390);
  });
  afterEach(() => { act(() => renderer?.unmount()); renderer = null; Dimensions.set({ window: initialWindow, screen: initialScreen }); jest.restoreAllMocks(); });
  it('virtualiza una cuadrícula, combina búsqueda/categoría y amplía seis resultados por acción', async () => {
    await act(async () => { renderer = create(<Pantalla />); });
    const lista = () => renderer.root.findByType(FlatList);
    expect(lista().props.numColumns).toBe(2);
    expect(lista().props.initialNumToRender).toBe(6);
    expect(lista().props.data).toHaveLength(6);
    await act(async () => { boton('Ver más servicios').props.onPress(); });
    expect(lista().props.data).toHaveLength(12);
    await act(async () => { boton('Categoría API B').props.onPress(); });
    expect(lista().props.data).toHaveLength(6);
    await act(async () => { renderer.root.findByType(TextInput).props.onChangeText('Servicio 199'); });
    expect(lista().props.data.map((s: ServicioItem) => s.id)).toEqual(['199']);
    // La selección inicial sigue en el resumen aunque no coincida con el filtro.
    expect(renderer.root.findAllByType(Text).some((n: any) => texto(n) === 'Servicio 0 ×')).toBe(true);
    await act(async () => { boton('Continuar').props.onPress(); });
    expect(onContinuar).toHaveBeenCalledTimes(1);
  });
  it('ofrece detalle completo y selecciona mediante el callback existente', async () => {
    await act(async () => { renderer = create(<Pantalla seleccion={[]} />); });
    const imagen = renderer.root.findAllByType(ExpoImage)[0];
    expect(imagen.props.source.uri).toBe('https://api.example.invalid/uploads/corte.jpg');
    await act(async () => { boton('Ver detalles').props.onPress(); });
    expect(renderer.root.findAllByType(Text).some((n: any) => texto(n) === 'Descripción completa 0')).toBe(true);
    await act(async () => { boton('Seleccionar servicio').props.onPress(); });
    expect(onSeleccionar).toHaveBeenCalledWith('0');
    expect(onContinuar).not.toHaveBeenCalled();
  });
  it('muestra carga, error con reintento y ausencia de resultados con limpieza de filtros', async () => {
    await act(async () => { renderer = create(<Pantalla isLoading />); });
    expect(renderer.root.findAllByType(ActivityIndicator).length).toBeGreaterThan(0);
    expect(renderer.root.findByType(FlatList).props.data).toEqual([]);
    await act(async () => { renderer.update(<Pantalla error="No se pudo cargar el catálogo." />); });
    await act(async () => { boton('Reintentar').props.onPress(); });
    expect(onReintentar).toHaveBeenCalledTimes(1);
    await act(async () => { renderer.update(<Pantalla />); });
    await act(async () => { renderer.root.findByType(TextInput).props.onChangeText('inexistente'); });
    expect(renderer.root.findAllByType(Text).some((n: any) => texto(n) === 'No encontramos servicios')).toBe(true);
    await act(async () => { boton('Limpiar filtros').props.onPress(); });
    expect(renderer.root.findByType(FlatList).props.data).toHaveLength(6);
  });
  it('adapta columnas a pantallas pequeñas, fuente grande y tabletas', async () => {
    cambiarPantalla(320);
    await act(async () => { renderer = create(<Pantalla />); });
    expect(renderer.root.findByType(FlatList).props.numColumns).toBe(1);
    await act(async () => { cambiarPantalla(1000); });
    expect(renderer.root.findByType(FlatList).props.numColumns).toBe(3);
    await act(async () => { cambiarPantalla(390, 1.6); });
    expect(renderer.root.findByType(FlatList).props.numColumns).toBe(1);
  });
  it('mantiene la selección operativa cuando falla una imagen', async () => {
    await act(async () => { renderer = create(<ServicioSeleccionCard servicio={datos[0]} seleccionado onSeleccionar={onSeleccionar} onDetalle={jest.fn()} />); });
    await act(async () => { renderer.root.findByType(ExpoImage).props.onError({ error: '404' }); });
    expect(renderer.root.findAllByType(ExpoImage)).toHaveLength(0);
    const check = renderer.root.findAll((n: any) => n.props.accessibilityRole === 'checkbox' && typeof n.props.onPress === 'function')[0];
    expect(check.props.accessibilityState.checked).toBe(true);
    await act(async () => { check.props.onPress(); });
    expect(onSeleccionar).toHaveBeenCalledWith('0');
  });
});
