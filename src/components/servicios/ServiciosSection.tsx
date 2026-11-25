import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Text } from '../compartidos/TextoApp';
import { Feather } from '@expo/vector-icons';
import { useServiciosViewModel } from '../../viewmodels/useServiciosViewModel';
import { ServicioCard } from './ServicioCard';
import { ServicioDetalleModal } from './ServicioDetalleModal';
import { ServicioItem } from '../../models/Servicio';

type Props = { onAgendarServicio?: (servicio: ServicioItem) => void; cabecera?: React.ReactElement; onActualizar?: () => void };
type Fila = ServicioItem | { tipo: 'controles'; id: string };
export const ServiciosSection = forwardRef<{ mostrarServicios: () => void }, Props>(function ServiciosSection({ onAgendarServicio, cabecera, onActualizar }, ref) {
  const apariencia = useAparienciaViewModel();
  const styles = useThemedStyles(baseStyles);
  const vm = useServiciosViewModel();
  const lista = useRef<FlatList<Fila>>(null);
  const altoPanel = useRef(0);
  const mostrarServicios = () => lista.current?.scrollToOffset({ offset: altoPanel.current, animated: true });
  const volverAlInicioCatalogo = () => lista.current?.scrollToOffset({ offset: altoPanel.current, animated: false });
  useImperativeHandle(ref, () => ({ mostrarServicios }));
  const agendar = (item: ServicioItem) => { vm.cerrarDetalle(); onAgendarServicio?.(item); };
  const controles = <View style={styles.controls}>
    <Text accessibilityRole="header" style={styles.title}>Nuestros Servicios Exclusivos</Text>
    <View style={styles.search}>
      <Feather name="search" size={19} color={apariencia.color("#2563EB")} />
      <TextInput accessibilityLabel="Buscar servicios" style={styles.input} placeholder="Buscar servicio, corte, tinte..."
        value={vm.busqueda} onChangeText={value => { vm.setBusqueda(value); volverAlInicioCatalogo(); }} placeholderTextColor={apariencia.colors.muted} keyboardAppearance={apariencia.esOscuro ? 'dark' : 'light'} />
      {!!vm.busqueda && <TouchableOpacity accessibilityLabel="Limpiar búsqueda" accessibilityRole="button" onPress={() => { vm.setBusqueda(''); volverAlInicioCatalogo(); }} style={styles.clear}><Feather name="x" size={18} color={apariencia.color("#64748B")} /></TouchableOpacity>}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.categories}>
      {vm.categoriasDisponibles.map(cat => <TouchableOpacity key={cat} accessibilityRole="button" accessibilityState={{ selected: vm.categoriaActiva === cat }}
        style={[styles.chip, vm.categoriaActiva === cat && styles.selected]} onPress={() => { vm.setCategoriaActiva(cat); volverAlInicioCatalogo(); }}>
        <Text style={[styles.chipText, vm.categoriaActiva === cat && styles.selectedText]}>{cat}</Text>
      </TouchableOpacity>)}
    </ScrollView>
    <Text accessibilityLiveRegion="polite" style={styles.counter}>{vm.totalServicios} servicios · Página {vm.pagina} de {vm.totalPaginas}</Text>
  </View>;
  const estado = vm.isLoading ? <View style={styles.state}><ActivityIndicator color={apariencia.color("#1E3A5A")} /><Text>Cargando servicios...</Text></View>
    : vm.error ? <View style={styles.state}><Text style={styles.error}>{vm.error}</Text><TouchableOpacity accessibilityRole="button" onPress={vm.reintentar}><Text style={styles.link}>Reintentar</Text></TouchableOpacity></View>
    : vm.servicios.length === 0 ? <View style={styles.state}><Text style={styles.empty}>No se encontraron servicios</Text><Text style={styles.counter}>Intenta con otro término o selecciona otra categoría.</Text></View> : null;
  return <View style={styles.container}>
    <FlatList<Fila> ref={lista} data={[{ tipo: 'controles', id: 'controles' }, ...(!vm.isLoading && !vm.error ? vm.servicios : [])]}
      keyExtractor={item => 'tipo' in item ? 'controles-catalogo' : `servicio-${item.id}`}
      ListHeaderComponent={<View onLayout={event => { altoPanel.current = event.nativeEvent.layout.height; }}>{cabecera}</View>}
      stickyHeaderIndices={[1]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      initialNumToRender={7} windowSize={5} showsVerticalScrollIndicator={false}
      refreshControl={onActualizar ? <RefreshControl refreshing={false} onRefresh={() => { onActualizar(); vm.reintentar(); }} /> : undefined}
      renderItem={({ item }) => 'tipo' in item ? controles : <View style={styles.card}><ServicioCard item={item} onDetalle={vm.abrirDetalle} onAgendar={agendar} /></View>}
      ListFooterComponent={<View style={styles.footer}>{estado}
        {!vm.isLoading && !vm.error && vm.totalPaginas > 1 && <View style={styles.pages}>
          <TouchableOpacity accessibilityRole="button" disabled={vm.pagina <= 1} style={[styles.page, vm.pagina <= 1 && styles.disabled]}
            onPress={() => { vm.cambiarPagina(vm.pagina - 1); mostrarServicios(); }}><Text style={styles.link}>Anterior</Text></TouchableOpacity>
          <Text style={styles.counter}>{vm.pagina} / {vm.totalPaginas}</Text>
          <TouchableOpacity accessibilityRole="button" disabled={vm.pagina >= vm.totalPaginas} style={[styles.page, vm.pagina >= vm.totalPaginas && styles.disabled]}
            onPress={() => { vm.cambiarPagina(vm.pagina + 1); mostrarServicios(); }}><Text style={styles.link}>Siguiente</Text></TouchableOpacity>
        </View>}
      </View>} />
    <ServicioDetalleModal visible={vm.modalDetalleVisible} servicio={vm.servicioSeleccionado} onClose={vm.cerrarDetalle} onAgendar={agendar} />
  </View>;
});
const baseStyles = StyleSheet.create({
  container: { flex: 1 }, controls: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, gap: 12, backgroundColor: '#FFF', borderBottomColor: '#E5E7EB', borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#1E3A5A' }, search: { flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 46, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  input: { flex: 1, color: '#1E293B', paddingVertical: 12 }, clear: { minHeight: 44, minWidth: 32, alignItems: 'center', justifyContent: 'center' },
  categories: { gap: 8 }, chip: { minHeight: 44, justifyContent: 'center', borderRadius: 24, paddingHorizontal: 16, backgroundColor: '#F1F5F9' },
  selected: { backgroundColor: '#1E3A5A' }, chipText: { color: '#475569', fontWeight: '600' }, selectedText: { color: '#FFF' },
  counter: { color: '#64748B', fontSize: 12 }, card: { paddingHorizontal: 20, paddingTop: 14 }, footer: { paddingHorizontal: 20, paddingBottom: 40 },
  state: { paddingVertical: 32, alignItems: 'center', gap: 14 }, error: { color: '#B91C1C' }, empty: { fontSize: 16, fontWeight: '700', color: '#1E3A5A' },
  pages: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, gap: 12 }, page: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: '#D4AF37', borderRadius: 12, paddingHorizontal: 16 },
  link: { color: '#1E3A5A', fontWeight: '700' }, disabled: { opacity: 0.35 },
});
