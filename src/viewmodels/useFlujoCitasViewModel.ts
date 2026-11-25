import { useCallback, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { FiltroCitas } from '../utils/listadoCitas';

type Reserva = {
  citaCreadaId: string;
  pagoAprobado: boolean;
  isGuardando: boolean;
  nuevaCita: (servicioId?: string) => void;
  cancelarApartado: () => Promise<void>;
};

export function useFlujoCitasViewModel() {
  const navigation = useNavigation();
  const [vista, setVista] = useState<'reservas' | 'agendar'>('reservas');
  const [filtroInicial, setFiltroInicial] = useState<FiltroCitas>('todas');
  const [mostrarSalida, setMostrarSalida] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [errorSalida, setErrorSalida] = useState<string | null>(null);
  const lock = useRef(false);

  const verReservas = useCallback((filtro: FiltroCitas = 'todas') => {
    setFiltroInicial(filtro); setMostrarSalida(false); setErrorSalida(null); setVista('reservas');
  }, []);

  // Las pestañas se mantienen montadas: al salir, descartar solamente la vista
  // del asistente. Una reserva persistida se recupera desde el listado del API.
  useFocusEffect(useCallback(() => {
    const unsubscribe = navigation.addListener('blur', () => verReservas());
    return unsubscribe;
  }, [navigation, verReservas]));

  const solicitarSalida = (reserva: Reserva) => {
    if (reserva.isGuardando || lock.current) return;
    if (reserva.citaCreadaId && !reserva.pagoAprobado) {
      setErrorSalida(null); setMostrarSalida(true);
    } else verReservas();
  };

  return { vista, filtroInicial, mostrarSalida, cancelando, errorSalida, verReservas,
    agendar: (reserva: Reserva, servicioId?: string) => {
      if (reserva.isGuardando || lock.current) return;
      reserva.nuevaCita(servicioId); setVista('agendar');
    },
    solicitarSalida,
    conservar: () => { if (!lock.current) verReservas('pendientes'); },
    seguirPagando: () => { if (!lock.current) { setMostrarSalida(false); setErrorSalida(null); } },
    cancelar: async (reserva: Reserva) => {
      if (lock.current || reserva.isGuardando) return;
      lock.current = true; setCancelando(true); setErrorSalida(null);
      try { await reserva.cancelarApartado(); verReservas(); }
      catch (e) { setErrorSalida(e instanceof Error ? e.message : 'No se pudo cancelar. Tu apartado se conserva; vuelve a intentarlo.'); }
      finally { lock.current = false; setCancelando(false); }
    },
  };
}

export function useAtrasCitas(agendando: boolean, salir: () => void) {
  useFocusEffect(useCallback(() => {
    if (!agendando) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { salir(); return true; });
    return () => subscription.remove();
  }, [agendando, salir]));
}
