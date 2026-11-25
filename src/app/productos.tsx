import { Redirect } from 'expo-router';

/** Conserva enlaces anteriores dentro del navegador principal. */
export default function ProductosRedirect() {
  return <Redirect href={{ pathname: '/(tabs)/tienda', params: { seccion: 'catalogo' } }} />;
}
