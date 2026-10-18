const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarReglasPassword(password: string) {
  return {
    len8: password.length >= 8,
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
  };
}

function calcularFortalezaPassword(password: string) {
  if (!password) return { score: 0, label: 'Débil' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;

  let label = 'Débil';
  if (score === 2) label = 'Moderada';
  if (score === 3) label = 'Buena';
  if (score >= 4) label = 'Segura';

  return { score, label };
}

describe('Pruebas Unitarias: Validadores de Autenticación y Registro', () => {
  describe('Validación de formato de Email (EMAIL_RE)', () => {
    it('debe aceptar direcciones de correo válidas', () => {
      expect(EMAIL_RE.test('cliente@gmail.com')).toBe(true);
      expect(EMAIL_RE.test('barber.itza@ladybarber.com.mx')).toBe(true);
      expect(EMAIL_RE.test('usuario_123@dominio.co')).toBe(true);
    });

    it('debe rechazar correos sin @ o sin dominio', () => {
      expect(EMAIL_RE.test('cliente-sin-arroba.com')).toBe(false);
      expect(EMAIL_RE.test('cliente@')).toBe(false);
      expect(EMAIL_RE.test('@dominio.com')).toBe(false);
      expect(EMAIL_RE.test('correo con espacios@dominio.com')).toBe(false);
    });
  });

  describe('Validación de reglas de contraseña (Longitud, Mayúscula y Dígito)', () => {
    it('debe cumplir todas las reglas con una contraseña robusta', () => {
      const res = validarReglasPassword('LadyBarber2026');
      expect(res.len8).toBe(true);
      expect(res.upper).toBe(true);
      expect(res.digit).toBe(true);
    });

    it('debe detectar si falta mayúscula, dígito o longitud', () => {
      const soloMinusculas = validarReglasPassword('cortecabello');
      expect(soloMinusculas.len8).toBe(true);
      expect(soloMinusculas.upper).toBe(false);
      expect(soloMinusculas.digit).toBe(false);

      const corta = validarReglasPassword('Ab1');
      expect(corta.len8).toBe(false);
      expect(corta.upper).toBe(true);
      expect(corta.digit).toBe(true);
    });
  });

  describe('Cálculo de indicador de fuerza de contraseña', () => {
    it('debe reportar Débil para contraseñas cortas o vacías', () => {
      expect(calcularFortalezaPassword('').label).toBe('Débil');
      expect(calcularFortalezaPassword('123').label).toBe('Débil');
    });

    it('debe reportar Segura para contraseñas de 8+ caracteres con mayúscula y número', () => {
      const res = calcularFortalezaPassword('Segura2026');
      expect(res.score).toBeGreaterThanOrEqual(4);
      expect(res.label).toBe('Segura');
    });
  });
});
