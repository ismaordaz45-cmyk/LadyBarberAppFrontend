import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, BackHandler, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '../compartidos/TextoApp';
import { EncabezadoModulo } from '../compartidos/EncabezadoModulo';
import { ImagenProducto } from './ImagenProducto';
import { DetalleCompraModal } from './DetalleCompraModal';
import { useComprasViewModel } from '../../viewmodels/useComprasViewModel';
import { FiltroCompras, etiquetasRecogida, fechaCompra } from '../../models/Compra';
import { useThemedStyles } from '../../hooks/use-themed-styles';

const filtros: { id: FiltroCompras; texto: string }[] = [{ id: 'todas', texto: 'Todas' }, { id: 'vigentes', texto: 'Plazo vigente' }, { id: 'vencidas', texto: 'Plazo vencido' }];
export default function MisComprasScreen() {
  const vm = useComprasViewModel(), styles = useThemedStyles(baseStyles), router = useRouter();
  const primera = useRef(true), entrada = useRef<string | null>(null);
  const { pedidoId } = useLocalSearchParams<{ pedidoId?: string }>();
  const { actualizar, abrir } = vm;
  useFocusEffect(useCallback(() => {
    if (primera.current) primera.current = false; else actualizar();
    const atras = BackHandler.addEventListener('hardwareBackPress', () => { router.navigate('/(tabs)/perfil'); return true; });
    return () => atras.remove();
  }, [actualizar, router]));
  useEffect(() => { if (pedidoId && /^[1-9]\d*$/.test(pedidoId) && entrada.current !== pedidoId) { entrada.current = pedidoId; void abrir(Number(pedidoId)); } }, [pedidoId, abrir]);
  return <SafeAreaView edges={['top','left','right']} style={styles.screen}>
    <EncabezadoModulo titulo="Mis compras" />
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" onPress={() => router.navigate('/(tabs)/perfil')} style={styles.back}><Text style={styles.link}>← Mi perfil</Text></TouchableOpacity>
      <Text style={styles.subtitle}>Tus productos y comprobantes, en un solo lugar.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filtros.map(f => <TouchableOpacity key={f.id} accessibilityRole="tab" accessibilityState={{ selected: vm.filtro === f.id }}
          onPress={() => vm.setFiltro(f.id)} style={[styles.filter, vm.filtro === f.id && styles.selected]}><Text style={[styles.filterText, vm.filtro === f.id && styles.selectedText]}>{f.texto}</Text></TouchableOpacity>)}
      </ScrollView>
    </View>
    {vm.error && <View style={styles.header}><Text style={styles.error} accessibilityRole="alert">{vm.error}</Text><TouchableOpacity onPress={vm.actualizar} style={styles.back}><Text style={styles.link}>Volver a intentar</Text></TouchableOpacity></View>}
    {vm.cargando ? <View style={styles.empty}><ActivityIndicator /><Text style={styles.subtitle}>Cargando tus compras...</Text></View> : <FlatList
      data={vm.compras} keyExtractor={c => String(c.id)} contentContainerStyle={styles.list} refreshing={false} onRefresh={vm.actualizar}
      renderItem={({ item: c }) => <View style={styles.card}>
        <View style={styles.row}><Text style={styles.folio}>PEDIDO #{c.id}</Text><Text style={styles.badge}>{c.paymentStatus === 'approved' ? etiquetasRecogida[c.estadoRecogida] : 'Pago en revisión / devolución'}</Text></View>
        <Text style={styles.subtitle}>{fechaCompra(c.aprobadoEn || c.fecha)}</Text>
        {c.items.map(i => <View key={i.insumoId} style={styles.product}>
          <ImagenProducto uri={i.imagen || undefined} nombre={i.nombre} style={styles.image} />
          <View style={styles.grow}><Text style={styles.name}>{i.nombre}</Text><Text style={styles.subtitle}>${i.precioUnitario.toFixed(2)} MXN × {i.cantidad}</Text><Text style={styles.name}>${i.subtotal.toFixed(2)} MXN</Text></View>
        </View>)}
        {c.totalProductos > c.items.length && <Text style={styles.subtitle}>+ {c.totalProductos - c.items.length} productos más en el detalle</Text>}
        <View style={styles.row}><Text style={styles.total}>${c.total.toFixed(2)} MXN</Text><Text style={styles.subtitle}>{c.totalUnidades} unidades</Text></View>
        <TouchableOpacity accessibilityRole="button" onPress={() => void vm.abrir(c.id)} style={styles.button}><Text style={styles.buttonText}>Vista previa y comprobante</Text></TouchableOpacity>
      </View>}
      ListEmptyComponent={<View style={styles.empty}><Text style={styles.name}>No hay compras en este apartado</Text><Text style={styles.subtitle}>Aquí aparecerán tus compras cuando el pago esté registrado.</Text><TouchableOpacity onPress={() => router.navigate('/(tabs)/tienda')} style={styles.button}><Text style={styles.buttonText}>Explorar productos</Text></TouchableOpacity></View>}
      ListFooterComponent={vm.hayMas ? <TouchableOpacity accessibilityRole="button" disabled={vm.cargandoMas} onPress={() => void vm.verMas()} style={styles.more}><Text style={styles.link}>{vm.cargandoMas ? 'Cargando...' : 'Ver más compras'}</Text></TouchableOpacity> : vm.compras.length ? <Text style={styles.end}>Has visto todas las compras de este apartado.</Text> : null} />}
    <DetalleCompraModal vm={vm} />
  </SafeAreaView>;
}
const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' }, header: { paddingHorizontal: 20, paddingBottom: 12, gap: 10 }, back: { minHeight: 44, justifyContent: 'center' },
  link: { color: '#2563EB', fontWeight: '700', fontSize: 14 }, subtitle: { color: '#64748B', fontSize: 12, lineHeight: 18 },
  filters: { gap: 8 }, filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }, selected: { backgroundColor: '#1E3A5A', borderColor: '#1E3A5A' }, filterText: { color: '#1E3A5A', fontWeight: '700' }, selectedText: { color: '#FFFFFF' },
  list: { padding: 20, paddingTop: 4, paddingBottom: 24, flexGrow: 1 }, card: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', gap: 14, marginBottom: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }, folio: { color: '#64748B', fontSize: 11, letterSpacing: 1 }, badge: { backgroundColor: '#FFFBEB', color: '#886B12', padding: 8, borderRadius: 10, fontWeight: '700', fontSize: 11 },
  product: { flexDirection: 'row', alignItems: 'center', gap: 14 }, image: { width: 66, height: 76, borderRadius: 10 }, grow: { flex: 1, gap: 6 }, name: { color: '#1E3A5A', fontSize: 15, fontWeight: '700' }, total: { color: '#1E3A5A', fontSize: 19, fontWeight: '800' },
  button: { backgroundColor: '#1E3A5A', padding: 14, borderRadius: 12, minHeight: 46, justifyContent: 'center' }, buttonText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center', fontSize: 13 }, more: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37', borderRadius: 12, backgroundColor: '#FFFBEB' },
  empty: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 14 }, end: { color: '#64748B', textAlign: 'center', padding: 12, fontSize: 12 }, error: { color: '#B91C1C', fontSize: 13 },
});
