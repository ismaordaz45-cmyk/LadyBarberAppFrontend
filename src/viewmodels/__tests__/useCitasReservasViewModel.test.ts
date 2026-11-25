import React from 'react';
import { act } from 'react-test-renderer';
import { AppState } from 'react-native';
import { useCitasViewModel, getMinFechaReserva } from '../useCitasViewModel';
import { CitasRepository } from '../../repositories/citasRepository';

jest.mock('expo-router', () => ({ useFocusEffect: (callback: () => (() => void) | undefined) => {
  const ReactModule = jest.requireActual('react'); ReactModule.useEffect(callback, [callback]);
} }));
const mockAbrirCheckout = jest.fn();
jest.mock('../usePagoCitaViewModel', () => ({ usePagoCitaViewModel: () => ({ pagoAprobado: false, estadoPago: null, abrirCheckout: mockAbrirCheckout }) }));
jest.mock('../../repositories/citasRepository', () => ({ CitasRepository: {
  getServicios: jest.fn(), getHorarioNegocio: jest.fn(), getEmpleadasPorServicio: jest.fn(),
  getOcupacion: jest.fn(), crearCita: jest.fn(), cancelarCita: jest.fn(),
} }));
let renderer: any;
async function renderHook() {
  const result = {} as { current: ReturnType<typeof useCitasViewModel> };
  function Component() { result.current = useCitasViewModel(); return null; }
  await act(async () => { renderer = require('react-test-renderer').create(React.createElement(Component)); });
  await act(async () => { result.current.toggleServicio('1'); });
  await act(async () => { result.current.nextStep1(); result.current.setFecha(getMinFechaReserva()); result.current.setEmpleadaId(1); });
  return result;
}
describe('Reserva y nueva cita', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
    (CitasRepository.getServicios as jest.Mock).mockResolvedValue([{ id: '1', nombre: 'Corte', descripcion: 'Corte clásico', categoria: 'Cabello', duracionMin: 60, precioMXN: 120, imagenUrl: null, estaActivo: true }]);
    (CitasRepository.getHorarioNegocio as jest.Mock).mockResolvedValue(['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'].map(diaSemana => ({ diaSemana, horaApertura: '09:00', horaCierre: '18:00', activo: true })));
    (CitasRepository.getEmpleadasPorServicio as jest.Mock).mockResolvedValue([{ id: 1, nombre: 'Estilista' }]);
    (CitasRepository.getOcupacion as jest.Mock).mockResolvedValue([]);
    (CitasRepository.crearCita as jest.Mock).mockResolvedValue({ citaId: 'cita-reservada' });
  });
  afterEach(() => { act(() => renderer?.unmount()); renderer = null; });
  it('permite pagar un apartado sin una segunda aceptación y no abre checkout sin reserva', async () => {
    const result = await renderHook();
    await act(async () => { await result.current.handlePagarAnticipo(); });
    expect(mockAbrirCheckout).not.toHaveBeenCalled();
    await act(async () => { result.current.setHorario('09:00'); });
    await act(async () => { await result.current.nextStep2(); });
    expect(result.current.citaCreadaId).toBe('cita-reservada');
    await act(async () => { await result.current.handlePagarAnticipo(); });
    expect(mockAbrirCheckout).toHaveBeenCalledTimes(1);
    expect(result.current.isGuardando).toBe(false);
  });
  it('permite iniciar otra reserva sin cancelar la cita anterior', async () => {
    const result = await renderHook();
    await act(async () => { result.current.setHorario('09:00'); });
    await act(async () => { await result.current.nextStep2(); });
    expect(result.current.citaCreadaId).toBe('cita-reservada');
    expect(result.current.activeStep).toBe(2);
    await act(async () => { result.current.nuevaCita(); });
    expect(result.current.activeStep).toBe(0);
    expect(result.current.citaCreadaId).toBe('');
    expect(result.current.serviciosSel).toEqual([]);
    expect(CitasRepository.cancelarCita).not.toHaveBeenCalled();
  });
  it('preselecciona el servicio activo proveniente de Inicio con su precio y permite continuar', async () => {
    const result = await renderHook();
    await act(async () => { result.current.nuevaCita('1'); });
    expect(result.current.activeStep).toBe(0);
    expect(result.current.serviciosSel).toEqual(['1']);
    expect(result.current.duracionYPrecioTotal).toEqual({ duracion: 60, precio: 120 });
    act(() => result.current.nextStep1());
    expect(result.current.activeStep).toBe(1);
    await act(async () => { result.current.nuevaCita('servicio-no-disponible'); });
    expect(result.current.serviciosSel).toEqual([]);
    expect(CitasRepository.crearCita).not.toHaveBeenCalled();
  });
  it('no pierde la reserva si falla cancelar y solo limpia el apartado tras confirmación del servidor', async () => {
    const result = await renderHook();
    await act(async () => { result.current.setHorario('09:00'); });
    await act(async () => { await result.current.nextStep2(); });
    (CitasRepository.cancelarCita as jest.Mock).mockRejectedValueOnce(new Error('Sin conexión'));
    await act(async () => { await expect(result.current.cancelarApartado()).rejects.toThrow('Sin conexión'); });
    expect(result.current.citaCreadaId).toBe('cita-reservada');
    expect(result.current.activeStep).toBe(2);
    (CitasRepository.cancelarCita as jest.Mock).mockResolvedValueOnce({});
    await act(async () => { await result.current.cancelarApartado(); });
    expect(CitasRepository.cancelarCita).toHaveBeenLastCalledWith('cita-reservada');
    expect(result.current.citaCreadaId).toBe('');
    expect(result.current.activeStep).toBe(0);
  });
  it('bloquea la reserva cuando no puede verificar disponibilidad', async () => {
    (CitasRepository.getOcupacion as jest.Mock).mockRejectedValue(new Error('401'));
    const result = await renderHook();
    await act(async () => { result.current.setHorario('09:00'); });
    await act(async () => { await result.current.nextStep2(); });
    expect(result.current.errorOcupacion).toMatch(/verificar/);
    expect(CitasRepository.crearCita).not.toHaveBeenCalled();
  });
  it('conserva la selección y el contrato de reserva al buscar y cambiar de categoría sin nuevas consultas', async () => {
    const result = await renderHook();
    await act(async () => { result.current.catalogoServicios.cambiarBusqueda('otro servicio'); result.current.catalogoServicios.cambiarCategoria('otra categoría'); });
    expect(result.current.catalogoServicios.serviciosVisibles).toEqual([]);
    expect(result.current.serviciosSel).toEqual(['1']);
    expect(result.current.duracionYPrecioTotal).toEqual({ duracion: 60, precio: 120 });
    expect(CitasRepository.getServicios).toHaveBeenCalledTimes(1);
    expect(CitasRepository.getEmpleadasPorServicio).toHaveBeenCalledTimes(1);
    await act(async () => { result.current.setHorario('09:00'); });
    await act(async () => { await result.current.nextStep2(); });
    expect(CitasRepository.crearCita).toHaveBeenCalledWith({ empleadaId: 1, fecha: getMinFechaReserva(), horaInicio: '09:00', servicios: [1] });
    expect(result.current.activeStep).toBe(2);
  });
  it('permite reintentar una carga fallida del catálogo', async () => {
    (CitasRepository.getServicios as jest.Mock).mockRejectedValueOnce(new Error('Sin conexión'));
    const result = {} as { current: ReturnType<typeof useCitasViewModel> };
    function Component() { result.current = useCitasViewModel(); return null; }
    await act(async () => { renderer = jest.requireActual('react-test-renderer').create(React.createElement(Component)); });
    expect(result.current.errorMsg).toMatch(/catálogo/);
    await act(async () => { result.current.reintentarCatalogo(); });
    expect(result.current.errorMsg).toBeNull();
    expect(result.current.isLoadingCatalogo).toBe(false);
    expect(result.current.serviciosApi[0].nombre).toBe('Corte');
  });
});
