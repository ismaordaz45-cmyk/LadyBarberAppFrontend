import { useThemedStyles } from '../../hooks/use-themed-styles';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { limiteProducto } from '../../models/Carrito';
import { ImagenProducto } from './ImagenProducto';
import { Text } from '../compartidos/TextoApp';
import { ProductoItem } from '../../models/Producto';

interface ProductoCardProps {
  item: ProductoItem;
  onAgregar?: () => void;
  onVerProducto?: () => void;
  cantidad?: number;
  bloqueado?: boolean;
}

export const ProductoCard: React.FC<ProductoCardProps> = ({ item, onAgregar, onVerProducto, cantidad = 0, bloqueado = false }) => {
  const styles = useThemedStyles(baseStyles);
  const safePrice = Number.isFinite(item.precioMXN) && item.precioMXN >= 0
    ? item.precioMXN
    : 0;
  const stockLabel = typeof item.stockActual === 'number'
    ? item.stockActual > 0 ? `Stock: ${item.stockActual}` : 'Agotado'
    : 'Consultar existencias';
  const isOutOfStock = item.stockActual === 0;

  return (
    <View style={styles.card}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Ver producto ${item.nombre}`}
        accessibilityHint="Abre la imagen y la información del producto" disabled={!onVerProducto} onPress={onVerProducto} activeOpacity={0.8}>
      {/* Imagen Superior con Badge */}
      <View style={styles.imageWrapper}>
        <ImagenProducto uri={item.imagenUrl} nombre={item.nombre} style={styles.image} />

        {item.badge && (
          <View
            style={[
              styles.badge,
              item.badge.tipo === 'topseller' ? styles.badgeTopSeller : styles.badgeTamano,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                item.badge.tipo === 'topseller' ? styles.badgeTextTopSeller : styles.badgeTextTamano,
              ]}
            >
              {item.badge.texto}
            </Text>
          </View>
        )}
      </View>

      {/* Contenido descriptivo */}
      <View style={styles.content}>
        <Text style={styles.category}>{item.categoriaEtiqueta}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {item.nombre}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.subtitulo}
        </Text>
        {!!item.descripcion && <Text style={styles.subtitle} numberOfLines={2}>{item.descripcion}</Text>}

        {/* El carrito limita cantidades; la compra se validará en el servidor. */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>Precio</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceVal}>${safePrice.toFixed(2)}</Text>
              <Text style={styles.currency}>MXN</Text>
            </View>
          </View>

          <View style={[styles.stockBadge, isOutOfStock && styles.stockBadgeEmpty]}>
            <Text style={[styles.stockText, isOutOfStock && styles.stockTextEmpty]}>
              {stockLabel}
            </Text>
          </View>
        </View>
      </View>
      </TouchableOpacity>
      {onAgregar && <View style={styles.actions}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Agregar ${item.nombre} al carrito`}
          disabled={bloqueado || cantidad >= limiteProducto(item)} onPress={onAgregar}
          style={[styles.addButton, (bloqueado || cantidad >= limiteProducto(item)) && styles.disabled]}>
          <Text style={styles.addText}>{limiteProducto(item) === 0 ? 'No disponible' : cantidad >= limiteProducto(item) ? 'Máximo en carrito' : cantidad > 0 ? `Agregar · ${cantidad} en carrito` : 'Agregar al carrito'}</Text>
        </TouchableOpacity></View>}
    </View>
  );
};

const baseStyles = StyleSheet.create({
  actions: { paddingHorizontal: 10, paddingBottom: 10 },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  addButton: { backgroundColor: '#1E3A5A', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10, marginTop: 12, minHeight: 44, justifyContent: 'center' },
  addText: { color: '#FFFFFF', textAlign: 'center', fontSize: 12, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  imageWrapper: {
    width: '100%',
    height: 124,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  badgeTopSeller: {
    left: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeTextTopSeller: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#B45309',
  },
  badgeTamano: {
    right: 8,
    backgroundColor: '#1E293B',
  },
  badgeTextTamano: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgeText: {
    fontSize: 9.5,
  },
  content: {
    padding: 10,
  },
  category: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  currency: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 2,
  },
  stockBadge: {
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stockBadgeEmpty: {
    backgroundColor: '#FEE2E2',
  },
  stockText: {
    color: '#166534',
    fontSize: 9.5,
    fontWeight: '700',
  },
  stockTextEmpty: {
    color: '#991B1B',
  },
});
