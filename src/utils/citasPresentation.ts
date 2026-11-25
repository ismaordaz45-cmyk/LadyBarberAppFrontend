import { CitaResumen, Ocupacion } from '../models/Cita';

export const HORARIOS = {
  disponible: { label: 'Disponible', color: '#2563EB', background: '#EFF6FF' },
  apartado: { label: 'Apartado · pendiente', color: '#64748B', background: '#F1F5F9' },
  confirmado: { label: 'Confirmado', color: '#886B12', background: '#FFF8DF' },
  cerrado: { label: 'Fuera de horario', color: '#64748B', background: '#F1F5F9' },
} as const;

export function minutosHora(value: string): number {
  const match = value.match(/(?:T|^|\s)(\d{2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
}

export function estadoHorario(hora: string, duracion: number, cierre: string, ocupacion: Ocupacion[]): keyof typeof HORARIOS {
  const inicio = minutosHora(hora);
  const fin = inicio + duracion;
  if (duracion <= 0 || fin > minutosHora(cierre)) return 'cerrado';
  const conflictos = ocupacion.filter(c => ['APARTADA', 'CONFIRMADA', 'EN_PROCESO', 'COMPLETADA'].includes(c.estado)
    && inicio < minutosHora(c.horaFin) && fin > minutosHora(c.horaInicio));
  if (conflictos.some(c => c.estado !== 'APARTADA')) return 'confirmado';
  return conflictos.length ? 'apartado' : 'disponible';
}

export const dinero = (value: number | string | null) =>
  value !== null && Number.isFinite(Number(value))
    ? `$${Number(value).toFixed(2)} MXN` : 'No disponible';

export function fechaCita(value: string) {
  const fecha = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(fecha.getTime()) ? value : fecha.toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export const horaCita = (value: string) => value.includes('T') ? value.slice(11, 16) : value.slice(0, 5);

export function apartadoVencido(cita: CitaResumen, now = Date.now()) {
  return cita.estado === 'APARTADA' && now - new Date(cita.creadoEn).getTime() >= 30 * 60 * 1000;
}

export function esCitaActiva(cita: CitaResumen, now = Date.now()) {
  if (!['APARTADA', 'CONFIRMADA', 'EN_PROCESO'].includes(cita.estado) || apartadoVencido(cita, now)) return false;
  // Las horas sin offset del API corresponden al horario del negocio en México.
  return new Date(`${cita.horaFin.slice(0, 19)}-06:00`).getTime() >= now;
}

export function etiquetaCita(cita: CitaResumen) {
  if (apartadoVencido(cita)) return 'Apartado vencido';
  return ({ APARTADA: 'Pendiente de pago', CONFIRMADA: 'Confirmada', COMPLETADA: 'Completada',
    EN_PROCESO: 'En atención', CANCELADA: 'Cancelada', NO_ASISTIO: 'No asistió' })[cita.estado] || cita.estado;
}
