import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { estadoHorario } from '../utils/citasPresentation';
import { usePagoCitaViewModel } from './usePagoCitaViewModel';
import { useCatalogoReservaViewModel } from './useCatalogoReservaViewModel';
import { CitasRepository } from '../repositories/citasRepository';
import { ServicioItem } from '../models/Servicio';
import { DiaHorario, Empleada, Ocupacion } from '../models/Cita';

// Helpers para fechas y horas (mismos que en la web)
const DIA_SEMANA_POR_GET_DAY = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

function fechaYmdToDiaSemanaBackend(fechaYmd: string): string | null {
  const parts = String(fechaYmd).trim().split('-');
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return DIA_SEMANA_POR_GET_DAY[dt.getDay()] ?? null;
}

function tiempoAperturaCierreAMinutos(horaStr: string): number {
  const s = String(horaStr || '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return NaN;
  const hh = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return hh * 60 + mm;
}

function minutosAHHmmEnPunto(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  return `${String(h).padStart(2, '0')}:00`;
}

function construirSlotsCadaHora(horaApertura: string, horaCierre: string): string[] {
  const openMin = tiempoAperturaCierreAMinutos(horaApertura);
  const closeMin = tiempoAperturaCierreAMinutos(horaCierre);
  if (Number.isNaN(openMin) || Number.isNaN(closeMin) || closeMin < openMin) return [];
  
  let cur = openMin % 60 === 0 ? openMin : Math.ceil(openMin / 60) * 60;
  const slots: string[] = [];
  while (cur <= closeMin) {
    slots.push(minutosAHHmmEnPunto(cur));
    cur += 60;
  }
  return slots;
}

export function getMinFechaReserva(): string {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  let habiles = 0;
  const cursor = new Date(base);
  while (habiles < 2) {
    cursor.setDate(cursor.getDate() + 1);
    const wd = cursor.getDay();
    if (wd !== 0 && wd !== 6) habiles += 1;
  }
  const y = cursor.getFullYear();
  const m = String(cursor.getMonth() + 1).padStart(2, '0');
  const d = String(cursor.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const useCitasViewModel = (agendando = true) => {
  const [activeStep, setActiveStep] = useState(0); // 0: Servicios, 1: Fecha/Barbero, 2: Resumen
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(true);
  const [isGuardando, setIsGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [serviciosApi, setServiciosApi] = useState<ServicioItem[]>([]);
  const [horariosNegocio, setHorariosNegocio] = useState<DiaHorario[]>([]);
  
  // Paso 1
  const [serviciosSel, setServiciosSel] = useState<string[]>([]);
  const catalogoServicios = useCatalogoReservaViewModel(serviciosApi, serviciosSel);
  const [revisionCatalogo, setRevisionCatalogo] = useState(0);
  
  // Paso 2
  const [empleadasApi, setEmpleadasApi] = useState<Empleada[]>([]);
  const [empleadaId, setEmpleadaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState<string>(''); // YYYY-MM-DD
  const [horario, setHorario] = useState<string>(''); // HH:mm
  const [ocupacionApi, setOcupacionApi] = useState<Ocupacion[]>([]);
  const [cargandoEstilistas, setCargandoEstilistas] = useState(false);
  const [cargandoOcupacion, setCargandoOcupacion] = useState(false);
  const [errorOcupacion, setErrorOcupacion] = useState<string | null>(null);
  const [revisionOcupacion, setRevisionOcupacion] = useState(0);

  // Paso 3
  const [citaCreadaId, setCitaCreadaId] = useState<string>('');
  const [citaCreadaTimestamp, setCitaCreadaTimestamp] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 min
  const pago = usePagoCitaViewModel(citaCreadaId);

  useFocusEffect(useCallback(() => {
    if (activeStep !== 1 || !agendando) return;
    let active = true;
    const actualizar = () => setRevisionOcupacion(v => v + 1);
    void Promise.resolve().then(() => { if (active) actualizar(); });
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') actualizar(); });
    const timer = setInterval(actualizar, 30_000);
    return () => { active = false; subscription.remove(); clearInterval(timer); };
  }, [activeStep, agendando]));

  // Cargar catálogos
  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        setIsLoadingCatalogo(true);
        setErrorMsg(null);
        const [srvRes, horRes] = await Promise.all([
          CitasRepository.getServicios(),
          CitasRepository.getHorarioNegocio()
        ]);
        if (!cancel) {
          setServiciosApi(srvRes);
          setHorariosNegocio(horRes);
        }
      } catch {
        if (!cancel) setErrorMsg('No se pudo cargar el catálogo.');
      } finally {
        if (!cancel) setIsLoadingCatalogo(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, [revisionCatalogo]);

  // Cargar estilistas según servicios seleccionados
  useEffect(() => {
    let cancel = false;
    const loadEstilistas = async () => {
      if (serviciosSel.length === 0) {
        setEmpleadasApi([]);
        setEmpleadaId(null);
        return;
      }
      try {
        setCargandoEstilistas(true);
        const results = await Promise.all(
          serviciosSel.map(sid => CitasRepository.getEmpleadasPorServicio(Number(sid)))
        );
        if (cancel) return;

        let candidatas = results[0] || [];
        for (let i = 1; i < results.length; i++) {
          const ids = new Set(results[i].map(e => e.id));
          candidatas = candidatas.filter(e => ids.has(e.id));
        }

        setEmpleadasApi(candidatas);
        setEmpleadaId(prev => {
          if (!prev) return null;
          return candidatas.some(e => e.id === prev) ? prev : null;
        });
      } catch {
        if (!cancel) {
          setEmpleadasApi([]);
          setEmpleadaId(null);
        }
      } finally {
        if (!cancel) setCargandoEstilistas(false);
      }
    };
    loadEstilistas();
    return () => { cancel = true; };
  }, [serviciosSel]);

  // Cargar ocupación
  useEffect(() => {
    let cancel = false;
    const loadOcupacion = async () => {
      if (!fecha || !empleadaId) {
        setOcupacionApi([]);
        return;
      }
      try {
        setCargandoOcupacion(true);
        setErrorOcupacion(null);
        const res = await CitasRepository.getOcupacion(fecha, empleadaId);
        if (!cancel) setOcupacionApi(res);
      } catch {
        if (!cancel) { setOcupacionApi([]); setErrorOcupacion('No se pudo verificar la disponibilidad. Actualiza antes de reservar.'); }
      } finally {
        if (!cancel) setCargandoOcupacion(false);
      }
    };
    loadOcupacion();
    return () => { cancel = true; };
  }, [fecha, empleadaId, revisionOcupacion]);

  // Temporizador de apartado
  useEffect(() => {
    if (!agendando || activeStep !== 2 || !citaCreadaTimestamp || pago.pagoAprobado) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - citaCreadaTimestamp) / 1000);
      const remaining = 1800 - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        Alert.alert('Apartado Expirado', 'El plazo terminó. Si ya pagaste, consulta el estado antes de reservar nuevamente.', [
          { text: 'OK' }
        ]);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [agendando, activeStep, citaCreadaTimestamp, pago.pagoAprobado]);

  // Cálculos derivados
  const duracionYPrecioTotal = useMemo(() => {
    let duracion = 0;
    let precio = 0;
    serviciosSel.forEach(id => {
      const s = serviciosApi.find(srv => srv.id === id);
      if (s) {
        duracion += Number(s.duracionMin) || 0;
        precio += Number(s.precioMXN) || 0;
      }
    });
    return { duracion, precio };
  }, [serviciosSel, serviciosApi]);

  const slotsConEstado = useMemo(() => {
    if (!fecha || horariosNegocio.length === 0) return [];
    const clave = fechaYmdToDiaSemanaBackend(fecha);
    if (!clave) return [];
    const dia = horariosNegocio.find(d => d.diaSemana === clave);
    if (!dia || !dia.activo || !dia.horaApertura || !dia.horaCierre) return [];

    const slots = construirSlotsCadaHora(dia.horaApertura, dia.horaCierre);
    const durTotal = duracionYPrecioTotal.duracion;

    return slots.map(hora => ({ hora, estado: estadoHorario(hora, durTotal, dia.horaCierre!, ocupacionApi) }));
  }, [fecha, horariosNegocio, ocupacionApi, duracionYPrecioTotal.duracion]);

  // Actions
  const toggleServicio = useCallback((id: string) => {
    setServiciosSel(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }, []);

  const nextStep1 = () => {
    if (serviciosSel.length === 0) {
      Alert.alert('Aviso', 'Selecciona al menos un servicio.');
      return;
    }
    setActiveStep(1);
  };

  const nextStep2 = async () => {
    if (isGuardando || cargandoOcupacion || errorOcupacion) return;
    if (!fecha || !empleadaId || !horario) {
      Alert.alert('Datos incompletos', 'Selecciona fecha, estilista y un horario disponible.');
      return;
    }
    const slot = slotsConEstado.find(s => s.hora === horario);
    if (!slot || slot.estado !== 'disponible') {
      Alert.alert('Error', 'El horario elegido ya no está disponible.');
      return;
    }
    try {
      setIsGuardando(true);
      const res = await CitasRepository.crearCita({
        empleadaId,
        fecha,
        horaInicio: horario,
        servicios: serviciosSel.map(Number)
      });
      setCitaCreadaId(res.citaId);
      setCitaCreadaTimestamp(Date.now());
      setTimeLeft(1800);
      setActiveStep(2);
    } catch (e: any) {
      Alert.alert('Error al apartar', e.message || 'No se pudo apartar el horario.');
    } finally {
      setIsGuardando(false);
    }
  };

  const handleBack = () => {
    if (pago.pagoAprobado) return;
    if (activeStep === 1) setActiveStep(0);
  };

  const cancelarApartado = async () => {
    if (!citaCreadaId || pago.pagoAprobado) return;
    // Conservar el identificador y la pantalla si el servidor rechaza la cancelación.
    await CitasRepository.cancelarCita(citaCreadaId);
    setCitaCreadaId('');
    setCitaCreadaTimestamp(null);
    setActiveStep(0);
  };

  const handlePagarAnticipo = async () => {
    if (!citaCreadaId || isGuardando || pago.pagoAprobado || timeLeft <= 0) return;
    try {
      setIsGuardando(true);
      await pago.abrirCheckout();
    } catch (e: any) {
      Alert.alert('Error de pago', e.message || 'No se pudo generar el link de pago.');
    } finally {
      setIsGuardando(false);
    }
  };

  return {
    catalogoServicios,
    reintentarCatalogo: () => { setIsLoadingCatalogo(true); setErrorMsg(null); setRevisionCatalogo(v => v + 1); },
    citaCreadaId,
    nuevaCita: (servicioId?: string) => {
      setCitaCreadaId(''); setCitaCreadaTimestamp(null); setTimeLeft(1800);
      setServiciosSel(serviciosApi.some(s => s.id === servicioId && s.estaActivo) ? [servicioId!] : []);
      setEmpleadaId(null);
      setFecha(''); setHorario(''); setOcupacionApi([]); setActiveStep(0);
      catalogoServicios.reiniciar();
    },
    activeStep,
    isLoadingCatalogo,
    isGuardando,
    errorMsg,
    serviciosApi,
    serviciosSel,
    toggleServicio,
    empleadasApi,
    empleadaId,
    setEmpleadaId: (id: number) => { setEmpleadaId(id); setHorario(''); },
    fecha,
    setFecha: (value: string) => { setFecha(value); setHorario(''); },
    horario,
    setHorario,
    slotsConEstado,
    duracionYPrecioTotal,
    cargandoEstilistas,
    cargandoOcupacion,
    errorOcupacion,
    actualizarHorarios: () => setRevisionOcupacion(v => v + 1),
    timeLeft,
    nextStep1,
    nextStep2,
    handleBack,
    cancelarApartado,
    handlePagarAnticipo,
    estadoPago: pago.estadoPago,
    consultandoPago: pago.consultandoPago,
    errorPago: pago.errorPago,
    consultarPago: pago.consultarPago,
    pagoAprobado: pago.pagoAprobado,
  };
};
