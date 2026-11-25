import React from 'react';
import { AccessibilityInfo, Text, TouchableOpacity } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AvisoCarrito } from '../AvisoCarrito';
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
let renderer: ReactTestRenderer;
beforeEach(() => { jest.useFakeTimers(); jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true); });
afterEach(() => { act(() => renderer?.unmount()); jest.restoreAllMocks(); jest.useRealTimers(); });
it('muestra el producto agregado, permite ir al carrito y desaparece sin bloquear la pantalla', async () => {
  const abrir = jest.fn();
  await act(async () => { renderer = create(<AvisoCarrito agregado={{ clave: 1, nombre: 'Gel' }} onVerCarrito={abrir} />); });
  expect(renderer.root.findAllByType(Text).some(node => node.props.children === 'Gel')).toBe(true);
  act(() => renderer.root.findByType(TouchableOpacity).props.onPress());
  expect(abrir).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(4500));
  expect(renderer.toJSON()).toBeNull();
});
it('no presenta confirmación al cargar y elimina el aviso si cambia la cuenta', async () => {
  await act(async () => { renderer = create(<AvisoCarrito agregado={null} onVerCarrito={jest.fn()} />); });
  expect(renderer.toJSON()).toBeNull();
  await act(async () => { renderer.update(<AvisoCarrito agregado={{ clave: 2, nombre: 'Cera' }} onVerCarrito={jest.fn()} />); });
  expect(renderer.toJSON()).not.toBeNull();
  act(() => renderer.update(<AvisoCarrito agregado={null} onVerCarrito={jest.fn()} />));
  expect(renderer.toJSON()).toBeNull();
});
