import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LegalSection } from '../../content/legal';

interface LegalDocumentScreenProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function LegalDocumentScreen({ title, subtitle, lastUpdated, sections }: LegalDocumentScreenProps) {
  const router = useRouter();
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
  section: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { color: '#1E3A5F', fontSize: 16, fontWeight: '800', marginBottom: 9 },
  paragraph: { color: '#475569', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 },
  bullet: { color: '#B47D22', fontSize: 16, fontWeight: '900', marginRight: 8 },
  bulletText: { flex: 1, color: '#475569', fontSize: 14, lineHeight: 21 },
});
