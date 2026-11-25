import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../compartidos/TextoApp';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import { ModoApariencia } from '../../models/Apariencia';

const opciones: { modo: ModoApariencia; titulo: string }[] = [
  { modo: 'light', titulo: 'Claro' }, { modo: 'dark', titulo: 'Oscuro' }, { modo: 'system', titulo: 'Del dispositivo' },
];
export function PreferenciaApariencia() {
  const { modo, colors, seleccionar, error } = useAparienciaViewModel();
  return <View style={styles.section}>
    <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Apariencia</Text>
    <Text style={[styles.description, { color: colors.muted }]}>Elige cómo quieres ver la aplicación.</Text>
    <View accessibilityRole="radiogroup" style={styles.options}>
      {opciones.map(opcion => <TouchableOpacity key={opcion.modo} accessibilityRole="radio"
        accessibilityState={{ checked: modo === opcion.modo }} accessibilityLabel={`Tema ${opcion.titulo.toLowerCase()}`}
        onPress={() => void seleccionar(opcion.modo)}
        style={[styles.option, { backgroundColor: modo === opcion.modo ? colors.primary : colors.surface,
          borderColor: modo === opcion.modo ? colors.gold : colors.border }]}>
        <Text style={[styles.label, { color: modo === opcion.modo ? '#FFF' : colors.text }]}>{opcion.titulo}</Text>
      </TouchableOpacity>)}
    </View>
    {error && <Text accessibilityLiveRegion="polite" style={{ color: colors.muted }}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  section: { marginBottom: 24, gap: 12 }, title: { fontSize: 18, fontWeight: '700' }, description: { lineHeight: 20 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, option: { minHeight: 48, paddingHorizontal: 16,
    paddingVertical: 13, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, label: { fontWeight: '700' },
});
