import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../../components/compartidos/TextoApp';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHomeViewModel } from '../../viewmodels/useHomeViewModel';
import { useUbicacionViewModel } from '../../viewmodels/useUbicacionViewModel';
import { UbicacionModal } from '../../components/ubicacion/UbicacionModal';
import { ServiciosSection } from '../../components/servicios/ServiciosSection';
import { EncabezadoModulo } from '../../components/compartidos/EncabezadoModulo';
import { dinero, fechaCita, horaCita } from '../../utils/citasPresentation';

function AccesoRapido({ label, icon, onPress }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void }) {
  const apariencia = useAparienciaViewModel();
  const styles = useThemedStyles(baseStyles);
  return <TouchableOpacity accessibilityRole="button" style={styles.action} onPress={onPress}>
    <View style={styles.actionIcon}><Ionicons name={icon} size={26} color={apariencia.color("#1E3A5A")} /></View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>;
}

export default function HomeScreen() {
  const apariencia = useAparienciaViewModel();
  const styles = useThemedStyles(baseStyles);
  const router = useRouter();
  const { isLoading, error, userNombre, proximaCita, stats, actualizar, resumen } = useHomeViewModel();
  const ubicacion = useUbicacionViewModel();
  const catalogoRef = React.useRef<{ mostrarServicios: () => void }>(null);
  const irAServicios = React.useCallback(() => { catalogoRef.current?.mostrarServicios(); }, []);
  const agendar = (servicioId?: string) => router.push({ pathname: '/(tabs)/citas',
    params: { vista: 'agendar', ...(servicioId ? { servicioId } : {}) } });
  const panel = <View style={styles.panel}>
    {error && <View style={styles.errorBox}><Text style={styles.error}>{error}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={actualizar}><Text style={styles.link}>Actualizar resumen</Text></TouchableOpacity></View>}
    <View style={styles.welcome}>
      <View style={styles.avatar}><Ionicons name="person" size={26} color={apariencia.color("#FFF")} /></View>
      <View style={{ flex: 1 }}><Text style={styles.greeting}>¡Hola, {userNombre}!</Text><Text style={styles.muted}>Bienvenido a tu espacio de citas.</Text></View>
    </View>
    <View style={styles.stats}>{[
      { label: 'Total citas', value: stats.total, bg: '#F1F5F9' },
      { label: 'Pendientes', value: stats.pendientes, bg: '#FFF8DF' },
      { label: 'Completadas', value: stats.completadas, bg: '#DCFCE7' },
    ].map(stat => <View key={stat.label} style={[styles.stat, { backgroundColor: apariencia.color(stat.bg, 'background') }]}>
      <Text style={styles.number}>{error ? '—' : stat.value}</Text><Text style={styles.statLabel}>{stat.label}</Text>
    </View>)}</View>
    <View style={styles.next}>
      <Text style={styles.eyebrow}>PRÓXIMA CITA</Text>
      {proximaCita ? <>
        <Text style={styles.service}>{proximaCita.serviciosLabel || 'Servicio agendado'}</Text>
        <Text style={styles.nextText}>{fechaCita(proximaCita.fecha)} · {horaCita(proximaCita.horaInicio)}</Text>
        <Text style={styles.nextText}>{proximaCita.estado === 'APARTADA' ? 'Pendiente de pago' : 'Confirmada'}</Text>
        <Text style={styles.price}>{dinero(proximaCita.precioFinal)}</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.detail} onPress={() => router.push({ pathname: '/cita/[id]', params: { id: proximaCita.id } })}>
          <Text style={styles.detailText}>Ver detalle de la cita</Text>
        </TouchableOpacity>
      </> : <Text style={styles.nextText}>{error ? 'No pudimos consultar tu próxima cita.' : 'No tienes citas próximas'}</Text>}
    </View>
    <View style={styles.actions}>
      <AccesoRapido label="Agendar" icon="calendar-outline" onPress={() => agendar()} />
      <AccesoRapido label="Servicios" icon="cut-outline" onPress={irAServicios} />
      <AccesoRapido label="Productos" icon="bag-outline" onPress={() => router.navigate({ pathname: '/(tabs)/tienda', params: { seccion: 'catalogo', visita: String(Date.now()) } })} />
      <AccesoRapido label="Ubicación" icon="location-outline" onPress={ubicacion.abrir} />
    </View>
  </View>;
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
    <EncabezadoModulo titulo="Inicio" />
    {isLoading && !resumen ? <View style={styles.loading}><ActivityIndicator size="large" color={apariencia.color("#1E3A5A")} /><Text style={styles.muted}>Cargando tu panel...</Text></View>
      : <ServiciosSection ref={catalogoRef} cabecera={panel} onActualizar={actualizar}
        onAgendarServicio={servicio => agendar(servicio.id)} />}
    <UbicacionModal vm={ubicacion} />
  </SafeAreaView>;
}
const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' }, panel: { padding: 20, gap: 22 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  welcome: { flexDirection: 'row', alignItems: 'center', gap: 14 }, avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#1E3A5A' }, muted: { color: '#64748B', marginTop: 6, lineHeight: 21 },
  stats: { flexDirection: 'row', gap: 10 }, stat: { flex: 1, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 4, alignItems: 'center', gap: 6 },
  number: { fontSize: 24, fontWeight: '800', color: '#1E3A5A' }, statLabel: { fontSize: 12, color: '#475569' },
  next: { borderRadius: 22, padding: 22, backgroundColor: '#1E293B', gap: 12 }, eyebrow: { color: '#E8CC78', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  service: { color: '#FFF', fontSize: 22, fontWeight: '700' }, nextText: { color: '#E2E8F0', lineHeight: 23 }, price: { color: '#E8CC78', fontSize: 19, fontWeight: '700' },
  detail: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }, detailText: { color: '#FFF', fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, action: { flex: 1, alignItems: 'center', gap: 10 },
  actionIcon: { borderRadius: 20, padding: 16, backgroundColor: '#F1F5F9', borderColor: '#E2E8F0', borderWidth: 1 }, actionLabel: { color: '#1E3A5A', fontSize: 12 },
  errorBox: { padding: 14, borderRadius: 12, backgroundColor: '#FEF2F2', gap: 10 }, error: { color: '#B91C1C' }, link: { color: '#2563EB', fontWeight: '700' },
});
