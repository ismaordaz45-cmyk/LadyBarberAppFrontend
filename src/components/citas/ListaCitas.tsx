import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import React, { useRef } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../compartidos/TextoApp';
import { useRouter } from 'expo-router';
import { apartadoVencido, dinero, etiquetaCita, fechaCita, horaCita } from '../../utils/citasPresentation';
import type { useMisCitasViewModel } from '../../viewmodels/useMisCitasViewModel';
import { VistaPreviaCita } from './VistaPreviaCita';

type Props = { vm: ReturnType<typeof useMisCitasViewModel>; historial?: boolean; nuevaCita?: () => void; encabezado?: React.ReactNode };

export function ListaCitas({ vm, historial, nuevaCita, encabezado }: Props) {
  const apariencia = useAparienciaViewModel();
  const styles = useThemedStyles(baseStyles);
  const router = useRouter();
  const scroll = useRef<ScrollView>(null);
  const { resultados: citas, isLoading, error, hayMas, actualizar, cargarMas } = vm;
  return <>{encabezado ?? <View style={{ padding: 20 }}><Text style={styles.title}>{historial ? 'Tu historial de citas' : 'Tus próximas citas'}</Text></View>}
    <ScrollView ref={scroll} contentContainerStyle={styles.content}
    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={actualizar} tintColor={apariencia.color("#1E3A5A")} />}>
    <Text style={styles.subtitle}>{historial ? 'Consulta tus visitas anteriores y comprobantes de anticipo.' : 'Administra tus reservas y consulta los detalles de cada cita.'}</Text>
    {nuevaCita && <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={nuevaCita}><Text style={styles.primaryText}>＋ Agendar nueva cita</Text></TouchableOpacity>}
    <View style={styles.controls}>
      <Text style={styles.controlTitle}>Filtrar por estado</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { flexWrap: 'nowrap' }]}>
        {vm.filtros.map(f => <TouchableOpacity key={f.value} accessibilityRole="button" accessibilityState={{ selected: vm.filtro === f.value }}
          style={[styles.chip, vm.filtro === f.value && styles.chipSelected]} onPress={() => vm.cambiarFiltro(f.value)}>
          <Text style={[styles.chipText, vm.filtro === f.value && styles.chipTextSelected]}>{f.label}</Text>
        </TouchableOpacity>)}
      </ScrollView>
      <Text style={styles.controlTitle}>Ordenar por</Text>
      <View style={styles.chips}>{vm.ordenes.map(o => <TouchableOpacity key={o.value} accessibilityRole="button"
        accessibilityState={{ selected: vm.orden === o.value }} style={[styles.sortChip, vm.orden === o.value && styles.sortSelected]}
        onPress={() => vm.cambiarOrden(o.value)}><Text style={[styles.chipText, vm.orden === o.value && styles.sortTextSelected]}>{o.label}</Text></TouchableOpacity>)}</View>
    </View>
    <Text accessibilityLiveRegion="polite" style={styles.counter}>
      {isLoading ? 'Actualizando tus citas…' : `Mostrando ${citas.length} de ${vm.totalFiltradas} ${vm.totalFiltradas === 1 ? 'cita' : 'citas'}`}
    </Text>
    {error && <View accessibilityLiveRegion="polite" style={styles.card}><Text style={styles.error}>{error}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={actualizar}><Text style={styles.link}>Reintentar</Text></TouchableOpacity></View>}
    {isLoading && citas.length === 0 && <ActivityIndicator size="large" color={apariencia.color("#1E3A5A")} />}
    {!isLoading && !error && citas.length === 0 && <View style={styles.card}><Text style={styles.name}>{vm.filtro !== 'todas' ? 'No hay citas con este filtro' : historial ? 'Aún no tienes citas anteriores' : 'No tienes próximas citas'}</Text>
      <Text style={styles.subtitle}>{vm.filtro !== 'todas' ? 'Elige otro estado o consulta todas tus citas.' : historial ? 'Aquí aparecerán las citas anteriores, canceladas y los apartados vencidos.' : 'Elige tus servicios y reserva tu siguiente visita.'}</Text>
      {vm.filtro !== 'todas' && <TouchableOpacity accessibilityRole="button" onPress={() => vm.cambiarFiltro('todas')}><Text style={styles.link}>Mostrar todas</Text></TouchableOpacity>}</View>}
    {citas.map(c => <View key={c.id} style={styles.card}>
      <View style={styles.row}><Text style={styles.folio}>FOLIO {c.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={[styles.badge, c.estado === 'CONFIRMADA' && styles.confirmada]}>{etiquetaCita(c)}</Text></View>
      <Text style={styles.name}>{c.serviciosLabel || 'Servicios de tu reserva'}</Text>
      <Text style={styles.subtitle}>{fechaCita(c.fecha)} · {horaCita(c.horaInicio)}–{horaCita(c.horaFin)}</Text>
      <Text style={styles.name}>{dinero(c.precioFinal)}</Text>
      <View style={styles.row}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Vista previa de cita ${c.id.slice(0, 8)}`} style={styles.previewButton} onPress={() => vm.abrirVistaPrevia(c.id)}><Text style={styles.previewText}>Vista previa</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Ver cita del ${fechaCita(c.fecha)}, ${etiquetaCita(c)}`} style={styles.detailButton}
          onPress={() => router.push({ pathname: '/cita/[id]', params: { id: c.id } })}><Text style={styles.link}>
            {c.estado === 'APARTADA' && !apartadoVencido(c) ? 'Continuar pago →' : 'Ver detalle →'}
          </Text></TouchableOpacity>
      </View>
    </View>)}
    {hayMas && <TouchableOpacity accessibilityRole="button" disabled={isLoading} style={styles.more} onPress={cargarMas}>
      <Text style={styles.link}>Ver más · {Math.min(6, vm.totalFiltradas - citas.length)} citas</Text></TouchableOpacity>}
    {vm.puedeVerMenos && <TouchableOpacity accessibilityRole="button" style={styles.more} onPress={() => {
      vm.verMenos(); scroll.current?.scrollTo({ y: 0, animated: true });
    }}><Text style={styles.link}>Ver menos</Text></TouchableOpacity>}
  </ScrollView><VistaPreviaCita citaId={vm.vistaPreviaId} onCerrar={vm.cerrarVistaPrevia} onDetalle={id => {
    vm.cerrarVistaPrevia(); router.push({ pathname: '/cita/[id]', params: { id } });
  }} /></>;
}

const baseStyles = StyleSheet.create({
  previewButton: { minHeight: 44, justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#D4AF37', backgroundColor: '#FFF8DF' },
  previewText: { color: '#735B16', fontWeight: '700', fontSize: 13 }, detailButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  controls: { gap: 12, paddingVertical: 8 }, controlTitle: { color: '#475569', fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { minHeight: 44, justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFF', paddingVertical: 11, paddingHorizontal: 16 },
  chipSelected: { borderColor: '#1E3A5A', backgroundColor: '#1E3A5A' }, chipText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: '#FFF' }, sortChip: { minHeight: 44, justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#F1F5F9' },
  sortSelected: { backgroundColor: '#FFF8DF', borderColor: '#D4AF37', borderWidth: 1 }, sortTextSelected: { color: '#735B16' },
  counter: { color: '#64748B', fontSize: 12 }, more: { alignItems: 'center', padding: 12 },
  content: { padding: 20, paddingBottom: 100, gap: 16 }, title: { fontSize: 22, fontWeight: '800', color: '#1E3A5A' },
  subtitle: { color: '#64748B', fontSize: 14, lineHeight: 22 }, card: { padding: 18, gap: 12, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: '#1E3A5A' }, folio: { fontSize: 11, color: '#64748B', letterSpacing: 1 },
  badge: { backgroundColor: '#F1F5F9', color: '#475569', padding: 7, borderRadius: 8, fontSize: 12, fontWeight: '600' },
  confirmada: { backgroundColor: '#FFF8DF', color: '#886B12' }, primary: { backgroundColor: '#1E3A5A', padding: 17, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#FFF', fontWeight: '700' }, link: { color: '#2563EB', fontWeight: '700', paddingVertical: 6 }, error: { color: '#B91C1C' },
});
