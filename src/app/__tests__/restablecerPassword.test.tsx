import React from 'react';
import { act, create } from 'react-test-renderer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import RestablecerPasswordScreen from '../restablecer-password';

let mockFormProps: any;

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../../components/autenticacion/RestablecerPasswordForm', () => ({
  RestablecerPasswordForm: (props: any) => {
    mockFormProps = props;
    return null;
  },
}));

const useRouterMock = useRouter as jest.Mock;
const useParamsMock = useLocalSearchParams as jest.Mock;

describe('HU-02 RestablecerPasswordScreen', () => {
  let renderer: any;
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormProps = undefined;
    useRouterMock.mockReturnValue({ replace });
    useParamsMock.mockReturnValue({ token: 'token_parametro_ficticio' });
  });

  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    renderer = null;
  });

  it('transmite el token y navega a login solo mediante callbacks definidos', () => {
    act(() => { renderer = create(<RestablecerPasswordScreen />); });

    expect(mockFormProps.initialToken).toBe('token_parametro_ficticio');
    act(() => mockFormProps.onBackToLogin());
    expect(replace).toHaveBeenLastCalledWith('/login');
    act(() => mockFormProps.onSuccess());
    expect(replace).toHaveBeenLastCalledWith('/login');
    expect(replace).toHaveBeenCalledTimes(2);
  });

  it('usa token vacio cuando el parametro no existe', () => {
    useParamsMock.mockReturnValue({});
    act(() => { renderer = create(<RestablecerPasswordScreen />); });

    expect(mockFormProps.initialToken).toBe('');
  });
});
