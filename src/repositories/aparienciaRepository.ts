import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { esModoApariencia, ModoApariencia } from '../models/Apariencia';

const clave = 'ladybarber.apariencia';
export const AparienciaRepository = {
  async leer(): Promise<ModoApariencia> {
    let contenido: string | null = null;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') contenido = window.localStorage.getItem(clave);
    } else {
      const archivo = new File(Paths.document, 'apariencia.json');
      if (archivo.exists) contenido = await archivo.text();
    }
    if (!contenido) return 'system';
    try {
      const modo: unknown = JSON.parse(contenido);
      return esModoApariencia(modo) ? modo : 'system';
    } catch { return 'system'; }
  },
  async guardar(modo: ModoApariencia): Promise<void> {
    if (!esModoApariencia(modo)) throw new Error('Modo de apariencia inválido');
    const contenido = JSON.stringify(modo);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(clave, contenido);
    } else {
      const archivo = new File(Paths.document, 'apariencia.json');
      archivo.create({ overwrite: true });
      archivo.write(contenido);
    }
  },
};
