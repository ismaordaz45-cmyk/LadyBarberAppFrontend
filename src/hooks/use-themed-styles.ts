import { useMemo } from 'react';
import { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { useAparienciaViewModel } from '../viewmodels/useAparienciaViewModel';
import { colorApariencia } from '../constants/apariencia';

export function useThemedStyles<T extends { [K in keyof T]: ViewStyle | TextStyle | ImageStyle }>(base: T): T {
  const { esOscuro } = useAparienciaViewModel();
  return useMemo(() => {
    if (!esOscuro) return base;
    const resultado = Object.fromEntries(Object.entries(base).map(([nombre, estilo]) => [nombre,
      Object.fromEntries(Object.entries(estilo as ViewStyle | TextStyle | ImageStyle).map(([propiedad, valor]) => [propiedad,
        propiedad === 'backgroundColor' ? colorApariencia(valor, true, 'background')
          : propiedad.startsWith('border') && propiedad.endsWith('Color') ? colorApariencia(valor, true, 'border')
          : propiedad === 'color' || propiedad === 'tintColor' || propiedad === 'textDecorationColor' ? colorApariencia(valor, true)
          : valor,
      ])),
    ]));
    return resultado as unknown as T;
  }, [base, esOscuro]);
}
