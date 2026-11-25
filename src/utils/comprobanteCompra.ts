import { CompraDetalle, etiquetasRecogida, fechaCompra } from '../models/Compra';
import { escaparHtml as esc } from './comprobanteCita';

export function htmlComprobanteCompra(compra: CompraDetalle): string {
  if (!compra.comprobanteDisponible || !compra.compraConfirmada || !compra.pagoAprobado || compra.paymentStatus !== 'approved' || !compra.paymentId || !compra.recogida.aprobadoEn || !compra.recogida.limiteEn) throw new Error('El comprobante requiere una compra con pago aprobado verificado.');
  const dinero = (importe: number) => `$${importe.toFixed(2)} MXN`;
  const filas = compra.items.map(i => `<tr><td>${esc(i.nombre)}</td><td>${i.cantidad}</td><td>${esc(dinero(i.precioUnitario))}</td><td>${esc(dinero(i.subtotal))}</td></tr>`).join('');
  const vigente = compra.recogida.estado === 'vigente';
  const instruccion = vigente ? 'Presenta este comprobante en el salón y recoge tus productos dentro del plazo indicado.'
    : 'PLAZO DE RECOGIDA VENCIDO. Este comprobante conserva la información de tu pago. Comunícate con el salón para coordinar la recogida; no vuelvas a pagar.';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Compra #${compra.id}</title><style>
  @page{size:letter;margin:18mm}body{font:12px Arial,sans-serif;color:#334155;line-height:1.6}header{background:#1e3a5a;color:white;padding:24px;border-bottom:5px solid #d4af37}h1{margin:0;font-size:25px}h2{font-size:16px;color:#1e3a5a;margin-top:24px}table{width:100%;border-collapse:collapse}th{background:#1e3a5a;color:white;text-align:left}th,td{border:1px solid #e2e8f0;padding:9px}tr{break-inside:avoid}.total{text-align:right;font-size:18px;font-weight:bold;color:#1e3a5a;margin:20px 0}.nota{border:1px solid #d4af37;padding:16px;background:#fffbeb}footer{margin-top:24px;font-size:10px;color:#64748b}</style></head>
  <body><header><h1>${esc(compra.negocio.nombre)}</h1><div>Comprobante de compra · Pedido #${compra.id}</div><b>PAGO APROBADO · ${esc(etiquetasRecogida[compra.recogida.estado].toUpperCase())}</b></header>
  <h2>Datos de la compra</h2><p><b>Cliente:</b> ${esc(compra.compradorNombre)}<br><b>Pago aprobado:</b> ${esc(fechaCompra(compra.recogida.aprobadoEn, compra.zonaHoraria))}<br><b>Referencia Mercado Pago:</b> ${esc(compra.paymentId)}<br><b>Folio:</b> ${compra.id}</p>
  <h2>Productos adquiridos</h2><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Importe</th></tr></thead><tbody>${filas}</tbody></table><div class="total">Total pagado: ${esc(dinero(compra.total))}</div>
  <div class="nota"><b>${esc(instruccion)}</b><p><b>Límite de recogida (24 horas):</b> ${esc(fechaCompra(compra.recogida.limiteEn, compra.zonaHoraria))}<br><b>Zona horaria:</b> ${esc(compra.zonaHoraria)}</p>
  </div>
  <h2>Recoge en el establecimiento</h2><p>${esc(compra.negocio.direccion || 'Consulta la ubicación del salón en LadyBarberApp.')}<br>${esc(compra.negocio.telefono || '')}</p>
  <footer>El plazo de recogida se calcula desde la aprobación del pago. Imprimir o descargar este comprobante otra vez no cambia la fecha límite.</footer></body></html>`;
}
