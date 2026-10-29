import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProductosViewModel } from '../viewmodels/useProductosViewModel';
import { ProductoCard } from '../components/productos/ProductoCard';
import { PromoBanner } from '../components/productos/PromoBanner';
import { CategoriaProducto } from '../models/Producto';

export default function ProductosScreen() {
  const router = useRouter();
  const {
    isLoading,
    error,
    categoriaActiva,
    setCategoriaActiva,
    busqueda,
    setBusqueda,
    categoriasDisponibles,
    productos,
    totalArticulos,
    toggleOrden,
    ordenAscendente,
    agregarAlCarrito,
    totalItemsCarrito,
    mensajeFeedback,
  } = useProductosViewModel();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER SUPERIOR */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.topBrandText}>LADY BARBER ITZÁ D'M</Text>
            <Text style={styles.topScreenTitle}>Catálogo de Productos</Text>
          </View>
        </View>

        {/* Logo circular del negocio con badge de carrito si hay productos */}
        <View style={styles.topHeaderRight}>
          <View style={styles.logoCircular}>
            <Image
              source={require('../../assets/images/logo-itza.png')}
              style={styles.logoCircularImg}
              resizeMode="cover"
            />
          </View>
          {totalItemsCarrito > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItemsCarrito}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Notificación flotante de producto agregado */}
      {mensajeFeedback && (
        <View style={styles.toastNotification}>
          <Feather name="check-circle" size={15} color="#16A34A" />
          <Text style={styles.toastText}>{mensajeFeedback}</Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#1E293B" />
          <Text style={styles.statusText}>Cargando productos...</Text>
        </View>
      )}

      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CABECERA BOUTIQUE & ESTILO */}
        <View style={styles.headerSection}>
          <Text style={styles.eyebrow}>BOUTIQUE & ESTILO</Text>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>Cuidado Capilar Exclusivo</Text>
            <View style={styles.coleccionBadge}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={11}
                color="#B47D22"
                style={{ marginRight: 3 }}
              />
              <Text style={styles.coleccionBadgeText}>Colección</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Fórmulas premium y herramientas profesionales utilizadas en tus servicios.
          </Text>
        </View>

        {/* BANNER PROMOCIONAL: Entrega Personalizada */}
        <PromoBanner />

        {/* BARRA DE BÚSQUEDA */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={17} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar sueros, ceras, mascarillas..."
            placeholderTextColor="#94A3B8"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Feather name="x" size={15} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* PÍLDORAS DE CATEGORÍAS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categoriasDisponibles.map((cat: CategoriaProducto) => {
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

        {/* FILA DE CONTEO Y ORDENAR */}
        <View style={styles.countAndSortRow}>
          <Text style={styles.countText}>{totalArticulos} ARTÍCULOS SELECTOS</Text>

          <TouchableOpacity style={styles.sortBtn} onPress={toggleOrden} activeOpacity={0.7}>
            <Feather name="sliders" size={13} color="#475569" style={{ marginRight: 5 }} />
            <Text style={styles.sortBtnText}>
              {ordenAscendente === null
                ? 'Ordenar'
                : ordenAscendente
                ? 'Menor precio'
                : 'Mayor precio'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* GRID DE PRODUCTOS (2 COLUMNAS) */}
        <View style={styles.productsGrid}>
          {productos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="shopping-bag" size={36} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No hay productos que coincidan</Text>
              <Text style={styles.emptySubtitle}>
                Prueba con otro término o selecciona otra categoría.
              </Text>
            </View>
          ) : (
            productos.map((prod) => (
              <ProductoCard
                key={prod.id}
                item={prod}
                onAgregar={agregarAlCarrito}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topBrandText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  topScreenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  topHeaderRight: {
    position: 'relative',
  },
  logoCircular: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#F5C26B',
  },
  logoCircularImg: {
    width: '100%',
    height: '100%',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#D97706',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  toastNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#166534',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  statusText: {
    fontSize: 13,
    color: '#64748B',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  coleccionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  coleccionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B47D22',
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
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
  categoriesScroll: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 16,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  catPillActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
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
  countAndSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
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
  },
});
