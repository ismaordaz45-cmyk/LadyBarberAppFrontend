import { CompraDetalle } from '../models/Compra';
import { htmlComprobanteCompra } from '../utils/comprobanteCompra';
import { guardarPdfHtml } from './guardarPdfService';
export function guardarComprobanteCompra(compra: CompraDetalle, continua?: () => boolean) {
  return guardarPdfHtml(htmlComprobanteCompra(compra), `Comprobante_Compra_${compra.id}`, continua);
}
