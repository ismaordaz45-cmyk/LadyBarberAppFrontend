import React from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { ServicioDetalleModal } from '../ServicioDetalleModal';
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
  id: '20', nombre: 'Tinte completo', descripcion: 'Color de larga duracion',
  precioMXN: 700, duracionMin: 120, categoria: 'Color',
  imagenUrl: '/uploads/servicios/tinte.jpg', estaActivo: true,
};

const allText = (renderer: any) => renderer.root.findAllByType(Text)
  .map((node: any) => String(node.props.children).replace(/,/g, ''))
  .join('|');

describe('HU-12 ServicioDetalleModal', () => {
  it('no renderiza contenido sin un servicio seleccionado', () => {
    let renderer: any;
    act(() => {
      renderer = create(
        <ServicioDetalleModal visible servicio={null} onClose={jest.fn()} onAgendar={jest.fn()} />
      );
    });
    expect(renderer.toJSON()).toBeNull();
    act(() => renderer.unmount());
  });

  it('presenta el detalle completo con formato MXN e imagen', () => {
    let renderer: any;
    act(() => {
      renderer = create(
        <ServicioDetalleModal visible servicio={servicio} onClose={jest.fn()} onAgendar={jest.fn()} />
      );
    });

    const text = allText(renderer);
    expect(text).toContain('Tinte completo');
    expect(text).toContain('Color de larga duracion');
    expect(text).toContain('120 minutos');
    expect(text).toContain('$700.00 MXN');
    expect(renderer.root.findByType(Image).props.source).toEqual({
      uri: 'https://api.example.invalid/uploads/servicios/tinte.jpg',
    });
    act(() => renderer.unmount());
  });

  it('cierra el modal antes de entregar el servicio al agendar', () => {
    const events: string[] = [];
    const onClose = jest.fn(() => events.push('close'));
    const onAgendar = jest.fn(() => events.push('schedule'));
    let renderer: any;
    act(() => {
      renderer = create(
        <ServicioDetalleModal visible servicio={servicio} onClose={onClose} onAgendar={onAgendar} />
      );
    });

    const buttons = renderer.root.findAllByType(TouchableOpacity);
    act(() => buttons[1].props.onPress());

    expect(onAgendar).toHaveBeenCalledWith(servicio);
    expect(events).toEqual(['close', 'schedule']);
    act(() => renderer.unmount());
  });
});
