import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import React from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../components/compartidos/TextoApp';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useDetalleCitaViewModel } from '../../viewmodels/useDetalleCitaViewModel';
import { dinero, fechaCita, horaCita } from '../../utils/citasPresentation';

export default function DetalleCitaScreen() {
  const apariencia = useAparienciaViewModel();
  const styles = useThemedStyles(baseStyles);
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const vm = useDetalleCitaViewModel(id);
  const router = useRouter();
  const c = vm.detalle;
  return <SafeAreaView style={styles.container}><Stack.Screen options={{ title: 'Detalle de tu cita', headerShown: true }} />
    <ScrollView contentContainerStyle={styles.content}>
      {vm.isLoading && <ActivityIndicator size="large" color={apariencia.color("#1E3A5A")} />}
      {vm.error && <Text accessibilityLiveRegion="polite" style={styles.error}>{vm.error}</Text>}
      {vm.mensaje && <Text accessibilityLiveRegion="polite" style={styles.notice}>{vm.mensaje}</Text>}
      {c && <>
        <View style={styles.hero}><Text style={styles.eyebrow}>SALÓN LADY BARBER</Text>
          <Text style={styles.title}>{c.estado === 'CONFIRMADA' ? 'Tu cita está confirmada' : 'Detalle de tu reservación'}</Text>
          <Text style={styles.status}>{c.estado.replace(/_/g, ' ')}</Text><Text selectable style={styles.folio}>Folio: {c.id}</Text></View>
        <View style={styles.card}><Text style={styles.heading}>{fechaCita(c.fecha)}</Text>
          <Text style={styles.text}>{horaCita(c.horaInicio)} a {horaCita(c.horaFin)}</Text>
          <Text style={styles.text}>Especialista: {c.empleadaNombre}</Text><Text style={styles.text}>Cliente: {c.clienteNombre}</Text></View>
        <View style={styles.card}><Text style={styles.heading}>Servicios reservados</Text>
          {c.servicios.map((s, i) => <View key={`${s.id}-${i}`} style={styles.row}><View style={{ flex: 1 }}><Text style={styles.text}>{s.nombre}</Text>
            <Text style={styles.muted}>{s.duracionMinutos} min</Text></View><Text style={styles.text}>{dinero(s.precio)}</Text></View>)}
        </View>
        <View style={styles.card}><Text style={styles.heading}>Resumen del pago</Text>
          <View style={styles.row}><Text style={styles.text}>Total de servicios</Text><Text style={styles.text}>{dinero(c.precioFinal)}</Text></View>
          {c.comprobanteDisponible ? <>
            <View style={styles.row}><Text style={styles.text}>Anticipo pagado</Text><Text style={styles.gold}>{dinero(c.anticipoPagado)}</Text></View>
            <View style={styles.row}><Text style={styles.text}>Saldo por liquidar*</Text><Text style={styles.text}>{dinero(c.saldoPendiente)}</Text></View>
            <Text style={styles.muted}>*Con base en el anticipo registrado; consulta en el salón cualquier liquidación posterior.</Text>
            <TouchableOpacity accessibilityRole="button" disabled={vm.ocupado || vm.isLoading} style={styles.button} onPress={vm.guardar}>
              <Text style={styles.buttonText}>{vm.ocupado ? 'Preparando…' : 'Descargar y guardar PDF'}</Text></TouchableOpacity>
          </> : <Text style={styles.muted}>{c.paymentStatus === 'approved' ? 'Pago aprobado. Aún no está disponible el detalle verificado del comprobante.' : 'Aún no hay un anticipo aprobado verificado.'}</Text>}
        </View>
        {c.estado === 'APARTADA' && <View style={styles.card}>
          <Text style={styles.heading}>Completar anticipo</Text><Text style={styles.muted}>Los apartados tienen una vigencia de 30 minutos. El servidor verifica que la reserva siga vigente antes de pagar.</Text>
          <Text style={styles.muted}>A esta reserva le aplican los términos y las políticas de reservación y cancelación.</Text>
          <TouchableOpacity accessibilityRole="link" onPress={() => router.push('/terminos')}><Text style={styles.link}>Leer términos y políticas</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" disabled={vm.ocupado || vm.isLoading} style={[styles.button, (vm.isLoading || vm.ocupado) && { opacity: 0.5 }]} onPress={vm.pagar}><Text style={styles.buttonText}>Pagar anticipo</Text></TouchableOpacity>
        </View>}
        {['APARTADA', 'CONFIRMADA'].includes(c.estado) && <TouchableOpacity accessibilityRole="button" disabled={vm.ocupado || vm.isLoading} style={styles.secondary} onPress={vm.cancelar}><Text style={styles.error}>Cancelar cita</Text></TouchableOpacity>}
      </>}
      <TouchableOpacity accessibilityRole="button" disabled={vm.ocupado || vm.isLoading} style={styles.secondary} onPress={vm.actualizar}><Text style={styles.link}>Actualizar información</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={() => router.replace({ pathname: '/(tabs)/citas', params: { vista: 'reservas' } })}><Text style={styles.link}>Volver a mis citas</Text></TouchableOpacity>
    </ScrollView></SafeAreaView>;
}

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, content: { padding: 20, paddingBottom: 60, gap: 16 },
  hero: { backgroundColor: '#1E3A5A', padding: 24, borderRadius: 20, gap: 12 }, eyebrow: { color: '#E8CC78', fontSize: 11, letterSpacing: 2 },
  title: { color: '#FFF', fontSize: 25, fontWeight: '800' }, status: { color: '#F6DC80', fontWeight: '700' }, folio: { color: '#E2E8F0', fontSize: 11 },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, gap: 14, borderColor: '#E5E7EB', borderWidth: 1 },
  heading: { color: '#1E3A5A', fontSize: 17, fontWeight: '700' }, text: { color: '#334155', fontSize: 14 }, muted: { color: '#64748B', lineHeight: 21, fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }, gold: { color: '#886B12', fontWeight: '800' },
  button: { backgroundColor: '#1E3A5A', borderRadius: 12, padding: 16, alignItems: 'center' }, buttonText: { color: '#FFF', fontWeight: '700' },
  secondary: { padding: 14, alignItems: 'center' }, error: { color: '#B91C1C' }, link: { color: '#2563EB', fontWeight: '600' },
  notice: { color: '#166534', backgroundColor: '#F0FDF4', padding: 14, borderRadius: 12, lineHeight: 21 },
});
