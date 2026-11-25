import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { Directory, File } from 'expo-file-system';

export type ResultadoGuardarPdf = { cancelado: true } | { cancelado: false; nombre: string; carpeta: string; uri: string };
export async function guardarPdfHtml(html: string, prefijo: string, continua = () => true): Promise<ResultadoGuardarPdf> {
  const comprobar = () => { if (!continua()) throw new Error('La solicitud o sesión cambió. Abre nuevamente el comprobante.'); };
  comprobar();
  if (Platform.OS === 'web') throw new Error('Abre la app en tu teléfono para guardar el PDF.');
  let carpeta: Directory;
  try { carpeta = await Directory.pickDirectoryAsync(); }
  catch (cause) {
    const code = typeof cause === 'object' && cause !== null && 'code' in cause ? String(cause.code) : '';
    if (['ERR_PICKER_CANCELLED','ERR_FILE_PICKING_CANCELLED'].includes(code)) return { cancelado: true };
    throw new Error('No se pudo acceder a la carpeta. Elige una carpeta donde puedas guardar archivos.', { cause });
  }
  let archivo: File | undefined, creado = false;
  try {
    comprobar();
    const { base64 } = await Print.printToFileAsync({ html, width: 612, height: 792, base64: true });
    comprobar();
    if (!base64) throw new Error('El generador no devolvió el contenido del PDF.');
    const nombre = `${prefijo.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100)}_${Date.now()}.pdf`;
    if (Platform.OS === 'android') archivo = carpeta.createFile(nombre, 'application/pdf');
    else { archivo = new File(carpeta, nombre); archivo.create(); }
    creado = true;
    archivo.write(base64, { encoding: 'base64' });
    if (!archivo.exists || archivo.size <= 0) throw new Error('El PDF no se guardó correctamente.');
    return { cancelado: false, nombre: archivo.name || nombre, carpeta: carpeta.name || 'la carpeta seleccionada', uri: archivo.uri };
  } catch (cause) {
    try { if (creado && archivo?.exists) archivo.delete(); } catch { /* Conservar el error original. */ }
    throw new Error('No se pudo guardar el PDF. Comprueba el espacio disponible o elige otra carpeta.', { cause });
  }
}
