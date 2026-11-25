import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Text } from '../compartidos/TextoApp';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import type { useUbicacionViewModel } from '../../viewmodels/useUbicacionViewModel';
import { API_URL } from '../../services/api';
import { resolveServicioImagenUrl } from '../../utils/resolveServicioImagenUrl';

type Props = { vm: ReturnType<typeof useUbicacionViewModel> };
export function UbicacionModal({ vm }: Props) {
  return vm.visible ? <ContenidoUbicacion vm={vm} /> : null;
}
function ContenidoUbicacion({ vm }: Props) {
  const { colors } = useAparienciaViewModel();
  const insets = useSafeAreaInsets();
  const logo = resolveServicioImagenUrl(vm.negocio?.logo, API_URL.replace(/\/api\/?$/, ''));
  const [logoFallido, setLogoFallido] = useState<string | null>(null);
  return <Modal transparent visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={vm.cerrar}>
    <View style={[styles.overlay, { paddingTop: insets.top + 16, paddingBottom: 82 + insets.bottom,
      paddingLeft: Math.max(16, insets.left + 8), paddingRight: Math.max(16, insets.right + 8) }]}>
      <Pressable style={styles.backdrop} accessibilityRole="button" accessibilityLabel="Cerrar ubicación tocando fuera" onPress={vm.cerrar} />
      <View accessibilityViewIsModal style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.topbar}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Nuestra ubicación</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar ubicación" style={styles.close} onPress={vm.cerrar}>
            <Feather name="x" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {vm.cargando ? <View style={styles.state}>
            <ActivityIndicator color={colors.text} size="large" /><Text style={{ color: colors.muted }}>Consultando la dirección…</Text>
          </View> : vm.negocio && <>
            <View style={styles.brand}>
              {logo && logo !== logoFallido ? <Image source={{ uri: logo }} onError={() => setLogoFallido(logo)} resizeMode="contain" style={styles.logo} accessibilityLabel={`Logo de ${vm.negocio.nombre}`} />
                : <View style={[styles.pin, { backgroundColor: colors.primary }]}><Ionicons name="location-outline" size={30} color="#E8CC78" /></View>}
              <Text style={[styles.name, { color: colors.text }]}>{vm.negocio.nombre}</Text>
            </View>
            <View style={[styles.addressCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.muted }]}>Dirección del establecimiento</Text>
              <Text selectable style={[styles.address, { color: colors.text }]}>
                {vm.direccion || 'La dirección aún no está publicada.'}
              </Text>
            </View>
            {!vm.puedeAbrir && <Text style={[styles.message, { color: colors.muted }]}>No hay una ubicación disponible para abrir en Maps. Consulta con el establecimiento o vuelve a actualizar.</Text>}
          </>}
          {vm.error && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.text }]}>{vm.error}</Text>}
          {!vm.cargando && (vm.error || !vm.puedeAbrir) && <TouchableOpacity accessibilityRole="button" style={styles.retry} onPress={vm.reintentar}>
            <Text style={{ color: colors.link, fontWeight: '700' }}>Actualizar ubicación</Text>
          </TouchableOpacity>}
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cómo llegar al establecimiento" disabled={!vm.puedeAbrir || vm.abriendo}
            style={[styles.primary, { backgroundColor: colors.primary, opacity: !vm.puedeAbrir || vm.abriendo ? 0.5 : 1 }]} onPress={vm.comoLlegar}>
            {vm.abriendo ? <ActivityIndicator color="#FFF" /> : <><Feather name="navigation" size={20} color="#FFF" /><Text style={styles.primaryText}>Cómo llegar</Text></>}
          </TouchableOpacity>
          <Text style={[styles.caption, { color: colors.muted }]}>Abre Google Maps o el navegador para consultar las indicaciones.</Text>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  card: { width: '100%', maxWidth: 520, maxHeight: '100%', borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  topbar: { paddingLeft: 22, paddingRight: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 22, fontWeight: '800' }, close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 22, paddingBottom: 22, gap: 18 }, brand: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pin: { width: 58, height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }, logo: { width: 58, height: 58, borderRadius: 14 },
  name: { flex: 1, fontSize: 18, fontWeight: '700' }, addressCard: { padding: 18, gap: 8, borderRadius: 16, borderWidth: 1 },
  label: { fontSize: 12, fontWeight: '600' }, address: { fontSize: 16, lineHeight: 25 }, message: { lineHeight: 22 },
  primary: { minHeight: 50, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 }, caption: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  state: { alignItems: 'center', paddingVertical: 24, gap: 16 }, retry: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
});
