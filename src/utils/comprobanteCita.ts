import { CitaDetalle } from '../models/Cita';
import { dinero, fechaCita, horaCita } from './citasPresentation';

export const escaparHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function htmlComprobanteCita(cita: CitaDetalle) {
  if (!cita.comprobanteDisponible || cita.paymentStatus !== 'approved' || !cita.paymentId
    || cita.anticipoPagado === null || cita.saldoPendiente === null) {
    throw new Error('El comprobante requiere un pago aprobado verificado.');
  }
  const esc = escaparHtml;
  const filas = cita.servicios.map(s => `<tr><td>${esc(s.nombre)}</td><td>${esc(s.duracionMinutos)} min</td><td>${esc(dinero(s.precio))}</td></tr>`).join('');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Comprobante de cita</title>
  <style>@page{size:letter;margin:18mm}body{font:12px Arial,sans-serif;color:#334155;line-height:1.6}
  header{background:#1E3A5A;color:white;padding:24px;border-bottom:5px solid #D4AF37}h1{margin:0;font-size:25px}
  h2{color:#1E3A5A;font-size:15px;margin-top:24px}.badge{color:#F6DC80;font-weight:bold}
  table{width:100%;border-collapse:collapse}th{background:#1E3A5A;color:white;text-align:left}td,th{padding:9px;border:1px solid #E5E7EB}
  tr{break-inside:avoid}.totales{margin:24px 0 24px auto;width:65%;padding:12px;background:#F8FAFC}
  .nota{padding:14px;border:1px solid #D4AF37;background:#FFFCF0}footer{margin-top:25px;font-size:10px;color:#64748B}
  </style></head><body><header><h1>SALÓN LADY BARBER</h1><div>Comprobante de anticipo de reservación</div><div class="badge">ANTICIPO PAGADO</div></header>
  <h2>DATOS DE LA RESERVACIÓN</h2><p><b>Folio:</b> ${esc(cita.id)}<br><b>Cliente:</b> ${esc(cita.clienteNombre)}<br>
  <b>Especialista:</b> ${esc(cita.empleadaNombre)}<br><b>Fecha:</b> ${esc(fechaCita(cita.fecha))}<br>
  <b>Horario:</b> ${esc(horaCita(cita.horaInicio))} a ${esc(horaCita(cita.horaFin))}<br><b>Estado de la cita:</b> ${esc(cita.estado)}<br>
  <b>Referencia de pago:</b> ${esc(cita.paymentId)}</p>
  <h2>SERVICIOS RESERVADOS</h2><table><thead><tr><th>Servicio</th><th>Duración</th><th>Importe</th></tr></thead><tbody>${filas}</tbody></table>
  <div class="totales">Total de servicios: <b>${esc(dinero(cita.precioFinal))}</b><br>
  Anticipo pagado: <b>${esc(dinero(cita.anticipoPagado))}</b><br>Saldo según anticipo registrado: <b>${esc(dinero(cita.saldoPendiente))}</b></div>
  <div class="nota">Presenta este comprobante digital el día de tu cita. Se recomienda llegar 20 minutos antes.
  Consulta las políticas de cancelación aceptadas al reservar. Por seguridad, no compartas tu folio públicamente.</div>
  <footer>Salón Lady Barber · Comprobante de reserva y anticipo. Consulta en el salón cualquier liquidación posterior. No es una factura fiscal ni acredita la liquidación total del servicio.</footer></body></html>`;
}
