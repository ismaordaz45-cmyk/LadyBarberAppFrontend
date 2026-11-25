import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../compartidos/TextoApp';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDetalleCitaViewModel } from '../../viewmodels/useDetalleCitaViewModel';
import { dinero, fechaCita, horaCita } from '../../utils/citasPresentation';

type Props = { citaId: string | null; onCerrar: () => void; onDetalle: (id: string) => void };

export function VistaPreviaCita({ citaId, ...props }: Props) {
  return citaId ? <ContenidoVistaPrevia key={citaId} citaId={citaId} {...props} /> : null;
}

function ContenidoVistaPrevia({ citaId, onCerrar, onDetalle }: Omit<Props, 'citaId'> & { citaId: string }) {
  const apariencia = useAparienciaViewModel();
  const styles = useThemedStyles(baseStyles);
  const vm = useDetalleCitaViewModel(citaId);
  const cita = vm.detalle;
  const bloqueado = vm.ocupado || vm.isLoading;
  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { if (!vm.ocupado) onCerrar(); }}>
    <SafeAreaView style={styles.container} accessibilityViewIsModal>
      <View style={styles.topbar}><Text style={styles.title}>Vista previa de tu cita</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar vista previa" disabled={vm.ocupado} onPress={onCerrar} style={styles.close}>
          <Text style={styles.closeText}>Cerrar</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content}>
        {vm.isLoading && <ActivityIndicator size="large" color={apariencia.color("#1E3A5A")} />}
        {vm.error && <View style={styles.errorBox}><Text accessibilityLiveRegion="polite" style={styles.error}>{vm.error}</Text>
          <TouchableOpacity accessibilityRole="button" disabled={bloqueado} onPress={vm.actualizar}><Text style={styles.link}>Actualizar información</Text></TouchableOpacity></View>}
        {vm.mensaje && <Text accessibilityLiveRegion="polite" style={styles.notice}>{vm.mensaje}</Text>}
        {cita && <>
          <View style={styles.hero}><Text style={styles.brand}>SALÓN LADY BARBER</Text>
            <Text style={styles.heroTitle}>{cita.comprobanteDisponible ? 'Comprobante de anticipo' : 'Resumen de reservación'}</Text>
            <Text style={styles.heroStatus}>{cita.estado.replace(/_/g, ' ')}</Text>
            {cita.comprobanteDisponible && <Text style={styles.heroStatus}>ANTICIPO PAGADO</Text>}
          </View>
          <View style={styles.card}><Text style={styles.heading}>Datos de la cita</Text>
            <Text selectable style={styles.folio}>Folio: {cita.id}</Text>
            <Text style={styles.text}>{fechaCita(cita.fecha)} · {horaCita(cita.horaInicio)}–{horaCita(cita.horaFin)}</Text>
            <Text style={styles.text}>Cliente: {cita.clienteNombre}</Text>
            <Text style={styles.text}>Especialista: {cita.empleadaNombre}</Text>
          </View>
          <View style={styles.card}><Text style={styles.heading}>Servicios reservados</Text>
            {cita.servicios.map((s, i) => <View key={`${s.id}-${i}`} style={styles.row}>
              <View style={{ flex: 1 }}><Text style={styles.text}>{s.nombre}</Text><Text style={styles.muted}>{s.duracionMinutos} min</Text></View>
              <Text style={styles.amount}>{dinero(s.precio)}</Text></View>)}
          </View>
          <View style={styles.card}><View style={styles.row}><Text style={styles.text}>Total de servicios</Text><Text style={styles.amount}>{dinero(cita.precioFinal)}</Text></View>
            {cita.comprobanteDisponible ? <>
              <View style={styles.row}><Text style={styles.text}>Anticipo pagado</Text><Text style={styles.gold}>{dinero(cita.anticipoPagado)}</Text></View>
              <View style={styles.row}><Text style={styles.text}>Saldo según anticipo</Text><Text style={styles.amount}>{dinero(cita.saldoPendiente)}</Text></View>
              <Text selectable style={styles.folio}>Referencia de pago: {cita.paymentId}</Text>
              <Text style={styles.muted}>Comprobante de reserva y anticipo. Consulta en el salón cualquier liquidación posterior. No es una factura fiscal.</Text>
            </> : <Text style={styles.muted}>El PDF de anticipo estará disponible cuando exista un pago aprobado verificado para esta cita.</Text>}
          </View>
          {cita.comprobanteDisponible && <View style={styles.actions}>
            <Text style={styles.muted}>Al guardar, elige una carpeta y autoriza el acceso en el selector del teléfono.</Text>
            <TouchableOpacity accessibilityRole="button" disabled={bloqueado} style={[styles.primary, bloqueado && styles.disabled]} onPress={vm.guardar}>
              <Text style={styles.primaryText}>{vm.ocupado ? 'Preparando…' : 'Descargar y guardar PDF'}</Text></TouchableOpacity>
          </View>}
          <TouchableOpacity accessibilityRole="button" disabled={vm.ocupado} style={styles.secondary} onPress={() => onDetalle(citaId)}><Text style={styles.link}>Ver detalle completo</Text></TouchableOpacity>
        </>}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, gap: 8, backgroundColor: '#FFF' },
  title: { flex: 1, color: '#1E3A5A', fontSize: 19, fontWeight: '800' }, close: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 }, closeText: { color: '#2563EB', fontWeight: '700' },
  content: { padding: 20, paddingBottom: 40, gap: 16 }, hero: { backgroundColor: '#1E3A5A', borderRadius: 18, borderBottomWidth: 4, borderColor: '#D4AF37', padding: 22, gap: 10 },
  brand: { color: '#F6DC80', fontSize: 11, letterSpacing: 2 }, heroTitle: { color: '#FFF', fontSize: 23, fontWeight: '800' }, heroStatus: { color: '#F6DC80', fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 18, gap: 12 }, heading: { color: '#1E3A5A', fontSize: 16, fontWeight: '700' },
  text: { color: '#334155', fontSize: 14, lineHeight: 21 }, folio: { color: '#64748B', fontSize: 11, lineHeight: 18 }, muted: { color: '#64748B', fontSize: 12, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }, amount: { color: '#1E3A5A', fontWeight: '700' }, gold: { color: '#886B12', fontWeight: '800' },
  actions: { gap: 12 }, primary: { minHeight: 48, padding: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A5A', borderRadius: 12 }, primaryText: { color: '#FFF', fontWeight: '700' },
  secondary: { minHeight: 44, padding: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, backgroundColor: '#FFF' }, link: { color: '#2563EB', fontWeight: '700' },
  disabled: { opacity: 0.5 }, errorBox: { gap: 12, backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12 }, error: { color: '#B91C1C' }, notice: { backgroundColor: '#F0FDF4', color: '#166534', padding: 14, borderRadius: 12, lineHeight: 21 },
});
