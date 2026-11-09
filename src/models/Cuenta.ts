export interface EliminarCuentaRequest {
  password: string;
  confirmacion: 'ELIMINAR';
}

export interface EliminarCuentaResponse {
  ok: boolean;
  message: string;
}
