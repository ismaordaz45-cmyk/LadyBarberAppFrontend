const texto = (value: unknown) => typeof value === 'string' ? value.trim() : '';

/** Solo enlaces públicos de Maps; no esquemas de otras apps ni redirecciones genéricas. */
export function esEnlaceGoogleMaps(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || value.length > 2048) return false;
    const host = url.hostname.toLowerCase();
    if (host === 'maps.app.goo.gl') return url.pathname.length > 1;
    if (host === 'goo.gl') return url.pathname.startsWith('/maps/');
    if (host === 'maps.google.com') return url.pathname === '/' || url.pathname.startsWith('/maps');
    return ['google.com', 'www.google.com', 'google.com.mx', 'www.google.com.mx'].includes(host)
      && (url.pathname === '/maps' || url.pathname.startsWith('/maps/'));
  } catch { return false; }
}

function ruta(destino: string): string | null {
  if (!destino) return null;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`;
  return url.length <= 2048 ? url : null;
}

export function enlaceComoLlegar(direccion: unknown, ubicacion: unknown): string | null {
  const domicilio = texto(direccion);
  const lugar = texto(ubicacion);
  if (!lugar) return ruta(domicilio);
  const coordenadas = lugar.match(/^([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)$/);
  if (coordenadas) {
    const lat = Number(coordenadas[1]), lng = Number(coordenadas[2]);
    return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? ruta(`${lat},${lng}`) : ruta(domicilio);
  }
  if (esEnlaceGoogleMaps(lugar)) {
    const url = new URL(lugar);
    const consulta = url.searchParams.get('destination') || url.searchParams.get('query') || url.searchParams.get('q');
    if (consulta) return ruta(consulta);
    // No propagar URLs de Embed/API ni claves de la integración web.
    if (url.pathname.includes('/embed') || url.searchParams.has('key')) return ruta(domicilio);
    return url.toString();
  }
  // Una referencia textual admite el mismo uso que en la web; una URL inválida,
  // HTML o un esquema ajeno no se utiliza como destino ni se abre directamente.
  if (/^[a-z][a-z0-9+.-]*:/i.test(lugar) || /[<>]/.test(lugar)) return ruta(domicilio);
  return ruta(lugar);
}
