import React from 'react';
import { Modal, Text, TouchableOpacity } from 'react-native';
import { act } from 'react-test-renderer';
import { SalidaApartadoModal } from '../SalidaApartadoModal';

let renderer: any;
const acciones = { onConservar: jest.fn(), onCancelar: jest.fn(), onContinuar: jest.fn() };
const boton = (texto: string) => renderer.root.findAllByType(TouchableOpacity).find((n: any) =>
  n.findAllByType(Text).some((t: any) => t.props.children === texto));

describe('Diálogo para salir del apartado', () => {
  beforeEach(() => { jest.clearAllMocks(); });
  afterEach(() => { act(() => renderer?.unmount()); });
  it('explica la vigencia y ofrece acciones distintas para conservar, cancelar o seguir pagando', () => {
    act(() => { renderer = jest.requireActual('react-test-renderer').create(<SalidaApartadoModal visible cancelando={false} error={null} {...acciones} />); });
    expect(renderer.root.findAllByType(Text).some((n: any) => String(n.props.children).includes('salir no lo reinicia'))).toBe(true);
    act(() => boton('Conservar y ver mis citas').props.onPress());
    expect(acciones.onConservar).toHaveBeenCalledTimes(1);
    expect(acciones.onCancelar).not.toHaveBeenCalled();
    act(() => boton('Cancelar apartado y volver a mis citas').props.onPress());
    expect(acciones.onCancelar).toHaveBeenCalledTimes(1);
    act(() => renderer.root.findByType(Modal).props.onRequestClose());
    expect(acciones.onContinuar).toHaveBeenCalledTimes(1);
  });
  it('bloquea las acciones durante la cancelación y muestra el error si no pudo completarse', () => {
    act(() => { renderer = jest.requireActual('react-test-renderer').create(<SalidaApartadoModal visible cancelando error="No se pudo cancelar" {...acciones} />); });
    expect(renderer.root.findAllByType(TouchableOpacity).every((n: any) => n.props.disabled)).toBe(true);
    expect(renderer.root.findAllByType(Text).some((n: any) => n.props.children === 'No se pudo cancelar')).toBe(true);
  });
});
