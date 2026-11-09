export interface PerfilUsuario {
  id: number;
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  correo: string;
  telefono: string | null;
  rol: string;
}

export interface ResumenPerfilCliente {
  user: PerfilUsuario;
  clienteId: number;
  stats: {
    total: number;
    pendientes: number;
    completadas: number;
  };
  nextCita: {
    id: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    estado: string;
    precioFinal: number;
  } | null;
  actualizadoEn: string;
}

export interface ActualizarPerfilRequest {
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  telefono: string | null;
}

export interface ActualizarPerfilResponse {
  message: string;
  perfil: ResumenPerfilCliente;
}
