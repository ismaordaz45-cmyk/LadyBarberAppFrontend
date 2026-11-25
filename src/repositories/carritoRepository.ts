import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { ArticuloCarrito, EstadoCarrito, normalizarCarrito, normalizarEstadoCarrito } from '../models/Carrito';
import { guardarTextoPrivado } from './archivoPrivado';

function clave(usuarioId: number): string {
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) throw new Error('Inicia sesión para usar tu carrito.');
  return `carrito-${usuarioId}.json`;
}

/** Solo identificadores y cantidades: los precios y existencias vienen del catálogo. */
export const CarritoRepository = {
  async leer(usuarioId: number): Promise<ArticuloCarrito[]> {
    return (await this.leerEstado(usuarioId)).items;
  },
  async leerEstado(usuarioId: number): Promise<EstadoCarrito> {
    const nombre = clave(usuarioId);
    let contenido: string | null = null;
    if (Platform.OS === 'web') contenido = window.localStorage.getItem(nombre);
    else {
      const file = new File(Paths.document, nombre);
      if (file.exists) contenido = await file.text();
    }
    if (!contenido) return { items: [], pedidosAplicados: [] };
    try { return normalizarEstadoCarrito(JSON.parse(contenido)); } catch { return { items: [], pedidosAplicados: [] }; }
  },
  async guardar(usuarioId: number, items: ArticuloCarrito[]): Promise<void> {
    const nombre = clave(usuarioId);
    const contenido = JSON.stringify(normalizarCarrito(items));
    if (Platform.OS === 'web') window.localStorage.setItem(nombre, contenido);
    else {
      const file = new File(Paths.document, nombre);
      file.create({ overwrite: true });
      file.write(contenido);
    }
  },
  async guardarEstado(usuarioId: number, estado: EstadoCarrito): Promise<void> {
    const nombre = clave(usuarioId);
    const contenido = JSON.stringify(normalizarEstadoCarrito(estado));
    await guardarTextoPrivado(nombre, contenido);
  },
};
