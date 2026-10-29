import { useState } from 'react';
import { AuthRepository } from '../repositories/authRepository';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * ViewModel para el formulario de Recuperación de Contraseña (MVVM).
 * Encapsula el estado del formulario, validaciones de correo y llamadas al repositorio.
 */
export const useRecuperarPasswordViewModel = () => {
  const [correo, setCorreo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const handleSolicitarRecuperacion = async (): Promise<boolean> => {
    const correoLimpio = correo.trim().toLowerCase();

    if (!correoLimpio) {
      setError('Ingresa tu correo electrónico.');
      return false;
    }

    if (!EMAIL_RE.test(correoLimpio)) {
      setError('Ingresa un correo electrónico válido.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthRepository.solicitarRecuperacion(correoLimpio);
      setEnviado(true);
      setMensajeExito(
        response.message ||
          'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.'
      );
      return true;
    } catch (err: any) {
      const msg =
        err.data?.error ||
        err.data?.message ||
        err.message ||
        'Error al solicitar la recuperación. Inténtalo de nuevo.';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormulario = () => {
    setCorreo('');
    setError(null);
    setEnviado(false);
    setMensajeExito(null);
  };

  return {
    correo,
    setCorreo,
    isLoading,
    error,
    enviado,
    mensajeExito,
    handleSolicitarRecuperacion,
    resetFormulario,
  };
};
