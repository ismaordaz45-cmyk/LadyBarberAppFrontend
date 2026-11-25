import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../compartidos/TextoApp';
import { ImagenProducto } from './ImagenProducto';
import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useComprasViewModel } from '../../viewmodels/useComprasViewModel';
import { etiquetasRecogida, fechaCompra } from '../../models/Compra';

export function DetalleCompraModal({ vm }: { vm: ReturnType<typeof useComprasViewModel> }) {
  const styles = useThemedStyles(baseStyles), insets = useSafeAreaInsets();
  const compra = vm.compra;
  return <Modal visible={vm.modalVisible} transparent animationType="fade" onRequestClose={vm.cerrar} statusBarTranslucent navigationBarTranslucent>
    <View style={[styles.backdrop, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.modal}>
        <View style={styles.row}><Text accessibilityRole="header" style={styles.title}>{compra ? `Compra #${compra.id}` : 'Detalle de compra'}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar vista previa de compra" onPress={vm.cerrar} disabled={vm.guardando} style={styles.close}><Text style={styles.title}>×</Text></TouchableOpacity></View>
        <ScrollView contentContainerStyle={styles.content}>
          {vm.cargandoDetalle && <ActivityIndicator accessibilityLabel="Cargando compra" />}
          {vm.errorDetalle && <Text accessibilityRole="alert" style={styles.error}>{vm.errorDetalle}</Text>}
          {compra && <>
            <View style={styles.hero}><Text style={styles.heroText}>{compra.negocio.nombre}</Text><Text style={styles.heroTitle}>{etiquetasRecogida[compra.recogida.estado]}</Text>
              <Text style={styles.heroText}>{compra.compradorNombre || 'Tu compra'}</Text></View>
            <Text style={styles.text}>Pago: {compra.paymentStatus === 'approved' ? 'Aprobado' : ['refunded','partially_refunded','charged_back'].includes(compra.paymentStatus || '') ? 'Con devolución o revisión' : 'En revisión'}</Text>
            <Text style={styles.text}>Fecha: {fechaCompra(compra.recogida.aprobadoEn || compra.fecha, compra.zonaHoraria)}</Text>
            {compra.recogida.limiteEn && <Text style={styles.text}>Recoger antes de: {fechaCompra(compra.recogida.limiteEn, compra.zonaHoraria)} ({compra.zonaHoraria})</Text>}
            {compra.recogida.estado === 'vencida' && <Text style={styles.notice}>El plazo de 24 horas venció. Tu pago permanece registrado; contacta al salón para coordinar la recogida. No vuelvas a pagar.</Text>}
            {['sin_registro','no_disponible'].includes(compra.recogida.estado) && <Text style={styles.notice}>Consulta con el salón para verificar la recogida de esta compra.</Text>}
            {compra.items.map(i => <View key={i.insumoId} style={styles.product}>
              <ImagenProducto uri={i.imagen || undefined} nombre={i.nombre} style={styles.image} />
              <View style={styles.grow}><Text style={styles.name}>{i.nombre}</Text><Text style={styles.text}>${i.precioUnitario.toFixed(2)} MXN × {i.cantidad}</Text><Text style={styles.name}>${i.subtotal.toFixed(2)} MXN</Text></View>
            </View>)}
            <View style={styles.row}><Text style={styles.title}>{compra.paymentStatus === 'approved' ? 'Total pagado' : 'Total de la compra'}</Text><Text style={styles.title}>${compra.total.toFixed(2)} MXN</Text></View>
            {compra.paymentId && <Text selectable style={styles.text}>Referencia de pago: {compra.paymentId}</Text>}
            <Text style={styles.text}>{compra.negocio.direccion || 'Consulta la ubicación del salón desde Inicio.'}</Text>
            {compra.comprobanteDisponible ? <TouchableOpacity accessibilityRole="button" disabled={vm.guardando} onPress={() => void vm.guardarPdf()} style={styles.button}>
              <Text style={styles.buttonText}>{vm.guardando ? 'Guardando comprobante...' : 'Descargar y guardar PDF'}</Text></TouchableOpacity>
              : <Text style={styles.notice}>El comprobante requiere evidencia de pago aprobada y coincidente. Consulta el estado o comunícate con el salón.</Text>}
            {vm.aviso && <Text accessibilityRole="alert" style={styles.text}>{vm.aviso}</Text>}
          </>}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
const baseStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, justifyContent: 'center' },
  modal: { maxHeight: '100%', flexShrink: 1, backgroundColor: '#F8FAFC', borderRadius: 20, overflow: 'hidden', paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, flexWrap: 'wrap' },
  title: { color: '#1E3A5A', fontSize: 19, fontWeight: '800' }, close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 16 }, text: { fontSize: 13, color: '#64748B', lineHeight: 20 }, name: { fontSize: 15, fontWeight: '700', color: '#1E3A5A' },
  hero: { padding: 20, borderRadius: 16, backgroundColor: '#1E3A5A', gap: 8 }, heroText: { color: '#FFFFFF', fontSize: 13 }, heroTitle: { color: '#F4D47C', fontSize: 23, fontWeight: '800' },
  product: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12 }, image: { width: 68, height: 78, borderRadius: 10 }, grow: { flex: 1, gap: 6 },
  notice: { padding: 12, color: '#886B12', backgroundColor: '#FFFBEB', borderRadius: 12, fontSize: 13, lineHeight: 20 },
  button: { padding: 16, borderRadius: 12, backgroundColor: '#1E3A5A', minHeight: 48 }, buttonText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' }, error: { color: '#B91C1C', fontSize: 13 },
});
