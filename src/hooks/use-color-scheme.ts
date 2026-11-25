import { useAparienciaViewModel } from '../viewmodels/useAparienciaViewModel';
export function useColorScheme(): 'light' | 'dark' | 'unspecified' {
  return useAparienciaViewModel().esOscuro ? 'dark' : 'light';
}
