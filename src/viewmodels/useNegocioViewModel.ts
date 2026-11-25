import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { NegocioPublico, NegocioRepository } from '../repositories/negocioRepository';

export function useNegocioViewModel() {
  const [negocio, setNegocio] = useState<NegocioPublico | null>(null);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    let activo = true;
    void NegocioRepository.obtener().then(value => { if (activo) { setNegocio(value); setError(null); } })
      .catch(() => { if (activo) setError('Información del salón no disponible.'); });
    return () => { activo = false; };
  }, []));
  return { negocio, error };
}
