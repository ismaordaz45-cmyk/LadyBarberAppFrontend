import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ServicioItem } from '../../models/Servicio';
import { resolveServicioImagenUrl } from '../../utils/resolveServicioImagenUrl';
import { API_URL } from '../../services/api';

// Extrae la base del backend (sin /api) para construir URLs de /uploads
const API_BASE = API_URL.replace(/\/api\/?$/, '');

interface ServicioCardProps {
  item: ServicioItem;
  onDetalle: (item: ServicioItem) => void;
  onAgendar: (item: ServicioItem) => void;
}

export const ServicioCard: React.FC<ServicioCardProps> = ({
  item,
  onDetalle,
  onAgendar,
}) => {
  const imagenResuelta = resolveServicioImagenUrl(item.imagenUrl, API_BASE);

  return (
    <View style={styles.card}>
      {/* Contenedor de Imagen con Badge en la esquina superior izquierda */}
      <View style={styles.imageWrapper}>
        {imagenResuelta ? (
          <Image
            source={{ uri: imagenResuelta }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          // Placeholder cuando no hay imagen
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="content-cut" size={32} color="rgba(255,255,255,0.5)" />
          </View>
        )}
        {/* Badge de categoría / relevancia */}
        <View style={styles.badgeWrapper}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {item.categoria}
          </Text>
        </View>
      </View>

      {/* Información del Servicio a la derecha */}
      <View style={styles.content}>
        {/* Duración */}
        <View style={styles.metaRow}>
          <Feather name="clock" size={12} color="#64748B" style={styles.metaIcon} />
          <Text style={styles.metaText}>
            {item.duracionMin > 0 ? `${item.duracionMin} min` : 'Consultar'}
          </Text>
        </View>

        {/* Título Principal */}
        <Text style={styles.title} numberOfLines={2}>
          {item.nombre}
        </Text>

        {/* Descripción breve */}
        {!!item.descripcion && (
          <Text style={styles.descripcion} numberOfLines={2}>
            {item.descripcion}
          </Text>
        )}

        {/* Fila Inferior: Precio y Botones de Acción */}
        <View style={styles.bottomRow}>
          <View style={styles.priceRow}>
            <Text style={styles.priceSymbol}>$</Text>
            <Text style={styles.priceValue}>{Number(item.precioMXN).toFixed(0)}</Text>
            <Text style={styles.priceCurrency}> MXN</Text>
          </View>

          <View style={styles.buttonsRow}>
            {/* Botón Detalle */}
            <TouchableOpacity
              style={styles.btnDetalle}
              onPress={() => onDetalle(item)}
              activeOpacity={0.75}
            >
              <Text style={styles.btnDetalleText}>Detalle</Text>
            </TouchableOpacity>

            {/* Botón Agendar */}
            <TouchableOpacity
              style={styles.btnAgendar}
              onPress={() => onAgendar(item)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="calendar-outline"
                size={13}
                color="#FFFFFF"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.btnAgendarText}>Agendar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  badgeWrapper: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 84,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 2,
  },
  descripcion: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 4,
  },
  bottomRow: {
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceSymbol: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10172A',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10172A',
    lineHeight: 22,
  },
  priceCurrency: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnDetalle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  btnDetalleText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  btnAgendar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  btnAgendarText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
