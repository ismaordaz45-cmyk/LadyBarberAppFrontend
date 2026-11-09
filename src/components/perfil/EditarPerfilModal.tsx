import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type EditarPerfilModalProps = {
  visible: boolean;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono: string;
  correo: string;
  error: string;
  isSaving: boolean;
  canSave: boolean;
  onNombreChange: (value: string) => void;
  onApellidoPaternoChange: (value: string) => void;
  onApellidoMaternoChange: (value: string) => void;
  onTelefonoChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export const EditarPerfilModal = ({
  visible,
  nombre,
  apellidoPaterno,
  apellidoMaterno,
  telefono,
  correo,
  error,
  isSaving,
  canSave,
  onNombreChange,
  onApellidoPaternoChange,
  onApellidoMaternoChange,
  onTelefonoChange,
  onCancel,
  onSave,
}: EditarPerfilModalProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    statusBarTranslucent
    onRequestClose={onCancel}
  >
    <KeyboardAvoidingView
      style={styles.backdrop}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card} accessibilityViewIsModal>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Editar perfil</Text>
          <Text style={styles.subtitle}>
            Actualiza tus datos de contacto. El correo no puede modificarse.
          </Text>

          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            accessibilityLabel="Nombre"
            value={nombre}
            onChangeText={onNombreChange}
            editable={!isSaving}
            autoCapitalize="words"
            style={styles.input}
            maxLength={120}
          />

          <Text style={styles.label}>Apellido paterno</Text>
          <TextInput
            accessibilityLabel="Apellido paterno"
            value={apellidoPaterno}
            onChangeText={onApellidoPaternoChange}
            editable={!isSaving}
            autoCapitalize="words"
            style={styles.input}
            maxLength={120}
          />

          <Text style={styles.label}>Apellido materno</Text>
          <TextInput
            accessibilityLabel="Apellido materno"
            value={apellidoMaterno}
            onChangeText={onApellidoMaternoChange}
            editable={!isSaving}
            autoCapitalize="words"
            style={styles.input}
            maxLength={120}
          />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            accessibilityLabel="Teléfono"
            value={telefono}
            onChangeText={onTelefonoChange}
            editable={!isSaving}
            keyboardType="phone-pad"
            style={styles.input}
            maxLength={25}
            placeholder="10 a 15 dígitos"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Correo</Text>
          <TextInput
            accessibilityLabel="Correo de solo lectura"
            value={correo}
            editable={false}
            style={[styles.input, styles.readOnlyInput]}
          />

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={onCancel}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Guardar perfil"
              disabled={!canSave || isSaving}
              onPress={onSave}
              style={[
                styles.button,
                styles.saveButton,
                (!canSave || isSaving) && styles.disabled,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Guardar</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  card: {
    maxHeight: '88%',
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#1E3A5F',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 20,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    color: '#0F172A',
    fontSize: 15,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 14,
  },
  readOnlyInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
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
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#1E3A5F',
  },
  cancelText: {
    color: '#334155',
    fontWeight: '700',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.45,
  },
});
