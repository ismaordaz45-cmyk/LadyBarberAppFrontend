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
  preferenciaId: string;
  initPoint: string;
}
