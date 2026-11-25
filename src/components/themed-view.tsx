import { useAparienciaViewModel } from '../viewmodels/useAparienciaViewModel';
import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const apariencia = useAparienciaViewModel();
  const theme = useTheme();

  return <View style={[{ backgroundColor: apariencia.color(theme[type ?? 'background'], 'background') }, style]} {...otherProps} />;
}
