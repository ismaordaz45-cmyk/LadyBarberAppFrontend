import React from 'react';
import { act, create } from 'react-test-renderer';
import { useRouter } from 'expo-router';
import RecuperarPasswordScreen from '../recuperar-password';

let mockFormProps: any;

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../components/autenticacion/RecuperarPasswordForm', () => ({
  RecuperarPasswordForm: (props: any) => {
    mockFormProps = props;
    return null;
  },
}));

const useRouterMock = useRouter as jest.Mock;

describe('HU-02 RecuperarPasswordScreen', () => {
  let renderer: any;
  const back = jest.fn();
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormProps = undefined;
    useRouterMock.mockReturnValue({ back, replace });
  });

  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    renderer = null;
  });

  it('regresa mediante Expo Router y no inventa navegacion tras enviar correo', () => {
    act(() => { renderer = create(<RecuperarPasswordScreen />); });

    act(() => mockFormProps.onBackToLogin());
    expect(back).toHaveBeenCalledTimes(1);

    act(() => mockFormProps.onSuccess());
    expect(replace).not.toHaveBeenCalled();
  });
});
