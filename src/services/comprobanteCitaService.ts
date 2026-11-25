import { CitaDetalle } from '../models/Cita';
import { htmlComprobanteCita } from '../utils/comprobanteCita';
import { guardarPdfHtml } from './guardarPdfService';
export type { ResultadoGuardarPdf } from './guardarPdfService';

export async function guardarComprobanteCita(cita: CitaDetalle) {
  const folio = cita.id.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64) || 'reserva';
  return guardarPdfHtml(htmlComprobanteCita(cita), `Comprobante_Cita_${folio}`);
}
