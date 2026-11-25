import { htmlComprobanteCita } from '../comprobanteCita';
import { CitaDetalle } from '../../models/Cita';

const cita: CitaDetalle = { id: 'folio-prueba', fecha: '2026-11-18', horaInicio: '2026-11-18T09:00:00', horaFin: '2026-11-18T10:00:00',
  estado: 'CONFIRMADA', precioFinal: '120.00', clienteNombre: '<script>alert(1)</script>', empleadaNombre: 'Estilista & socia',
  paymentStatus: 'approved', paymentId: 'payment-test', fechaAprobacion: null, moneda: 'MXN', comprobanteDisponible: true,
  anticipoPagado: 60, saldoPendiente: 60, servicios: [{ id: 1, nombre: 'Corte', precio: 120, duracionMinutos: 60 }] };

describe('Comprobante de anticipo', () => {
  it('incluye importes verificados, folio, servicios y horario y escapa contenido del servidor', () => {
    const html = htmlComprobanteCita(cita);
    expect(html).toContain('folio-prueba');
    expect(html).toContain('$60.00 MXN');
    expect(html).toContain('09:00 a 10:00');
    expect(html).toContain('Corte');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Estilista &amp; socia');
  });
  it('no emite un comprobante solo por tener una cita confirmada', () => {
    expect(() => htmlComprobanteCita({ ...cita, paymentStatus: 'pending' })).toThrow(/verificado/);
    expect(() => htmlComprobanteCita({ ...cita, comprobanteDisponible: false })).toThrow(/verificado/);
    expect(() => htmlComprobanteCita({ ...cita, anticipoPagado: null })).toThrow(/verificado/);
  });
});
