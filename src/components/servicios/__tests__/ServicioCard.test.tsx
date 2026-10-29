import React from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { ServicioCard } from '../ServicioCard';
import { ServicioItem } from '../../../models/Servicio';

jest.mock('../../../services/api', () => ({
  API_URL: 'https://api.example.invalid/api',
}));

jest.mock('@expo/vector-icons', () => {
  const ReactModule = require('react');
  const { Text: NativeText } = require('react-native');
  const Icon = (props: any) => ReactModule.createElement(NativeText, props, props.name);
  return { Feather: Icon, Ionicons: Icon, MaterialCommunityIcons: Icon };
});

const servicio: ServicioItem = {
  id: '10',
  nombre: 'Corte editorial',
  descripcion: 'Diseño personalizado',
  precioMXN: 350,
  duracionMin: 50,
  categoria: 'Corte',
  imagenUrl: '/uploads/servicios/editorial.jpg',
  estaActivo: true,
};

const textContent = (renderer: any) => renderer.root
  .findAllByType(Text)
  .map((node: any) => String(node.props.children).replace(/,/g, ''))
  .join('|');

describe('HU-12 ServicioCard', () => {
  it('presenta nombre, descripcion, categoria, precio, duracion e imagen', () => {
    let renderer: any;
    act(() => {
      renderer = create(
        <ServicioCard item={servicio} onDetalle={jest.fn()} onAgendar={jest.fn()} />
      );
    });

    const text = textContent(renderer);
    expect(text).toContain('Corte editorial');
    expect(text).toContain('Diseño personalizado');
    expect(text).toContain('Corte');
    expect(text).toContain('50 min');
    expect(text).toContain('350');
    expect(text).toContain('MXN');
    expect(renderer.root.findByType(Image).props.source).toEqual({
      uri: 'https://api.example.invalid/uploads/servicios/editorial.jpg',
    });
    act(() => renderer.unmount());
  });

  it('muestra valores de consulta y precio cero sin imagen ni descripcion', () => {
    let renderer: any;
    act(() => {
      renderer = create(
        <ServicioCard
          item={{ ...servicio, descripcion: '', imagenUrl: null, precioMXN: 0, duracionMin: 0 }}
          onDetalle={jest.fn()}
          onAgendar={jest.fn()}
        />
      );
    });

    const text = textContent(renderer);
    expect(text).toContain('Consultar');
    expect(text).toContain('0');
    expect(renderer.root.findAllByType(Image)).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it('entrega el objeto exacto en Detalle y Agendar', () => {
    const onDetalle = jest.fn();
    const onAgendar = jest.fn();
    let renderer: any;
    act(() => {
      renderer = create(
        <ServicioCard item={servicio} onDetalle={onDetalle} onAgendar={onAgendar} />
      );
    });

    const buttons = renderer.root.findAllByType(TouchableOpacity);
    act(() => buttons[0].props.onPress());
    act(() => buttons[1].props.onPress());

    expect(onDetalle).toHaveBeenCalledWith(servicio);
    expect(onAgendar).toHaveBeenCalledWith(servicio);
    act(() => renderer.unmount());
  });
});
