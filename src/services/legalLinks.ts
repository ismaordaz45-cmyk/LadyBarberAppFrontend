import { Linking } from 'react-native';

export const PRIVACY_POLICY_URL =
  'https://salon-lady-barber-frontend.vercel.app/privacidad' as const;
export const TERMS_AND_CONDITIONS_URL =
  'https://salon-lady-barber-frontend.vercel.app/terminos' as const;
export const ACCOUNT_DELETION_URL =
  'https://salon-lady-barber-frontend.vercel.app/privacidad#eliminar-cuenta' as const;

export type LegalPublicUrl =
  | typeof PRIVACY_POLICY_URL
  | typeof TERMS_AND_CONDITIONS_URL
  | typeof ACCOUNT_DELETION_URL;

const ALLOWED_LEGAL_URLS = new Set<string>([
  PRIVACY_POLICY_URL,
  TERMS_AND_CONDITIONS_URL,
  ACCOUNT_DELETION_URL,
]);

export const isAllowedLegalUrl = (url: string): url is LegalPublicUrl =>
  ALLOWED_LEGAL_URLS.has(url);

export const openLegalUrl = async (url: string): Promise<void> => {
  if (!isAllowedLegalUrl(url)) {
    throw new Error('La URL legal no está autorizada.');
  }

  await Linking.openURL(url);
};
