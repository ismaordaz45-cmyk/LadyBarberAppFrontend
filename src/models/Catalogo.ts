// ─── Catálogo: Servicios ────────────────────────────────────
export interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  duracion: number;       // duracionMinutos aliased por el backend
  descripcion?: string;
  categoria?: string;
  imagenUrl?: string;     // puede venir null/vacío
  estaActivo?: number;
}

// ─── Catálogo: Insumos/Productos ────────────────────────────
export interface Producto {
  id: number;
  nombre: string;
  precio: number;         // precioUnitario aliased por el backend
  descripcion?: string;
  unidad?: string;
  stockActual?: number;
  imagen?: string;        // puede venir null/vacío
  estaActivo?: number;
}

// ─── Perfil + Resumen del Cliente ────────────────────────────
export interface ResumenCliente {
  user: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string;
    telefono: string;
    rol: string;
  };
  clienteId: number;
  stats: {
    total: number;
    pendientes: number;
    completadas: number;
  };
  nextCita: ProximaCita | null;
  actualizadoEn: string;
}

// ─── Próxima Cita ────────────────────────────────────────────
export interface ProximaCita {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  precioFinal: number;
  serviciosLabel?: string;
}
