import { enlaceComoLlegar, esEnlaceGoogleMaps } from '../ubicacion';

it('construye indicaciones con la dirección publicada y codifica sus caracteres', () => {
  const url = enlaceComoLlegar('Calle Itzá 10 & Centro, Hidalgo', null)!;
  const parsed = new URL(url);
  expect(parsed.origin).toBe('https://www.google.com');
  expect(parsed.pathname).toBe('/maps/dir/');
  expect(parsed.searchParams.get('api')).toBe('1');
  expect(parsed.searchParams.get('destination')).toBe('Calle Itzá 10 & Centro, Hidalgo');
  expect(parsed.searchParams.has('origin')).toBe(false);
  expect(parsed.searchParams.has('key')).toBe(false);
});
it('prefiere las coordenadas válidas del administrador', () => {
  expect(new URL(enlaceComoLlegar('Dirección', '21.14, -98.42')!).searchParams.get('destination')).toBe('21.14,-98.42');
});
it.each(['91,-98', '21,181', '-91,0'])('descarta coordenadas fuera de rango: %s', ubicacion => {
  expect(new URL(enlaceComoLlegar('Dirección publicada', ubicacion)!).searchParams.get('destination')).toBe('Dirección publicada');
});
it.each(['https://maps.app.goo.gl/ejemplo', 'https://goo.gl/maps/ejemplo', 'https://www.google.com/maps/place/Salon'])('conserva un enlace oficial al lugar: %s', url => {
  expect(enlaceComoLlegar('Dirección', url)).toBe(url);
});
it('convierte una URL de Embed en indicaciones sin transferir la clave de la web', () => {
  const url = enlaceComoLlegar('Dirección', 'https://www.google.com/maps/embed/v1/place?key=clave-ficticia&q=21.14%2C-98.42')!;
  expect(new URL(url).searchParams.get('destination')).toBe('21.14,-98.42');
  expect(url).not.toContain('clave-ficticia');
  expect(url).not.toContain('embed');
});
it.each(['https://google.com.ejemplo.invalid/maps', 'https://ejemplo.invalid/maps', 'https://www.google.com/url?q=externo',
  'javascript:alert(1)', 'file:///archivo', '<iframe src="https://www.google.com/maps"></iframe>', 'https://user:password@www.google.com/maps/'])('usa la dirección si la ubicación no es un enlace permitido: %s', ubicacion => {
  const resultado = enlaceComoLlegar('Dirección publicada', ubicacion)!;
  expect(new URL(resultado).searchParams.get('destination')).toBe('Dirección publicada');
  expect(esEnlaceGoogleMaps(ubicacion)).toBe(false);
});
it('acepta una referencia textual como en la web y no inventa una ubicación ausente', () => {
  expect(new URL(enlaceComoLlegar(null, 'Calle de prueba, Centro')!).searchParams.get('destination')).toBe('Calle de prueba, Centro');
  expect(enlaceComoLlegar(null, null)).toBeNull();
  expect(enlaceComoLlegar('', '<iframe>')).toBeNull();
  expect(enlaceComoLlegar('a'.repeat(3000), null)).toBeNull();
});
