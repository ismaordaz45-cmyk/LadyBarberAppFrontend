import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarberActionOverlay } from '../../components/compartidos/BarberActionOverlay';
import { EditarPerfilModal } from '../../components/perfil/EditarPerfilModal';
import { EliminarCuentaModal } from '../../components/perfil/EliminarCuentaModal';
import { usePerfilViewModel } from '../../viewmodels/usePerfilViewModel';

const NAVY = '#1E3A5F';

export default function PerfilScreen() {
  const router = useRouter();
  const viewModel = usePerfilViewModel();
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

  const onLogout = () => {
    setShowLogoutOverlay(true);
    setTimeout(() => {
      viewModel.handleCerrarSesion();
      setShowLogoutOverlay(false);
      router.replace('/login');
    }, 1400);
  };

  const onDelete = async () => {
    const deleted = await viewModel.handleEliminarCuenta();
    if (deleted) router.replace('/login');
  };

  const renderProfile = () => {
    if (viewModel.isLoading && !viewModel.perfil) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={NAVY} />
          <Text style={styles.stateText}>Cargando tu perfil...</Text>
        </View>
      );
    }

    if (viewModel.profileError && !viewModel.perfil) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>No pudimos cargar tu perfil</Text>
          <Text style={styles.errorText}>{viewModel.profileError}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void viewModel.cargarPerfil()}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!viewModel.perfil) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Perfil no disponible</Text>
          <Text style={styles.errorText}>
            No se encontraron datos asociados a tu cuenta.
          </Text>
        </View>
      );
    }

    const { user, stats } = viewModel.perfil;
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={viewModel.isRefreshing}
            onRefresh={() => void viewModel.cargarPerfil(true)}
            colors={[NAVY]}
          />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.nombre.trim().charAt(0).toUpperCase() || 'C'}
            </Text>
          </View>
          <Text style={styles.name}>{viewModel.nombreCompleto}</Text>
          <Text style={styles.email}>{user.correo}</Text>
          <Text style={styles.role}>{user.rol}</Text>
        </View>

        {viewModel.successMessage ? (
          <Text style={styles.successMessage} accessibilityRole="alert">
            {viewModel.successMessage}
          </Text>
        ) : null}
        {viewModel.profileError ? (
          <Text style={styles.warningMessage} accessibilityRole="alert">
            {viewModel.profileError}
          </Text>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Datos personales</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={viewModel.openEditModal}
          >
            <Text style={styles.editLink}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.fieldLabel}>Nombre completo</Text>
          <Text style={styles.fieldValue}>{viewModel.nombreCompleto}</Text>
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>Teléfono</Text>
          <Text style={styles.fieldValue}>
            {user.telefono || 'Sin teléfono registrado'}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>Correo</Text>
          <Text style={styles.fieldValue}>{user.correo}</Text>
        </View>

        <Text style={styles.sectionTitle}>Resumen de citas</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completadas}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Información legal</Text>
        <View style={styles.legalCard}>
          <TouchableOpacity
            accessibilityRole="link"
            style={styles.legalButton}
            onPress={() => router.push('/privacidad')}
          >
            <Text style={styles.legalButtonText}>Política de privacidad</Text>
            <Text style={styles.legalArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            accessibilityRole="link"
            style={styles.legalButton}
            onPress={() => router.push('/terminos')}
          >
            <Text style={styles.legalButtonText}>Términos y condiciones</Text>
            <Text style={styles.legalArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Sesión</Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.logoutBtn}
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Zona de seguridad</Text>
          <Text style={styles.dangerDescription}>
            Puedes solicitar la eliminación de tu cuenta y los datos personales
            asociados. Esta acción es permanente.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.deleteAccountBtn}
            onPress={viewModel.openDeleteModal}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteAccountText}>Eliminar cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>ESPACIO EXCLUSIVO</Text>
        <Text style={styles.title}>Mi Perfil</Text>
      </View>

      {renderProfile()}

      <EditarPerfilModal
        visible={viewModel.isEditModalVisible}
        nombre={viewModel.nombre}
        apellidoPaterno={viewModel.apellidoPaterno}
        apellidoMaterno={viewModel.apellidoMaterno}
        telefono={viewModel.telefono}
        correo={viewModel.perfil?.user.correo ?? ''}
        error={viewModel.editError}
        isSaving={viewModel.isSaving}
        canSave={viewModel.canSave}
        onNombreChange={viewModel.updateNombre}
        onApellidoPaternoChange={viewModel.updateApellidoPaterno}
        onApellidoMaternoChange={viewModel.updateApellidoMaterno}
        onTelefonoChange={viewModel.updateTelefono}
        onCancel={viewModel.closeEditModal}
        onSave={() => void viewModel.handleGuardarPerfil()}
      />

      <EliminarCuentaModal
        visible={viewModel.isDeleteModalVisible}
        password={viewModel.password}
        confirmation={viewModel.confirmation}
        error={viewModel.deleteError}
        isDeleting={viewModel.isDeleting}
        canDelete={viewModel.canDelete}
        onPasswordChange={viewModel.updatePassword}
        onConfirmationChange={viewModel.updateConfirmation}
        onCancel={viewModel.closeDeleteModal}
        onDelete={onDelete}
      />

      <BarberActionOverlay
        visible={showLogoutOverlay}
        headline="Cerrando sesión..."
        message="Hasta pronto. Esperamos verte de nuevo en Lady Barber"
        isSuccess
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  legalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginBottom: 18,
    overflow: 'hidden',
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  legalButtonText: { color: NAVY, fontSize: 14, fontWeight: '700' },
  legalArrow: { color: '#94A3B8', fontSize: 24, lineHeight: 24 },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: { fontSize: 24, fontWeight: '800', color: NAVY, marginTop: 2 },
  content: { padding: 20, paddingBottom: 42 },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  stateText: { color: '#64748B', fontSize: 15, marginTop: 12 },
  errorTitle: { color: '#991B1B', fontSize: 18, fontWeight: '700' },
  errorText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: NAVY,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 18,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 22,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAVY,
    borderWidth: 3,
    borderColor: '#D4AF37',
    marginBottom: 12,
  },
  avatarText: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  name: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  email: { color: '#64748B', fontSize: 13, marginTop: 4 },
  role: { color: NAVY, fontSize: 11, fontWeight: '700', marginTop: 5 },
  successMessage: {
    color: '#166534',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  warningMessage: {
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 10,
  },
  editLink: { color: NAVY, fontSize: 15, fontWeight: '800' },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 18,
  },
  fieldLabel: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  fieldValue: { color: '#0F172A', fontSize: 15, fontWeight: '600', marginTop: 3 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 13 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
  },
  statNumber: { color: NAVY, fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#64748B', fontSize: 11, marginTop: 3 },
  logoutBtn: {
    padding: 15,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { color: NAVY, fontWeight: '700', fontSize: 16 },
  dangerSection: {
    marginTop: 30,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF7F7',
  },
  dangerTitle: { color: '#991B1B', fontSize: 17, fontWeight: '700' },
  dangerDescription: {
    color: '#7F1D1D',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  deleteAccountBtn: {
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
  },
  deleteAccountText: { color: '#B91C1C', fontSize: 15, fontWeight: '700' },
});
