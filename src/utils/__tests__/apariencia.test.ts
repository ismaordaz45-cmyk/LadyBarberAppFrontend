import { colorApariencia, paletas } from '../../constants/apariencia';

const luminancia = (hex: string) => {
  const rgb = hex.replace('#', '').match(/.{2}/g)!.map(c => parseInt(c, 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
const contraste = (a: string, b: string) => (Math.max(luminancia(a), luminancia(b)) + 0.05) / (Math.min(luminancia(a), luminancia(b)) + 0.05);

it('distingue blanco de superficie y blanco sobre botón sin invertir imágenes ni colores transparentes', () => {
  expect(colorApariencia('#FFF', true, 'background')).toBe(paletas.dark.surface);
  expect(colorApariencia('#FFF', true, 'text')).toBe('#FFF');
  expect(colorApariencia('transparent', true, 'background')).toBe('transparent');
  expect(colorApariencia(undefined, true)).toBeUndefined();
  expect(colorApariencia('#1E3A5A', false)).toBe('#1E3A5A');
});
it.each(['light', 'dark'] as const)('mantiene contraste de texto, enlaces y botones en %s', modo => {
  const p = paletas[modo];
  expect(contraste(p.text, p.surface)).toBeGreaterThanOrEqual(4.5);
  expect(contraste(p.muted, p.background)).toBeGreaterThanOrEqual(4.5);
  expect(contraste(p.link, p.surface)).toBeGreaterThanOrEqual(4.5);
  expect(contraste('#FFFFFF', p.primary)).toBeGreaterThanOrEqual(4.5);
});
it('mantiene legibles los estados de pago, advertencias y errores en oscuro', () => {
  for (const [texto, fondo] of [['#886B12', '#FFF8DF'], ['#B91C1C', '#FEF2F2'], ['#166534', '#DCFCE7']]) {
    expect(contraste(colorApariencia(texto, true), colorApariencia(fondo, true, 'background'))).toBeGreaterThanOrEqual(4.5);
  }
});
