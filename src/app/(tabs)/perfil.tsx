import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePerfilViewModel } from '../../viewmodels/usePerfilViewModel';
import { BarberActionOverlay } from '../../components/compartidos/BarberActionOverlay';

const NAVY = '#1E3A5F';

export default function PerfilScreen() {
  const router = useRouter();
  const { isLoading, perfil, handleCerrarSesion } = usePerfilViewModel();
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

  const onLogout = () => {
    setShowLogoutOverlay(true);
    setTimeout(() => {
      handleCerrarSesion();
      setShowLogoutOverlay(false);
      router.replace('/login');
    }, 1400);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholder}>Configuración e información del perfil.</Text>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Overlay con Barber Pole animado al cerrar sesión */}
      <BarberActionOverlay
        visible={showLogoutOverlay}
        headline="Cerrando sesión..."
        message="Hasta pronto. Esperamos verte de nuevo en Lady Barber"
        isSuccess={true}
      />
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
    padding: 24,
  },
  placeholder: {
    color: '#8B9BB4',
    fontSize: 16,
    marginBottom: 40,
  },
  logoutBtn: {
    padding: 16,
    backgroundColor: '#FEE2E2', // Rojo suave
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
  }
});
