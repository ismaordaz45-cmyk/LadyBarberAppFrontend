import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useServiciosViewModel } from '../../viewmodels/useServiciosViewModel';
import { ServicioCard } from './ServicioCard';
import { ServicioDetalleModal } from './ServicioDetalleModal';
import { ServicioItem } from '../../models/Servicio';

interface ServiciosSectionProps {
  onAgendarServicio?: (servicio: ServicioItem) => void;
}

export const ServiciosSection: React.FC<ServiciosSectionProps> = ({
  onAgendarServicio,
}) => {
  const {
    isLoading,
    error,
    categoriaActiva,
    setCategoriaActiva,
    busqueda,
    setBusqueda,
    categoriasDisponibles,
    servicios,
    servicioSeleccionado,
    modalDetalleVisible,
    abrirDetalle,
    cerrarDetalle,
  } = useServiciosViewModel();

  const handleAgendar = (item: ServicioItem) => {
    if (onAgendarServicio) {
      onAgendarServicio(item);
    }
  };

  return (
    <View style={styles.container}>
      {/* Subcabecera de Sección */}
      <View style={styles.header}>
        <View style={styles.eyebrowRow}>
          <MaterialCommunityIcons
            name="star-four-points"
            size={13}
            color="#D97706"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.eyebrowText}>EXPERIENCIAS DE AUTOR</Text>
        </View>
        <Text style={styles.sectionTitle}>Nuestros Servicios Exclusivos</Text>
        <Text style={styles.sectionSubtitle}>
          Bespoke grooming, visagismo editorial y tratamientos...
        </Text>
      </View>

      {/* Barra de Búsqueda y Botón de Filtro */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={17} color="#3B82F6" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar servicio, corte, tinte..."
            placeholderTextColor="#94A3B8"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')} style={styles.clearBtn}>
              <Feather name="x" size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Botón de Filtros */}
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
          <Feather name="sliders" size={17} color="#D97706" />
        </TouchableOpacity>
      </View>

      {/* Píldoras de Categorías Horizontales */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {categoriasDisponibles.map((cat: string) => {
          const isActive = categoriaActiva === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, isActive && styles.catPillActive]}
              onPress={() => setCategoriaActiva(cat)}
              activeOpacity={0.8}
            >
              {isActive && <View style={styles.activeDot} />}
              <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Estado de carga / error / lista */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E293B" />
            <Text style={styles.loadingText}>Cargando servicios...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Feather name="wifi-off" size={28} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : servicios.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="search" size={32} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No se encontraron servicios</Text>
            <Text style={styles.emptySubtitle}>
              Intenta con otro término o selecciona otra categoría.
            </Text>
          </View>
        ) : (
          servicios.map((item) => (
            <ServicioCard
              key={item.id}
              item={item}
              onDetalle={abrirDetalle}
              onAgendar={handleAgendar}
            />
          ))
        )}
      </View>

      {/* Modal de Detalle */}
      <ServicioDetalleModal
        visible={modalDetalleVisible}
        servicio={servicioSeleccionado}
        onClose={cerrarDetalle}
        onAgendar={handleAgendar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesScroll: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 16,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  catPillActive: {
    backgroundColor: '#1E293B',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  catPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '500',
  },
});
