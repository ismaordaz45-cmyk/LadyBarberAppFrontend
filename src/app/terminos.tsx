import React from 'react';
import { LegalDocumentScreen } from '../components/legal/LegalDocumentScreen';
import { LEGAL_LAST_UPDATED, TERMS_SECTIONS } from '../content/legal';

export default function TerminosScreen() {
  return <LegalDocumentScreen title="Términos y condiciones" subtitle="Reglas para utilizar LadyBarberApp" lastUpdated={LEGAL_LAST_UPDATED} sections={TERMS_SECTIONS} />;
}
