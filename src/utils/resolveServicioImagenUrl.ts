/**
 * Resuelve la URL de imagen de un servicio/insumo al formato usable
 * en <Image source={{ uri: ... }} />.
 *
 * Lógica copiada del frontend web (resolveServicioImagenUrl.js).
 *
 * Casos posibles del campo imagenUrl que llega del backend:
 *  1. null / undefined / cadena vacía → null
 *  2. Ya es URL absoluta (http/https/blob/data:) → devuelve tal cual
 *  3. Ruta /uploads/... relativa al backend → prefija la URL base del backend
 *  4. Ruta /images/... estática del frontend web → devuelve tal cual (no aplica al móvil)
 *  5. Cadena base64 cruda (sin prefijo data:image) → convierte a data URL
 *  6. Nombre de archivo suelto → asume que vive bajo /uploads/
 */

/** Detecta si la cadena tiene pinta de base64 crudo (sin prefijo data:). */
function looksLikeRawBase64(s: string): boolean {
  if (s.length < 32) return false;
  return /^[A-Za-z0-9+/=_-]+$/.test(s);
}

/**
 * @param imagenUrl  Campo imagenUrl que viene de la BD/API.
 * @param apiBaseUrl URL base del backend, p.ej. "http://192.168.0.111:3000"
 *                   (SIN el /api al final).
 * @returns          Cadena usable como URI en React Native Image, o null si no hay imagen.
 */
export function resolveServicioImagenUrl(
  imagenUrl: string | null | undefined,
  apiBaseUrl: string
): string | null {
  if (imagenUrl == null) return null;
  const t = String(imagenUrl).trim();
  if (!t || t === 'null' || t === 'undefined' || t === '""' || t === "''") return null;

  // Ya es URL absoluta
  if (
    t.startsWith('data:') ||
    t.startsWith('http://') ||
    t.startsWith('https://') ||
    t.startsWith('blob:')
  ) {
    return t;
  }

  const base = apiBaseUrl.replace(/\/$/, '');

  const absolutizeUploads = (path: string): string => {
    const p = path.startsWith('/') ? path : `/${path.replace(/^\//, '')}`;
    if (base && p.startsWith('/uploads')) return `${base}${p}`;
    return p;
  };

  // Ruta estática de imágenes del frontend (no aplica al móvil, pero se respeta)
  if (t.startsWith('/images/')) return t;

  // Ruta relativa de /uploads servida por el backend
  if (t.startsWith('/uploads')) return absolutizeUploads(t);

  const clean = t.replace(/\r|\n|\s/g, '');

  // Base64 crudo: intentar construir data URL
  if (looksLikeRawBase64(clean)) {
    // Intentar detectar tipo: JPEG suele empezar con /9j/, PNG con iVBO
    let mimeType = 'image/jpeg';
    if (clean.startsWith('iVBO')) mimeType = 'image/png';
    else if (clean.startsWith('R0lG')) mimeType = 'image/gif';
    return `data:${mimeType};base64,${clean}`;
  }

  // Ruta con extensión reconocida de imagen: asumir que es un archivo de /uploads
  if (/\.(jpe?g|png|gif|webp|svg)(\?|#|$)/i.test(t)) {
    return absolutizeUploads(`/${t.replace(/^\//, '')}`);
  }

  // Fallback: intentar absolutizar como /uploads
  if (t.startsWith('/')) return absolutizeUploads(t);
  return absolutizeUploads(`/${t}`);
}
