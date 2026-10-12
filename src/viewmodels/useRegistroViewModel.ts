import { useState, useMemo } from 'react';
import { AuthRepository } from '../repositories/authRepository';
import { PasswordRulesValidation, RegistroRequest } from '../models/Auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegistroFormData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono: string;
  correo: string;
  password: string;
  passwordConfirm: string;
  preguntaSecreta: string;
  respuestaSecreta: string;
}

const initialFormData: RegistroFormData = {
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  telefono: '',
  correo: '',
  password: '',
  passwordConfirm: '',
  preguntaSecreta: '',
  respuestaSecreta: '',
};

/**
 * ViewModel para el formulario de Registro de Usuario (MVVM).
 * Gestiona reactivamente el estado de los campos, validaciones de reglas,
 * formato de teléfono, fortaleza de contraseña y llamada al repositorio.
 */
export const useRegistroViewModel = () => {
  const [formData, setFormData] = useState<RegistroFormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitoso, setExitoso] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const updateField = (field: keyof RegistroFormData, value: string) => {
    if (field === 'telefono') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, telefono: digitsOnly }));
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Reglas de seguridad de contraseña
  const passwordRules: PasswordRulesValidation = useMemo(
    () => ({
      len8: formData.password.length >= 8,
      upper: /[A-Z]/.test(formData.password),
      digit: /\d/.test(formData.password),
    }),
    [formData.password]
  );

  // Nivel de fuerza de contraseña para la barra del diseño (0 a 4 segmentos)
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { score: 0, label: 'Débil' };
    let score = 0;
    if (p.length >= 6) score += 1;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/\d/.test(p)) score += 1;

    let label = 'Débil';
    if (score === 2) label = 'Moderada';
    if (score === 3) label = 'Buena';
    if (score >= 4) label = 'Segura';

    return { score, label };
  }, [formData.password]);


  const confirmHasInput = formData.passwordConfirm.length > 0;
  const passwordsMatch = confirmHasInput && formData.password === formData.passwordConfirm;
  const confirmMismatch = confirmHasInput && formData.password !== formData.passwordConfirm;
  const isCorreoValid = EMAIL_RE.test(formData.correo.trim());
  const isTelefonoValid = !formData.telefono || /^\d{10}$/.test(formData.telefono);
  const allPasswordRulesPassed =
    passwordRules.len8 && passwordRules.upper && passwordRules.digit;

  // Si define pregunta secreta, debe definir respuesta y viceversa
  const pregunta = formData.preguntaSecreta.trim();
  const respuesta = formData.respuestaSecreta.trim();
  const preguntaRespuestaValida = (!pregunta && !respuesta) || (pregunta.length > 0 && respuesta.length > 0);

  const canSubmit = Boolean(
    formData.nombre.trim() &&
      isCorreoValid &&
      isTelefonoValid &&
      allPasswordRulesPassed &&
      passwordsMatch &&
      preguntaRespuestaValida &&
      !isLoading
  );

  const toggleShowPassword = () => setShowPassword((prev) => !prev);
  const toggleShowPasswordConfirm = () => setShowPasswordConfirm((prev) => !prev);

  const handleRegistro = async (): Promise<boolean> => {
    const nombreTrim = formData.nombre.trim();
    const correoTrim = formData.correo.trim().toLowerCase();
    const telTrim = formData.telefono.trim();

    if (!nombreTrim) {
      setError('El nombre completo es obligatorio.');
      return false;
    }

    if (!correoTrim) {
      setError('El correo electrónico es obligatorio.');
      return false;
    }

    if (!EMAIL_RE.test(correoTrim)) {
      setError('Ingresa un correo electrónico con formato válido (ej. usuario@ejemplo.com).');
      return false;
    }

    if (telTrim.length > 0 && telTrim.length !== 10) {
      setError('El teléfono debe tener exactamente 10 dígitos numéricos, o déjalo vacío si no aplica.');
      return false;
    }

    if (!formData.password) {
      setError('La contraseña es obligatoria.');
      return false;
    }

    if (!allPasswordRulesPassed) {
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.');
      return false;
    }

    if (!formData.passwordConfirm) {
      setError('Debes confirmar tu contraseña.');
      return false;
    }

    if (!passwordsMatch) {
      setError('La confirmación de contraseña no coincide con la contraseña.');
      return false;
    }

    if (pregunta && !respuesta) {
      setError('Si defines una pregunta secreta, debes ingresar también la respuesta.');
      return false;
    }

    if (respuesta && !pregunta) {
      setError('Si defines una respuesta secreta, debes ingresar la pregunta.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    const payload: RegistroRequest = {
      nombre: nombreTrim,
      apellidoPaterno: formData.apellidoPaterno.trim() || undefined,
      apellidoMaterno: formData.apellidoMaterno.trim() || undefined,
      correo: correoTrim,
      telefono: telTrim.length === 10 ? telTrim : undefined,
      password: formData.password,
      rol: 'CLIENTE',
      preguntaSecreta: pregunta || undefined,
      respuestaSecreta: respuesta || undefined,
    };

    try {
      const response = await AuthRepository.registro(payload);
      setExitoso(true);
      setMensajeExito(response.message || 'Usuario registrado exitosamente.');
      return true;
    } catch (err: any) {
      const msg =
        err.data?.error ||
        err.data?.message ||
        err.message ||
        'Error al crear la cuenta. Inténtalo de nuevo.';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormulario = () => {
    setFormData(initialFormData);
    setError(null);
    setExitoso(false);
    setMensajeExito(null);
  };

  return {
    formData,
    updateField,
    showPassword,
    toggleShowPassword,
    showPasswordConfirm,
    toggleShowPasswordConfirm,
    isLoading,
    error,
    exitoso,
    mensajeExito,
    passwordRules,
    passwordStrength,
    confirmHasInput,
    passwordsMatch,
    confirmMismatch,
    isCorreoValid,
    isTelefonoValid,
    canSubmit,
    handleRegistro,
    resetFormulario,
  };
};
