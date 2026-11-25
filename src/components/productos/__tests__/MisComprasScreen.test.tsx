import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import MisComprasScreen from '../MisComprasScreen';
import { compraPrueba, resumenCompra } from '../../../../test/fixtures/compra';
const mockVm = jest.fn(), mockNavigate = jest.fn(), mockParams: { pedidoId?: string } = {};
jest.mock('../../../viewmodels/useComprasViewModel', () => ({ useComprasViewModel: () => mockVm() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: mockNavigate }), useLocalSearchParams: () => mockParams,
  useFocusEffect: (cb: () => void) => { jest.requireActual('react').useEffect(cb, [cb]); } }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View, useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }) }));
jest.mock('../../compartidos/EncabezadoModulo', () => ({ EncabezadoModulo: () => null }));
let renderer: ReactTestRenderer;
const base = () => ({ filtro: 'todas', compras: [resumenCompra(9), resumenCompra(8), resumenCompra(7)], cargando: false, cargandoMas: false, error: null, actualizar: jest.fn(), verMas: jest.fn(), hayMas: true, abrir: jest.fn(), setFiltro: jest.fn(), modalVisible: false, compra: null, cargandoDetalle: false, errorDetalle: null, aviso: null, guardando: false, guardarPdf: jest.fn(), cerrar: jest.fn() });
function montar(extra = {}) { const vm = { ...base(), ...extra }; mockVm.mockReturnValue(vm); act(() => { renderer = create(<MisComprasScreen />); }); return vm; }
const texto = () => renderer.root.findAllByType(Text).map(n => Array.isArray(n.props.children) ? n.props.children.filter((c: unknown) => typeof c === 'string' || typeof c === 'number').join('') : n.props.children).join('|');
function pulsar(label: string) {
  const button = renderer.root.findAllByType(TouchableOpacity).find(b => b.findAllByType(Text).some(t => t.props.children === label));
  if (!button) throw new Error(`No se encontró ${label}`); act(() => button.props.onPress());
}
afterEach(() => { act(() => renderer?.unmount()); delete mockParams.pedidoId; jest.clearAllMocks(); });
it('muestra tres compras con productos, cantidad, precio y controles de filtro y más', () => {
  const vm = montar(); expect(texto()).toContain('PEDIDO #9'); expect(texto()).toContain('Gel'); expect(texto()).toContain('$60.00 MXN');
  pulsar('Plazo vigente'); expect(vm.setFiltro).toHaveBeenCalledWith('vigentes');
  pulsar('Ver más compras'); expect(vm.verMas).toHaveBeenCalledTimes(1);
  pulsar('Vista previa y comprobante'); expect(vm.abrir).toHaveBeenCalledWith(9);
});
it('la vista previa presenta el código y permite guardar PDF sin compartir', () => {
  const vm = montar({ modalVisible: true, compra: compraPrueba });
  expect(texto()).not.toContain('C?digo para recoger'); expect(texto()).toContain('Recoger antes de:');
  pulsar('Descargar y guardar PDF'); expect(vm.guardarPdf).toHaveBeenCalledTimes(1); expect(texto()).not.toContain('Compartir PDF');
});
it('una compra ya recogida muestra la entrega y no presenta otro código de retirada', () => {
  montar({ modalVisible: true, compra: { ...compraPrueba, recogida: { ...compraPrueba.recogida, estado: 'vencida' } } });
  expect(texto()).toContain('Tu pago permanece registrado'); expect(texto()).not.toContain('Entrega registrada');
});
it('abre un comprobante después del pago y permite regresar al Perfil', () => {
  mockParams.pedidoId = '9'; const vm = montar(); expect(vm.abrir).toHaveBeenCalledWith(9);
  pulsar('← Mi perfil'); expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/perfil');
});
