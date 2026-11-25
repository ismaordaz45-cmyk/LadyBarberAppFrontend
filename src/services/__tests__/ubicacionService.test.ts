import { abrirIndicaciones } from '../ubicacionService';
import { openURL } from 'expo-linking';
jest.mock('expo-linking', () => ({ openURL: jest.fn() }));
beforeEach(() => jest.resetAllMocks());
it('abre el enlace HTTPS de indicaciones sin geolocalización ni SDK de mapas', async () => {
  (openURL as jest.Mock).mockResolvedValue(undefined);
  const url = 'https://www.google.com/maps/dir/?api=1&destination=21.14%2C-98.42';
  await abrirIndicaciones(url);
  expect(openURL).toHaveBeenCalledWith(url);
  expect(openURL).toHaveBeenCalledTimes(1);
});
it('no abre un enlace ajeno a Maps', async () => {
  await expect(abrirIndicaciones('https://ejemplo.invalid')).rejects.toThrow('no es válido');
  expect(openURL).not.toHaveBeenCalled();
});
it('informa si no se pudo abrir Maps o el navegador', async () => {
  (openURL as jest.Mock).mockRejectedValueOnce(new Error('No handler'));
  await expect(abrirIndicaciones('https://maps.app.goo.gl/prueba')).rejects.toThrow('No pudimos abrir el mapa');
});
