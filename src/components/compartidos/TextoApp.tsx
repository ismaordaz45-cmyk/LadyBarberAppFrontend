import React, { forwardRef } from 'react';
import { Text as NativeText, TextProps } from 'react-native';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';

// Da un color legible a textos sin color explícito. Los estilos de cada vista
// conservan prioridad, por ejemplo el texto blanco sobre botones azul marino.
export const Text = forwardRef<React.ComponentRef<typeof NativeText>, TextProps>(function TextoApp({ style, ...props }, ref) {
  const { colors } = useAparienciaViewModel();
  return <NativeText {...props} ref={ref} style={[{ color: colors.text }, style]} />;
});
