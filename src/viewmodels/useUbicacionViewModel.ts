import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { NegocioPublico, NegocioRepository } from '../repositories/negocioRepository';
import { abrirIndicaciones } from '../services/ubicacionService';
import { enlaceComoLlegar } from '../utils/ubicacion';

export function useUbicacionViewModel() {
  const [visible, setVisible] = useState(false);
  const [negocio, setNegocio] = useState<NegocioPublico | null>(null);
  const [cargando, setCargando] = useState(false);
  const [abriendo, setAbriendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generacion = useRef(0);
  const cargaEnCurso = useRef(false);
  const aperturaEnCurso = useRef(false);
  const cerrar = useCallback(() => {
    generacion.current += 1; cargaEnCurso.current = false;
    setVisible(false); setCargando(false); setAbriendo(false); setError(null);
  }, []);
  useFocusEffect(useCallback(() => () => cerrar(), [cerrar]));
  const cargar = useCallback(async () => {
    if (cargaEnCurso.current) return;
    cargaEnCurso.current = true;
    const actual = ++generacion.current;
    setCargando(true); setError(null); setNegocio(null);
    try {
      const resultado = await NegocioRepository.obtener({ actualizar: true });
      if (actual === generacion.current) setNegocio(resultado);
    } catch {
      if (actual === generacion.current) setError('No pudimos consultar la ubicación del establecimiento. Intenta de nuevo.');
    } finally {
      if (actual === generacion.current) { cargaEnCurso.current = false; setCargando(false); }
    }
  }, []);
  const url = negocio ? enlaceComoLlegar(negocio.direccion, negocio.ubicacion) : null;
  const direccion = typeof negocio?.direccion === 'string' ? negocio.direccion.trim() : '';
  return { visible, negocio, direccion, cargando, abriendo, error, puedeAbrir: Boolean(url) && !cargando,
    abrir: () => { setVisible(true); void cargar(); }, cerrar, reintentar: cargar,
    comoLlegar: async () => {
      if (!url || cargando || cargaEnCurso.current || aperturaEnCurso.current) return;
      aperturaEnCurso.current = true; setAbriendo(true); setError(null);
      const actual = generacion.current;
      try { await abrirIndicaciones(url); }
      catch (e) { if (actual === generacion.current) setError(e instanceof Error ? e.message : 'No pudimos abrir el mapa.'); }
      finally { aperturaEnCurso.current = false; if (actual === generacion.current) setAbriendo(false); }
    },
  };
}
