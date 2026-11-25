import { apartadoVencido, esCitaActiva, estadoHorario } from '../citasPresentation';
import { CitaResumen } from '../../models/Cita';

describe('Disponibilidad y clasificación de citas', () => {
  const ocupado = { id: 'otra', horaInicio: '2026-11-18T09:00:00', horaFin: '2026-11-18T10:30:00', estado: 'APARTADA' };
  it('bloquea todo traslape por duración, respeta los límites y distingue apartado de confirmado', () => {
    expect(estadoHorario('08:00', 90, '18:00', [ocupado])).toBe('apartado');
    expect(estadoHorario('09:00', 30, '18:00', [ocupado])).toBe('apartado');
    expect(estadoHorario('10:00', 60, '18:00', [{ ...ocupado, estado: 'CONFIRMADA' }])).toBe('confirmado');
    expect(estadoHorario('10:30', 30, '18:00', [ocupado])).toBe('disponible');
    expect(estadoHorario('17:00', 90, '18:00', [])).toBe('cerrado');
    expect(estadoHorario('09:00', 30, '18:00', [{ ...ocupado, estado: 'CANCELADA' }])).toBe('disponible');
    expect(estadoHorario('09:00', 30, '18:00', [ocupado, { ...ocupado, estado: 'CONFIRMADA' }])).toBe('confirmado');
  });
  it('envía los apartados vencidos y las citas anteriores al historial', () => {
    const now = Date.parse('2026-11-18T14:00:00Z');
    const cita: CitaResumen = { id: 'test', fecha: '2026-11-18', horaInicio: '2026-11-18T09:00:00',
      horaFin: '2026-11-18T10:00:00', creadoEn: '2026-11-18T13:40:00Z', estado: 'APARTADA', precioFinal: 120, serviciosLabel: 'Corte' };
    expect(esCitaActiva(cita, now)).toBe(true);
    expect(apartadoVencido({ ...cita, creadoEn: '2026-11-18T13:30:00Z' }, now)).toBe(true);
    expect(esCitaActiva({ ...cita, estado: 'CANCELADA' }, now)).toBe(false);
    expect(esCitaActiva({ ...cita, estado: 'CONFIRMADA' }, Date.parse('2026-11-19T00:00:00Z'))).toBe(false);
  });
});
