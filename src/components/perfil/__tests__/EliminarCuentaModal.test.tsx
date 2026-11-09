import React from 'react';
import { Pressable, TextInput } from 'react-native';
import { act, create } from 'react-test-renderer';
import { EliminarCuentaModal } from '../EliminarCuentaModal';

const createProps = (overrides: Record<string, unknown> = {}) => ({
  visible: true,
  password: '',
  confirmation: '',
  error: '',
  isDeleting: false,
  canDelete: false,
  onPasswordChange: jest.fn(),
  onConfirmationChange: jest.fn(),
  onCancel: jest.fn(),
  onDelete: jest.fn(),
  ...overrides,
});

describe('EliminarCuentaModal', () => {
  let renderer: any;

  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    renderer = null;
    jest.clearAllMocks();
  });

  it('oculta la contraseña y captura la confirmación explícita', () => {
    const props = createProps();
    act(() => {
      renderer = create(<EliminarCuentaModal {...props} />);
    });

    const passwordInput = renderer.root.findByProps({
      accessibilityLabel: 'Contraseña actual',
    });
    const confirmationInput = renderer.root.findByProps({
      accessibilityLabel: 'Confirmación de eliminación',
    });

    expect(passwordInput.type).toBe(TextInput);
    expect(passwordInput.props.secureTextEntry).toBe(true);
    act(() => passwordInput.props.onChangeText('ClaveSegura1'));
    act(() => confirmationInput.props.onChangeText('ELIMINAR'));
    expect(props.onPasswordChange).toHaveBeenCalledWith('ClaveSegura1');
    expect(props.onConfirmationChange).toHaveBeenCalledWith('ELIMINAR');
  });

  it('permite mostrar y volver a ocultar la contraseña actual', () => {
    act(() => {
      renderer = create(<EliminarCuentaModal {...createProps({ password: 'ClaveSegura1' })} />);
    });

    const passwordInput = () => renderer.root.findByProps({
      accessibilityLabel: 'Contraseña actual',
    });

    expect(passwordInput().props.secureTextEntry).toBe(true);

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Mostrar contraseña' }).props.onPress();
    });
    expect(passwordInput().props.secureTextEntry).toBe(false);

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Ocultar contraseña' }).props.onPress();
    });
    expect(passwordInput().props.secureTextEntry).toBe(true);
  });

  it('mantiene deshabilitada la acción si la confirmación no es válida', () => {
    const props = createProps({ canDelete: false });
    act(() => {
      renderer = create(<EliminarCuentaModal {...props} />);
    });
    const deleteButton = renderer.root.findByProps({
      accessibilityLabel: 'Confirmar eliminación de cuenta',
    });

    expect(deleteButton.props.disabled).toBe(true);
  });

  it('permite confirmar únicamente con datos válidos y sin carga activa', () => {
    const props = createProps({ canDelete: true });
    act(() => {
      renderer = create(<EliminarCuentaModal {...props} />);
    });
    const deleteButton = renderer.root.findByProps({
      accessibilityLabel: 'Confirmar eliminación de cuenta',
    });

    expect(deleteButton.props.disabled).toBe(false);
    act(() => deleteButton.props.onPress());
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('bloquea campos y botones durante la solicitud', () => {
    const props = createProps({ canDelete: true, isDeleting: true });
    act(() => {
      renderer = create(<EliminarCuentaModal {...props} />);
    });

    const inputs = renderer.root.findAllByType(TextInput);
    expect(inputs.every((input: any) => input.props.editable === false)).toBe(true);
    const buttons = renderer.root.findAllByType(Pressable);
    expect(buttons.every((button: any) => button.props.disabled === true)).toBe(true);
  });
});
