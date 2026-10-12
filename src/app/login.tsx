import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';
import { BarberPole } from '../components/compartidos/BarberPole';
import { BarberActionOverlay } from '../components/compartidos/BarberActionOverlay';

export default function LoginScreen() {
  const router = useRouter();
  const {
    correo,
    setCorreo,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    isLoading,
    error,
    handleLogin,
  } = useLoginViewModel();

  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayHeadline, setOverlayHeadline] = useState('¡Bienvenido!');
  const [overlayMessage, setOverlayMessage] = useState('Iniciando sesión...');
  const [overlaySuccess, setOverlaySuccess] = useState(false);

  const onSubmit = async () => {
    if (!correo.trim() || !password) {
      await handleLogin();
      return;
    }

    setShowOverlay(true);
    setOverlayHeadline('¡Bienvenido!');
    setOverlayMessage('Comprobando tus credenciales...');
    setOverlaySuccess(false);

    const user = await handleLogin();
    if (user) {
      const nombreUsuario = user.nombre ? user.nombre.split(' ')[0] : 'Cliente';
      setOverlayHeadline(`¡Hola, ${nombreUsuario}!`);
      setOverlayMessage('Acceso concedido. Entrando a tu espacio exclusivo...');
      setOverlaySuccess(true);

      setTimeout(() => {
        setShowOverlay(false);
        router.replace('/(tabs)');
      }, 1400);
    } else {
      setShowOverlay(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Superior sutil */}
          <View style={styles.topBar}>
            <Text style={styles.topBarTitle}>Inicio de Sesión</Text>
            <BarberPole size={26} width={9} speedMs={1100} />
          </View>

          {/* Sección Central de Bienvenida y Logo */}
          <View style={styles.headerSection}>
            {/* Logo de Lady Barber Itzá D'M */}
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/images/logo-itza.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>

            {/* Badge de Acceso Exclusivo */}
            <View style={styles.badgeContainer}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={12}
                color="#B47D22"
                style={styles.badgeIcon}
              />
              <Text style={styles.badgeText}>ACCESO EXCLUSIVO</Text>
            </View>

            {/* Título Principal */}
            <Text style={styles.mainTitle}>Iniciar Sesión</Text>
            <Text style={styles.mainSubtitle}>
              Bienvenida a tu espacio exclusivo de belleza
            </Text>
          </View>

          {/* Tarjeta de Formulario */}
          <View style={styles.card}>
            {/* Mensaje de Error si falla la autenticación */}
            {error && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Campo: Correo o Usuario */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Correo o Usuario</Text>
              <View style={styles.inputContainer}>
                <Feather name="at-sign" size={17} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="ejemplo@itzadm.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={correo}
                  onChangeText={setCorreo}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Campo: Contraseña */}
            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.fieldLabel}>Contraseña</Text>
                <TouchableOpacity
                  onPress={() => router.push('/recuperar-password')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Feather name="lock" size={17} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={togglePasswordVisibility}
                  style={styles.eyeButton}
                  activeOpacity={0.6}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Principal: Iniciar Sesión */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={onSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.loginBtnContent}>
                  <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
                  <Feather name="arrow-right" size={18} color="#F5C26B" style={styles.arrowIcon} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Enlace de Registro */}
          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>¿No tienes una cuenta? </Text>
            <TouchableOpacity
              onPress={() => router.push('/registro')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>

          {/* Footer de Seguridad y Garantía */}
          <View style={styles.footerRow}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={15}
              color="#D97706"
              style={styles.shieldIcon}
            />
            <Text style={styles.footerText}>
              Acceso seguro & exclusivo • Lady Barber Itzá D'M
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Overlay Barber Pole en movimiento al iniciar sesión / bienvenida */}
      <BarberActionOverlay
        visible={showOverlay}
        headline={overlayHeadline}
        message={overlayMessage}
        isSuccess={overlaySuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 36,
  },
  topBar: {
    paddingTop: Platform.OS === 'android' ? 14 : 6,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarTitle: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  logoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#0A0A0A',
    shadowColor: '#F5C26B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#F3D17A',
    borderRadius: 20,
    paddingVertical: 4.5,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  badgeIcon: {
    marginRight: 5,
  },
  badgeText: {
    color: '#B47D22',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  mainTitle: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  mainSubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    color: '#1E293B',
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#1E3A5F',
    fontSize: 12.5,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 14,
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtn: {
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 22,
  },
  registerPrompt: {
    color: '#64748B',
    fontSize: 13,
  },
  registerLink: {
    color: '#1E3A5F',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldIcon: {
    marginRight: 6,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 11.5,
  },
});
