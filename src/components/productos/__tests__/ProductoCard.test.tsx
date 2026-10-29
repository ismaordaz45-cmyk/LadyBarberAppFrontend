import React from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { ProductoItem } from '../../../models/Producto';
import { ProductoCard } from '../ProductoCard';

jest.mock('@expo/vector-icons', () => {
  const ReactModule = require('react');
  const { Text: NativeText } = require('react-native');
  return {
    Feather: (props: any) => ReactModule.createElement(NativeText, props, props.name),
  };
});

const producto: ProductoItem = {
  id: 'producto-1',
  nombre: 'Aceite Premium',
  categoriaEtiqueta: 'TRATAMIENTO',
  categoria: 'Tratamientos',
  subtitulo: 'Brillo y nutrición',
  precioMXN: 420,
  imagenUrl: 'https://example.invalid/aceite.jpg',
  descripcion: 'Tratamiento capilar',
  badge: { texto: 'Top Seller', tipo: 'topseller' },
};

const renderCard = (item: ProductoItem = producto, onAgregar = jest.fn()) => {
  let renderer: any;
  act(() => {
    renderer = create(<ProductoCard item={item} onAgregar={onAgregar} />);
  });
  return { renderer, onAgregar };
};

const allText = (renderer: any): string => renderer.root.findAllByType(Text)
  .map((node: any) => {
    const children = Array.isArray(node.props.children) ? node.props.children : [node.props.children];
    return children.filter((child: unknown) => ['string', 'number'].includes(typeof child)).join('');
  })
  .join('|');

describe('HU-04 ProductoCard', () => {
  it('presenta nombre, categoria, subtitulo, precio MXN e imagen', () => {
    const { renderer } = renderCard();
    const text = allText(renderer);

    expect(text).toContain('Aceite Premium');
    expect(text).toContain('TRATAMIENTO');
    expect(text).toContain('Brillo y nutrición');
    expect(text).toContain('$420.00');
    expect(text).toContain('MXN');
    expect(renderer.root.findByType(Image).props.source).toEqual({
      uri: 'https://example.invalid/aceite.jpg',
    });
    act(() => renderer.unmount());
  });

  it('formatea de manera segura un precio cero', () => {
    const { renderer } = renderCard({ ...producto, precioMXN: 0 });
    expect(allText(renderer)).toContain('$0.00');
    act(() => renderer.unmount());
  });

  it('evita mostrar NaN ante un precio invalido', () => {
    const { renderer } = renderCard({ ...producto, precioMXN: Number.NaN });
    expect(allText(renderer)).toContain('$0.00');
    expect(allText(renderer)).not.toContain('NaN');
    act(() => renderer.unmount());
  });

  it('utiliza una imagen local de respaldo cuando la URL esta ausente', () => {
    const { renderer } = renderCard({ ...producto, imagenUrl: '' });
    const source = renderer.root.findByType(Image).props.source;
    expect(source).toBeTruthy();
    expect(source).not.toEqual({ uri: '' });
    act(() => renderer.unmount());
  });

  it('cambia a la imagen de respaldo si la imagen remota falla', () => {
    const { renderer } = renderCard();
    const image = renderer.root.findByType(Image);
    act(() => image.props.onError());
    expect(renderer.root.findByType(Image).props.source).not.toEqual({
      uri: 'https://example.invalid/aceite.jpg',
    });
    act(() => renderer.unmount());
  });

  it('muestra el badge solo cuando esta definido', () => {
    const first = renderCard();
    expect(allText(first.renderer)).toContain('Top Seller');
    act(() => first.renderer.unmount());

    const second = renderCard({ ...producto, badge: undefined });
    expect(allText(second.renderer)).not.toContain('Top Seller');
    act(() => second.renderer.unmount());
  });

  it('entrega el producto exacto al presionar agregar', () => {
    const onAgregar = jest.fn();
    const { renderer } = renderCard(producto, onAgregar);
    act(() => renderer.root.findByType(TouchableOpacity).props.onPress());
    expect(onAgregar).toHaveBeenCalledTimes(1);
    expect(onAgregar).toHaveBeenCalledWith(producto);
    act(() => renderer.unmount());
  });
});
