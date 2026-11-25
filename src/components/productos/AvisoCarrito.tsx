import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '../compartidos/TextoApp';
import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';

export type ProductoAgregado = { clave: number; nombre: string };
export function AvisoCarrito({ agregado, onVerCarrito }: { agregado: ProductoAgregado | null; onVerCarrito: () => void }) {
  const styles = useThemedStyles(baseStyles);
  const apariencia = useAparienciaViewModel();
  const [oculto, setOculto] = useState<ProductoAgregado | null>(null);
  const [progreso] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!agregado) return;
    let activo = true;
    progreso.setValue(0);
    void AccessibilityInfo.isReduceMotionEnabled().then(reducido => {
      if (!activo) return;
      if (reducido) progreso.setValue(1);
      else Animated.timing(progreso, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }).catch(() => { if (activo) progreso.setValue(1); });
    const timer = setTimeout(() => setOculto(agregado), 4500);
    return () => { activo = false; clearTimeout(timer); progreso.stopAnimation(); };
  }, [agregado, progreso]);
  if (!agregado || oculto === agregado) return null;
  return <Animated.View style={[styles.notice, { opacity: progreso, transform: [{ translateY: progreso.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
    <Feather name="check-circle" size={22} color={apariencia.colors.text} />
    <View style={styles.content} accessibilityLiveRegion="polite">
      <Text style={styles.title}>Agregado al carrito</Text><Text numberOfLines={1} style={styles.name}>{agregado.nombre}</Text>
    </View>
    <TouchableOpacity accessibilityRole="button" onPress={onVerCarrito} style={styles.action}><Text style={styles.actionText}>Ver carrito</Text></TouchableOpacity>
  </Animated.View>;
}
const baseStyles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 10, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#D4AF37', backgroundColor: '#FFFBEB' },
  content: { flex: 1, gap: 3 }, title: { color: '#1E3A5A', fontSize: 13, fontWeight: '700' }, name: { color: '#64748B', fontSize: 12 },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 }, actionText: { color: '#886B12', fontWeight: '700', fontSize: 12 },
});
