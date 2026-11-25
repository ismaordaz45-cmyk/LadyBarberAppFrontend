import { useThemedStyles } from '../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../viewmodels/useAparienciaViewModel';
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/compartidos/TextoApp';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';
import { useNegocioViewModel } from '../viewmodels/useNegocioViewModel';
import { BarberPole } from '../components/compartidos/BarberPole';

export default function LoginScreen() {
  const apariencia = useAparienciaViewModel();
  const styles = useThemedStyles(baseStyles);
  const router = useRouter();
  const { negocio } = useNegocioViewModel();
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

  const onSubmit = async () => {
    const user = await handleLogin();
    if (user) router.replace('/(tabs)');
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

            {/* Título Principal */}
            <View style={styles.titleRow}>
              <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <BarberPole size={26} width={9} speedMs={1100} />
              </View>
              <Text accessibilityRole="header" style={styles.mainTitle}>Inicio de sesión</Text>
            </View>
            <Text style={styles.mainSubtitle}>
              Te damos la bienvenida
            </Text>
          </View>

          {/* Tarjeta de Formulario */}
          <View style={styles.card}>
            {/* Mensaje de Error si falla la autenticación */}
            {error && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color={apariencia.color("#DC2626")} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Campo: Correo electrónico */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Correo electrónico</Text>
              <View style={styles.inputContainer}>
                <Feather name="at-sign" size={17} color={apariencia.color("#94A3B8")} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ingresa tu correo electrónico"
                  placeholderTextColor={apariencia.color("#94A3B8")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={correo}
                  onChangeText={setCorreo}
                  editable={!isLoading} keyboardAppearance={apariencia.esOscuro ? 'dark' : 'light'}
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
                <Feather name="lock" size={17} color={apariencia.color("#94A3B8")} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••••••"
                  placeholderTextColor={apariencia.color("#94A3B8")}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading} keyboardAppearance={apariencia.esOscuro ? 'dark' : 'light'}
                />
                <TouchableOpacity
                  onPress={togglePasswordVisibility}
                  style={styles.eyeButton}
                  activeOpacity={0.6}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={apariencia.color("#94A3B8")}
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
                <ActivityIndicator color={apariencia.color("#FFFFFF")} size="small" />
              ) : (
                <View style={styles.loginBtnContent}>
                  <Text style={styles.loginBtnText}>Inicio de sesión</Text>
                  <Feather name="arrow-right" size={18} color={apariencia.color("#F5C26B")} style={styles.arrowIcon} />
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

          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => router.push('/terminos')}>
              <Text style={styles.legalLink}>Términos</Text>
            </TouchableOpacity>
            <Text style={styles.legalDivider}>•</Text>
            <TouchableOpacity onPress={() => router.push('/privacidad')}>
              <Text style={styles.legalLink}>Privacidad</Text>
            </TouchableOpacity>
          </View>

          {/* Footer de Seguridad y Garantía */}
          <View style={styles.footerRow}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={15}
              color={apariencia.color("#D97706")}
              style={styles.shieldIcon}
            />
            <Text style={styles.footerText}>
              {negocio?.nombre ? `Acceso seguro · ${negocio.nombre}` : 'Acceso seguro'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardContainer: {
    flex: 1,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  legalLink: {
    color: '#1E3A5F',
    fontSize: 12.5,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  legalDivider: { color: '#94A3B8', fontSize: 12 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 36,
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 6, maxWidth: '100%' },
  mainTitle: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '700',
    flexShrink: 1,
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
    paddingHorizontal: 8,
  },
  shieldIcon: {
    marginRight: 6,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 11.5,
    flexShrink: 1,
    textAlign: 'center',
  },
});
