import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { BarberPole } from './BarberPole';

interface BarberActionOverlayProps {
  visible: boolean;
  headline?: string;
  message?: string;
  isSuccess?: boolean;
}

/**
 * Overlay de pantalla completa con animación de Barber Pole.
 * Replica fielmente el componente BarberActionOverlayContext de la versión web:
 * - Fondo oscuro translúcido con desenfoque estético.
 * - Poste de Barbero central animado en movimiento continuo.
 * - Textos de estado ("¡Casi listo!", "Creando tu cuenta...", "¡Registro exitoso!").
 */
export const BarberActionOverlay: React.FC<BarberActionOverlayProps> = ({
  visible,
  headline = '¡Casi listo!',
  message = 'Creando tu cuenta...',
  isSuccess = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Trío de postes de barbero estilo Web: centro prominente y dos secundarios */}
          <View style={styles.polesRow}>
            <BarberPole size={48} width={12} speedMs={1400} />
            <View style={styles.centerPoleWrapper}>
              <BarberPole size={96} width={22} speedMs={1100} />
            </View>
            <BarberPole size={48} width={12} speedMs={1400} />
          </View>

          {/* Textos descriptivos de la acción */}
          <Text style={[styles.headlineText, isSuccess && styles.headlineSuccess]}>
            {headline}
          </Text>
          <Text style={styles.messageText}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  cardContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  polesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 24,
  },
  centerPoleWrapper: {
    marginBottom: 4,
  },
  headlineText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  headlineSuccess: {
    color: '#34D399',
  },
  messageText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});

export default BarberActionOverlay;
