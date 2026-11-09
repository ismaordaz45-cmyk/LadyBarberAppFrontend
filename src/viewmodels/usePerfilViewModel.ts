import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActualizarPerfilRequest,
  ResumenPerfilCliente,
} from '../models/Perfil';
import { CuentaRepository } from '../repositories/cuentaRepository';
import { PerfilRepository } from '../repositories/perfilRepository';
import { sessionStore } from '../services/sessionStore';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const apiError = error as {
      message?: unknown;
      data?: { message?: unknown; error?: unknown };
    };
    if (typeof apiError.data?.message === 'string') return apiError.data.message;
    if (typeof apiError.data?.error === 'string') return apiError.data.error;
    if (typeof apiError.message === 'string') return apiError.message;
  }
  return fallback;
};

const isNullableString = (value: unknown) =>
  value === null || typeof value === 'string';

const isValidProfile = (value: unknown): value is ResumenPerfilCliente => {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Partial<ResumenPerfilCliente>;
  const user = profile.user;
  const stats = profile.stats;
  return Boolean(
    user &&
    typeof user.id === 'number' &&
    typeof user.nombre === 'string' &&
    isNullableString(user.apellidoPaterno) &&
    isNullableString(user.apellidoMaterno) &&
    typeof user.correo === 'string' &&
    isNullableString(user.telefono) &&
    typeof user.rol === 'string' &&
    typeof profile.clienteId === 'number' &&
    stats &&
    typeof stats.total === 'number' &&
    typeof stats.pendientes === 'number' &&
    typeof stats.completadas === 'number'
  );
};

const normalizeName = (
  value: string,
  field: string,
  required = false
): string | null => {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    if (required) throw new Error(`${field} es obligatorio.`);
    return null;
  }
  if (normalized.length > 120) {
    throw new Error(`${field} no puede superar 120 caracteres.`);
  }
  if (!/^[\p{L}\p{M} .'’-]+$/u.test(normalized)) {
    throw new Error(`${field} contiene caracteres no permitidos.`);
  }
  return normalized;
};

const normalizePhone = (value: string): string | null => {
  const compact = value.trim().replace(/[\s().-]/g, '');
  if (!compact) return null;
  if (!/^\+?[0-9]{10,15}$/.test(compact)) {
    throw new Error(
      'El teléfono debe contener entre 10 y 15 dígitos y puede iniciar con +.'
    );
  }
  return compact;
};

export const usePerfilViewModel = () => {
  const [perfil, setPerfil] = useState<ResumenPerfilCliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const loadInFlight = useRef(false);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const saveInFlight = useRef(false);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deleteInFlight = useRef(false);

  const cargarPerfil = useCallback(async (refresh = false): Promise<boolean> => {
    if (loadInFlight.current) return false;
    if (!sessionStore.isAuthenticated) {
      setProfileError('Tu sesión terminó. Inicia sesión nuevamente.');
      setIsLoading(false);
      setIsRefreshing(false);
      return false;
    }

    loadInFlight.current = true;
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    setProfileError('');

    try {
      const response = await PerfilRepository.obtenerPerfil();
      if (!isValidProfile(response)) {
        throw new Error('El servidor devolvió un perfil inesperado.');
      }
      setPerfil(response);
      return true;
    } catch (error) {
      if (!refresh) setPerfil(null);
      setProfileError(
        getErrorMessage(error, 'No fue posible cargar el perfil. Intenta nuevamente.')
      );
      return false;
    } finally {
      loadInFlight.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void cargarPerfil();
  }, [cargarPerfil]);

  const openEditModal = () => {
    if (!perfil) return;
    setNombre(perfil.user.nombre);
    setApellidoPaterno(perfil.user.apellidoPaterno ?? '');
    setApellidoMaterno(perfil.user.apellidoMaterno ?? '');
    setTelefono(perfil.user.telefono ?? '');
    setEditError('');
    setSuccessMessage('');
    setIsEditModalVisible(true);
  };

  const closeEditModal = () => {
    if (saveInFlight.current) return;
    setIsEditModalVisible(false);
    setEditError('');
  };

  const clearEditError = () => setEditError('');

  const updateNombre = (value: string) => {
    setNombre(value);
    clearEditError();
  };
  const updateApellidoPaterno = (value: string) => {
    setApellidoPaterno(value);
    clearEditError();
  };
  const updateApellidoMaterno = (value: string) => {
    setApellidoMaterno(value);
    clearEditError();
  };
  const updateTelefono = (value: string) => {
    setTelefono(value);
    clearEditError();
  };

  const handleGuardarPerfil = async (): Promise<boolean> => {
    if (saveInFlight.current) return false;

    let payload: ActualizarPerfilRequest;
    try {
      payload = {
        nombre: normalizeName(nombre, 'El nombre', true) as string,
        apellidoPaterno: normalizeName(apellidoPaterno, 'El apellido paterno'),
        apellidoMaterno: normalizeName(apellidoMaterno, 'El apellido materno'),
        telefono: normalizePhone(telefono),
      };
    } catch (error) {
      setEditError(getErrorMessage(error, 'Revisa los datos del perfil.'));
      return false;
    }

    const token = sessionStore.token;
    const userId = sessionStore.userId;
    if (!token || !userId) {
      setEditError('Tu sesión terminó. Inicia sesión nuevamente.');
      return false;
    }

    saveInFlight.current = true;
    setIsSaving(true);
    setEditError('');
    setSuccessMessage('');

    try {
      const response = await PerfilRepository.actualizarPerfil(payload);
      if (
        !response ||
        typeof response.message !== 'string' ||
        !isValidProfile(response.perfil) ||
        response.perfil.user.id !== userId
      ) {
        throw new Error('El servidor devolvió una actualización inesperada.');
      }

      setPerfil(response.perfil);
      sessionStore.setSession(
        token,
        userId,
        response.perfil.user.nombre,
        response.perfil.user.rol
      );
      setSuccessMessage(response.message);
      setIsEditModalVisible(false);
      return true;
    } catch (error) {
      setEditError(
        getErrorMessage(error, 'No fue posible guardar el perfil. Intenta nuevamente.')
      );
      return false;
    } finally {
      saveInFlight.current = false;
      setIsSaving(false);
    }
  };

  const resetDeleteForm = () => {
    setPassword('');
    setConfirmation('');
    setDeleteError('');
  };

  const handleCerrarSesion = () => {
    sessionStore.clearSession();
    setPerfil(null);
  };

  const openDeleteModal = () => {
    resetDeleteForm();
    setIsDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    if (deleteInFlight.current) return;
    setIsDeleteModalVisible(false);
    resetDeleteForm();
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    setDeleteError('');
  };

  const updateConfirmation = (value: string) => {
    setConfirmation(value);
    setDeleteError('');
  };

  const handleEliminarCuenta = async (): Promise<boolean> => {
    if (deleteInFlight.current) return false;
    if (!password.trim()) {
      setDeleteError('Ingresa tu contraseña para continuar.');
      return false;
    }
    if (confirmation !== 'ELIMINAR') {
      setDeleteError('Escribe ELIMINAR exactamente para confirmar.');
      return false;
    }
    if (!sessionStore.isAuthenticated) {
      setDeleteError('Tu sesión terminó. Inicia sesión nuevamente.');
      return false;
    }

    deleteInFlight.current = true;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const response = await CuentaRepository.eliminarCuenta(password, confirmation);
      if (response.ok !== true || typeof response.message !== 'string') {
        throw new Error('El servidor devolvió una respuesta inesperada.');
      }

      sessionStore.clearSession();
      setPerfil(null);
      setIsDeleteModalVisible(false);
      resetDeleteForm();
      return true;
    } catch (error) {
      setDeleteError(
        getErrorMessage(error, 'No fue posible eliminar la cuenta. Intenta nuevamente.')
      );
      return false;
    } finally {
      deleteInFlight.current = false;
      setIsDeleting(false);
    }
  };

  const nombreCompleto = perfil
    ? [
        perfil.user.nombre,
        perfil.user.apellidoPaterno,
        perfil.user.apellidoMaterno,
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  return {
    perfil,
    nombreCompleto,
    isLoading,
    isRefreshing,
    profileError,
    successMessage,
    cargarPerfil,
    isEditModalVisible,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    telefono,
    isSaving,
    editError,
    canSave: nombre.trim().length > 0,
    openEditModal,
    closeEditModal,
    updateNombre,
    updateApellidoPaterno,
    updateApellidoMaterno,
    updateTelefono,
    handleGuardarPerfil,
    isDeleteModalVisible,
    password,
    confirmation,
    isDeleting,
    deleteError,
    canDelete: password.trim().length > 0 && confirmation === 'ELIMINAR',
    handleCerrarSesion,
    openDeleteModal,
    closeDeleteModal,
    updatePassword,
    updateConfirmation,
    handleEliminarCuenta,
  };
};
