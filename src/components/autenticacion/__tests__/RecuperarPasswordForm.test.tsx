import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { useRecuperarPasswordViewModel } from '../../../viewmodels/useRecuperarPasswordViewModel';
import { RecuperarPasswordForm } from '../RecuperarPasswordForm';

jest.mock('../../../viewmodels/useRecuperarPasswordViewModel', () => ({
  useRecuperarPasswordViewModel: jest.fn(),
}));

jest.mock('../../compartidos/BarberActionOverlay', () => ({
  BarberActionOverlay: () => null,
}));

const useViewModelMock = useRecuperarPasswordViewModel as jest.Mock;

const findButtonByText = (root: any, label: string) =>
  root.findAllByType(TouchableOpacity).find((button: any) =>
    button.findAllByType(Text).some((text: any) => text.props.children === label)
  );

const createViewModel = (handle: jest.Mock) => ({
  correo: 'cliente@example.invalid',
  setCorreo: jest.fn(),
  isLoading: false,
  error: null,
  enviado: false,
  mensajeExito: null,
  handleSolicitarRecuperacion: handle,
});

describe('HU-02 RecuperarPasswordForm', () => {
  let renderer: any;

  afterEach(() => {
    if (renderer) {
      act(() => renderer.unmount());
      renderer = null;
    }
    jest.restoreAllMocks();
  });

  it('ejecuta onSuccess despues de una solicitud confirmada', async () => {
    const handle = jest.fn().mockResolvedValue(true);
    const onSuccess = jest.fn();
    useViewModelMock.mockReturnValue(createViewModel(handle));
    act(() => { renderer = create(<RecuperarPasswordForm onSuccess={onSuccess} />); });
    const button = findButtonByText(renderer.root, 'Enviar instrucciones');
    let callback: (() => void) | undefined;
    const timeoutSpy = jest.spyOn(globalThis, 'setTimeout').mockImplementation((fn) => {
      callback = fn as () => void;
      return 101 as any;
    });

    await act(async () => { await button.props.onPress(); });
    expect(handle).toHaveBeenCalledTimes(1);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1500);
    expect(onSuccess).not.toHaveBeenCalled();

    act(() => callback?.());
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('no ejecuta onSuccess cuando la solicitud falla', async () => {
    const handle = jest.fn().mockResolvedValue(false);
    const onSuccess = jest.fn();
    useViewModelMock.mockReturnValue(createViewModel(handle));
    act(() => { renderer = create(<RecuperarPasswordForm onSuccess={onSuccess} />); });
    const button = findButtonByText(renderer.root, 'Enviar instrucciones');

    await act(async () => { await button.props.onPress(); });
    expect(handle).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('cancela el temporizador pendiente al desmontarse', async () => {
    const handle = jest.fn().mockResolvedValue(true);
    useViewModelMock.mockReturnValue(createViewModel(handle));
    const timeoutSpy = jest.spyOn(globalThis, 'setTimeout').mockReturnValue(202 as any);
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout').mockImplementation(() => undefined);
    act(() => { renderer = create(<RecuperarPasswordForm onSuccess={jest.fn()} />); });
    const button = findButtonByText(renderer.root, 'Enviar instrucciones');

    await act(async () => { await button.props.onPress(); });
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1500);
    act(() => renderer.unmount());
    renderer = null;

    expect(clearTimeoutSpy).toHaveBeenCalledWith(202);
  });
});
