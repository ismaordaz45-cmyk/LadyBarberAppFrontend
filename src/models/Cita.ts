export interface DiaHorario {
  diaSemana: string;
  horaApertura: string | null;
  horaCierre: string | null;
  activo: boolean;
}

export interface Empleada {
  id: number;
  nombre: string;
  apellidos: string;
  especialidad: string;
  imagenUrl?: string | null;
}

export interface Ocupacion {
  id: string;
  horaInicio: string;
  horaFin: string;
  estado: string; // APARTADA, CONFIRMADA
}

export interface CitaPayload {
  empleadaId: number;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  servicios: number[];
}

export interface PreferenciaPagoResponse {
  preferenceId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
}

export interface EstadoPagoCita {
  citaId: string;
  estado: string;
  precioFinal: number | string | null;
  preferenceId: string | null;
  paymentId: string | null;
  paymentStatus: string | null;
}

export interface CitaResumen {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  precioFinal: number | string | null;
  creadoEn: string;
  serviciosLabel: string | null;
}

export interface CitaDetalle extends Omit<CitaResumen, 'serviciosLabel' | 'creadoEn'> {
  clienteNombre: string;
  empleadaNombre: string;
  paymentStatus: string | null;
  paymentId: string | null;
  fechaAprobacion: string | null;
  moneda: string | null;
  comprobanteDisponible: boolean;
  anticipoPagado: number | null;
  saldoPendiente: number | null;
  servicios: { id: number; nombre: string; precio: number | string; duracionMinutos: number }[];
}
