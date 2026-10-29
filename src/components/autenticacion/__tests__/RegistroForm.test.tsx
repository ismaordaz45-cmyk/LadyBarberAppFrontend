import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { useRegistroViewModel } from '../../../viewmodels/useRegistroViewModel';
import { RegistroForm } from '../RegistroForm';

jest.mock('../../../viewmodels/useRegistroViewModel', () => ({
  useRegistroViewModel: jest.fn(),
}));

jest.mock('../../compartidos/BarberPole', () => ({
  BarberPole: () => null,
}));

jest.mock('../../compartidos/BarberActionOverlay', () => ({
  BarberActionOverlay: () => null,
}));

const useRegistroViewModelMock = useRegistroViewModel as jest.Mock;

const findButtonByText = (root: any, label: string) => {
  return root.findAllByType(TouchableOpacity).find((button: any) =>
    button.findAllByType(Text).some((text: any) => text.props.children === label)
  );
};

const createViewModel = (handleRegistro: jest.Mock) => ({
  formData: {
    nombre: 'Cliente QA',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    correo: 'cliente@example.invalid',
    password: 'Clave123',
    passwordConfirm: 'Clave123',
    preguntaSecreta: '',
    respuestaSecreta: '',
  },
  updateField: jest.fn(),
  showPassword: false,
  toggleShowPassword: jest.fn(),
  showPasswordConfirm: false,
  toggleShowPasswordConfirm: jest.fn(),
  isLoading: false,
  error: null,
  exitoso: false,
  mensajeExito: null,
  passwordStrength: { score: 4, label: 'Segura' },
  confirmHasInput: true,
  passwordsMatch: true,
  confirmMismatch: false,
  canSubmit: true,
  handleRegistro,
});

describe('HU-01 RegistroForm navegacion', () => {
  let renderer: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (renderer) {
      act(() => renderer.unmount());
      renderer = null;
    }
    jest.restoreAllMocks();
  });

  it('ejecuta onSuccess solamente despues de un registro confirmado', async () => {
    const handleRegistro = jest.fn().mockResolvedValue(true);
    const onSuccess = jest.fn();
    useRegistroViewModelMock.mockReturnValue(createViewModel(handleRegistro));
    act(() => { renderer = create(<RegistroForm onSuccess={onSuccess} />); });
    const button = findButtonByText(renderer.root, 'Crear Cuenta');
    let navigationCallback: (() => void) | undefined;
    const timeoutSpy = jest.spyOn(globalThis, 'setTimeout').mockImplementation((callback) => {
      navigationCallback = callback as () => void;
      return 1 as any;
    });

    await act(async () => { await button.props.onPress(); });
    expect(handleRegistro).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1500);

    act(() => navigationCallback?.());
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('no ejecuta onSuccess cuando el registro falla', async () => {
    const handleRegistro = jest.fn().mockResolvedValue(false);
    const onSuccess = jest.fn();
    useRegistroViewModelMock.mockReturnValue(createViewModel(handleRegistro));
    act(() => { renderer = create(<RegistroForm onSuccess={onSuccess} />); });
    const button = findButtonByText(renderer.root, 'Crear Cuenta');

    await act(async () => { await button.props.onPress(); });

    expect(handleRegistro).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
