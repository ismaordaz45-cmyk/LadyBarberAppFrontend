import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Keyboard, ScrollView, StyleSheet, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Text } from '../compartidos/TextoApp';
import { Feather } from '@expo/vector-icons';
import { ServicioItem } from '../../models/Servicio';
import type { useCatalogoReservaViewModel } from '../../viewmodels/useCatalogoReservaViewModel';
import { ServicioSeleccionCard } from './ServicioSeleccionCard';
import { ServicioDetalleModal } from './ServicioDetalleModal';
import { dinero } from '../../utils/citasPresentation';

type Props = { catalogo: ReturnType<typeof useCatalogoReservaViewModel>; isLoading: boolean; error: string | null;
  onReintentar: () => void; onSeleccionar: (id: string) => void; onContinuar: () => void;
  total: { duracion: number; precio: number } };
const extraerId = (servicio: ServicioItem) => servicio.id;

export function CatalogoServiciosReserva({ catalogo, isLoading, error, onReintentar, onSeleccionar, onContinuar, total }: Props) {
  const apariencia = useAparienciaViewModel();
  const styles = useThemedStyles(baseStyles);
  const { width, fontScale } = useWindowDimensions();
  const { abrirDetalle: mostrarDetalle } = catalogo;
  const columnas = width < 360 || fontScale >= 1.4 ? 1 : width >= 900 ? 3 : 2;
  const ancho = Math.max(1, (width - 40 - (columnas - 1) * 12) / columnas);
  const abrirDetalle = useCallback((servicio: ServicioItem) => { Keyboard.dismiss(); mostrarDetalle(servicio); }, [mostrarDetalle]);
  const renderServicio = useCallback(({ item }: { item: ServicioItem }) => <View style={{ width: ancho, marginBottom: 12 }}>
    <ServicioSeleccionCard servicio={item} seleccionado={catalogo.seleccion.has(item.id)} onSeleccionar={onSeleccionar} onDetalle={abrirDetalle} />
  </View>, [ancho, catalogo.seleccion, abrirDetalle, onSeleccionar]);
  const bloqueado = isLoading || Boolean(error);

  return <View style={styles.container}>
    <FlatList<ServicioItem> key={`servicios-${columnas}`} testID="catalogo-reserva-lista"
      data={bloqueado ? [] : catalogo.serviciosVisibles} keyExtractor={extraerId} renderItem={renderServicio}
      extraData={catalogo.seleccion} numColumns={columnas} columnWrapperStyle={columnas > 1 ? styles.columns : undefined}
      contentContainerStyle={styles.content} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      ListHeaderComponent={<View style={styles.header}>
        <Text style={styles.title}>Encuentra tu servicio</Text>
        <Text style={styles.subtitle}>Busca, explora y selecciona uno o varios servicios para tu visita.</Text>
        <View style={styles.search}><Feather name="search" size={19} color={apariencia.color("#64748B")} />
          <TextInput accessibilityLabel="Buscar servicios por nombre" placeholder="Buscar por nombre" value={catalogo.busqueda}
            onChangeText={catalogo.cambiarBusqueda} editable={!bloqueado} autoCorrect={false} autoCapitalize="none"
            returnKeyType="search" onSubmitEditing={Keyboard.dismiss} style={styles.searchInput} placeholderTextColor={apariencia.colors.muted} keyboardAppearance={apariencia.esOscuro ? 'dark' : 'light'} />
          {!!catalogo.busqueda && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" style={styles.clear} onPress={() => catalogo.cambiarBusqueda('')}>
            <Feather name="x" size={18} color={apariencia.color("#64748B")} /></TouchableOpacity>}
        </View>
        {catalogo.categorias.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories} keyboardShouldPersistTaps="handled">
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: catalogo.categoriaActiva === null }} style={[styles.chip, catalogo.categoriaActiva === null && styles.chipActive]}
            onPress={() => catalogo.cambiarCategoria(null)}><Text style={[styles.chipText, catalogo.categoriaActiva === null && styles.chipTextActive]}>Todas las categorías</Text></TouchableOpacity>
          {catalogo.categorias.map(categoria => <TouchableOpacity key={categoria} accessibilityRole="button" accessibilityState={{ selected: catalogo.categoriaActiva === categoria }}
            style={[styles.chip, catalogo.categoriaActiva === categoria && styles.chipActive]} onPress={() => catalogo.cambiarCategoria(categoria)}>
            <Text style={[styles.chipText, catalogo.categoriaActiva === categoria && styles.chipTextActive]}>{categoria}</Text></TouchableOpacity>)}
        </ScrollView>}
        {!bloqueado && <Text accessibilityLiveRegion="polite" style={styles.counter}>Mostrando {catalogo.serviciosVisibles.length} de {catalogo.totalResultados} servicios</Text>}
      </View>}
      ListEmptyComponent={<View style={styles.state}>
        {isLoading ? <><ActivityIndicator size="large" color={apariencia.color("#1E3A5A")} /><Text style={styles.subtitle}>Cargando servicios…</Text></>
          : error ? <><Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text><TouchableOpacity accessibilityRole="button" onPress={onReintentar} style={styles.stateButton}><Text style={styles.link}>Reintentar</Text></TouchableOpacity></>
          : <><Feather name="search" size={30} color={apariencia.color("#94A3B8")} /><Text style={styles.stateTitle}>{catalogo.totalCatalogo ? 'No encontramos servicios' : 'No hay servicios disponibles'}</Text>
            <Text style={styles.subtitle}>{catalogo.totalCatalogo ? 'Prueba otro nombre o cambia de categoría.' : 'Vuelve a consultar el catálogo más tarde.'}</Text>
            {!!(catalogo.busqueda || catalogo.categoriaActiva) && <TouchableOpacity accessibilityRole="button" onPress={catalogo.limpiarFiltros} style={styles.stateButton}><Text style={styles.link}>Limpiar filtros</Text></TouchableOpacity>}</>}
      </View>}
      ListFooterComponent={!bloqueado && catalogo.hayMas ? <TouchableOpacity accessibilityRole="button" onPress={catalogo.verMas} style={styles.more}><Text style={styles.link}>Ver más servicios</Text></TouchableOpacity> : null}
    />
    <View style={styles.footer}>
      {catalogo.seleccionados.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedServices} keyboardShouldPersistTaps="handled">
        {catalogo.seleccionados.map(servicio => <TouchableOpacity key={servicio.id} accessibilityRole="button" accessibilityLabel={`Quitar ${servicio.nombre} de la selección`}
          style={styles.selectedChip} onPress={() => onSeleccionar(servicio.id)}><Text style={styles.selectedName}>{servicio.nombre} ×</Text></TouchableOpacity>)}
      </ScrollView>}
      <View style={styles.summaryRow}><View style={{ flexShrink: 1 }}>
        <Text style={styles.summaryLabel}>{catalogo.seleccionados.length} {catalogo.seleccionados.length === 1 ? 'seleccionado' : 'seleccionados'} · {total.duracion} min</Text>
        <Text style={styles.price}>{dinero(total.precio)}</Text>
      </View><TouchableOpacity accessibilityRole="button" disabled={bloqueado || catalogo.seleccionados.length === 0}
        style={[styles.continue, (bloqueado || catalogo.seleccionados.length === 0) && styles.disabled]}
        onPress={() => { Keyboard.dismiss(); onContinuar(); }}><Text style={styles.continueText}>Continuar</Text><Feather name="arrow-right" size={16} color={apariencia.color("#FFF")} /></TouchableOpacity></View>
    </View>
    <ServicioDetalleModal visible={catalogo.detalleServicio !== null} servicio={catalogo.detalleServicio} onClose={catalogo.cerrarDetalle}
      actionLabel={catalogo.detalleServicio && catalogo.seleccion.has(catalogo.detalleServicio.id) ? 'Quitar de mi selección' : 'Seleccionar servicio'}
      onAgendar={servicio => onSeleccionar(servicio.id)} />
  </View>;
}

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 }, columns: { gap: 12 },
  header: { gap: 14, marginBottom: 16 }, title: { color: '#1E3A5A', fontWeight: '800', fontSize: 22 }, subtitle: { color: '#64748B', fontSize: 13, lineHeight: 21 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, backgroundColor: '#FFF', paddingHorizontal: 12 },
  searchInput: { flex: 1, minHeight: 48, paddingVertical: 12, color: '#1E3A5A', fontSize: 14 }, clear: { minWidth: 36, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  categories: { flexDirection: 'row', gap: 8 }, chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFF' },
  chipActive: { backgroundColor: '#1E3A5A', borderColor: '#1E3A5A' }, chipText: { color: '#475569', fontSize: 12, fontWeight: '600' }, chipTextActive: { color: '#FFF' }, counter: { color: '#64748B', fontSize: 12 },
  state: { paddingVertical: 28, alignItems: 'center', gap: 12 }, stateTitle: { color: '#1E3A5A', fontSize: 16, fontWeight: '700' }, error: { color: '#B91C1C', textAlign: 'center' },
  stateButton: { minHeight: 44, justifyContent: 'center', padding: 12 }, link: { color: '#2563EB', fontWeight: '700' }, more: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFF' },
  footer: { borderTopWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', padding: 14, gap: 10 }, selectedServices: { flexDirection: 'row', gap: 8 },
  selectedChip: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 18, backgroundColor: '#FFF8DF' }, selectedName: { color: '#735B16', fontSize: 12, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, summaryLabel: { fontSize: 11, color: '#64748B' }, price: { fontWeight: '800', fontSize: 18, color: '#1E3A5A', marginTop: 5 },
  continue: { minHeight: 48, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 12, backgroundColor: '#1E3A5A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, continueText: { color: '#FFF', fontWeight: '700' }, disabled: { opacity: 0.45 },
});
