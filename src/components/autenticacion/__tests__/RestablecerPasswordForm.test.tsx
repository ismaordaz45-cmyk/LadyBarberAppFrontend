import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { useRestablecerPasswordViewModel } from '../../../viewmodels/useRestablecerPasswordViewModel';
import { RestablecerPasswordForm } from '../RestablecerPasswordForm';

jest.mock('../../../viewmodels/useRestablecerPasswordViewModel', () => ({
  useRestablecerPasswordViewModel: jest.fn(),
}));

jest.mock('../../compartidos/BarberActionOverlay', () => ({
  BarberActionOverlay: () => null,
}));

const useViewModelMock = useRestablecerPasswordViewModel as jest.Mock;

const findButtonByText = (root: any, label: string) =>
  root.findAllByType(TouchableOpacity).find((button: any) =>
    button.findAllByType(Text).some((text: any) => text.props.children === label)
  );

const createViewModel = (handle: jest.Mock) => ({
  token: 'token_ficticio',
  setToken: jest.fn(),
  password: 'NuevaClave1',
  setPassword: jest.fn(),
  passwordConfirm: 'NuevaClave1',
  setPasswordConfirm: jest.fn(),
  showPassword: false,
  toggleShowPassword: jest.fn(),
  showPasswordConfirm: false,
  toggleShowPasswordConfirm: jest.fn(),
  isLoading: false,
  error: null,
  exitoso: false,
  mensajeExito: null,
  passwordRules: { len8: true, upper: true, digit: true },
  confirmHasInput: true,
  passwordsMatch: true,
  confirmMismatch: false,
  canSubmit: true,
  handleRestablecerPassword: handle,
});

describe('HU-02 RestablecerPasswordForm', () => {
  let renderer: any;

  afterEach(() => {
    if (renderer) {
      act(() => renderer.unmount());
      renderer = null;
    }
    jest.restoreAllMocks();
  });

  it('ejecuta onSuccess despues de restablecer correctamente', async () => {
    const handle = jest.fn().mockResolvedValue(true);
    const onSuccess = jest.fn();
    useViewModelMock.mockReturnValue(createViewModel(handle));
    act(() => { renderer = create(<RestablecerPasswordForm onSuccess={onSuccess} />); });
    const button = findButtonByText(renderer.root, 'Restablecer contraseña');
    let callback: (() => void) | undefined;
    const timeoutSpy = jest.spyOn(globalThis, 'setTimeout').mockImplementation((fn) => {
      callback = fn as () => void;
      return 303 as any;
    });

    await act(async () => { await button.props.onPress(); });
    expect(handle).toHaveBeenCalledTimes(1);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1500);
    expect(onSuccess).not.toHaveBeenCalled();

    act(() => callback?.());
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('no ejecuta onSuccess cuando el restablecimiento falla', async () => {
    const handle = jest.fn().mockResolvedValue(false);
    const onSuccess = jest.fn();
    useViewModelMock.mockReturnValue(createViewModel(handle));
    act(() => { renderer = create(<RestablecerPasswordForm onSuccess={onSuccess} />); });
    const button = findButtonByText(renderer.root, 'Restablecer contraseña');

    await act(async () => { await button.props.onPress(); });
    expect(handle).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('cancela el temporizador pendiente al desmontarse', async () => {
    const handle = jest.fn().mockResolvedValue(true);
    useViewModelMock.mockReturnValue(createViewModel(handle));
    const timeoutSpy = jest.spyOn(globalThis, 'setTimeout').mockReturnValue(404 as any);
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout').mockImplementation(() => undefined);
    act(() => { renderer = create(<RestablecerPasswordForm onSuccess={jest.fn()} />); });
    const button = findButtonByText(renderer.root, 'Restablecer contraseña');

    await act(async () => { await button.props.onPress(); });
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1500);
    act(() => renderer.unmount());
    renderer = null;

    expect(clearTimeoutSpy).toHaveBeenCalledWith(404);
  });
});
