import React from 'react';
import { LegalDocumentScreen } from '../components/legal/LegalDocumentScreen';
import { LEGAL_LAST_UPDATED, PRIVACY_SECTIONS } from '../content/legal';
import { ACCOUNT_DELETION_URL, PRIVACY_POLICY_URL } from '../services/legalLinks';

export default function PrivacidadScreen() {
  return <LegalDocumentScreen title="Política de privacidad" subtitle="Cómo protegemos y utilizamos tus datos" lastUpdated={LEGAL_LAST_UPDATED} sections={PRIVACY_SECTIONS} externalLinks={[{ label: 'Ver política publicada', url: PRIVACY_POLICY_URL }, { label: 'Solicitar eliminación fuera de la app', url: ACCOUNT_DELETION_URL }]} />;
}
