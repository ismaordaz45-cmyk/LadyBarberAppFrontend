import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface BarberPoleProps {
  /** Altura del cilindro visible (default: 80) */
  size?: number;
  /** Ancho del cilindro (default: 20) */
  width?: number;
  /** Duración de un ciclo en ms (default: 1200) */
  speedMs?: number;
  /** Dirección del movimiento: 'down' (hacia abajo) | 'up' (hacia arriba) */
  direction?: 'down' | 'up';
}

/**
 * Componente nativo de Poste de Barbero (Barber Pole) con animación continua.
 * Replica el efecto visual del proyecto web:
 * - Cilindro de vidrio con reflejo tridimensional.
 * - Rayas diagonales en rotación continua: Rojo (#B91C1C), Blanco (#F8FAFC), Azul (#1E40AF), Blanco.
 * - Tapas metálicas superior (domo pulido) e inferior (pedestal oscuro).
 */
export const BarberPole: React.FC<BarberPoleProps> = ({
  size = 80,
  width = 20,
  speedMs = 1200,
  direction = 'down',
}) => {
  const animValue = useRef(new Animated.Value(0)).current;

  // Parámetros de las franjas
  const stripeHeight = Math.max(8, Math.round(width * 0.5));
  const cycleDistance = stripeHeight * 4; // Ciclo completo de 4 colores

  useEffect(() => {
    const toValue = direction === 'down' ? cycleDistance : -cycleDistance;
    const animation = Animated.loop(
      Animated.timing(animValue, {
        toValue,
        duration: speedMs,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [animValue, cycleDistance, speedMs, direction]);

  // Generamos franjas suficientes para cubrir altura + margen de ciclo
  const totalStripesNeeded = Math.ceil(size / stripeHeight) + 12;
  const colors = ['#B91C1C', '#F8FAFC', '#1E40AF', '#F8FAFC'];

  const stripes = Array.from({ length: totalStripesNeeded }, (_, i) => ({
    key: `stripe-${i}`,
    color: colors[i % 4],
  }));

  const capWidth = width + 8;
  const capHeight = Math.max(9, Math.round(capWidth * 0.42));
  const baseWidth = width + 10;
  const baseHeight = Math.max(5, Math.round(width * 0.28));

  return (
    <View style={styles.outerContainer}>
      {/* Tapa superior metálica (domo redondeado) */}
      <View
        style={[
          styles.topCap,
          {
            width: capWidth,
            height: capHeight,
            borderTopLeftRadius: capWidth / 2,
            borderTopRightRadius: capWidth / 2,
          },
        ]}
      >
        <View style={styles.capHighlight} />
      </View>

      {/* Cilindro de vidrio con rayas en movimiento */}
      <View
        style={[
          styles.cylinder,
          {
            width,
            height: size,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.stripesTrack,
            {
              width: width * 2,
              left: -width * 0.5,
              top: -cycleDistance * 1.5,
              transform: [
                {
                  translateY: animValue,
                },
              ],
            },
          ]}
        >
          {stripes.map((s) => (
            <View
              key={s.key}
              style={[
                styles.stripe,
                {
                  height: stripeHeight,
                  backgroundColor: s.color,
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Reflejo de brillo vítreo 3D longitudinal */}
        <View
          style={[
            styles.glassReflection,
            {
              width: Math.max(3, width * 0.26),
            },
          ]}
        />
        {/* Sombra de profundidad en el borde derecho */}
        <View style={styles.glassInnerShadow} />
      </View>

      {/* Tapa inferior metálica (base pedestal) */}
      <View
        style={[
          styles.bottomBase,
          {
            width: baseWidth,
            height: baseHeight,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCap: {
    backgroundColor: '#CBD5E1',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    overflow: 'hidden',
    alignItems: 'center',
    zIndex: 2,
  },
  capHighlight: {
    width: '60%',
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 99,
    marginTop: 1,
  },
  cylinder: {
    borderRadius: 4,
    borderWidth: 1.8,
    borderColor: '#64748B',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
    marginTop: -1,
    zIndex: 1,
  },
  stripesTrack: {
    position: 'absolute',
  },
  stripe: {
    width: '100%',
    transform: [{ skewY: '-28deg' }],
  },
  glassReflection: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 2,
  },
  glassInnerShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 2.5,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  bottomBase: {
    backgroundColor: '#475569',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginTop: -1,
    zIndex: 2,
  },
});

export default BarberPole;
