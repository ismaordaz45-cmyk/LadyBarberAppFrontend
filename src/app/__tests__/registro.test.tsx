import React from 'react';
import { act, create } from 'react-test-renderer';
import { useRouter } from 'expo-router';
import RegistroScreen from '../registro';

let mockRegistroFormProps: any;

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../components/autenticacion/RegistroForm', () => ({
  RegistroForm: (props: any) => {
    mockRegistroFormProps = props;
    return null;
  },
}));

const useRouterMock = useRouter as jest.Mock;

describe('HU-01 RegistroScreen navegacion', () => {
  let renderer: any;
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRegistroFormProps = undefined;
    useRouterMock.mockReturnValue({ replace });
  });

  afterEach(() => {
    if (renderer) {
      act(() => renderer.unmount());
      renderer = null;
    }
  });

  it('conecta el regreso y el registro exitoso con la ruta de login', () => {
    act(() => { renderer = create(<RegistroScreen />); });

    act(() => mockRegistroFormProps.onBackToLogin());
    expect(replace).toHaveBeenLastCalledWith('/login');

    act(() => mockRegistroFormProps.onSuccess());
    expect(replace).toHaveBeenLastCalledWith('/login');
    expect(replace).toHaveBeenCalledTimes(2);
  });
});
