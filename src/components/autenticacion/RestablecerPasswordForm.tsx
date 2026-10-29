import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRestablecerPasswordViewModel } from '../../viewmodels/useRestablecerPasswordViewModel';
import { BarberActionOverlay } from '../compartidos/BarberActionOverlay';

interface RestablecerPasswordFormProps {
  initialToken?: string;
  onBackToLogin?: () => void;
  onSuccess?: () => void;
}

const COLORS = {
  text: '#1E293B',
  textMuted: '#64748B',
  pageBg: '#F1F5F9',
  white: '#FFFFFF',
  primaryBlue: '#2563EB',
  primaryBlueHover: '#1D4ED8',
  linkOrange: '#EA580C',
  imageLetterbox: '#0F172A',
  strengthOk: '#16A34A',
  cardBorder: '#E2E8F0',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  errorText: '#B91C1C',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  successText: '#166534',
  warningBg: '#FEF9C3',
  warningBorder: '#FDE047',
  warningText: '#854D0E',
};

/**
 * Componente View: Formulario de Restablecimiento de Contraseña (MVVM).
 * Reproduce fielmente el diseño del componente web RestablecerContraseña.jsx.
 */
export const RestablecerPasswordForm: React.FC<RestablecerPasswordFormProps> = ({
  initialToken = '',
  onBackToLogin,
  onSuccess,
}) => {
  const {
    token,
    setToken,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    showPassword,
    toggleShowPassword,
    showPasswordConfirm,
    toggleShowPasswordConfirm,
    isLoading,
    error,
    exitoso,
    mensajeExito,
    passwordRules,
    confirmHasInput,
    passwordsMatch,
    confirmMismatch,
    canSubmit,
    handleRestablecerPassword,
  } = useRestablecerPasswordViewModel(initialToken);

  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayHeadline, setOverlayHeadline] = useState('Actualizando contraseña...');
  const [overlayMessage, setOverlayMessage] = useState('Guardando tu nueva clave de acceso...');
  const [overlaySuccess, setOverlaySuccess] = useState(false);

  const onSubmit = async () => {
    if (!token.trim() || !password || !passwordConfirm) {
      await handleRestablecerPassword();
      return;
    }

    setShowOverlay(true);
    setOverlayHeadline('Actualizando contraseña...');
    setOverlayMessage('Guardando tu nueva clave de acceso...');
    setOverlaySuccess(false);

    const ok = await handleRestablecerPassword();
    if (ok) {
      setOverlayHeadline('¡Contraseña actualizada!');
      setOverlayMessage('Tu clave ha sido cambiada con éxito. Redirigiendo...');
      setOverlaySuccess(true);

      setTimeout(() => {
        setShowOverlay(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } else {
      setShowOverlay(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Mitad Superior: Hero Banner estilizado como en la Web */}
      <View style={styles.heroBanner}>
        <View style={styles.heroOverlay}>
          <Image
            source={require('../../../assets/images/logo-itza.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Tu seguridad es primero</Text>
          <Text style={styles.heroSubtitle}>
            Crea una nueva contraseña segura para proteger tu cuenta del salón
          </Text>
        </View>
        <View style={styles.heroAccentLine} />
      </View>

      {/* Mitad Inferior: Contenedor del Formulario */}
      <View style={styles.formContainer}>
        {/* Enlace Volver al inicio de sesión */}
        {onBackToLogin && (
          <TouchableOpacity
            onPress={onBackToLogin}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={16} color={COLORS.primaryBlue} />
            <Text style={styles.backButtonText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        )}

        {/* Encabezado */}
        <Text style={styles.titleText}>Nueva contraseña</Text>
        <Text style={styles.subtitleText}>
          Crea tu nueva contraseña. Debe ser diferente de tus contraseñas anteriores.
        </Text>

        {/* Banner de Error */}
        {error ? (
          <View style={styles.errorAlert}>
            <Feather name="alert-circle" size={18} color="#DC2626" style={styles.alertIcon} />
            <Text style={styles.errorAlertText}>{error}</Text>
          </View>
        ) : null}

        {/* Si no hay token en parámetros, mostrar aviso informativo */}
        {!token.trim() && (
          <View style={styles.warningAlert}>
            <Feather name="info" size={18} color={COLORS.warningText} style={styles.alertIcon} />
            <Text style={styles.warningAlertText}>
              Pega el token recibido en tu correo electrónico para verificar tu identidad y restablecer tu contraseña.
            </Text>
          </View>
        )}

        {/* Estado Exitoso */}
        {exitoso ? (
          <View style={styles.successCard}>
            <View style={styles.successAlert}>
              <Feather name="check-circle" size={20} color="#16A34A" style={styles.alertIcon} />
              <View style={styles.successTextContainer}>
                <Text style={styles.successAlertTitle}>¡Contraseña actualizada!</Text>
                <Text style={styles.successAlertText}>
                  {mensajeExito || 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.'}
                </Text>
              </View>
            </View>

            {onBackToLogin && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onBackToLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Iniciar sesión</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* Formulario */
          <View style={styles.form}>
            {/* Campo de Token / Código de Verificación */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Token o código de verificación</Text>
              <View style={styles.inputWrapper}>
                <Feather name="key" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Pega el token recibido por correo"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={token}
                  onChangeText={setToken}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Campo Nueva Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nueva contraseña</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
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
                  onPress={toggleShowPassword}
                  style={styles.eyeBtn}
                  activeOpacity={0.6}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Reglas de Fortaleza de Contraseña (StrengthLine del web) */}
              <View style={styles.rulesContainer}>
                <View style={styles.ruleItem}>
                  <Feather
                    name={passwordRules.len8 ? 'check-circle' : 'circle'}
                    size={13}
                    color={passwordRules.len8 ? COLORS.strengthOk : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.ruleText,
                      passwordRules.len8 && styles.ruleTextPassed,
                    ]}
                  >
                    8+ caracteres
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <Feather
                    name={passwordRules.upper ? 'check-circle' : 'circle'}
                    size={13}
                    color={passwordRules.upper ? COLORS.strengthOk : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.ruleText,
                      passwordRules.upper && styles.ruleTextPassed,
                    ]}
                  >
                    1 mayúscula
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <Feather
                    name={passwordRules.digit ? 'check-circle' : 'circle'}
                    size={13}
                    color={passwordRules.digit ? COLORS.strengthOk : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.ruleText,
                      passwordRules.digit && styles.ruleTextPassed,
                    ]}
                  >
                    1 número
                  </Text>
                </View>
              </View>
            </View>

            {/* Campo Confirmar Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirma tu contraseña</Text>
              <View
                style={[
                  styles.inputWrapper,
                  confirmMismatch && styles.inputWrapperError,
                  confirmHasInput && passwordsMatch && styles.inputWrapperSuccess,
                ]}
              >
                <Feather name="lock" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPasswordConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={toggleShowPasswordConfirm}
                  style={styles.eyeBtn}
                  activeOpacity={0.6}
                >
                  <Feather
                    name={showPasswordConfirm ? 'eye-off' : 'eye'}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Helper text como en web */}
              {confirmMismatch ? (
                <Text style={styles.helperMismatch}>Las contraseñas no coinciden.</Text>
              ) : confirmHasInput && passwordsMatch ? (
                <Text style={styles.helperMatch}>Las contraseñas coinciden.</Text>
              ) : (
                <Text style={styles.helperMuted}>Escribe de nuevo tu contraseña.</Text>
              )}
            </View>

            {/* Botón de Envío */}
            <TouchableOpacity
              style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]}
              onPress={onSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.primaryBtnText}>Restableciendo...</Text>
                </View>
              ) : (
                <Text style={styles.primaryBtnText}>Restablecer contraseña</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Overlay Barber Pole en movimiento al restablecer contraseña */}
      <BarberActionOverlay
        visible={showOverlay}
        headline={overlayHeadline}
        message={overlayMessage}
        isSuccess={overlaySuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  heroBanner: {
    backgroundColor: COLORS.imageLetterbox,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  heroOverlay: {
    alignItems: 'center',
    maxWidth: 340,
  },
  heroLogo: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  heroAccentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.linkOrange,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  backButtonText: {
    color: COLORS.primaryBlue,
    fontSize: 13.5,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 13.5,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBg,
    borderColor: COLORS.errorBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  warningAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warningBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  alertIcon: {
    marginRight: 10,
  },
  errorAlertText: {
    flex: 1,
    color: COLORS.errorText,
    fontSize: 13,
    fontWeight: '500',
  },
  warningAlertText: {
    flex: 1,
    color: COLORS.warningText,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
  },
  successCard: {
    marginTop: 4,
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.successBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  successTextContainer: {
    flex: 1,
  },
  successAlertTitle: {
    color: COLORS.successText,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  successAlertText: {
    color: COLORS.successText,
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  inputWrapperSuccess: {
    borderColor: '#22C55E',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: COLORS.text,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  rulesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ruleText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  ruleTextPassed: {
    color: COLORS.strengthOk,
    fontWeight: '600',
  },
  helperMismatch: {
    fontSize: 12,
    color: COLORS.errorText,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  helperMatch: {
    fontSize: 12,
    color: COLORS.strengthOk,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  helperMuted: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  primaryBtn: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
