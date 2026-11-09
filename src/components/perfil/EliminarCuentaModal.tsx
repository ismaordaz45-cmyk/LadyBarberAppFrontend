import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type EliminarCuentaModalProps = {
  visible: boolean;
  password: string;
  confirmation: string;
  error: string;
  isDeleting: boolean;
  canDelete: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  onCancel: () => void;
  onDelete: () => void;
};

export const EliminarCuentaModal = ({
  visible,
  password,
  confirmation,
  error,
  isDeleting,
  canDelete,
  onPasswordChange,
  onConfirmationChange,
  onCancel,
  onDelete,
}: EliminarCuentaModalProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onCancel}
  >
    <KeyboardAvoidingView
      style={styles.backdrop}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card} accessibilityViewIsModal>
        <Text style={styles.title}>Eliminar cuenta</Text>
        <Text style={styles.warning}>
          Esta acción desactivará tu cuenta, cerrará tu sesión y cancelará tus
          citas activas. No podrás iniciar sesión nuevamente con esta cuenta.
        </Text>

        <Text style={styles.label}>Contraseña actual</Text>
        <View style={styles.passwordInputWrapper}>
          <TextInput
            accessibilityLabel="Contraseña actual"
            value={password}
            onChangeText={onPasswordChange}
            secureTextEntry={!isPasswordVisible}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isDeleting}
            style={styles.passwordInput}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor="#94A3B8"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            disabled={isDeleting}
            onPress={() => setIsPasswordVisible((current) => !current)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.visibilityButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.visibilityText}>
              {isPasswordVisible ? 'Ocultar' : 'Mostrar'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>
          Escribe <Text style={styles.confirmWord}>ELIMINAR</Text> para confirmar
        </Text>
        <TextInput
          accessibilityLabel="Confirmación de eliminación"
          value={confirmation}
          onChangeText={onConfirmationChange}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isDeleting}
          style={styles.input}
          placeholder="ELIMINAR"
          placeholderTextColor="#94A3B8"
        />

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={isDeleting}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.button,
              styles.cancelButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirmar eliminación de cuenta"
            disabled={!canDelete || isDeleting}
            onPress={onDelete}
            style={({ pressed }) => [
              styles.button,
              styles.deleteButton,
              (!canDelete || isDeleting) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteText}>Eliminar definitivamente</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  card: {
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#991B1B',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  warning: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 7,
  },
  confirmWord: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    color: '#0F172A',
    fontSize: 16,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 16,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  visibilityButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  visibilityText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
  error: {
    color: '#B91C1C',
    fontSize: 14,
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
  },
  deleteButton: {
    backgroundColor: '#B91C1C',
  },
  cancelText: {
    color: '#334155',
    fontWeight: '700',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
