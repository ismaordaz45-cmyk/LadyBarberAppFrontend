import { CitaResumen } from '../../models/Cita';
import { filtrarOrdenarCitas } from '../listadoCitas';

const now = Date.parse('2026-11-17T18:00:00Z');
const cita = (id: string, fecha: string, creadoEn: string, estado = 'CONFIRMADA'): CitaResumen => ({
  id, fecha, horaInicio: `${fecha}T09:00:00`, horaFin: `${fecha}T10:00:00`, creadoEn, estado, precioFinal: 120, serviciosLabel: 'Corte',
});
describe('Orden y filtros de la lista de citas', () => {
  it('ordena por fecha más cercana o última reserva sin modificar los datos originales', () => {
    const datos = [cita('lejana', '2026-11-20', '2026-11-17T17:59:00Z'), cita('cercana', '2026-11-18', '2026-11-17T17:50:00Z')];
    expect(filtrarOrdenarCitas(datos, 'proximas', 'todas', 'fechaAsc', now).map(c => c.id)).toEqual(['cercana', 'lejana']);
    expect(filtrarOrdenarCitas(datos, 'proximas', 'todas', 'creacionDesc', now).map(c => c.id)).toEqual(['lejana', 'cercana']);
    expect(datos.map(c => c.id)).toEqual(['lejana', 'cercana']);
  });
  it('distingue apartados vigentes, vencidos y cancelaciones al aplicar filtros', () => {
    const datos = [cita('vigente', '2026-11-18', '2026-11-17T17:55:00Z', 'APARTADA'),
      cita('vencida', '2026-11-18', '2026-11-17T17:00:00Z', 'APARTADA'),
      cita('cancelada', '2026-11-19', '2026-11-17T17:55:00Z', 'CANCELADA')];
    expect(filtrarOrdenarCitas(datos, 'proximas', 'pendientes', 'fechaAsc', now).map(c => c.id)).toEqual(['vigente']);
    expect(filtrarOrdenarCitas(datos, 'historial', 'vencidas', 'fechaDesc', now).map(c => c.id)).toEqual(['vencida']);
    expect(filtrarOrdenarCitas(datos, 'historial', 'canceladas', 'fechaDesc', now).map(c => c.id)).toEqual(['cancelada']);
  });
});
