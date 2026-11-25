import { htmlComprobanteCompra } from '../comprobanteCompra';
import { compraPrueba } from '../../../test/fixtures/compra';

it('incluye compra, cantidades, importes persistidos, fecha y plazo de 24 horas sin cargar imágenes externas', () => {
  const html = htmlComprobanteCompra(compraPrueba);
  expect(html).toContain('Pedido #9'); expect(html).toContain('Gel'); expect(html).toContain('$60.00 MXN');
  expect(html).toContain('24 horas'); expect(html).not.toContain('C?digo para validar'); expect(html).toContain('America/Mexico_City');
  expect(html).not.toContain('<img'); expect(html).toContain('recoge tus productos dentro del plazo indicado');
});
it('un comprobante vencido conserva el pago y no promete entrega ?nica ni renueva el plazo', () => {
  const vencida = htmlComprobanteCompra({ ...compraPrueba, recogida: { ...compraPrueba.recogida, estado: 'vencida' } });
  expect(vencida).toContain('PLAZO DE RECOGIDA VENCIDO');
  expect(vencida).not.toContain('segunda recogida');
  expect(vencida).not.toContain('C?digo');
});
it('escapa textos del servidor y bloquea comprobantes sin pago aprobado o sin fecha verificable', () => {
  const html = htmlComprobanteCompra({ ...compraPrueba, compradorNombre: '<script>alert(1)</script>' });
  expect(html).toContain('&lt;script&gt;'); expect(html).not.toContain('<script>');
  expect(() => htmlComprobanteCompra({ ...compraPrueba, pagoAprobado: false })).toThrow(/verificado/);
  expect(() => htmlComprobanteCompra({ ...compraPrueba, comprobanteDisponible: false })).toThrow(/verificado/);
  expect(() => htmlComprobanteCompra({ ...compraPrueba, recogida: { ...compraPrueba.recogida, aprobadoEn: null } })).toThrow(/verificado/);
});
