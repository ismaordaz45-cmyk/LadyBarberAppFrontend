import { Linking } from 'react-native';
import {
  ACCOUNT_DELETION_URL,
  PRIVACY_POLICY_URL,
  TERMS_AND_CONDITIONS_URL,
  isAllowedLegalUrl,
  openLegalUrl,
} from '../legalLinks';

const openURLMock = jest.spyOn(Linking, 'openURL');

describe('Enlaces legales públicos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    openURLMock.mockResolvedValue(true);
  });

  afterAll(() => {
    openURLMock.mockRestore();
  });

  it('autoriza únicamente las tres páginas HTTPS oficiales', () => {
    expect(isAllowedLegalUrl(PRIVACY_POLICY_URL)).toBe(true);
    expect(isAllowedLegalUrl(TERMS_AND_CONDITIONS_URL)).toBe(true);
    expect(isAllowedLegalUrl(ACCOUNT_DELETION_URL)).toBe(true);
    expect(isAllowedLegalUrl('http://salon-lady-barber-frontend.vercel.app/privacidad')).toBe(false);
    expect(isAllowedLegalUrl('https://example.com/privacidad')).toBe(false);
  });

  it('abre una URL oficial mediante el sistema operativo', async () => {
    await openLegalUrl(ACCOUNT_DELETION_URL);
    expect(openURLMock).toHaveBeenCalledWith(ACCOUNT_DELETION_URL);
  });

  it('rechaza URL no autorizadas sin intentar abrirlas', async () => {
    await expect(openLegalUrl('https://example.com')).rejects.toThrow(
      'La URL legal no está autorizada.'
    );
    expect(openURLMock).not.toHaveBeenCalled();
  });
});
