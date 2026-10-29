import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import HomeScreen from '../(tabs)/index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../viewmodels/useHomeViewModel', () => ({
  useHomeViewModel: () => ({
    isLoading: false,
    error: null,
    userNombre: 'Cliente QA',
    serviciosPopulares: [],
    proximaCita: null,
    stats: { total: 0, pendientes: 0, completadas: 0 },
  }),
}));

jest.mock('../../components/servicios/ServiciosSection', () => {
  const ReactModule = require('react');
  const { Text: NativeText, TouchableOpacity: NativeButton } = require('react-native');
  return {
    ServiciosSection: ({ onAgendarServicio }: any) => ReactModule.createElement(
      NativeButton,
      {
        testID: 'agendar-servicio-diagnostico',
        onPress: () => onAgendarServicio({ id: '77', nombre: 'Servicio diagnóstico' }),
      },
      ReactModule.createElement(NativeText, null, 'Agendar servicio diagnóstico')
    ),
  };
});

jest.mock('../../components/compartidos/BarberPole', () => ({ BarberPole: () => null }));
jest.mock('@expo/vector-icons', () => {
  const ReactModule = require('react');
  const { Text: NativeText } = require('react-native');
  const Icon = (props: any) => ReactModule.createElement(NativeText, props, props.name);
  return { Feather: Icon, Ionicons: Icon, MaterialCommunityIcons: Icon };
});

describe('HU-12 navegación actual desde Servicios', () => {
  beforeEach(() => mockPush.mockClear());

  it('navega a Citas sin transmitir el servicio seleccionado', () => {
    let renderer: any;
    act(() => { renderer = create(<HomeScreen />); });

    act(() => {
      renderer.root.findByProps({ testID: 'agendar-servicio-diagnostico' }).props.onPress();
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/citas');
    act(() => renderer.unmount());
  });
});
