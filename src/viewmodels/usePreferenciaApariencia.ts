import { useCallback, useEffect, useRef, useState } from 'react';
import { AparienciaRepository } from '../repositories/aparienciaRepository';
import { ModoApariencia } from '../models/Apariencia';

export function usePreferenciaApariencia() {
  const [modo, setModo] = useState<ModoApariencia>('system');
  const [lista, setLista] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revision = useRef(0);
  const escritura = useRef<Promise<void>>(Promise.resolve());
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    const actual = revision.current;
    void AparienciaRepository.leer().then(valor => {
      if (montado.current && actual === revision.current) setModo(valor);
    }).catch(() => {
      if (montado.current && actual === revision.current) setError('No se pudo recuperar tu apariencia. Se usará la del dispositivo.');
    }).finally(() => { if (montado.current) setLista(true); });
    return () => { montado.current = false; };
  }, []);
  const seleccionar = useCallback(async (valor: ModoApariencia) => {
    const actual = ++revision.current;
    setModo(valor); setError(null);
    // Serializar evita que una escritura antigua reemplace la última elección.
    const tarea = escritura.current.catch(() => {}).then(() => AparienciaRepository.guardar(valor));
    escritura.current = tarea;
    try { await tarea; }
    catch {
      if (montado.current && actual === revision.current) setError('El tema se aplicó, pero no pudo guardarse. Vuelve a elegirlo para reintentar.');
    }
  }, []);
  return { modo, lista, error, seleccionar };
}
