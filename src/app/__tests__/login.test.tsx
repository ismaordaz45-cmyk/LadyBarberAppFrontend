import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { useRouter } from 'expo-router';
import { useLoginViewModel } from '../../viewmodels/useLoginViewModel';
import LoginScreen from '../login';
import { useNegocioViewModel } from '../../viewmodels/useNegocioViewModel';
jest.mock('../../viewmodels/useNegocioViewModel', () => ({ useNegocioViewModel: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../viewmodels/useLoginViewModel', () => ({
  useLoginViewModel: jest.fn(),
}));

jest.mock('../../components/compartidos/BarberPole', () => ({
  BarberPole: () => null,
}));

jest.mock('../../components/compartidos/BarberActionOverlay', () => ({
  BarberActionOverlay: () => null,
}));

const useRouterMock = useRouter as jest.Mock;
const useLoginViewModelMock = useLoginViewModel as jest.Mock;

const findButtonByText = (root: any, label: string) => {
  return root.findAllByType(TouchableOpacity).find((button: any) =>
    button.findAllByType(Text).some((text: any) => text.props.children === label)
  );
};

const createViewModel = (handleLogin: jest.Mock) => ({
  correo: 'cliente@example.invalid',
  setCorreo: jest.fn(),
  password: 'Clave123',
  setPassword: jest.fn(),
  showPassword: false,
  togglePasswordVisibility: jest.fn(),
  isLoading: false,
  error: null,
  handleLogin,
});

describe('HU-01 LoginScreen navegacion', () => {
  let renderer: any;
  const replace = jest.fn();
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({ replace, push });
    jest.mocked(useNegocioViewModel).mockReturnValue({ negocio: null, error: null });
  });

  afterEach(() => {
    if (renderer) {
      act(() => renderer.unmount());
      renderer = null;
    }
    jest.restoreAllMocks();
  });

  it('navega a tabs solamente despues de un login valido', async () => {
    let resolver!: (user: { nombre: string }) => void;
    const handleLogin = jest.fn().mockReturnValue(new Promise(resolve => { resolver = resolve; }));
    useLoginViewModelMock.mockReturnValue(createViewModel(handleLogin));
    act(() => { renderer = create(<LoginScreen />); });
    const button = findButtonByText(renderer.root, 'Inicio de sesión');
    let pendiente!: Promise<void>;
    act(() => { pendiente = button.props.onPress(); });
    expect(handleLogin).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
    await act(async () => { resolver({ nombre: 'Cliente QA' }); await pendiente; });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('no navega cuando la autenticacion falla', async () => {
    const handleLogin = jest.fn().mockResolvedValue(false);
    useLoginViewModelMock.mockReturnValue(createViewModel(handleLogin));
    act(() => { renderer = create(<LoginScreen />); });
    const button = findButtonByText(renderer.root, 'Inicio de sesión');

    await act(async () => { await button.props.onPress(); });

    expect(handleLogin).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it('permite consultar términos y privacidad sin iniciar sesión', () => {
    useLoginViewModelMock.mockReturnValue(createViewModel(jest.fn()));
    act(() => { renderer = create(<LoginScreen />); });

    act(() => findButtonByText(renderer.root, 'Términos').props.onPress());
    act(() => findButtonByText(renderer.root, 'Privacidad').props.onPress());
    expect(push).toHaveBeenNthCalledWith(1, '/terminos');
    expect(push).toHaveBeenNthCalledWith(2, '/privacidad');
  });
  it('presenta el nombre público del negocio sin textos exclusivos ni encabezado duplicado', () => {
    useLoginViewModelMock.mockReturnValue(createViewModel(jest.fn()));
    jest.mocked(useNegocioViewModel).mockReturnValue({ negocio: { id: 1, nombre: 'Salón actualizado desde la base', logo: null, direccion: null, telefono: null, horarioAtencion: null }, error: null });
    act(() => { renderer = create(<LoginScreen />); });
    const textos = () => renderer.root.findAllByType(Text).map((node: any) => node.props.children).filter((value: unknown) => typeof value === 'string');
    expect(textos()).toContain('Acceso seguro · Salón actualizado desde la base');
    expect(textos().join(' ')).not.toMatch(/exclusiv/i);
    expect(renderer.root.findAllByType(Text).filter((node: any) => node.props.accessibilityRole === 'header')).toHaveLength(1);
    jest.mocked(useNegocioViewModel).mockReturnValue({ negocio: null, error: 'No disponible' });
    act(() => renderer.update(<LoginScreen />));
    expect(textos()).toContain('Acceso seguro');
    expect(textos().join(' ')).not.toContain('Salón actualizado');
    expect(findButtonByText(renderer.root, 'Inicio de sesión')).toBeDefined();
  });
});
