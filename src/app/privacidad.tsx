import React from 'react';
import { LegalDocumentScreen } from '../components/legal/LegalDocumentScreen';
import { LEGAL_LAST_UPDATED, PRIVACY_SECTIONS } from '../content/legal';

export default function PrivacidadScreen() {
  return <LegalDocumentScreen title="Política de privacidad" subtitle="Cómo protegemos y utilizamos tus datos" lastUpdated={LEGAL_LAST_UPDATED} sections={PRIVACY_SECTIONS} />;
}
