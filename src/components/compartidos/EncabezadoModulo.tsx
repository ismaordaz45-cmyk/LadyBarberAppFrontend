import { useThemedStyles } from '../../hooks/use-themed-styles';
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from './TextoApp';
import { useNegocioViewModel } from '../../viewmodels/useNegocioViewModel';
import { resolveServicioImagenUrl } from '../../utils/resolveServicioImagenUrl';
import { API_URL } from '../../services/api';

export function EncabezadoModulo({ titulo }: { titulo: string }) {
  const styles = useThemedStyles(baseStyles);
  const { negocio } = useNegocioViewModel();
  const uri = resolveServicioImagenUrl(negocio?.logo, API_URL.replace(/\/api\/?$/, ''));
  const [imagenFallida, setImagenFallida] = useState<string | null>(null);
  return <View style={styles.header}>
    <View style={styles.texts}>
      {negocio && <Text style={styles.name}>{negocio.nombre}</Text>}
      <Text accessibilityRole="header" style={styles.title}>{titulo}</Text>
    </View>
    <Image accessibilityLabel={negocio?.nombre ? `Logo de ${negocio.nombre}` : 'Logo del salón'}
      source={uri && uri !== imagenFallida ? { uri } : require('../../../assets/images/logo-itza.png')}
      onError={() => setImagenFallida(uri)} style={styles.logo} resizeMode="contain" />
  </View>;
}
const baseStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFF', borderBottomColor: '#E5E7EB', borderBottomWidth: 1 },
  texts: { flex: 1, gap: 4 }, name: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  title: { fontSize: 23, fontWeight: '800', color: '#1E3A5A' },
  logo: { width: 64, height: 64, borderRadius: 16 },
});
