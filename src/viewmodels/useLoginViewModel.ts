import { useRef, useState } from 'react';
import { AuthRepository } from '../repositories/authRepository';
import { User } from '../models/Auth';
import { sessionStore } from '../services/sessionStore';

export const useLoginViewModel = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  const handleLogin = async () => {
    if (!correo.trim() || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return false;
    }

    if (requestInFlight.current) {
      return false;
    }

    requestInFlight.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthRepository.login(correo.trim().toLowerCase(), password);

      if (
        typeof response?.token !== 'string' ||
        !response.token.trim() ||
        !response.user ||
        typeof response.user.id !== 'number' ||
        typeof response.user.nombre !== 'string' ||
        typeof response.user.rol !== 'string'
      ) {
        throw new Error('Respuesta de autenticación inválida.');
      }

      // Persistir token y datos en el Singleton de sesión
      sessionStore.setSession(
        response.token,
        response.user.id,
        response.user.nombre,
        response.user.rol
      );

      return response.user; // Éxito
    } catch (err: any) {
      const serverMsg = err.data?.message || err.message || 'Error al iniciar sesión';
      setError(serverMsg);
      return false;
    } finally {
      requestInFlight.current = false;
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return {
    correo,
    setCorreo,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    isLoading,
    error,
    handleLogin,
  };
};
