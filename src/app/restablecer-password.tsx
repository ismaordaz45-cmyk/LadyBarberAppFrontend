import { useThemedStyles } from '../hooks/use-themed-styles';
import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RestablecerPasswordForm } from '../components/autenticacion/RestablecerPasswordForm';

export default function RestablecerPasswordScreen() {
  const styles = useThemedStyles(baseStyles);
  const router = useRouter();

  const params = useLocalSearchParams<{ token?: string }>();

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
          <RestablecerPasswordForm
            initialToken={params.token || ''}
            onBackToLogin={() => router.replace('/login')}
            onSuccess={() => router.replace('/login')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
    justifyContent: 'center',
  },
});
