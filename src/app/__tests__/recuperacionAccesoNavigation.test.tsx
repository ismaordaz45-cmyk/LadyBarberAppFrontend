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

jest.mock('../../components/compartidos/BarberPole', () => ({ BarberPole: () => null }));
jest.mock('../../components/compartidos/BarberActionOverlay', () => ({
  BarberActionOverlay: () => null,
}));

const useRouterMock = useRouter as jest.Mock;
const useLoginViewModelMock = useLoginViewModel as jest.Mock;

describe('HU-02 entrada desde LoginScreen', () => {
  let renderer: any;
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({ push, replace: jest.fn() });
    useLoginViewModelMock.mockReturnValue({
      correo: '',
      setCorreo: jest.fn(),
      password: '',
      setPassword: jest.fn(),
      showPassword: false,
      togglePasswordVisibility: jest.fn(),
      isLoading: false,
      error: null,
      handleLogin: jest.fn(),
    });
  });

  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    renderer = null;
  });

  it('abre la ruta real de recuperacion desde el enlace de password olvidado', () => {
    act(() => { renderer = create(<LoginScreen />); });
    const button = renderer.root.findAllByType(TouchableOpacity).find((item: any) =>
      item.findAllByType(Text).some((text: any) =>
        text.props.children === '¿Olvidaste tu contraseña?'
      )
    );

    act(() => button.props.onPress());
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/recuperar-password');
  });
});
