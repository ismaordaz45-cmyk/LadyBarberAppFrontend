import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';

/** Escribe primero un temporal para conservar el archivo anterior si falla la escritura. */
export async function guardarTextoPrivado(nombre: string, contenido: string): Promise<void> {
  if (Platform.OS === 'web') { window.localStorage.setItem(nombre, contenido); return; }
  const temporal = new File(Paths.document, `${nombre}.tmp`);
  temporal.create({ overwrite: true });
  temporal.write(contenido);
  await temporal.move(new File(Paths.document, nombre), { overwrite: true });
}
