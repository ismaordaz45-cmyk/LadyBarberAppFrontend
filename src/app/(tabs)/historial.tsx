import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useHistorialViewModel } from '../../viewmodels/useHistorialViewModel';

const NAVY = '#1E3A5F';

export default function HistorialScreen() {
  const { isLoading, historial } = useHistorialViewModel();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholder}>Tu historial de servicios aparecerá aquí.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: NAVY,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholder: {
    color: '#8B9BB4',
    fontSize: 16,
    textAlign: 'center',
  }
});
