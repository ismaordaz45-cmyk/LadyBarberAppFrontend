import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { CitaResumen } from '../models/Cita';
import { CitasRepository } from '../repositories/citasRepository';
import { sessionStore } from '../services/sessionStore';
import { CITAS_POR_VISTA, filtrarOrdenarCitas, filtrosCitas, ordenesCitas, FiltroCitas, OrdenCitas, VistaCitas } from '../utils/listadoCitas';

export function useMisCitasViewModel(vista: VistaCitas = 'proximas', filtroInicial: FiltroCitas = 'todas') {
  const [citas, setCitas] = useState<CitaResumen[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroCitas>(filtroInicial);
  const [orden, setOrden] = useState<OrdenCitas>(vista === 'proximas' ? 'fechaAsc' : 'fechaDesc');
  const [limite, setLimite] = useState(CITAS_POR_VISTA);
  const [vistaPreviaId, setVistaPreviaId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const generation = useRef(0);
  const busy = useRef(false);
  const owner = useRef<string | null>(null);
  const cargar = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const current = generation.current;
    const token = sessionStore.token;
    const cambioSesion = owner.current !== token;
    if (cambioSesion) { setCitas([]); setVistaPreviaId(null); owner.current = token; }
    setLoading(true);
    setError(null);
    try {
      // Leer las páginas del contrato existente permite ordenar y filtrar sobre
      // todas las reservas, no solamente sobre las primeras 40 del servidor.
      const reservas = new Map<string, CitaResumen>();
      let offset = 0;
      while (true) {
        const pagina = await CitasRepository.getMisCitas(offset);
        if (current !== generation.current || token !== sessionStore.token) return;
        const anteriores = reservas.size;
        pagina.forEach(c => reservas.set(c.id, c));
        if (pagina.length < 40) break;
        if (reservas.size === anteriores) throw new Error('No se pudo completar la consulta de citas. Intenta actualizar.');
        offset += pagina.length;
      }
      setCitas([...reservas.values()]);
      setLimite(CITAS_POR_VISTA);
      setNow(Date.now());
    } catch (e) {
      if (current === generation.current && token === sessionStore.token) setError(e instanceof Error ? e.message : 'No se pudieron cargar tus citas.');
    } finally {
      if (current === generation.current) { setLoading(false); busy.current = false; }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) void cargar(); });
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void cargar();
    });
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      active = false; generation.current += 1; busy.current = false;
      subscription.remove(); clearInterval(timer);
    };
  }, [cargar]));

  const filtradas = filtrarOrdenarCitas(citas, vista, filtro, orden, now);
  return { citas, proximas: filtrarOrdenarCitas(citas, 'proximas', 'todas', 'fechaAsc', now),
    vistaPreviaId, abrirVistaPrevia: (citaId: string) => setVistaPreviaId(citaId), cerrarVistaPrevia: () => setVistaPreviaId(null),
    historial: filtrarOrdenarCitas(citas, 'historial', 'todas', 'fechaDesc', now), isLoading, error,
    resultados: filtradas.slice(0, limite), totalFiltradas: filtradas.length,
    hayMas: limite < filtradas.length, puedeVerMenos: limite > CITAS_POR_VISTA,
    filtro, orden, filtros: filtrosCitas(vista), ordenes: ordenesCitas(vista),
    cambiarFiltro: (value: FiltroCitas) => { setFiltro(value); setLimite(CITAS_POR_VISTA); },
    cambiarOrden: (value: OrdenCitas) => { setOrden(value); setLimite(CITAS_POR_VISTA); },
    verMenos: () => setLimite(CITAS_POR_VISTA), actualizar: () => cargar(),
    cargarMas: async () => setLimite(value => Math.min(value + CITAS_POR_VISTA, filtradas.length)) };
}
