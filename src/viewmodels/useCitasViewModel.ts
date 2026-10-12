import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
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

export const useCitasViewModel = () => {
  const [activeStep, setActiveStep] = useState(0); // 0: Servicios, 1: Fecha/Barbero, 2: Resumen
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(true);
  const [isGuardando, setIsGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [serviciosApi, setServiciosApi] = useState<ServicioItem[]>([]);
  const [horariosNegocio, setHorariosNegocio] = useState<DiaHorario[]>([]);
  
  // Paso 1
  const [serviciosSel, setServiciosSel] = useState<string[]>([]);
  
  // Paso 2
  const [empleadasApi, setEmpleadasApi] = useState<Empleada[]>([]);
  const [empleadaId, setEmpleadaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState<string>(''); // YYYY-MM-DD
  const [horario, setHorario] = useState<string>(''); // HH:mm
  const [ocupacionApi, setOcupacionApi] = useState<Ocupacion[]>([]);
  const [cargandoEstilistas, setCargandoEstilistas] = useState(false);
  const [cargandoOcupacion, setCargandoOcupacion] = useState(false);

  // Paso 3
  const [citaCreadaId, setCitaCreadaId] = useState<string>('');
  const [citaCreadaTimestamp, setCitaCreadaTimestamp] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 min
  const [terminosAceptados, setTerminosAceptados] = useState(false);

  // Cargar catálogos
  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        setIsLoadingCatalogo(true);
        const [srvRes, horRes] = await Promise.all([
          CitasRepository.getServicios(),
          CitasRepository.getHorarioNegocio()
        ]);
        if (!cancel) {
          setServiciosApi(srvRes);
          setHorariosNegocio(horRes);
        }
      } catch (e: any) {
        if (!cancel) setErrorMsg('No se pudo cargar el catálogo.');
      } finally {
        if (!cancel) setIsLoadingCatalogo(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, []);

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
        const res = await CitasRepository.getOcupacion(fecha, empleadaId);
        if (!cancel) setOcupacionApi(res);
      } catch {
        if (!cancel) setOcupacionApi([]);
      } finally {
        if (!cancel) setCargandoOcupacion(false);
      }
    };
    loadOcupacion();
    return () => { cancel = true; };
  }, [fecha, empleadaId]);

  // Temporizador de apartado
  useEffect(() => {
    if (activeStep !== 2 || !citaCreadaTimestamp) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - citaCreadaTimestamp) / 1000);
      const remaining = 1800 - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        Alert.alert('Apartado Expirado', 'El tiempo límite ha expirado. Por favor reserva nuevamente.', [
          {
            text: 'OK', onPress: () => {
              setActiveStep(1);
              setHorario('');
              setCitaCreadaId('');
              setCitaCreadaTimestamp(null);
            }
          }
        ]);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeStep, citaCreadaTimestamp]);

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

    return slots.map(hStr => {
      const parts = hStr.split(':');
      const slotMin = Number(parts[0]) * 60 + Number(parts[1]);
      const slotEndMin = slotMin + durTotal;

      let estadoSlot = 'disponible';
      let citaIdConflicto = null;

      for (const cita of ocupacionApi) {
        const dInicio = new Date(cita.horaInicio);
        const dFin = new Date(cita.horaFin);
        const cStartMin = dInicio.getHours() * 60 + dInicio.getMinutes();
        const cEndMin = dFin.getHours() * 60 + dFin.getMinutes();

        if (slotMin < cEndMin && slotEndMin > cStartMin) {
          citaIdConflicto = cita.id;
          estadoSlot = cita.estado === 'APARTADA' ? 'apartado' : 'confirmado';
          break;
        }
      }
      return { hora: hStr, estado: estadoSlot, citaId: citaIdConflicto };
    });
  }, [fecha, horariosNegocio, ocupacionApi, duracionYPrecioTotal.duracion]);

  // Actions
  const toggleServicio = (id: string) => {
    setServiciosSel(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const nextStep1 = () => {
    if (serviciosSel.length === 0) {
      Alert.alert('Aviso', 'Selecciona al menos un servicio.');
      return;
    }
    setActiveStep(1);
  };

  const nextStep2 = async () => {
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
    if (activeStep === 2) {
      Alert.alert(
        '¿Volver al paso anterior?',
        'Si regresas, perderás tu apartado actual sobre este horario.',
        [
          { text: 'Mantener apartado', style: 'cancel' },
          {
            text: 'Sí, regresar',
            style: 'destructive',
            onPress: () => {
              if (citaCreadaId) CitasRepository.cancelarCita(citaCreadaId).catch(() => {});
              setCitaCreadaId('');
              setCitaCreadaTimestamp(null);
              setActiveStep(1);
            }
          }
        ]
      );
    } else {
      setActiveStep(prev => prev - 1);
    }
  };

  const handlePagarAnticipo = async () => {
    if (!terminosAceptados) {
      Alert.alert('Aviso', 'Debes aceptar las políticas para continuar.');
      return;
    }
    try {
      setIsGuardando(true);
      const res = await CitasRepository.crearPreferenciaPago(citaCreadaId);
      if (res.initPoint) {
        Linking.openURL(res.initPoint);
      }
    } catch (e: any) {
      Alert.alert('Error de pago', e.message || 'No se pudo generar el link de pago.');
    } finally {
      setIsGuardando(false);
    }
  };

  return {
    activeStep,
    isLoadingCatalogo,
    isGuardando,
    errorMsg,
    serviciosApi,
    serviciosSel,
    toggleServicio,
    empleadasApi,
    empleadaId,
    setEmpleadaId,
    fecha,
    setFecha,
    horario,
    setHorario,
    slotsConEstado,
    duracionYPrecioTotal,
    cargandoEstilistas,
    cargandoOcupacion,
    timeLeft,
    terminosAceptados,
    setTerminosAceptados,
    nextStep1,
    nextStep2,
    handleBack,
    handlePagarAnticipo
  };
};
