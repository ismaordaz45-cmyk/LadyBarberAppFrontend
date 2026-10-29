import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { useRouter } from 'expo-router';
import { useLoginViewModel } from '../../viewmodels/useLoginViewModel';
import LoginScreen from '../login';

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

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({ replace, push: jest.fn() });
  });

  afterEach(() => {
    if (renderer) {
      act(() => renderer.unmount());
      renderer = null;
    }
    jest.restoreAllMocks();
  });

  it('navega a tabs solamente despues de un login valido', async () => {
    const handleLogin = jest.fn().mockResolvedValue({ nombre: 'Cliente QA' });
    useLoginViewModelMock.mockReturnValue(createViewModel(handleLogin));
    act(() => { renderer = create(<LoginScreen />); });
    const button = findButtonByText(renderer.root, 'Iniciar Sesión');
    let navigationCallback: (() => void) | undefined;
    const timeoutSpy = jest.spyOn(globalThis, 'setTimeout').mockImplementation((callback) => {
      navigationCallback = callback as () => void;
      return 1 as any;
    });

    await act(async () => { await button.props.onPress(); });
    expect(handleLogin).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1400);

    act(() => navigationCallback?.());
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('no navega cuando la autenticacion falla', async () => {
    const handleLogin = jest.fn().mockResolvedValue(false);
    useLoginViewModelMock.mockReturnValue(createViewModel(handleLogin));
    act(() => { renderer = create(<LoginScreen />); });
    const button = findButtonByText(renderer.root, 'Iniciar Sesión');

    await act(async () => { await button.props.onPress(); });

    expect(handleLogin).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });
});
