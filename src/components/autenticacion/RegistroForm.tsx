import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRegistroViewModel } from '../../viewmodels/useRegistroViewModel';
import { BarberPole } from '../compartidos/BarberPole';
import { BarberActionOverlay } from '../compartidos/BarberActionOverlay';

interface RegistroFormProps {
  onBackToLogin?: () => void;
  onSuccess?: () => void;
}

const COLORS = {
  textDark: '#0F172A',
  textBody: '#1E293B',
  textMuted: '#64748B',
  placeholder: '#94A3B8',
  pageBg: '#F8FAFC',
  white: '#FFFFFF',
  cardBorder: '#E2E8F0',
  inputBg: '#F8FAFC',
  inputBorder: '#E2E8F0',
  primaryNavy: '#1E293B',
  primaryNavyHover: '#0F172A',
  goldBrand: '#B47D22',
  goldBorder: '#F3D17A',
  goldBgLight: '#FFFDF5',
  amberBorder: '#FDE68A',
  amberBg: '#FFFDF5',
  amberBadgeBg: '#FEF3C7',
  amberBadgeText: '#B45309',
  amberShield: '#D97706',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  errorText: '#DC2626',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  successText: '#166534',
  barInactive: '#E2E8F0',
  barActive: '#1E293B',
};

/**
 * Componente View: Formulario de Registro de Usuario (MVVM).
 * Reproduce exactamente el diseño e iconografía de Figma ("Crear Cuenta").
 */
export const RegistroForm: React.FC<RegistroFormProps> = ({
  onBackToLogin,
  onSuccess,
}) => {
  const {
    formData,
    updateField,
    showPassword,
    toggleShowPassword,
    showPasswordConfirm,
    toggleShowPasswordConfirm,
    isLoading,
    error,
    exitoso,
    mensajeExito,
    passwordStrength,
    confirmHasInput,
    passwordsMatch,
    confirmMismatch,
    canSubmit,
    handleRegistro,
  } = useRegistroViewModel();

  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayHeadline, setOverlayHeadline] = useState('¡Casi listo!');
  const [overlayMessage, setOverlayMessage] = useState('Creando tu cuenta...');
  const [overlaySuccess, setOverlaySuccess] = useState(false);

  const onSubmit = async () => {
    // Si campos esenciales faltan, validar localmente primero sin abrir overlay
    if (
      !formData.nombre.trim() ||
      !formData.correo.trim() ||
      !formData.password ||
      !formData.passwordConfirm
    ) {
      await handleRegistro();
      return;
    }

    setShowOverlay(true);
    setOverlayHeadline('¡Casi listo!');
    setOverlayMessage('Creando tu cuenta...');
    setOverlaySuccess(false);

    const ok = await handleRegistro();
    if (ok) {
      setOverlayHeadline('¡Registro exitoso!');
      setOverlayMessage('Usuario registrado correctamente. Redirigiendo...');
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
      {/* Barra Superior: Botón circular de retroceso, Pill central y Barber Pole decorativo */}
      <View style={styles.topBarRow}>
        {onBackToLogin ? (
          <TouchableOpacity
            onPress={onBackToLogin}
            style={styles.circleBackBtn}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={18} color={COLORS.textDark} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.brandPill}>
          <Text style={styles.brandPillText}>LADY BARBER ITZÁ D'M</Text>
        </View>

        <View style={styles.topRightOrnament}>
          <BarberPole size={28} width={9} speedMs={1100} />
        </View>
      </View>

      {/* Título y Subtítulo de la Pantalla */}
      <View style={styles.titleContainer}>
        <Text style={styles.mainTitle}>Crear Cuenta</Text>
        <Text style={styles.mainSubtitle}>Únete a nuestra experiencia exclusiva</Text>
      </View>

      {/* Tarjeta Blanca Principal del Formulario */}
      <View style={styles.card}>
        {/* Banner de Error */}
        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={17} color={COLORS.errorText} style={styles.alertIcon} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* Estado Exitoso */}
        {exitoso ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <Feather name="check" size={26} color={COLORS.successText} />
            </View>
            <Text style={styles.successTitle}>¡Cuenta creada exitosamente!</Text>
            <Text style={styles.successDescription}>
              {mensajeExito || 'Bienvenida a Lady Barber. Ya puedes iniciar sesión con tu cuenta.'}
            </Text>

            {onBackToLogin && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onBackToLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Iniciar Sesión</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.formFields}>
            {/* Campo 1: Nombre */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Feather name="user" size={14} color={COLORS.textMuted} style={styles.labelIcon} />
                <Text style={styles.labelText}>Nombre completo *</Text>
              </View>
              <TextInput
                style={styles.inputBox}
                placeholder="Ej. Mariana Morales R."
                placeholderTextColor={COLORS.placeholder}
                value={formData.nombre}
                onChangeText={(val) => updateField('nombre', val)}
                editable={!isLoading}
              />
            </View>

            {/* Fila: Apellidos */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, styles.columnLeft]}>
                <View style={styles.labelRow}>
                  <Feather name="user" size={14} color={COLORS.textMuted} style={styles.labelIcon} />
                  <Text style={styles.labelText}>Apellido paterno</Text>
                </View>
                <TextInput
                  style={styles.inputBox}
                  placeholder="Paterno"
                  placeholderTextColor={COLORS.placeholder}
                  value={formData.apellidoPaterno}
                  onChangeText={(val) => updateField('apellidoPaterno', val)}
                  editable={!isLoading}
                />
              </View>

              <View style={[styles.fieldGroup, styles.columnRight]}>
                <View style={styles.labelRow}>
                  <Feather name="user" size={14} color={COLORS.textMuted} style={styles.labelIcon} />
                  <Text style={styles.labelText}>Apellido materno</Text>
                </View>
                <TextInput
                  style={styles.inputBox}
                  placeholder="Materno"
                  placeholderTextColor={COLORS.placeholder}
                  value={formData.apellidoMaterno}
                  onChangeText={(val) => updateField('apellidoMaterno', val)}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Campo 2: Correo electrónico */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Feather name="mail" size={14} color={COLORS.textMuted} style={styles.labelIcon} />
                <Text style={styles.labelText}>Correo electrónico *</Text>
              </View>
              <TextInput
                style={styles.inputBox}
                placeholder="tu.correo@ejemplo.com"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={formData.correo}
                onChangeText={(val) => updateField('correo', val)}
                editable={!isLoading}
              />
            </View>

            {/* Campo 3: Teléfono / WhatsApp con prefijo +52 */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Feather name="phone" size={14} color={COLORS.textMuted} style={styles.labelIcon} />
                <Text style={styles.labelText}>Teléfono / WhatsApp</Text>
              </View>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.flagEmoji}>🇲🇽</Text>
                  <Text style={styles.countryCodeText}>+52</Text>
                  <Feather name="chevron-down" size={13} color={COLORS.textMuted} style={styles.chevronIcon} />
                </View>

                <TextInput
                  style={[styles.inputBox, styles.phoneInputBox]}
                  placeholder="55 1234 5678"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="numeric"
                  maxLength={10}
                  value={formData.telefono}
                  onChangeText={(val) => updateField('telefono', val)}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Campo 4: Contraseña */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Feather name="lock" size={14} color={COLORS.textMuted} style={styles.labelIcon} />
                <Text style={styles.labelText}>Contraseña *</Text>
              </View>
              <View style={styles.inputWithIconRow}>
                <TextInput
                  style={styles.inputInner}
                  placeholder="Mínimo 8 carac."
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={formData.password}
                  onChangeText={(val) => updateField('password', val)}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={toggleShowPassword}
                  style={styles.eyeBtn}
                  activeOpacity={0.6}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={17}
                    color={COLORS.placeholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Campo 5: Confirmar Contraseña */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Feather name="shield" size={14} color={COLORS.textMuted} style={styles.labelIcon} />
                <Text style={styles.labelText}>Confirmar *</Text>
              </View>
              <View
                style={[
                  styles.inputWithIconRow,
                  confirmMismatch && styles.inputErrorBorder,
                  confirmHasInput && passwordsMatch && styles.inputSuccessBorder,
                ]}
              >
                <TextInput
                  style={styles.inputInner}
                  placeholder="Repite clave"
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!showPasswordConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={formData.passwordConfirm}
                  onChangeText={(val) => updateField('passwordConfirm', val)}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={toggleShowPasswordConfirm}
                  style={styles.eyeBtn}
                  activeOpacity={0.6}
                >
                  <Feather
                    name={showPasswordConfirm ? 'eye-off' : 'eye'}
                    size={17}
                    color={COLORS.placeholder}
                  />
                </TouchableOpacity>
              </View>

              {confirmMismatch ? (
                <Text style={styles.helperError}>Las contraseñas no coinciden.</Text>
              ) : confirmHasInput && passwordsMatch ? (
                <Text style={styles.helperSuccess}>Las contraseñas coinciden.</Text>
              ) : null}
            </View>

            {/* Barra de Fuerza de Contraseña (Segmentos idénticos al diseño de Figma) */}
            <View style={styles.strengthRow}>
              <View style={styles.strengthBarsContainer}>
                {[1, 2, 3, 4].map((segmentIndex) => {
                  const isActive = segmentIndex <= passwordStrength.score;
                  return (
                    <View
                      key={segmentIndex}
                      style={[
                        styles.strengthBarSegment,
                        isActive && styles.strengthBarActive,
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={styles.strengthText}>
                Fuerza: <Text style={styles.strengthHighlight}>{passwordStrength.label}</Text>
              </Text>
            </View>

            {/* Recuadro de Recuperación de Cuenta (Figma amber box) */}
            <View style={styles.recoveryCard}>
              <View style={styles.recoveryHeaderRow}>
                <View style={styles.recoveryHeaderLeft}>
                  <Feather name="shield" size={15} color={COLORS.amberShield} style={styles.recoveryShieldIcon} />
                  <Text style={styles.recoveryHeaderTitle}>Recuperación de cuenta</Text>
                </View>
                <View style={styles.secureBadge}>
                  <Text style={styles.secureBadgeText}>SEGURA</Text>
                </View>
              </View>

              {/* Pregunta secreta */}
              <View style={styles.recoveryInputRow}>
                <TextInput
                  style={styles.recoveryInputInner}
                  placeholder="¿Nombre de tu mascota?"
                  placeholderTextColor={COLORS.placeholder}
                  value={formData.preguntaSecreta}
                  onChangeText={(val) => updateField('preguntaSecreta', val)}
                  editable={!isLoading}
                />
                <Feather name="chevron-down" size={15} color={COLORS.placeholder} />
              </View>

              {/* Respuesta secreta */}
              <View style={styles.recoveryInputRow}>
                <TextInput
                  style={styles.recoveryInputInner}
                  placeholder="Tu respuesta secreta"
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry
                  value={formData.respuestaSecreta}
                  onChangeText={(val) => updateField('respuestaSecreta', val)}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Banner de error visible directamente sobre el botón para rápida visualización */}
            {error ? (
              <View style={styles.inlineErrorBanner}>
                <Feather name="alert-circle" size={16} color={COLORS.errorText} style={styles.alertIcon} />
                <Text style={styles.inlineErrorText}>{error}</Text>
              </View>
            ) : null}

            {/* Botón Principal: Crear Cuenta */}
            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={onSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={COLORS.white} size="small" />
                  <Text style={styles.primaryBtnText}>Creando cuenta...</Text>
                </View>
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.primaryBtnText}>Crear Cuenta</Text>
                  <Feather name="arrow-right" size={16} color={COLORS.white} style={styles.btnArrow} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Enlace inferior "¿Ya tienes cuenta? Inicia sesión" */}
        {onBackToLogin && (
          <View style={styles.bottomLinkRow}>
            <Text style={styles.bottomMutedText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={onBackToLogin} activeOpacity={0.7}>
              <Text style={styles.bottomLinkText}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Overlay con animación Barber Pole (en movimiento continuo) */}
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
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  circleBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  backPlaceholder: {
    width: 42,
  },
  brandPill: {
    backgroundColor: COLORS.goldBgLight,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.goldBrand,
    letterSpacing: 1.2,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 13.5,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 20,
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBg,
    borderColor: COLORS.errorBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  alertIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    color: COLORS.errorText,
    fontSize: 13,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.successText,
    marginBottom: 6,
  },
  successDescription: {
    fontSize: 13.5,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  formFields: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 15,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelIcon: {
    marginRight: 6,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  inputBox: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 13,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textDark,
  },
  twoColumnRow: {
    flexDirection: 'row',
  },
  columnLeft: {
    flex: 1,
    marginRight: 6,
  },
  columnRight: {
    flex: 1,
    marginLeft: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 13,
    height: 48,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  flagEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  countryCodeText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.textDark,
    marginRight: 4,
  },
  chevronIcon: {
    marginLeft: 2,
  },
  phoneInputBox: {
    flex: 1,
  },
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 13,
    height: 48,
    paddingHorizontal: 14,
  },
  inputInner: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    height: '100%',
  },
  inputErrorBorder: {
    borderColor: COLORS.errorText,
  },
  inputSuccessBorder: {
    borderColor: COLORS.successText,
  },
  eyeBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperError: {
    fontSize: 11.5,
    color: COLORS.errorText,
    marginTop: 4,
    marginLeft: 2,
  },
  helperSuccess: {
    fontSize: 11.5,
    color: COLORS.successText,
    marginTop: 4,
    marginLeft: 2,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  strengthBarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  strengthBarSegment: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.barInactive,
  },
  strengthBarActive: {
    backgroundColor: COLORS.barActive,
  },
  strengthText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  strengthHighlight: {
    color: COLORS.textDark,
    fontWeight: '700',
  },
  recoveryCard: {
    backgroundColor: COLORS.amberBg,
    borderWidth: 1.5,
    borderColor: COLORS.amberBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  recoveryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recoveryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recoveryShieldIcon: {
    marginRight: 6,
  },
  recoveryHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textBody,
  },
  secureBadge: {
    backgroundColor: COLORS.amberBadgeBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.amberBadgeText,
    letterSpacing: 0.6,
  },
  recoveryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  recoveryInputInner: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.textDark,
    height: '100%',
  },
  primaryBtn: {
    backgroundColor: COLORS.primaryNavy,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryNavy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnArrow: {
    marginLeft: 8,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  bottomMutedText: {
    fontSize: 13.5,
    color: COLORS.textMuted,
  },
  bottomLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.primaryNavy,
  },
  topRightOrnament: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBg,
    borderColor: COLORS.errorBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  inlineErrorText: {
    flex: 1,
    color: COLORS.errorText,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
});
