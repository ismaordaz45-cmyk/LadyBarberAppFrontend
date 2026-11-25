import * as Linking from 'expo-linking';
import { esEnlaceGoogleMaps } from '../utils/ubicacion';

export async function abrirIndicaciones(url: string): Promise<void> {
  if (!esEnlaceGoogleMaps(url)) throw new Error('El enlace de ubicación no es válido.');
  try { await Linking.openURL(url); }
  catch { throw new Error('No pudimos abrir el mapa. Intenta de nuevo o consulta la dirección mostrada.'); }
}
