import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ProductoItem } from '../../models/Producto';

interface ProductoCardProps {
  item: ProductoItem;
  onAgregar: (item: ProductoItem) => void;
}

export const ProductoCard: React.FC<ProductoCardProps> = ({ item, onAgregar }) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const hasRemoteImage = /^https?:\/\/\S+$/i.test(item.imagenUrl || '');
  const imageSource = hasRemoteImage && !imageFailed
    ? { uri: item.imagenUrl }
    : require('../../../assets/images/logo-itza.png');
  const safePrice = Number.isFinite(item.precioMXN) && item.precioMXN >= 0
    ? item.precioMXN
    : 0;

  return (
    <View style={styles.card}>
      {/* Imagen Superior con Badge */}
      <View style={styles.imageWrapper}>
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />

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
        <Text style={styles.name} numberOfLines={1}>
          {item.nombre}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.subtitulo}
        </Text>

        {/* Fila de Precio y Botón + */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>Precio</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceVal}>${safePrice.toFixed(2)}</Text>
              <Text style={styles.currency}>MXN</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onAgregar(item)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
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
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
