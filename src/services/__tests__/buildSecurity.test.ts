const {
  assertJarsignerVerification,
  validateEasBuildEnvironment,
  validatePublicApiUrl,
} = require('../../../scripts/build-security.cjs');

describe('seguridad de compilacion EAS', () => {
  describe('EXPO_PUBLIC_API_URL', () => {
    it('acepta y normaliza una URL HTTPS terminada en /api', () => {
      expect(validatePublicApiUrl('  https://qa.example.com/api/  '))
        .toBe('https://qa.example.com/api');
    });

    it.each([
      undefined,
      '',
      'qa.example.com/api',
      'http://qa.example.com/api',
      'https://qa.example.com',
      'https://usuario:password@qa.example.com/api',
      'https://qa.example.com/api?token=valor',
      'https://qa.example.com/api#fragmento',
      'https://qa.example.com/api/v1',
    ])('rechaza una URL ausente o invalida: %s', (url) => {
      expect(() => validatePublicApiUrl(url)).toThrow();
    });

    it('solo exige la variable dentro del worker de EAS Build', () => {
      expect(validateEasBuildEnvironment({ EAS_BUILD: 'false' })).toBeUndefined();
      expect(() => validateEasBuildEnvironment({ EAS_BUILD: 'true' }))
        .toThrow('obligatoria');
      expect(validateEasBuildEnvironment({
        EAS_BUILD: 'true',
        EXPO_PUBLIC_API_URL: 'https://qa.example.com/api',
      })).toBe('https://qa.example.com/api');
    });
  });

  describe('evidencia de firma jarsigner', () => {
    it('acepta una verificacion firmada sin advertencias criticas', () => {
      expect(() => assertJarsignerVerification(`
        s = signature was verified
        jar verified.
        Warning: signer certificate is self-signed.
      `)).not.toThrow();
    });

    it.each([
      '',
      'jar is unsigned.',
      'This jar contains unsigned entries which have not been integrity-checked.\njar verified.',
      'signature is invalid\njar verified.',
      'unable to verify the signer certificate\njar verified.',
      'signer certificate has expired\njar verified.',
      'signer certificate is not yet valid\njar verified.',
      "signer certificate doesn't allow code signing\njar verified.",
    ])('rechaza evidencia ausente, sin firma o critica', (report) => {
      expect(() => assertJarsignerVerification(report)).toThrow();
    });
  });
});
