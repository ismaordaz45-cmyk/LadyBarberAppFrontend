import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../compartidos/TextoApp';
import { useThemedStyles } from '../../hooks/use-themed-styles';
import { mensajePedido } from '../../models/Pedido';
import { usePagoProductosViewModel } from '../../viewmodels/usePagoProductosViewModel';
import { useRouter } from 'expo-router';
import { ConfirmacionAccion } from '../compartidos/ConfirmacionAccion';

type Pago = ReturnType<typeof usePagoProductosViewModel>;
export function ResumenPedido({ pago }: { pago: Pago }) {
  const styles = useThemedStyles(baseStyles);
  const router = useRouter();
  const [confirmarId, setConfirmarId] = useState<number | null>(null);
  const pedido = pago.pedido;
  if (!pedido) return null;
  const cerrado = pedido.compraConfirmada || pedido.estado === 'cancelado' || pedido.vencido || ['rejected','cancelled','mobile_created'].includes(pedido.paymentStatus ?? '');
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>PEDIDO #{pedido.id}</Text>
    <Text style={styles.title}>{pedido.requiereRevision ? 'Pago recibido · en revisión' : pedido.compraConfirmada ? 'Tu compra está confirmada' : 'Resumen de tu pedido'}</Text>
    <Text accessibilityLiveRegion="polite" style={styles.message}>{mensajePedido(pedido)}</Text>
    {pedido.items.map(item => <View key={item.insumoId} style={styles.row}>
      <Text style={styles.item}>{item.cantidad} × {item.nombre}</Text><Text style={styles.item}>${item.subtotal.toFixed(2)}</Text>
    </View>)}
    <View style={styles.row}><Text style={styles.title}>Total</Text><Text style={styles.title}>${pedido.total.toFixed(2)} MXN</Text></View>
    {pedido.paymentId && <Text selectable style={styles.message}>Pago Mercado Pago: {pedido.paymentId}</Text>}
    {pedido.compraConfirmada && <TouchableOpacity accessibilityRole="button" onPress={() => router.navigate({ pathname: '/(tabs)/compras', params: { pedidoId: String(pedido.id) } })} style={styles.secondary}><Text style={styles.secondaryText}>Ver compra y comprobante</Text></TouchableOpacity>}
    {pago.ocupado && <ActivityIndicator accessibilityLabel="Procesando pedido" />}
    {pago.puedePagar && <TouchableOpacity accessibilityRole="button" disabled={pago.ocupado} onPress={() => void pago.pagar()} style={[styles.button, pago.ocupado && styles.disabled]}><Text style={styles.buttonText}>Pagar con Mercado Pago</Text></TouchableOpacity>}
    <TouchableOpacity accessibilityRole="button" disabled={pago.ocupado} onPress={() => void pago.consultar()} style={styles.secondary}><Text style={styles.secondaryText}>Consultar estado del pedido</Text></TouchableOpacity>
    {!!pago.checkoutUrl && !pedido.pagoAprobado && <View><Text style={styles.message}>Enlace de pago · mantén pulsado para copiar y abrir en tu navegador.</Text><Text selectable style={styles.link}>{pago.checkoutUrl}</Text></View>}
    {pago.puedeCancelar && <TouchableOpacity accessibilityRole="button" disabled={pago.ocupado} onPress={() => setConfirmarId(pedido.id)} style={[styles.secondary, pago.ocupado && styles.disabled]}><Text style={styles.secondaryText}>Cancelar pedido y volver al carrito</Text></TouchableOpacity>}
    {cerrado && !pedido.requiereRevision && !pago.puedeCancelar && <TouchableOpacity accessibilityRole="button" disabled={pago.ocupado} onPress={() => void pago.finalizar()} style={styles.secondary}><Text style={styles.secondaryText}>{pedido.compraConfirmada ? 'Seguir comprando' : 'Volver al carrito'}</Text></TouchableOpacity>}
    <ConfirmacionAccion visible={confirmarId === pedido.id && pago.puedeCancelar} titulo="¿Cancelar este pedido?"
      descripcion="Tus productos se conservarán en el carrito para que puedas cambiarlos o quitarlos. Verificaremos que no haya un pago aprobado o en proceso antes de cancelar."
      confirmar="Sí, cancelar pedido" conservar="Conservar pedido" ocupado={pago.ocupado} error={pago.error}
      onConservar={() => setConfirmarId(null)} onConfirmar={() => { void pago.cancelar(pedido.id).then(cancelado => { if (cancelado) setConfirmarId(null); }); }} />
  </View>;
}
const baseStyles = StyleSheet.create({
  card: { padding: 18, margin: 6, marginBottom: 18, gap: 14, borderRadius: 18, borderWidth: 1, borderColor: '#D4AF37', backgroundColor: '#FFFFFF' },
  eyebrow: { color: '#886B12', fontWeight: '700', fontSize: 12 }, title: { color: '#1E3A5A', fontSize: 18, fontWeight: '800' },
  message: { color: '#64748B', fontSize: 13, lineHeight: 20 }, item: { color: '#1E3A5A', fontSize: 13, flexShrink: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 }, button: { padding: 14, borderRadius: 12, backgroundColor: '#1E3A5A', minHeight: 48 },
  buttonText: { color: '#FFFFFF', textAlign: 'center', fontWeight: '700' }, secondary: { padding: 12, minHeight: 44, borderWidth: 1, borderColor: '#D4AF37', borderRadius: 12, backgroundColor: '#FFFBEB' },
  secondaryText: { color: '#886B12', textAlign: 'center', fontWeight: '700' }, link: { color: '#2563EB', fontSize: 12, marginTop: 8 }, disabled: { opacity: 0.5 },
});
