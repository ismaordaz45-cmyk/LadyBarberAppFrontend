import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../compartidos/TextoApp';

type Props = { visible: boolean; cancelando: boolean; error: string | null;
  onConservar: () => void; onCancelar: () => void; onContinuar: () => void };

export function SalidaApartadoModal({ visible, cancelando, error, onConservar, onCancelar, onContinuar }: Props) {
  const apariencia = useAparienciaViewModel();
  const styles = useThemedStyles(baseStyles);
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onContinuar}>
    <View style={styles.backdrop}>
      <View style={styles.card} accessibilityViewIsModal>
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>¿Qué deseas hacer con tu apartado?</Text>
          <Text style={styles.description}>Puedes regresar a tus citas y pagar después desde “Por pagar”. El plazo original de 30 minutos sigue corriendo: salir no lo reinicia. Si no se confirma el pago a tiempo, el horario se libera.</Text>
          {error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
          <TouchableOpacity accessibilityRole="button" disabled={cancelando} style={[styles.primary, cancelando && styles.disabled]} onPress={onConservar}>
            <Text style={styles.primaryText}>Conservar y ver mis citas</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" disabled={cancelando} style={[styles.secondary, cancelando && styles.disabled]} onPress={onCancelar}>
            {cancelando ? <ActivityIndicator color={apariencia.color("#735B16")} /> : <Text style={styles.secondaryText}>Cancelar apartado y volver a mis citas</Text>}
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" disabled={cancelando} style={styles.continue} onPress={onContinuar}>
            <Text style={styles.continueText}>Seguir con el pago</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const baseStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', padding: 24, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 480, maxHeight: '90%', borderRadius: 24, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  content: { padding: 24, gap: 16 }, title: { fontSize: 22, fontWeight: '800', color: '#1E3A5A' },
  description: { color: '#64748B', fontSize: 14, lineHeight: 22 },
  primary: { minHeight: 48, padding: 16, borderRadius: 12, backgroundColor: '#1E3A5A', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFF', fontWeight: '700', textAlign: 'center' },
  secondary: { minHeight: 48, padding: 16, borderRadius: 12, backgroundColor: '#FFF8DF', borderColor: '#D4AF37', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#735B16', fontWeight: '700', textAlign: 'center' },
  continue: { minHeight: 44, justifyContent: 'center', alignItems: 'center', padding: 8 },
  continueText: { color: '#2563EB', fontWeight: '700', textAlign: 'center' },
  error: { color: '#B91C1C', lineHeight: 22 }, disabled: { opacity: 0.5 },
});
