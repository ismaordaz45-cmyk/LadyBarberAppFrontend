import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp, ImageResizeMode } from 'react-native';

export function ImagenProducto({ uri, nombre, style, resizeMode = 'cover' }: { uri?: string; nombre: string; style: StyleProp<ImageStyle>; resizeMode?: ImageResizeMode }) {
  const [fallida, setFallida] = useState<string | undefined>();
  const valida = /^(https?:\/\/\S+|data:image\/[^;]+;base64,)/i.test(uri ?? '');
  return <Image accessibilityLabel={nombre} source={valida && uri !== fallida ? { uri } : require('../../../assets/images/logo-itza.png')}
    onError={() => setFallida(uri)} style={style} resizeMode={resizeMode} />;
}
