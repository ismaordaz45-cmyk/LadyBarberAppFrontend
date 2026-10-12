import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ServicioItem } from '../../models/Servicio';
import { resolveServicioImagenUrl } from '../../utils/resolveServicioImagenUrl';
import { API_URL } from '../../services/api';

const API_BASE = API_URL.replace(/\/api\/?$/, '');

interface ServicioDetalleModalProps {
  visible: boolean;
  servicio: ServicioItem | null;
  onClose: () => void;
  onAgendar: (servicio: ServicioItem) => void;
}

export const ServicioDetalleModal: React.FC<ServicioDetalleModalProps> = ({
  visible,
  servicio,
  onClose,
  onAgendar,
}) => {
  if (!servicio) return null;

  const imagenResuelta = resolveServicioImagenUrl(servicio.imagenUrl, API_BASE);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header con Imagen */}
          <View style={styles.imageContainer}>
            {imagenResuelta ? (
              <Image
                source={{ uri: imagenResuelta }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="content-cut" size={48} color="rgba(255,255,255,0.5)" />
              </View>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={18} color="#0F172A" />
            </TouchableOpacity>

            {/* Badge de categoría sobre la imagen */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{servicio.categoria}</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Meta tags: duración y categoría */}
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Feather name="clock" size={12} color="#1E293B" style={{ marginRight: 4 }} />
                <Text style={styles.metaChipText}>
                  {servicio.duracionMin > 0 ? `${servicio.duracionMin} minutos` : 'Consultar'}
                </Text>
              </View>
              <View style={styles.metaChip}>
                <Feather name="tag" size={12} color="#1E293B" style={{ marginRight: 4 }} />
                <Text style={styles.metaChipText}>{servicio.categoria}</Text>
              </View>
            </View>

            {/* Título y Precio */}
            <Text style={styles.title}>{servicio.nombre}</Text>
            <Text style={styles.price}>
              ${Number(servicio.precioMXN).toFixed(2)} MXN
            </Text>

            {/* Descripción */}
            {!!servicio.descripcion && (
              <>
                <Text style={styles.sectionLabel}>Descripción del servicio</Text>
                <Text style={styles.description}>{servicio.descripcion}</Text>
              </>
            )}
          </ScrollView>

          {/* Botón inferior Agendar Cita */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.agendarBtn}
              onPress={() => {
                onClose();
                onAgendar(servicio);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.agendarBtnText}>Agendar este servicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#1E293B',
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
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    lineHeight: 26,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  agendarBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 14,
  },
  agendarBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
