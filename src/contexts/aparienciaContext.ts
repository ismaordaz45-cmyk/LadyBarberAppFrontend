import { createContext } from 'react';
import { paletas, RolColor } from '../constants/apariencia';
import { ModoApariencia } from '../models/Apariencia';

export type AparienciaContexto = {
  modo: ModoApariencia; esOscuro: boolean; lista: boolean; error: string | null;
  colors: typeof paletas.light;
  seleccionar: (modo: ModoApariencia) => Promise<void>;
  color: <T>(value: T, rol?: RolColor) => T;
};
export const AparienciaContext = createContext<AparienciaContexto>({
  modo: 'light', esOscuro: false, lista: true, error: null, colors: paletas.light,
  seleccionar: async () => {}, color: value => value,
});
