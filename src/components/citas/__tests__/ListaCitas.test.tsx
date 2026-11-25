import React from 'react';
import { Text } from 'react-native';
import { act } from 'react-test-renderer';
import { ListaCitas } from '../ListaCitas';
import { CitasRepository } from '../../../repositories/citasRepository';
import { useMisCitasViewModel } from '../../../viewmodels/useMisCitasViewModel';
import { guardarComprobanteCita } from '../../../services/comprobanteCitaService';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => (() => void) | undefined) => {
    const ReactModule = jest.requireActual('react'); ReactModule.useEffect(callback, [callback]);
  } }));
jest.mock('../../../repositories/citasRepository', () => ({ CitasRepository: { getMisCitas: jest.fn(), getDetalle: jest.fn() } }));
jest.mock('../../../services/comprobanteCitaService', () => ({ guardarComprobanteCita: jest.fn() }));
jest.mock('../../../viewmodels/usePagoCitaViewModel', () => ({ usePagoCitaViewModel: () => ({ pagoAprobado: false, errorPago: null, consultarPago: jest.fn() }) }));
let renderer: any;
function Pantalla({ historial = false }: { historial?: boolean }) { const vm = useMisCitasViewModel(historial ? 'historial' : 'proximas'); return <ListaCitas vm={vm} historial={historial} />; }
const boton = (texto: string) => {
  let node = renderer.root.findAllByType(Text).find((n: any) =>
    (Array.isArray(n.props.children) ? n.props.children.join('') : n.props.children) === texto);
  while (node && typeof node.props.onPress !== 'function') node = node.parent;
  if (!node) throw new Error(`No se encontró el botón ${texto}`);
  return node;
};
const tarjetas = () => renderer.root.findAll((n: any) => n.type !== Text && n.props.accessibilityRole === 'button'
  && typeof n.props.onPress === 'function' && String(n.props.accessibilityLabel || '').startsWith('Ver cita del'));
describe('Lista visible de citas', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (CitasRepository.getMisCitas as jest.Mock).mockResolvedValue(Array.from({ length: 8 }, (_, i) => ({
      id: `folio-${i}`, fecha: '2099-11-18', horaInicio: '2099-11-18T09:00:00', horaFin: '2099-11-18T10:00:00',
      creadoEn: '2099-11-01T09:00:00Z', estado: 'CONFIRMADA', precioFinal: 120, serviciosLabel: 'Corte',
    })));
    (CitasRepository.getDetalle as jest.Mock).mockResolvedValue({
      id: 'folio-0', fecha: '2099-11-18', horaInicio: '2099-11-18T09:00:00', horaFin: '2099-11-18T10:00:00', estado: 'CONFIRMADA',
      clienteNombre: 'Cliente de prueba', empleadaNombre: 'Especialista de prueba', precioFinal: 120,
      paymentId: 'payment-test', paymentStatus: 'approved', comprobanteDisponible: true, anticipoPagado: 60, saldoPendiente: 60,
      servicios: [{ id: 1, nombre: 'Corte', precio: 120, duracionMinutos: 60 }],
    });
    await act(async () => { renderer = jest.requireActual('react-test-renderer').create(<Pantalla />); });
  });
  afterEach(() => { act(() => renderer.unmount()); });
  it('muestra seis tarjetas, permite ver más/menos y conserva la navegación al detalle', async () => {
    expect(renderer.root.findAllByType(Text).filter((n: any) => n.props.children?.toString().startsWith('FOLIO '))).toHaveLength(6);
    await act(async () => { boton('Ver más · 2 citas').props.onPress(); });
    expect(renderer.root.findAllByType(Text).filter((n: any) => n.props.children?.toString().startsWith('FOLIO '))).toHaveLength(8);
    await act(async () => { boton('Ver menos').props.onPress(); });
    expect(renderer.root.findAllByType(Text).filter((n: any) => n.props.children?.toString().startsWith('FOLIO '))).toHaveLength(6);
    act(() => tarjetas()[0].props.onPress());
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/cita/[id]', params: { id: 'folio-0' } });
  });
  it('ofrece recuperar todas las citas cuando un filtro no tiene resultados', async () => {
    await act(async () => { boton('Por pagar').props.onPress(); });
    expect(renderer.root.findAllByType(Text).some((n: any) => n.props.children === 'No hay citas con este filtro')).toBe(true);
    await act(async () => { boton('Mostrar todas').props.onPress(); });
    expect(renderer.root.findAllByType(Text).filter((n: any) => n.props.children?.toString().startsWith('FOLIO '))).toHaveLength(6);
  });
  it('muestra el apartado persistido en Por pagar y permite retomar el pago de la misma cita', async () => {
    act(() => renderer.unmount());
    (CitasRepository.getMisCitas as jest.Mock).mockResolvedValue([{ id: 'apartado-persistido', fecha: '2099-11-18',
      horaInicio: '2099-11-18T09:00:00', horaFin: '2099-11-18T10:00:00', creadoEn: new Date().toISOString(),
      estado: 'APARTADA', precioFinal: 120, serviciosLabel: 'Corte' }]);
    await act(async () => { renderer = jest.requireActual('react-test-renderer').create(<Pantalla />); });
    await act(async () => { boton('Por pagar').props.onPress(); });
    act(() => boton('Continuar pago →').props.onPress());
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/cita/[id]', params: { id: 'apartado-persistido' } });
    expect(renderer.root.findAllByType(Text).some((n: any) => n.props.children === 'En atención')).toBe(false);
  });
  it('abre una vista previa sin navegar y permite guardar desde la tarjeta de Citas', async () => {
    (guardarComprobanteCita as jest.Mock).mockResolvedValue({ cancelado: false, nombre: 'Cita.pdf', carpeta: 'Documentos' });
    await act(async () => { boton('Vista previa').props.onPress(); });
    expect(CitasRepository.getDetalle).toHaveBeenCalledWith('folio-0');
    expect(mockPush).not.toHaveBeenCalled();
    expect(renderer.root.findAllByType(Text).some((n: any) => n.props.children === 'Comprobante de anticipo')).toBe(true);
    await act(async () => { boton('Descargar y guardar PDF').props.onPress(); });
    expect(guardarComprobanteCita).toHaveBeenCalledWith(expect.objectContaining({ id: 'folio-0', anticipoPagado: 60 }));
    expect(renderer.root.findAllByType(Text).some((n: any) => n.props.children === 'PDF guardado en Documentos: Cita.pdf')).toBe(true);
    await act(async () => { boton('Cerrar').props.onPress(); });
    expect(renderer.root.findAllByType(Text).some((n: any) => n.props.children === 'Vista previa de tu cita')).toBe(false);
  });
  it('ofrece la misma vista previa y guardado en Historial', async () => {
    act(() => renderer.unmount());
    (CitasRepository.getMisCitas as jest.Mock).mockResolvedValue([{ id: 'folio-0', fecha: '2026-01-01',
      horaInicio: '2026-01-01T09:00:00', horaFin: '2026-01-01T10:00:00', creadoEn: '2025-12-30T09:00:00Z',
      estado: 'COMPLETADA', precioFinal: 120, serviciosLabel: 'Corte' }]);
    (guardarComprobanteCita as jest.Mock).mockResolvedValue({ cancelado: true });
    await act(async () => { renderer = jest.requireActual('react-test-renderer').create(<Pantalla historial />); });
    await act(async () => { boton('Vista previa').props.onPress(); });
    await act(async () => { boton('Descargar y guardar PDF').props.onPress(); });
    expect(guardarComprobanteCita).toHaveBeenCalledWith(expect.objectContaining({ id: 'folio-0' }));
    expect(renderer.root.findAllByType(Text).some((n: any) => String(n.props.children).includes('Guardado cancelado'))).toBe(true);
  });
  it('permite previsualizar una reserva pendiente sin ofrecer un comprobante de pago', async () => {
    (CitasRepository.getDetalle as jest.Mock).mockResolvedValueOnce({
      id: 'folio-0', fecha: '2099-11-18', horaInicio: '09:00', horaFin: '10:00', estado: 'APARTADA',
      clienteNombre: 'Cliente', empleadaNombre: 'Especialista', precioFinal: 120, comprobanteDisponible: false, servicios: [],
    });
    await act(async () => { boton('Vista previa').props.onPress(); });
    expect(renderer.root.findAllByType(Text).some((n: any) => n.props.children === 'Resumen de reservación')).toBe(true);
    expect(renderer.root.findAllByType(Text).some((n: any) => n.props.children === 'Descargar y guardar PDF')).toBe(false);
    expect(guardarComprobanteCita).not.toHaveBeenCalled();
  });
});
