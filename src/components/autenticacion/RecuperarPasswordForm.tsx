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
import { useRecuperarPasswordViewModel } from '../../viewmodels/useRecuperarPasswordViewModel';
import { BarberActionOverlay } from '../compartidos/BarberActionOverlay';

interface RecuperarPasswordFormProps {
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
  cardBorder: '#E2E8F0',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  errorText: '#B91C1C',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  successText: '#166534',
};

/**
 * Componente View: Formulario de Recuperación de Contraseña (MVVM).
 * Reproduce fielmente el diseño del componente web RecuperarContraseña.jsx.
 */
export const RecuperarPasswordForm: React.FC<RecuperarPasswordFormProps> = ({
  onBackToLogin,
  onSuccess,
}) => {
  const {
    correo,
    setCorreo,
    isLoading,
    error,
    enviado,
    mensajeExito,
    handleSolicitarRecuperacion,
  } = useRecuperarPasswordViewModel();

  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayHeadline, setOverlayHeadline] = useState('Enviando instrucciones...');
  const [overlayMessage, setOverlayMessage] = useState('Conectando con el servidor de correo...');
  const [overlaySuccess, setOverlaySuccess] = useState(false);

  const onSubmit = async () => {
    if (!correo.trim()) {
      await handleSolicitarRecuperacion();
      return;
    }

    setShowOverlay(true);
    setOverlayHeadline('Enviando instrucciones...');
    setOverlayMessage('Conectando con el servidor de correo...');
    setOverlaySuccess(false);

    const ok = await handleSolicitarRecuperacion();
    if (ok) {
      setOverlayHeadline('¡Correo enviado!');
      setOverlayMessage('Instrucciones enviadas exitosamente.');
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
          <Text style={styles.heroTitle}>Recupera el acceso a tu cuenta</Text>
          <Text style={styles.heroSubtitle}>
            Te ayudaremos a restablecer tu contraseña de forma segura
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

        {/* Encabezado del Formulario */}
        <View style={styles.titleRow}>
          <MaterialCommunityIcons
            name="lock-reset"
            size={30}
            color={COLORS.linkOrange}
            style={styles.titleIcon}
          />
          <Text style={styles.titleText}>Recuperar contraseña</Text>
        </View>

        <Text style={styles.subtitleText}>
          Ingresa el correo asociado a tu cuenta. Te enviaremos los pasos para crear una nueva contraseña.
        </Text>

        {/* Banner de Error */}
        {error ? (
          <View style={styles.errorAlert}>
            <Feather name="alert-circle" size={18} color="#DC2626" style={styles.alertIcon} />
            <Text style={styles.errorAlertText}>{error}</Text>
          </View>
        ) : null}

        {/* Mensaje de Éxito al Enviar */}
        {enviado ? (
          <View style={styles.successCard}>
            <View style={styles.successAlert}>
              <Feather name="check-circle" size={20} color="#16A34A" style={styles.alertIcon} />
              <View style={styles.successTextContainer}>
                <Text style={styles.successAlertTitle}>Solicitud enviada</Text>
                <Text style={styles.successAlertText}>
                  Revisa tu bandeja de entrada en <Text style={styles.boldText}>{correo}</Text>. Si no encuentras el mensaje, revisa la carpeta de spam.
                </Text>
              </View>
            </View>

            {onBackToLogin && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onBackToLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Volver al inicio de sesión</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* Formulario */
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="mail"
                  size={18}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
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

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={onSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.primaryBtnText}>Enviando instrucciones...</Text>
                </View>
              ) : (
                <Text style={styles.primaryBtnText}>Enviar instrucciones</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Enlace inferior de navegación */}
        {onBackToLogin && (
          <View style={styles.bottomLinkContainer}>
            <Text style={styles.bottomText}>¿Recordaste tu contraseña? </Text>
            <TouchableOpacity onPress={onBackToLogin} activeOpacity={0.7}>
              <Text style={styles.bottomHighlight}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Overlay Barber Pole en movimiento al solicitar recuperación */}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 10,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitleText: {
    fontSize: 13.5,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 22,
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
  alertIcon: {
    marginRight: 10,
  },
  errorAlertText: {
    flex: 1,
    color: COLORS.errorText,
    fontSize: 13,
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
  boldText: {
    fontWeight: '700',
  },
  form: {
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: COLORS.text,
    height: '100%',
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
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.65,
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
  bottomLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  bottomText: {
    color: COLORS.textMuted,
    fontSize: 13.5,
  },
  bottomHighlight: {
    color: COLORS.linkOrange,
    fontSize: 13.5,
    fontWeight: '700',
  },
});
