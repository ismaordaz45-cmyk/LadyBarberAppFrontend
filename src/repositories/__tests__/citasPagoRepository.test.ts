import { CitasRepository } from '../citasRepository';
import { apiClientAuth } from '../../services/api';

jest.mock('../../services/api', () => ({ apiClient: jest.fn(), apiClientAuth: jest.fn() }));
const authenticatedRequest = apiClientAuth as jest.Mock;

describe('Contrato de pagos de citas', () => {
  beforeEach(() => jest.resetAllMocks());

  it('consulta reservas, detalle y ocupación con autenticación y conserva errores de disponibilidad', async () => {
    authenticatedRequest.mockResolvedValue([]);
    await CitasRepository.getMisCitas(40);
    expect(authenticatedRequest).toHaveBeenLastCalledWith('/citas/mis-citas?offset=40');
    await CitasRepository.getDetalle('cita/ajena');
    expect(authenticatedRequest).toHaveBeenLastCalledWith('/citas/cita%2Fajena');
    authenticatedRequest.mockRejectedValue(new Error('Sin conexión'));
    await expect(CitasRepository.getOcupacion('2026-11-18', 1)).rejects.toThrow('Sin conexión');
    expect(authenticatedRequest).toHaveBeenLastCalledWith('/citas/ocupacion?fecha=2026-11-18&empleadaId=1');
  });

  it('crea la preferencia en la ruta autenticada sin enviar importes del cliente', async () => {
    const response = { preferenceId: 'pref-test', checkoutUrl: 'https://checkout.example.test/', amount: 100, currency: 'MXN' };
    authenticatedRequest.mockResolvedValue(response);
    await expect(CitasRepository.crearPreferenciaPago('cita-1')).resolves.toEqual(response);
    expect(authenticatedRequest).toHaveBeenCalledWith('/citas/cita-1/pago/preferencia', { method: 'POST' });
  });

  it('consulta el estado y conserva los errores HTTP del API', async () => {
    const error = Object.assign(new Error('Cita no encontrada'), { status: 404 });
    authenticatedRequest.mockRejectedValue(error);
    await expect(CitasRepository.getEstadoPago('cita-1')).rejects.toBe(error);
    expect(authenticatedRequest).toHaveBeenCalledWith('/citas/cita-1/pago/estado');
  });
});
