export interface User {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string;
  telefono: string;
  rol: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RecuperarPasswordRequest {
  correo: string;
}

export interface RecuperarPasswordResponse {
  message: string;
}

export interface RestablecerPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RestablecerPasswordResponse {
  message: string;
}

export interface PasswordRulesValidation {
  len8: boolean;
  upper: boolean;
  digit: boolean;
}

export interface RegistroRequest {
  nombre: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  correo: string;
  telefono?: string;
  password: string;
  rol?: string;
  preguntaSecreta?: string;
  respuestaSecreta?: string;
}

export interface RegistroResponse {
  message: string;
  userId?: number;
  token?: string;
  user?: User;
}
