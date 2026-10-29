import { resolveServicioImagenUrl } from '../resolveServicioImagenUrl';

describe('Pruebas Unitarias: resolveServicioImagenUrl', () => {
  const API_URL = 'http://192.168.0.100:3000';

  it('debe retornar null cuando la imagen es null, undefined o cadena vacía', () => {
    expect(resolveServicioImagenUrl(null, API_URL)).toBeNull();
    expect(resolveServicioImagenUrl(undefined, API_URL)).toBeNull();
    expect(resolveServicioImagenUrl('', API_URL)).toBeNull();
    expect(resolveServicioImagenUrl('   ', API_URL)).toBeNull();
    expect(resolveServicioImagenUrl('null', API_URL)).toBeNull();
  });

  it('debe conservar intacta la URL si ya es absoluta (http / https / data:)', () => {
    const urlHttps = 'https://ejemplo.com/imagenes/corte.jpg';
    const urlHttp = 'http://ejemplo.com/imagenes/corte.jpg';
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE=';

    expect(resolveServicioImagenUrl(urlHttps, API_URL)).toBe(urlHttps);
    expect(resolveServicioImagenUrl(urlHttp, API_URL)).toBe(urlHttp);
    expect(resolveServicioImagenUrl(dataUrl, API_URL)).toBe(dataUrl);
  });

  it('debe anteponer apiBaseUrl si la ruta es relativa (/uploads/...)', () => {
    const rutaRelativa = '/uploads/servicios/corte-fade.jpg';
    const resultado = resolveServicioImagenUrl(rutaRelativa, API_URL);

    expect(resultado).toBe('http://192.168.0.100:3000/uploads/servicios/corte-fade.jpg');
  });

  it('debe formatear a data URL si se le proporciona una cadena base64 cruda detectando su tipo', () => {
    const rawPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const resultado = resolveServicioImagenUrl(rawPngBase64, API_URL);

    expect(resultado).toBe(`data:image/png;base64,${rawPngBase64}`);
  });

  it('debe resolver la ruta relativa con apiBaseUrl cuando se recibe una ruta /uploads/ o archivo suelto', () => {
    const rutaUploads = '/uploads/servicios/corte-moderno.png';
    const resultado = resolveServicioImagenUrl(rutaUploads, API_URL);

    expect(resultado).toBe('http://192.168.0.100:3000/uploads/servicios/corte-moderno.png');
  });
});
