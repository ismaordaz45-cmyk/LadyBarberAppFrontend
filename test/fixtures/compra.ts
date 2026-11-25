import { CompraDetalle, CompraResumen } from '../../src/models/Compra';
export const compraPrueba: CompraDetalle = {
  id: 9, total: 60, moneda: 'MXN', fecha: '2026-11-18 12:00:00', estado: 'pagado',
  paymentId: '500001', paymentStatus: 'approved', pagoAprobado: true, compraConfirmada: true, requiereRevision: false, vencido: false,
  items: [{ insumoId: 1, nombre: 'Gel', imagen: 'https://example.test/gel.jpg', cantidad: 1, precioUnitario: 25, subtotal: 25 }, { insumoId: 2, nombre: 'Cera', imagen: null, cantidad: 1, precioUnitario: 35, subtotal: 35 }],
  compradorNombre: 'Cliente de prueba', negocio: { nombre: 'Salón de prueba', direccion: 'Dirección de prueba', telefono: '0000000000' },
  comprobanteDisponible: true, zonaHoraria: 'America/Mexico_City',
  recogida: { estado: 'vigente', aprobadoEn: '2026-11-18T12:00:00.000Z', limiteEn: '2026-11-19T12:00:00.000Z' },
};
export const resumenCompra = (id = 9): CompraResumen => ({ id, fecha: compraPrueba.fecha, aprobadoEn: compraPrueba.recogida.aprobadoEn, total: 60, moneda: 'MXN', paymentStatus: 'approved', estadoRecogida: 'vigente', totalProductos: 2, totalUnidades: 2, items: compraPrueba.items });
