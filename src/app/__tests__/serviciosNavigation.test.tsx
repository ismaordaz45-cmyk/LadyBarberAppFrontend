import React from 'react';

import { act, create } from 'react-test-renderer';
import HomeScreen from '../(tabs)/index';

const mockPush = jest.fn();
jest.mock('../../components/compartidos/EncabezadoModulo', () => ({ EncabezadoModulo: () => null }));
jest.mock('../../viewmodels/useNegocioViewModel', () => ({ useNegocioViewModel: () => ({ negocio: null }) }));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => (() => void) | undefined) => { jest.requireActual('react').useEffect(callback, [callback]); },
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
  const ReactModule = jest.requireActual('react');
  const { Text: NativeText, TouchableOpacity: NativeButton } = jest.requireActual('react-native');
  return {
    ServiciosSection: ({ onAgendarServicio, cabecera }: any) => ReactModule.createElement(
      NativeButton,
      {
        testID: 'agendar-servicio-diagnostico',
        onPress: () => onAgendarServicio({ id: '77', nombre: 'Servicio diagnóstico' }),
      },
      cabecera, ReactModule.createElement(NativeText, null, 'Agendar servicio diagnóstico')
    ),
  };
});

jest.mock('../../components/compartidos/BarberPole', () => ({ BarberPole: () => null }));
jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual('react');
  const { Text: NativeText } = jest.requireActual('react-native');
  const Icon = (props: any) => ReactModule.createElement(NativeText, props, props.name);
  return { Feather: Icon, Ionicons: Icon, MaterialCommunityIcons: Icon };
});

describe('HU-12 navegación actual desde Servicios', () => {
  beforeEach(() => mockPush.mockClear());

  it('abre agendamiento transmitiendo el identificador del servicio seleccionado', () => {
    let renderer: any;
    act(() => { renderer = create(<HomeScreen />); });

    act(() => {
      renderer.root.findByProps({ testID: 'agendar-servicio-diagnostico' }).props.onPress();
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/citas', params: { vista: 'agendar', servicioId: '77' } });
    act(() => renderer.unmount());
  });
});
