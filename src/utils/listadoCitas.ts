import { CitaResumen } from '../models/Cita';
import { apartadoVencido, esCitaActiva } from './citasPresentation';

export type VistaCitas = 'proximas' | 'historial';
export type FiltroCitas = 'todas' | 'confirmadas' | 'pendientes' | 'completadas' | 'canceladas' | 'vencidas' | 'inasistencias';
export type OrdenCitas = 'fechaAsc' | 'fechaDesc' | 'creacionDesc';
export const CITAS_POR_VISTA = 6;

export const filtrosCitas = (vista: VistaCitas): { value: FiltroCitas; label: string }[] => vista === 'proximas'
  ? [{ value: 'todas', label: 'Todas' }, { value: 'confirmadas', label: 'Confirmadas' },
    { value: 'pendientes', label: 'Por pagar' }]
  : [{ value: 'todas', label: 'Todas' }, { value: 'completadas', label: 'Completadas' },
    { value: 'canceladas', label: 'Canceladas' }, { value: 'confirmadas', label: 'Confirmadas' },
    { value: 'vencidas', label: 'Vencidas' }, { value: 'inasistencias', label: 'No asistí' }];

export const ordenesCitas = (vista: VistaCitas): { value: OrdenCitas; label: string }[] => vista === 'proximas'
  ? [{ value: 'fechaAsc', label: 'Fecha más cercana' }, { value: 'creacionDesc', label: 'Últimas reservas' }]
  : [{ value: 'fechaDesc', label: 'Más recientes' }, { value: 'fechaAsc', label: 'Más antiguas' }];

export function filtrarOrdenarCitas(citas: CitaResumen[], vista: VistaCitas, filtro: FiltroCitas, orden: OrdenCitas, now: number) {
  const estados: Partial<Record<FiltroCitas, string>> = {
    confirmadas: 'CONFIRMADA', pendientes: 'APARTADA', completadas: 'COMPLETADA',
    canceladas: 'CANCELADA', inasistencias: 'NO_ASISTIO',
  };
  return citas.filter(c => esCitaActiva(c, now) === (vista === 'proximas'))
    .filter(c => filtro === 'todas' || (filtro === 'vencidas' ? apartadoVencido(c, now) : c.estado === estados[filtro]))
    .sort((a, b) => {
      if (orden === 'creacionDesc') {
        const fechas = new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime();
        if (Number.isFinite(fechas) && fechas !== 0) return fechas;
      }
      const fechas = a.horaInicio.localeCompare(b.horaInicio) || a.id.localeCompare(b.id);
      return orden === 'fechaAsc' ? fechas : -fechas;
    });
}
