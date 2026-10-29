import { useState } from 'react';
import { AuthRepository } from '../repositories/authRepository';
import { User } from '../models/Auth';
import { sessionStore } from '../services/sessionStore';

export const useLoginViewModel = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!correo || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthRepository.login(correo.trim().toLowerCase(), password);

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
