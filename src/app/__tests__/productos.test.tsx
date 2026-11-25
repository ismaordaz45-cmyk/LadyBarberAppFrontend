import React from 'react';
import { ActivityIndicator, Image, Modal, Text, TextInput, TouchableOpacity } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import TiendaScreen from '../../components/productos/TiendaScreen';

const mockNavigate = jest.fn();
const mockRouter = { navigate: mockNavigate };
const mockCatalogo = jest.fn();
const mockCarrito = jest.fn();
const mockPago = jest.fn();
let mockParams: { seccion?: string; visita?: string } = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (callback: () => (() => void)) => { jest.requireActual('react').useEffect(callback, [callback]); },
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('../../components/compartidos/EncabezadoModulo', () => ({
  EncabezadoModulo: ({ titulo }: { titulo: string }) => require('react').createElement(require('react-native').Text, null, titulo),
}));
jest.mock('../../viewmodels/useProductosViewModel', () => ({ useProductosViewModel: () => mockCatalogo() }));
jest.mock('../../viewmodels/useCarritoViewModel', () => ({ useCarritoViewModel: () => mockCarrito() }));
jest.mock('../../viewmodels/usePagoProductosViewModel', () => ({ usePagoProductosViewModel: () => mockPago() }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
const producto = { id: '7', nombre: 'Aceite', precioMXN: 10.5, stockActual: 3, categoria: 'Productos', categoriaEtiqueta: 'PRODUCTO', subtitulo: '100 ml', descripcion: 'Cuidado capilar', imagenUrl: '' };
const catalogo = () => ({ isLoading: false, error: null, catalogo: [producto], productosVisibles: [producto],
  categoriasDisponibles: ['Todos', 'Productos'], categoriaActiva: 'Todos', busqueda: '', soloDisponibles: false,
  totalArticulos: 1, hayMas: false, ordenAscendente: null,
  productoDetalle: null, abrirDetalle: jest.fn(), cerrarDetalle: jest.fn(),
  setBusqueda: jest.fn(), setCategoriaActiva: jest.fn(), setSoloDisponibles: jest.fn(), toggleOrden: jest.fn(), recargar: jest.fn(), verMas: jest.fn() });
const carrito = () => ({ listo: true, sinSesion: false, lineas: [], cantidad: 0, total: 0, error: null,
  agregar: jest.fn(), cambiar: jest.fn(), quitar: jest.fn(), vaciar: jest.fn(), reintentar: jest.fn() });
let renderer: ReactTestRenderer;
const texto = () => renderer.root.findAllByType(Text).map(node => {
  const hijos = Array.isArray(node.props.children) ? node.props.children : [node.props.children];
  return hijos.filter((hijo: unknown) => typeof hijo === 'string' || typeof hijo === 'number').join('');
}).join('|');
function pulsar(label: string) {
  const button = renderer.root.findAllByType(TouchableOpacity).find(node => node.findAllByType(Text).some(text => text.props.children === label));
  if (!button) throw new Error(`Botón no encontrado: ${label}`);
  act(() => button.props.onPress());
}
function montar(cat = {}, cart = {}) {
  const state = { ...catalogo(), ...cat };
  const basket = { ...carrito(), ...cart };
  mockCatalogo.mockReturnValue(state); mockCarrito.mockReturnValue(basket);
  mockPago.mockReturnValue({ pedido: null, ocupado: false, listo: true, error: null, preparar: jest.fn() });
  act(() => { renderer = create(<TiendaScreen />); });
  return { state, basket };
}
afterEach(() => { act(() => renderer?.unmount()); mockParams = {}; jest.clearAllMocks(); });
it('abre directamente el carrito desde la navegación inferior y vuelve al catálogo desde Inicio', () => {
  mockParams = { seccion: 'carrito', visita: '1' };
  montar(); expect(texto()).toContain('Tu carrito está vacío');
  pulsar('Explorar catálogo'); expect(texto()).toContain('Agregar al carrito');
  mockParams = { seccion: 'carrito', visita: '2' };
  act(() => renderer.update(<TiendaScreen />));
  expect(texto()).toContain('Tu carrito está vacío');
  mockParams = { seccion: 'catalogo', visita: '3' };
  act(() => renderer.update(<TiendaScreen />));
  expect(texto()).toContain('Agregar al carrito');
  expect(mockPago().preparar).not.toHaveBeenCalled();
});
it('muestra catálogo, recogida en salón, pestañas y agregar al carrito', () => {
  const { basket } = montar();
  expect(texto()).toContain('Recoge en el salón');
  expect(texto()).toContain('Aceite');
  pulsar('Agregar al carrito');
  expect(basket.agregar).toHaveBeenCalledWith(producto);
});
it('abre el producto al tocar la tarjeta sin agregarlo ni iniciar un pago', () => {
  const { state, basket } = montar();
  const tarjeta = renderer.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'Ver producto Aceite')!;
  act(() => tarjeta.props.onPress());
  expect(state.abrirDetalle).toHaveBeenCalledWith(producto);
  expect(basket.agregar).not.toHaveBeenCalled();
  expect(mockPago().preparar).not.toHaveBeenCalled();
});
it('presenta imagen completa, información y permite agregar o cerrar la vista previa', () => {
  const { state, basket } = montar({ productoDetalle: producto });
  expect(texto()).toContain('Cuidado capilar');
  expect(texto()).toContain('3 unidades disponibles');
  expect(renderer.root.findAllByType(Image).some(node => node.props.resizeMode === 'contain')).toBe(true);
  const agregar = renderer.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'Agregar Aceite desde vista previa')!;
  act(() => agregar.props.onPress()); expect(basket.agregar).toHaveBeenCalledWith(producto);
  pulsar('Seguir explorando'); expect(state.cerrarDetalle).toHaveBeenCalledTimes(1);
  act(() => renderer.root.findByType(Modal).props.onRequestClose());
  expect(state.cerrarDetalle).toHaveBeenCalledTimes(2);
});
it('bloquea agregar desde la vista previa cuando ya se alcanzaron las existencias', () => {
  montar({ productoDetalle: producto }, { cantidad: 3, lineas: [{ productoId: '7', cantidad: 3, producto, limite: 3, subtotal: 31.5 }] });
  const agregar = renderer.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'Agregar Aceite desde vista previa')!;
  expect(agregar.props.disabled).toBe(true);
  expect(texto()).toContain('Máximo en carrito');
});
it('conecta búsqueda, disponibilidad, orden y carga progresiva', () => {
  const { state } = montar({ hayMas: true });
  act(() => renderer.root.findByType(TextInput).props.onChangeText('aceite'));
  expect(state.setBusqueda).toHaveBeenCalledWith('aceite');
  pulsar('Disponibles'); expect(state.setSoloDisponibles).toHaveBeenCalledWith(true);
  pulsar('Ordenar'); expect(state.toggleOrden).toHaveBeenCalledTimes(1);
  pulsar('Ver más productos'); expect(state.verMas).toHaveBeenCalledTimes(1);
});
it('no inventa categorías cuando la API solo entrega Productos', () => {
  montar(); expect(texto()).not.toContain('Tratamientos');
  expect(texto()).not.toContain('Pomadas');
});
it('presenta carga y permite reintentar ante error', () => {
  const { state } = montar({ isLoading: true, productosVisibles: [] });
  expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(1);
  mockCatalogo.mockReturnValue({ ...state, isLoading: false, error: 'Sin conexión' });
  act(() => renderer.update(<TiendaScreen />));
  expect(texto()).toContain('Sin conexión'); pulsar('Volver a intentar');
  expect(state.recargar).toHaveBeenCalledTimes(1);
});
it('muestra vacío y permite volver al catálogo sin salir del módulo', () => {
  montar(); pulsar('Carrito (0)'); expect(texto()).toContain('Tu carrito está vacío');
  pulsar('Explorar catálogo'); expect(texto()).toContain('Agregar al carrito');
});
it('muestra total, cantidades, revisión antes de pagar y confirma antes de vaciar', () => {
  const { basket } = montar({}, { cantidad: 2, total: 21, lineas: [{ productoId: '7', cantidad: 2, producto, limite: 3, subtotal: 21, requiereAjuste: false }] });
  pulsar('Carrito (2)'); expect(texto()).toContain('$21.00 MXN');
  const plus = renderer.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'Sumar una unidad de Aceite')!;
  act(() => plus.props.onPress()); expect(basket.cambiar).toHaveBeenCalledWith(producto, 3);
  pulsar('Vaciar carrito'); expect(basket.vaciar).not.toHaveBeenCalled();
  pulsar('Conservar'); expect(basket.vaciar).not.toHaveBeenCalled();
  pulsar('Vaciar carrito'); pulsar('Sí, vaciar'); expect(basket.vaciar).toHaveBeenCalledTimes(1);
  expect(texto()).toContain('Revisar pedido y pagar');
});
it('presenta sin resultados y ofrece volver a Inicio', () => {
  montar({ productosVisibles: [], totalArticulos: 0 });
  expect(texto()).toContain('No hay productos que coincidan');
  pulsar('Inicio'); expect(mockNavigate).toHaveBeenCalledWith('/(tabs)');
});
it('prepara un resumen con las cantidades del carrito antes de permitir un cobro', () => {
  montar({}, { cantidad: 2, total: 21, lineas: [{ productoId: '7', cantidad: 2, producto, limite: 3, subtotal: 21, requiereAjuste: false }] });
  pulsar('Carrito (2)'); pulsar('Revisar pedido y pagar');
  expect(mockPago().preparar).toHaveBeenCalledWith([{ productoId: '7', cantidad: 2 }]);
});
it('pide confirmar la cancelación y permite conservar el pedido sin enviarla', async () => {
  montar({}, { cantidad: 1, total: 10.5, lineas: [{ productoId: '7', cantidad: 1, producto, limite: 3, subtotal: 10.5, requiereAjuste: false }] });
  const cancelar = jest.fn().mockResolvedValue(true);
  mockPago.mockReturnValue({ ...mockPago(), puedeCancelar: true, puedePagar: true, cancelar, consultar: jest.fn(), pagar: jest.fn(),
    pedido: { id: 40, total: 10.5, items: [{ insumoId: 7, cantidad: 1, nombre: 'Aceite', subtotal: 10.5 }], estado: 'pendiente', paymentStatus: 'mobile_created', compraConfirmada: false } });
  pulsar('Carrito (1)'); pulsar('Cancelar pedido y volver al carrito');
  expect(cancelar).not.toHaveBeenCalled();
  pulsar('Conservar pedido'); expect(cancelar).not.toHaveBeenCalled();
  pulsar('Cancelar pedido y volver al carrito');
  await act(async () => { const button = renderer.root.findAllByType(TouchableOpacity).find(node => node.props.accessibilityLabel === 'Sí, cancelar pedido')!; button.props.onPress(); });
  expect(cancelar).toHaveBeenCalledWith(40);
});
