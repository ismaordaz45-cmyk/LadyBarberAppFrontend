import React, { PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { usePreferenciaApariencia } from '../viewmodels/usePreferenciaApariencia';
import { AparienciaContext } from '../contexts/aparienciaContext';
import { colorApariencia, paletas, RolColor } from '../constants/apariencia';

export function AparienciaProvider({ children }: PropsWithChildren) {
  const preferencia = usePreferenciaApariencia();
  const sistema = useColorScheme();
  const esOscuro = (preferencia.modo === 'system' ? sistema : preferencia.modo) === 'dark';
  const colors = paletas[esOscuro ? 'dark' : 'light'];
  const color = useCallback(<T,>(value: T, rol?: RolColor): T => colorApariencia(value, esOscuro, rol), [esOscuro]);
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(preferencia.modo === 'system' ? 'unspecified' : preferencia.modo);
  }, [preferencia.modo]);
  useEffect(() => { void SystemUI.setBackgroundColorAsync(colors.background).catch(() => {}); }, [colors.background]);
  const value = useMemo(() => ({ ...preferencia, esOscuro, colors, color }), [preferencia, esOscuro, colors, color]);
  return <AparienciaContext.Provider value={value}>{children}</AparienciaContext.Provider>;
}
