import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const PromoBanner: React.FC = () => {
  return (
    <View style={styles.banner}>
      <View style={styles.iconBox}>
        <Feather name="shopping-bag" size={20} color="#FFFFFF" />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title}>Entrega Personalizada</Text>
        <Text style={styles.description}>
          Recógelo en el salón el día de tu cita o recibe a domicilio con empaque de lujo.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  description: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16.5,
  },
});
