import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './TextoApp';
import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';

type Props = { visible: boolean; titulo: string; descripcion: string; confirmar: string; conservar: string;
  ocupado?: boolean; error?: string | null; onConfirmar: () => void; onConservar: () => void };
export function ConfirmacionAccion({ visible, titulo, descripcion, confirmar, conservar, ocupado = false, error, onConfirmar, onConservar }: Props) {
  const styles = useThemedStyles(baseStyles);
  const apariencia = useAparienciaViewModel();
  if (!visible) return null;
  return <Modal transparent visible animationType="fade" onRequestClose={() => { if (!ocupado) onConservar(); }}>
    <SafeAreaView style={styles.backdrop}><View style={styles.card} accessibilityViewIsModal>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>{titulo}</Text>
        <Text style={styles.description}>{descripcion}</Text>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <TouchableOpacity accessibilityRole="button" disabled={ocupado} onPress={onConservar} style={[styles.primary, ocupado && styles.disabled]}><Text style={styles.primaryText}>{conservar}</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={confirmar} disabled={ocupado} onPress={onConfirmar} style={[styles.secondary, ocupado && styles.disabled]}>
          {ocupado ? <ActivityIndicator color={apariencia.colors.text} /> : <Text style={styles.secondaryText}>{confirmar}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View></SafeAreaView>
  </Modal>;
}
const baseStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', padding: 24, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 480, maxHeight: '90%', borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  content: { padding: 24, gap: 16 }, title: { color: '#1E3A5A', fontSize: 22, fontWeight: '800' }, description: { color: '#64748B', fontSize: 14, lineHeight: 22 },
  primary: { backgroundColor: '#1E3A5A', minHeight: 48, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  secondary: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#D4AF37', minHeight: 48, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: '#886B12', fontWeight: '700', textAlign: 'center' },
  error: { color: '#B91C1C', fontSize: 13, lineHeight: 20 }, disabled: { opacity: 0.5 },
});
