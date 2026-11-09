import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { usePerfilViewModel } from '../../viewmodels/usePerfilViewModel';
import PerfilScreen from '../(tabs)/perfil';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('../../viewmodels/usePerfilViewModel', () => ({
  usePerfilViewModel: jest.fn(),
}));
jest.mock('../../components/compartidos/BarberActionOverlay', () => ({
  BarberActionOverlay: () => null,
}));
jest.mock('../../components/perfil/EditarPerfilModal', () => ({
  EditarPerfilModal: (props: any) => {
    const MockReact = require('react');
    const { Pressable } = require('react-native');
    return MockReact.createElement(Pressable, {
      testID: 'modal-edit',
      onPress: props.onSave,
    });
  },
}));
jest.mock('../../components/perfil/EliminarCuentaModal', () => ({
  EliminarCuentaModal: (props: any) => {
    const MockReact = require('react');
    const { Pressable } = require('react-native');
    return MockReact.createElement(Pressable, {
      testID: 'modal-delete',
      onPress: props.onDelete,
    });
  },
}));

const useRouterMock = useRouter as jest.Mock;
const usePerfilViewModelMock = usePerfilViewModel as jest.Mock;

const findButtonByText = (root: any, label: string) =>
  root.findAllByType(TouchableOpacity).find((button: any) =>
    button.findAllByType(Text).some((text: any) => text.props.children === label)
  );

const profile = {
  user: {
    id: 7,
    nombre: 'Cliente',
    apellidoPaterno: 'Prueba',
    apellidoMaterno: null,
    correo: 'cliente@example.invalid',
    telefono: '7710000000',
    rol: 'CLIENTE',
  },
  clienteId: 12,
  stats: { total: 3, pendientes: 1, completadas: 2 },
  nextCita: null,
  actualizadoEn: '2026-11-07T00:00:00.000Z',
};

const createViewModel = (overrides: Record<string, unknown> = {}) => ({
  perfil: profile,
  nombreCompleto: 'Cliente Prueba',
  isLoading: false,
  isRefreshing: false,
  profileError: '',
  successMessage: '',
  cargarPerfil: jest.fn(),
  isEditModalVisible: false,
  nombre: 'Cliente',
  apellidoPaterno: 'Prueba',
  apellidoMaterno: '',
  telefono: '7710000000',
  isSaving: false,
  editError: '',
  canSave: true,
  openEditModal: jest.fn(),
  closeEditModal: jest.fn(),
  updateNombre: jest.fn(),
  updateApellidoPaterno: jest.fn(),
  updateApellidoMaterno: jest.fn(),
  updateTelefono: jest.fn(),
  handleGuardarPerfil: jest.fn(),
  isDeleteModalVisible: false,
  password: '',
  confirmation: '',
  isDeleting: false,
  deleteError: '',
  canDelete: false,
  handleCerrarSesion: jest.fn(),
  openDeleteModal: jest.fn(),
  closeDeleteModal: jest.fn(),
  updatePassword: jest.fn(),
  updateConfirmation: jest.fn(),
  handleEliminarCuenta: jest.fn(),
  ...overrides,
});

describe('HU-03 PerfilScreen', () => {
  let renderer: any;
  const replace = jest.fn();
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({ replace, push });
  });

  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    renderer = null;
    jest.restoreAllMocks();
  });

  it('muestra datos reales, estadísticas y abre la edición', () => {
    const viewModel = createViewModel();
    usePerfilViewModelMock.mockReturnValue(viewModel);
    act(() => { renderer = create(<PerfilScreen />); });

    expect(renderer.root.findAllByType(Text).some(
      (text: any) => text.props.children === 'Cliente Prueba'
    )).toBe(true);
    expect(renderer.root.findAllByType(Text).some(
      (text: any) => text.props.children === 'cliente@example.invalid'
    )).toBe(true);
    const editButton = findButtonByText(renderer.root, 'Editar');
    act(() => editButton.props.onPress());
    expect(viewModel.openEditModal).toHaveBeenCalledTimes(1);
  });

  it('muestra carga inicial sin presentar datos incompletos', () => {
    usePerfilViewModelMock.mockReturnValue(createViewModel({
      perfil: null,
      isLoading: true,
      nombreCompleto: '',
    }));
    act(() => { renderer = create(<PerfilScreen />); });

    expect(renderer.root.findAllByType(Text).some(
      (text: any) => text.props.children === 'Cargando tu perfil...'
    )).toBe(true);
  });

  it('permite reintentar después de un error de carga', () => {
    const cargarPerfil = jest.fn();
    usePerfilViewModelMock.mockReturnValue(createViewModel({
      perfil: null,
      profileError: 'No se pudo conectar',
      nombreCompleto: '',
      cargarPerfil,
    }));
    act(() => { renderer = create(<PerfilScreen />); });

    const retryButton = findButtonByText(renderer.root, 'Reintentar');
    act(() => retryButton.props.onPress());
    expect(cargarPerfil).toHaveBeenCalledTimes(1);
  });

  it('muestra un estado explícito cuando no existen datos ni error', () => {
    usePerfilViewModelMock.mockReturnValue(createViewModel({
      perfil: null,
      nombreCompleto: '',
    }));
    act(() => { renderer = create(<PerfilScreen />); });

    expect(renderer.root.findAllByType(Text).some(
      (text: any) => text.props.children === 'Perfil no disponible'
    )).toBe(true);
  });

  it('abre la confirmación de eliminación desde la zona de seguridad', () => {
    const viewModel = createViewModel();
    usePerfilViewModelMock.mockReturnValue(viewModel);
    act(() => { renderer = create(<PerfilScreen />); });

    const button = findButtonByText(renderer.root, 'Eliminar cuenta');
    act(() => button.props.onPress());
    expect(viewModel.openDeleteModal).toHaveBeenCalledTimes(1);
  });

  it('mantiene accesibles privacidad y términos desde el perfil', () => {
    usePerfilViewModelMock.mockReturnValue(createViewModel());
    act(() => { renderer = create(<PerfilScreen />); });

    act(() => findButtonByText(renderer.root, 'Política de privacidad').props.onPress());
    act(() => findButtonByText(renderer.root, 'Términos y condiciones').props.onPress());
    expect(push).toHaveBeenNthCalledWith(1, '/privacidad');
    expect(push).toHaveBeenNthCalledWith(2, '/terminos');
  });

  it('vuelve al login únicamente después de eliminar correctamente', async () => {
    const handle = jest.fn().mockResolvedValue(true);
    usePerfilViewModelMock.mockReturnValue(createViewModel({
      handleEliminarCuenta: handle,
    }));
    act(() => { renderer = create(<PerfilScreen />); });

    await act(async () => {
      await renderer.root.findByProps({ testID: 'modal-delete' }).props.onPress();
    });
    expect(handle).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('permanece en perfil cuando la eliminación falla', async () => {
    const handle = jest.fn().mockResolvedValue(false);
    usePerfilViewModelMock.mockReturnValue(createViewModel({
      handleEliminarCuenta: handle,
    }));
    act(() => { renderer = create(<PerfilScreen />); });

    await act(async () => {
      await renderer.root.findByProps({ testID: 'modal-delete' }).props.onPress();
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it('limpia la sesión antes de navegar al login al cerrar sesión', () => {
    const viewModel = createViewModel();
    usePerfilViewModelMock.mockReturnValue(viewModel);
    let timeoutCallback: (() => void) | undefined;
    jest.spyOn(globalThis, 'setTimeout').mockImplementation((callback) => {
      timeoutCallback = callback as () => void;
      return 1 as any;
    });
    act(() => { renderer = create(<PerfilScreen />); });

    const button = findButtonByText(renderer.root, 'Cerrar sesión');
    act(() => button.props.onPress());
    expect(viewModel.handleCerrarSesion).not.toHaveBeenCalled();
    act(() => timeoutCallback?.());
    expect(viewModel.handleCerrarSesion).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/login');
  });
});
