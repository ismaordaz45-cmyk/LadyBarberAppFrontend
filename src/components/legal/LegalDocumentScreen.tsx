import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LegalSection } from '../../content/legal';
import { LegalPublicUrl, openLegalUrl } from '../../services/legalLinks';

interface LegalExternalLink {
  label: string;
  url: LegalPublicUrl;
}

interface LegalDocumentScreenProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
  externalLinks?: LegalExternalLink[];
}

export function LegalDocumentScreen({ title, subtitle, lastUpdated, sections, externalLinks = [] }: LegalDocumentScreenProps) {
  const router = useRouter();

  const handleExternalLink = async (url: LegalPublicUrl) => {
    try {
      await openLegalUrl(url);
    } catch {
      Alert.alert(
        'No se pudo abrir el enlace',
        'Comprueba tu conexión e intenta nuevamente.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={21} color="#1E3A5F" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.versionCard}>
          <Feather name="shield" size={19} color="#B47D22" />
          <Text style={styles.versionText}>Última actualización: {lastUpdated}</Text>
        </View>
        {externalLinks.length > 0 ? (
          <View style={styles.externalLinks}>
            {externalLinks.map((link) => (
              <TouchableOpacity
                key={link.url}
                accessibilityRole="link"
                accessibilityLabel={link.label}
                onPress={() => void handleExternalLink(link.url)}
                style={styles.externalLinkButton}
              >
                <Feather name="external-link" size={17} color="#1E3A5F" />
                <Text style={styles.externalLinkText}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs?.map((paragraph) => <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>)}
            {section.bullets?.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', marginRight: 12 },
  headerText: { flex: 1 },
  title: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#64748B', fontSize: 12.5, marginTop: 2 },
  content: { padding: 18, paddingBottom: 42 },
  versionCard: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FFFDF5', borderColor: '#F3D17A', borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 16 },
  versionText: { color: '#854D0E', fontSize: 12.5, fontWeight: '700' },
  externalLinks: { gap: 9, marginBottom: 16 },
  externalLinkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#FFFFFF' },
  externalLinkText: { color: '#1E3A5F', fontSize: 13.5, fontWeight: '700', textAlign: 'center' },
  section: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { color: '#1E3A5F', fontSize: 16, fontWeight: '800', marginBottom: 9 },
  paragraph: { color: '#475569', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 },
  bullet: { color: '#B47D22', fontSize: 16, fontWeight: '900', marginRight: 8 },
  bulletText: { flex: 1, color: '#475569', fontSize: 14, lineHeight: 21 },
});
