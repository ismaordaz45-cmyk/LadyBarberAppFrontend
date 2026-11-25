import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { guardarTextoPrivado } from './archivoPrivado';

const nombre = (usuario: number) => {
  if (!Number.isSafeInteger(usuario) || usuario <= 0) throw new Error('Inicia sesión para continuar tu pedido.');
  return `pedido-activo-${usuario}.json`;
};
export const PedidoActivoRepository = {
  async leer(usuario: number): Promise<number | null> {
    const key = nombre(usuario);
    let contenido;
    if (Platform.OS === 'web') contenido = window.localStorage.getItem(key);
    else { const file = new File(Paths.document, key); contenido = file.exists ? await file.text() : null; }
    if (!contenido) return null;
    try {
      const id: unknown = JSON.parse(contenido);
      if (id === null) return null;
      if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) throw new Error('Identificador inválido');
      return id;
    }
    catch { throw new Error('No se pudo recuperar el pedido guardado. No inicies otro pago hasta revisar tus compras con el salón.'); }
  },
  async guardar(usuario: number, id: number | null): Promise<void> {
    if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) throw new Error('Pedido inválido.');
    const key = nombre(usuario), contenido = JSON.stringify(id);
    await guardarTextoPrivado(key, contenido);
  },
};
