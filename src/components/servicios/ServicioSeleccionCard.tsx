import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../compartidos/TextoApp';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ServicioItem } from '../../models/Servicio';
import { API_URL } from '../../services/api';
import { resolveServicioImagenUrl } from '../../utils/resolveServicioImagenUrl';
import { dinero } from '../../utils/citasPresentation';

const API_BASE = API_URL.replace(/\/api\/?$/, '');
type Props = { servicio: ServicioItem; seleccionado: boolean; onSeleccionar: (id: string) => void;
  onDetalle: (servicio: ServicioItem) => void };

/** Variante de tarjeta para selección múltiple, sin iniciar otra reserva. */
export const ServicioSeleccionCard = memo(function ServicioSeleccionCard({ servicio, seleccionado, onSeleccionar, onDetalle }: Props) {
  const apariencia = useAparienciaViewModel();
  const styles = useThemedStyles(baseStyles);
  const imagen = useMemo(() => resolveServicioImagenUrl(servicio.imagenUrl, API_BASE), [servicio.imagenUrl]);
  const [imagenFallida, setImagenFallida] = useState<string | null>(null);
  const duracion = servicio.duracionMin > 0 ? `${servicio.duracionMin} min` : 'Duración por confirmar';
  return <View style={[styles.card, seleccionado && styles.selected]}>
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: seleccionado }}
      accessibilityLabel={`${servicio.nombre}, ${dinero(servicio.precioMXN)}, ${duracion}`}
      style={styles.selectArea} activeOpacity={0.85} onPress={() => onSeleccionar(servicio.id)}>
      <View style={styles.imageBox}>
        <MaterialCommunityIcons name="content-cut" size={34} color={apariencia.color("#94A3B8")} />
        {imagen && imagenFallida !== imagen && <Image source={{ uri: imagen }} style={StyleSheet.absoluteFill}
          contentFit="cover" cachePolicy="memory-disk" recyclingKey={servicio.id} transition={120}
          accessible={false} onError={() => setImagenFallida(imagen)} />}
        {seleccionado && <View style={styles.check}><Ionicons name="checkmark" color={apariencia.color("#FFF")} size={18} /></View>}
      </View>
      <View style={styles.body}>
        {!!servicio.categoria && <Text numberOfLines={1} style={styles.category}>{servicio.categoria}</Text>}
        <Text numberOfLines={2} style={styles.name}>{servicio.nombre}</Text>
        {!!servicio.descripcion && <Text numberOfLines={2} style={styles.description}>{servicio.descripcion}</Text>}
        <Text style={styles.duration}>{duracion}</Text>
        <Text style={styles.price}>{dinero(servicio.precioMXN)}</Text>
        <Text style={[styles.selectLabel, seleccionado && styles.selectedLabel]}>{seleccionado ? '✓ Seleccionado' : '＋ Seleccionar'}</Text>
      </View>
    </TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Ver detalles de ${servicio.nombre}`} style={styles.details} onPress={() => onDetalle(servicio)}>
      <Text style={styles.detailsText}>Ver detalles</Text>
    </TouchableOpacity>
  </View>;
});

const baseStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  selected: { borderColor: '#D4AF37', borderWidth: 2 }, selectArea: { flex: 1 },
  imageBox: { height: 118, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  check: { position: 'absolute', top: 9, right: 9, width: 28, height: 28, borderRadius: 14, backgroundColor: '#1E3A5A', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 12, gap: 7 }, category: { fontSize: 10, color: '#886B12', fontWeight: '700' },
  name: { fontSize: 15, color: '#1E3A5A', fontWeight: '800', lineHeight: 21 }, description: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  duration: { fontSize: 11, color: '#64748B' }, price: { fontSize: 14, color: '#1E3A5A', fontWeight: '800', marginTop: 'auto' },
  selectLabel: { color: '#2563EB', fontWeight: '700', fontSize: 12 }, selectedLabel: { color: '#886B12' },
  details: { minHeight: 44, padding: 10, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderColor: '#E2E8F0' },
  detailsText: { color: '#2563EB', fontWeight: '600', fontSize: 12 },
});
