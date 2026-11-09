import React from 'react';
import { Pressable, TextInput } from 'react-native';
import { act, create } from 'react-test-renderer';
import { EditarPerfilModal } from '../EditarPerfilModal';

const createProps = (overrides: Record<string, unknown> = {}) => ({
  visible: true,
  nombre: 'Cliente',
  apellidoPaterno: 'Prueba',
  apellidoMaterno: '',
  telefono: '7710000000',
  correo: 'cliente@example.invalid',
  error: '',
  isSaving: false,
  canSave: true,
  onNombreChange: jest.fn(),
  onApellidoPaternoChange: jest.fn(),
  onApellidoMaternoChange: jest.fn(),
  onTelefonoChange: jest.fn(),
  onCancel: jest.fn(),
  onSave: jest.fn(),
  ...overrides,
});

describe('HU-03 EditarPerfilModal', () => {
  let renderer: any;

  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    renderer = null;
    jest.clearAllMocks();
  });

  it('expone los campos editables y mantiene el correo de solo lectura', () => {
    const props = createProps();
    act(() => { renderer = create(<EditarPerfilModal {...props} />); });

    const nombre = renderer.root.findByProps({ accessibilityLabel: 'Nombre' });
    const telefono = renderer.root.findByProps({ accessibilityLabel: 'Teléfono' });
    const correo = renderer.root.findByProps({
      accessibilityLabel: 'Correo de solo lectura',
    });

    expect(nombre.type).toBe(TextInput);
    expect(correo.props.editable).toBe(false);
    act(() => nombre.props.onChangeText('Nombre nuevo'));
    act(() => telefono.props.onChangeText('7711111111'));
    expect(props.onNombreChange).toHaveBeenCalledWith('Nombre nuevo');
    expect(props.onTelefonoChange).toHaveBeenCalledWith('7711111111');
  });

  it('deshabilita guardar cuando el formulario no es válido', () => {
    const props = createProps({ canSave: false });
    act(() => { renderer = create(<EditarPerfilModal {...props} />); });
    const button = renderer.root.findByProps({ accessibilityLabel: 'Guardar perfil' });

    expect(button.props.disabled).toBe(true);
  });

  it('guarda una sola vez cuando el formulario está habilitado', () => {
    const props = createProps();
    act(() => { renderer = create(<EditarPerfilModal {...props} />); });
    const button = renderer.root.findByProps({ accessibilityLabel: 'Guardar perfil' });

    expect(button.props.disabled).toBe(false);
    act(() => button.props.onPress());
    expect(props.onSave).toHaveBeenCalledTimes(1);
  });

  it('bloquea campos y acciones durante el guardado', () => {
    const props = createProps({ isSaving: true });
    act(() => { renderer = create(<EditarPerfilModal {...props} />); });

    const editableInputs = renderer.root
      .findAllByType(TextInput)
      .filter((input: any) => input.props.accessibilityLabel !== 'Correo de solo lectura');
    expect(editableInputs.every((input: any) => input.props.editable === false)).toBe(true);
    expect(
      renderer.root.findAllByType(Pressable).every((button: any) => button.props.disabled)
    ).toBe(true);
  });
});
