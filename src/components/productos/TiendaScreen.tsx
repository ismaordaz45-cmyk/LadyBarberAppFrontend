import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Text } from '../compartidos/TextoApp';
import { EncabezadoModulo } from '../compartidos/EncabezadoModulo';
import { ProductoCard } from './ProductoCard';
import { ProductoDetalleModal } from './ProductoDetalleModal';
import { ImagenProducto } from './ImagenProducto';
import { useProductosViewModel } from '../../viewmodels/useProductosViewModel';
import { useCarritoViewModel } from '../../viewmodels/useCarritoViewModel';
import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import { usePagoProductosViewModel } from '../../viewmodels/usePagoProductosViewModel';
import { ResumenPedido } from './ResumenPedido';
import { AvisoCarrito } from './AvisoCarrito';

const dinero = (valor: number) => `$${valor.toFixed(2)} MXN`;

export default function TiendaScreen() {
  const styles = useThemedStyles(baseStyles);
  const apariencia = useAparienciaViewModel();
  const router = useRouter();
  const { seccion, visita } = useLocalSearchParams<{ seccion?: string; visita?: string }>();
  const catalogo = useProductosViewModel();
  const carrito = useCarritoViewModel(catalogo.catalogo);
  const pago = usePagoProductosViewModel(carrito.aplicarPedido, carrito.listo);
  const entrada = `${seccion ?? 'catalogo'}:${visita ?? ''}`;
  const [seleccion, setSeleccion] = useState<{ entrada: string; pestana: 'catalogo' | 'carrito' }>(() => ({ entrada, pestana: seccion === 'carrito' ? 'carrito' : 'catalogo' }));
  const pestana = seleccion.entrada === entrada ? seleccion.pestana : seccion === 'carrito' ? 'carrito' : 'catalogo';
  const setPestana = (pestana: 'catalogo' | 'carrito') => setSeleccion({ entrada, pestana });
  const [confirmarVaciado, setConfirmarVaciado] = useState(false);
  const { width } = useWindowDimensions();
  const columnas = width >= 760 ? 3 : width >= 360 ? 2 : 1;
  const lista = useRef<FlatList>(null);
  const primeraVisita = useRef(true);
  const { recargar } = catalogo;
  useFocusEffect(useCallback(() => {
    if (primeraVisita.current) primeraVisita.current = false;
    else recargar();
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      router.navigate('/(tabs)');
      return true;
    });
    return () => listener.remove();
  }, [router, recargar]));
  const reiniciarScroll = () => lista.current?.scrollToOffset({ offset: 0, animated: false });
  const bloqueado = !carrito.listo || catalogo.isLoading || !!catalogo.error || pago.ocupado;
  const bloquearCambios = bloqueado || !!pago.pedido;
  const verCarrito = () => { catalogo.cerrarDetalle(); setPestana('carrito'); setConfirmarVaciado(false); };
  const boton = (texto: string, onPress: () => void, secundario = false, disabled = false) => (
    <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={[styles.button, secundario && styles.secondary, disabled && styles.disabled]}>
      <Text style={[styles.buttonText, secundario && styles.secondaryText]}>{texto}</Text>
    </TouchableOpacity>
  );

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <EncabezadoModulo titulo={pestana === 'carrito' ? 'Carrito' : 'Productos'} />
    <View style={styles.navigation}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver a Inicio" onPress={() => router.navigate('/(tabs)')} style={styles.back}>
        <Feather name="arrow-left" size={20} color={apariencia.colors.text} /><Text style={styles.muted}>Inicio</Text>
      </TouchableOpacity>
      <Text style={styles.pickup}>Recoge en el salón</Text>
    </View>
    <View style={styles.tabs} accessibilityRole="tablist">
      {(['catalogo', 'carrito'] as const).map(tab => <TouchableOpacity key={tab} accessibilityRole="tab"
        accessibilityState={{ selected: pestana === tab }} onPress={() => { setPestana(tab); setConfirmarVaciado(false); }}
        style={[styles.tab, pestana === tab && styles.tabActive]}>
        <Feather name={tab === 'catalogo' ? 'grid' : 'shopping-cart'} size={17} color={pestana === tab ? apariencia.color('#FFFFFF') : apariencia.colors.text} />
        <Text style={[styles.tabText, pestana === tab && styles.tabTextActive]}>{tab === 'catalogo' ? 'Catálogo' : `Carrito (${carrito.cantidad})`}</Text>
      </TouchableOpacity>)}
    </View>
    {!catalogo.productoDetalle && <AvisoCarrito agregado={carrito.ultimoAgregado ?? null} onVerCarrito={verCarrito} />}
    {carrito.error && <View style={styles.controls}><Text accessibilityRole="alert" style={styles.error}>{carrito.error}</Text>{boton('Reintentar guardar carrito', carrito.reintentar, true)}</View>}
    {carrito.sinSesion && <Text style={styles.notice}>Inicia sesión para guardar productos en tu carrito.</Text>}
    {pago.error && <View style={styles.controls}><Text accessibilityRole="alert" style={styles.error}>{pago.error}</Text>{!pago.listo && boton('Recuperar pedido', pago.reintentar, true)}</View>}
    {!carrito.sinSesion && !carrito.listo && !carrito.error && <Text style={styles.notice}>Recuperando tu carrito...</Text>}
    {pestana === 'catalogo' && <View style={styles.controls}>
      <View style={styles.search}>
        <Feather name="search" size={18} color={apariencia.colors.muted} />
        <TextInput accessibilityLabel="Buscar productos" placeholder="Busca un producto" placeholderTextColor={apariencia.colors.muted}
          keyboardAppearance={apariencia.esOscuro ? 'dark' : 'light'} value={catalogo.busqueda} style={styles.input}
          onChangeText={texto => { catalogo.setBusqueda(texto); reiniciarScroll(); }} />
        {!!catalogo.busqueda && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Limpiar búsqueda"
          onPress={() => { catalogo.setBusqueda(''); reiniciarScroll(); }} style={styles.clear}><Feather name="x" size={18} color={apariencia.colors.text} /></TouchableOpacity>}
      </View>
      {catalogo.categoriasDisponibles.length > 2 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {catalogo.categoriasDisponibles.map(cat => <TouchableOpacity key={cat} accessibilityRole="button"
          accessibilityState={{ selected: cat === catalogo.categoriaActiva }} style={[styles.chip, cat === catalogo.categoriaActiva && styles.chipActive]}
          onPress={() => { catalogo.setCategoriaActiva(cat); reiniciarScroll(); }}>
          <Text style={styles.chipText}>{cat}</Text></TouchableOpacity>)}
      </ScrollView>}
      <View style={styles.row}>
        <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: catalogo.soloDisponibles }} style={styles.filter}
          onPress={() => { catalogo.setSoloDisponibles(!catalogo.soloDisponibles); reiniciarScroll(); }}>
          <Feather name={catalogo.soloDisponibles ? 'check-square' : 'square'} size={18} color={apariencia.colors.text} />
          <Text style={styles.small}>Disponibles</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.filter} onPress={() => { catalogo.toggleOrden(); reiniciarScroll(); }}>
          <Feather name="sliders" size={16} color={apariencia.colors.text} /><Text style={styles.small}>{catalogo.ordenAscendente === null ? 'Ordenar' : catalogo.ordenAscendente ? 'Menor precio' : 'Mayor precio'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.muted}>{catalogo.totalArticulos} productos · {catalogo.productosVisibles.length} visibles</Text>
    </View>}

    {catalogo.isLoading ? <View style={styles.empty}><ActivityIndicator color={apariencia.colors.text} /><Text style={styles.muted}>Cargando productos...</Text></View>
      : catalogo.error ? <View style={styles.empty}><Text accessibilityRole="alert" style={styles.error}>{catalogo.error}</Text>{boton('Volver a intentar', catalogo.recargar)}</View>
      : pestana === 'catalogo' ? <FlatList ref={lista} key={`catalogo-${columnas}`} data={catalogo.productosVisibles} numColumns={columnas}
        keyExtractor={item => item.id} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <View style={{ width: `${100 / columnas}%`, paddingHorizontal: 6 }}><ProductoCard item={item}
          cantidad={carrito.lineas.find(linea => linea.productoId === item.id)?.cantidad ?? 0}
          bloqueado={bloqueado} onVerProducto={() => catalogo.abrirDetalle(item)} onAgregar={() => carrito.agregar(item)} /></View>}
        ListEmptyComponent={<View style={styles.empty}><Feather name="search" size={32} color={apariencia.colors.muted} /><Text style={styles.title}>No hay productos que coincidan</Text><Text style={styles.muted}>Prueba otra búsqueda o ajusta los filtros.</Text></View>}
        ListFooterComponent={catalogo.hayMas ? boton('Ver más productos', catalogo.verMas, true) : <Text style={styles.end}>Has visto todos los resultados.</Text>} />
      : <>
        <FlatList data={carrito.lineas} keyExtractor={item => item.productoId} contentContainerStyle={styles.list}
          ListHeaderComponent={pago.pedido ? <ResumenPedido pago={pago} /> : null}
          ListEmptyComponent={<View style={styles.empty}><Feather name="shopping-bag" size={36} color={apariencia.colors.muted} />
            <Text style={styles.title}>Tu carrito está vacío</Text><Text style={styles.muted}>Encuentra tus productos y agrégalos aquí.</Text>
            {boton('Explorar catálogo', () => setPestana('catalogo'))}</View>}
          renderItem={({ item }) => <View style={styles.cartCard}>
            <View style={styles.row}>
              <ImagenProducto uri={item.producto?.imagenUrl} nombre={item.producto?.nombre ?? 'Producto no disponible'} style={styles.thumbnail} />
              <View style={styles.grow}><Text style={styles.title}>{item.producto?.nombre ?? 'Producto no disponible'}</Text>
              <Text style={styles.muted}>{item.producto ? `${dinero(item.producto.precioMXN)} por unidad` : 'Este producto ya no está en el catálogo.'}</Text></View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Quitar ${item.producto?.nombre ?? 'producto'}`} disabled={bloquearCambios} onPress={() => carrito.quitar(item.productoId)} style={styles.clear}>
                <Feather name="trash-2" size={20} color={apariencia.colors.muted} /></TouchableOpacity></View>
            {item.requiereAjuste && <Text style={styles.warning}>Revisa la cantidad: {item.limite} unidades disponibles.</Text>}
            <View style={styles.row}>
              <View style={styles.quantity}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Restar una unidad de ${item.producto?.nombre}`} disabled={bloquearCambios}
                  onPress={() => item.producto && item.cantidad > 1 && item.limite > 0 ? carrito.cambiar(item.producto, Math.min(item.cantidad - 1, item.limite)) : carrito.quitar(item.productoId)} style={styles.step}>
                  <Text style={styles.stepText}>−</Text></TouchableOpacity>
                <Text style={styles.quantityText}>{item.cantidad}</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Sumar una unidad de ${item.producto?.nombre}`}
                  disabled={bloquearCambios || item.cantidad >= item.limite} style={[styles.step, item.cantidad >= item.limite && styles.disabled]}
                  onPress={() => item.producto && carrito.cambiar(item.producto, item.cantidad + 1)}><Text style={styles.stepText}>+</Text></TouchableOpacity>
              </View><Text style={styles.price}>{dinero(item.subtotal)}</Text>
            </View>
            {item.requiereAjuste && item.producto && item.limite > 0 && boton('Ajustar a existencias', () => carrito.cambiar(item.producto!, item.limite), true, bloquearCambios)}
          </View>} />
        {carrito.lineas.length > 0 && <View style={styles.summary}>
          <View style={styles.row}><Text style={styles.title}>Total estimado</Text><Text style={styles.price}>{dinero(carrito.total)}</Text></View>
          <Text style={styles.muted}>El carrito no aparta existencias. Recogerás tu compra en el salón.</Text>
          {!pago.pedido && boton(pago.ocupado ? 'Preparando pedido...' : 'Revisar pedido y pagar', () => void pago.preparar(carrito.lineas.map(i => ({ productoId: i.productoId, cantidad: i.cantidad }))), false,
            bloqueado || !pago.listo || carrito.lineas.some(i => i.requiereAjuste))}
          {pago.pedido && <Text style={styles.notice}>Consulta el resumen de tu pedido al inicio del carrito.</Text>}
          {confirmarVaciado ? <View style={styles.row}>
            {boton('Conservar', () => setConfirmarVaciado(false), true)}
            {boton('Sí, vaciar', () => { carrito.vaciar(); setConfirmarVaciado(false); }, false, bloquearCambios)}
          </View> : boton('Vaciar carrito', () => setConfirmarVaciado(true), true, bloquearCambios)}
        </View>}
      </>}
    <ProductoDetalleModal producto={catalogo.productoDetalle} cantidad={carrito.lineas.find(linea => linea.productoId === catalogo.productoDetalle?.id)?.cantidad ?? 0}
      bloqueado={bloqueado} onClose={catalogo.cerrarDetalle} onAgregar={carrito.agregar}
      agregado={carrito.ultimoAgregado ?? null} onVerCarrito={verCarrito} />
  </SafeAreaView>;
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  navigation: { paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickup: { color: '#886B12', fontSize: 12, fontWeight: '600' },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: '#E2E8F0', marginHorizontal: 20, marginBottom: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: 12 },
  tabActive: { backgroundColor: '#1E3A5A' }, tabText: { color: '#1E3A5A', fontSize: 14, fontWeight: '700' }, tabTextActive: { color: '#FFFFFF' },
  controls: { paddingHorizontal: 20, gap: 10, paddingBottom: 12 },
  search: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, backgroundColor: '#FFFFFF', minHeight: 48 },
  input: { flex: 1, padding: 12, color: '#0F172A', fontSize: 14 },
  clear: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: 8 }, chip: { borderWidth: 1, borderColor: '#E2E8F0', padding: 10, borderRadius: 20, backgroundColor: '#FFFFFF' },
  chipActive: { borderColor: '#D4AF37', backgroundColor: '#FFFBEB' }, chipText: { color: '#1E3A5A', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  filter: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44 }, small: { fontSize: 12, color: '#334155' },
  muted: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  list: { paddingHorizontal: 14, paddingBottom: 20, flexGrow: 1 },
  empty: { padding: 24, flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  title: { color: '#1E3A5A', fontSize: 16, fontWeight: '700' }, price: { color: '#1E3A5A', fontSize: 17, fontWeight: '800' },
  button: { backgroundColor: '#1E3A5A', minHeight: 46, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  secondary: { borderWidth: 1, borderColor: '#D4AF37', backgroundColor: '#FFFBEB' }, secondaryText: { color: '#886B12' }, disabled: { opacity: 0.45 },
  end: { textAlign: 'center', color: '#64748B', padding: 12, fontSize: 12 },
  error: { color: '#B91C1C', fontSize: 13, padding: 12 }, notice: { color: '#64748B', fontSize: 12, paddingVertical: 6, textAlign: 'center' },
  cartCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 18, padding: 16, marginHorizontal: 6, marginBottom: 12, gap: 14 },
  grow: { flex: 1, minWidth: 140, gap: 6 },
  thumbnail: { width: 56, height: 64, borderRadius: 10 },
  quantity: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  step: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }, stepText: { color: '#1E3A5A', fontSize: 24 }, quantityText: { color: '#1E3A5A', minWidth: 30, textAlign: 'center', fontWeight: '700' },
  warning: { color: '#886B12', fontSize: 12 },
  summary: { borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF', padding: 16, gap: 8 },
});
