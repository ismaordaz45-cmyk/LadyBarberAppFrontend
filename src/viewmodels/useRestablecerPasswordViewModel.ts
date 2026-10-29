import { useMemo, useRef, useState } from 'react';
import { AuthRepository } from '../repositories/authRepository';
import { PasswordRulesValidation } from '../models/Auth';

/**
 * ViewModel para el formulario de Restablecer Contraseña (MVVM).
 * Encapsula la validación reactiva de reglas de fortaleza de contraseña,
 * confirmación de coincidencia y la llamada al repositorio.
 */
export const useRestablecerPasswordViewModel = (initialToken: string = '') => {
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitoso, setExitoso] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  // Reglas de contraseña idénticas al frontend web
  const passwordRules: PasswordRulesValidation = useMemo(
    () => ({
      len8: password.length >= 8,
      upper: /[A-Z]/.test(password),
      digit: /\d/.test(password),
    }),
    [password]
  );

  const confirmHasInput = passwordConfirm.length > 0;
  const passwordsMatch = confirmHasInput && password === passwordConfirm;
  const confirmMismatch = confirmHasInput && password !== passwordConfirm;
  const allRulesPassed = passwordRules.len8 && passwordRules.upper && passwordRules.digit;
  const canSubmit = Boolean(token.trim() && allRulesPassed && passwordsMatch && !isLoading);

  const toggleShowPassword = () => setShowPassword((prev) => !prev);
  const toggleShowPasswordConfirm = () => setShowPasswordConfirm((prev) => !prev);

  const handleRestablecerPassword = async (): Promise<boolean> => {
    if (requestInFlight.current) {
      return false;
    }

    const tokenLimpio = token.trim();

    if (!tokenLimpio) {
      setError('El token es obligatorio para restablecer tu contraseña.');
      return false;
    }

    if (!allRulesPassed) {
      setError('La contraseña debe cumplir con todos los requisitos de seguridad.');
      return false;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden.');
      return false;
    }

    requestInFlight.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthRepository.restablecerPassword(tokenLimpio, password);

      if (typeof response?.message !== 'string' || !response.message.trim()) {
        throw new Error('Respuesta de restablecimiento inválida.');
      }

      setExitoso(true);
      setMensajeExito(response.message);
      return true;
    } catch (err: any) {
      const msg =
        err.data?.error ||
        err.data?.message ||
        err.message ||
        'Error al restablecer la contraseña. Verifica que el enlace no haya expirado.';
      setError(msg);
      return false;
    } finally {
      requestInFlight.current = false;
      setIsLoading(false);
    }
  };

  const resetFormulario = () => {
    setPassword('');
    setPasswordConfirm('');
    setError(null);
    setExitoso(false);
    setMensajeExito(null);
  };

  return {
    token,
    setToken,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    showPassword,
    toggleShowPassword,
    showPasswordConfirm,
    toggleShowPasswordConfirm,
    isLoading,
    error,
    exitoso,
    mensajeExito,
    passwordRules,
    confirmHasInput,
    passwordsMatch,
    confirmMismatch,
    allRulesPassed,
    canSubmit,
    handleRestablecerPassword,
    resetFormulario,
  };
};
