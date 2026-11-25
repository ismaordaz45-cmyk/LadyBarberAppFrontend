import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../../components/compartidos/TextoApp';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCitasViewModel, getMinFechaReserva } from '../../viewmodels/useCitasViewModel';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ListaCitas } from '../../components/citas/ListaCitas';
import { CatalogoServiciosReserva } from '../../components/servicios/CatalogoServiciosReserva';
import { useMisCitasViewModel } from '../../viewmodels/useMisCitasViewModel';
import { dinero, fechaCita, HORARIOS } from '../../utils/citasPresentation';
import { useAtrasCitas, useFlujoCitasViewModel } from '../../viewmodels/useFlujoCitasViewModel';
import { SalidaApartadoModal } from '../../components/citas/SalidaApartadoModal';
import { FiltroCitas } from '../../utils/listadoCitas';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EncabezadoModulo } from '../../components/compartidos/EncabezadoModulo';

const COLORS = {
  navy: '#1E3A5A',
  gold: '#D4AF37',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
  muted: '#64748B',
  blue: '#2563EB',
  bg: '#F8FAFC',
  success: '#10B981',
  error: '#EF4444'
};

export default function CitasScreen() {
  const apariencia = useAparienciaViewModel();
  const styles = useThemedStyles(baseStyles);
  const router = useRouter();
  const flujo = useFlujoCitasViewModel();
  const { vista, verReservas } = flujo;
  const reserva = useCitasViewModel(vista === 'agendar');
  const params = useLocalSearchParams<{ vista?: string; servicioId?: string }>();
  const entradaProcesada = useRef(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    if (params.vista !== 'agendar') entradaProcesada.current = false;
    if (params.vista === 'reservas') void Promise.resolve().then(() => {
      if (active) { verReservas(); router.setParams({ vista: undefined }); }
    });
    if (params.vista === 'agendar' && !reserva.isLoadingCatalogo && !reserva.isGuardando) void Promise.resolve().then(() => {
      if (active && !entradaProcesada.current) {
        entradaProcesada.current = true;
        flujo.agendar(reserva, typeof params.servicioId === 'string' ? params.servicioId : undefined);
        router.setParams({ vista: undefined, servicioId: undefined });
      }
    });
    return () => { active = false; };
  }, [params.vista, params.servicioId, router, verReservas, reserva, flujo]));
  const {
    citaCreadaId, nuevaCita, errorOcupacion, actualizarHorarios, catalogoServicios, reintentarCatalogo,
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
    nextStep1,
    nextStep2,
    handleBack,
    handlePagarAnticipo,
    estadoPago,
    consultandoPago,
    errorPago,
    consultarPago,
    pagoAprobado,
  } = reserva;
  const salir = () => flujo.solicitarSalida(reserva);
  useAtrasCitas(vista === 'agendar', salir);

  if (vista === 'reservas') return <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}><MisReservas filtroInicial={flujo.filtroInicial}
    onAgendar={() => flujo.agendar(reserva)} /></SafeAreaView>;

  // Helper arrays for dates
  const generateDates = () => {
    const dates = [];
    const minDateStr = getMinFechaReserva();
    const current = new Date(`${minDateStr}T12:00:00`);
    for (let i = 0; i < 14; i++) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${d}`;
      const dayName = current.toLocaleDateString('es-MX', { weekday: 'short' }).toUpperCase();
      const dayNum = current.getDate();
      dates.push({ iso, dayName, dayNum });
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  };

  const renderStep1 = () => (
    <CatalogoServiciosReserva catalogo={catalogoServicios} isLoading={isLoadingCatalogo} error={errorMsg}
      onReintentar={reintentarCatalogo} onSeleccionar={toggleServicio} onContinuar={nextStep1} total={duracionYPrecioTotal} />
  );

  const renderStep2 = () => {
    const dates = generateDates();
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Feather name="arrow-left" size={20} color={apariencia.color(COLORS.navy)} />
          <Text style={styles.backText}>Volver a servicios</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>1. Elige a tu especialista</Text>
        {cargandoEstilistas ? (
          <ActivityIndicator color={apariencia.color(COLORS.navy)} style={{ marginVertical: 20 }} />
        ) : empleadasApi.length === 0 ? (
          <Text style={styles.emptyText}>No hay estilistas disponibles para la combinación de servicios seleccionada.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {empleadasApi.map(emp => {
              const isSelected = empleadaId === emp.id;
              return (
                <TouchableOpacity 
                  key={emp.id} 
                  style={[styles.empCard, isSelected && styles.empCardSelected]}
                  onPress={() => setEmpleadaId(emp.id)}
                >
                  <View style={styles.empAvatar}>
                    <Ionicons name="person" size={24} color={apariencia.color(isSelected ? COLORS.navy : COLORS.muted)} />
                  </View>
                  <Text style={[styles.empName, isSelected && styles.empNameSelected]}>{emp.nombre}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>2. Selecciona una fecha</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {dates.map(d => {
            const isSelected = fecha === d.iso;
            return (
              <TouchableOpacity
                key={d.iso}
                style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                onPress={() => setFecha(d.iso)}
              >
                <Text style={[styles.dateName, isSelected && styles.dateTextSelected]}>{d.dayName}</Text>
                <Text style={[styles.dateNum, isSelected && styles.dateTextSelected]}>{d.dayNum}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>3. Elige el horario</Text>
        {cargandoOcupacion ? (
          <ActivityIndicator color={apariencia.color(COLORS.navy)} style={{ marginVertical: 20 }} />
        ) : errorOcupacion ? (
          <View><Text style={{ color: apariencia.color(COLORS.error) }}>{errorOcupacion}</Text><TouchableOpacity onPress={actualizarHorarios}><Text style={styles.backText}>Reintentar disponibilidad</Text></TouchableOpacity></View>
        ) : !fecha || !empleadaId ? (
          <Text style={styles.emptyText}>Selecciona estilista y fecha primero.</Text>
        ) : slotsConEstado.length === 0 ? (
          <Text style={styles.emptyText}>No hay horarios disponibles para esta fecha.</Text>
        ) : (
          <View style={styles.slotsGrid}>
            {slotsConEstado.map(slot => {
              const isSelected = horario === slot.hora && slot.estado === 'disponible';
              const isOcupado = slot.estado !== 'disponible';
              const visual = HORARIOS[slot.estado];
              return (
                <TouchableOpacity
                  key={slot.hora}
                  disabled={isOcupado}
                  accessibilityRole="button"
                  accessibilityLabel={`${slot.hora}, ${visual.label}`}
                  accessibilityState={{ disabled: isOcupado, selected: isSelected }}
                  style={[
                    styles.slotCard,
                    { borderColor: apariencia.color(visual.color, 'border'), backgroundColor: apariencia.color(visual.background, 'background') },
                    isSelected && styles.slotCardSelected,
                  ]}
                  onPress={() => setHorario(slot.hora)}
                >
                  <Text style={[
                    styles.slotText,
                    { color: apariencia.color(visual.color) },
                    isSelected && styles.slotTextSelected,
                  ]}>{slot.hora}</Text>
                  <Text style={{ fontSize: 9, marginTop: 4, color: apariencia.color(isSelected ? '#FFF' : visual.color) }}>{isSelected ? 'Seleccionado' : visual.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
          {(['disponible', 'apartado', 'confirmado'] as const).map(estado => <Text key={estado} style={{ color: apariencia.color(HORARIOS[estado].color), fontSize: 12 }}>● {HORARIOS[estado].label}</Text>)}
        </View>

        <TouchableOpacity 
          style={[styles.btnPrimary, { marginTop: 30 }, isGuardando && { opacity: 0.7 }]} 
          onPress={nextStep2}
          disabled={isGuardando || cargandoOcupacion || Boolean(errorOcupacion) || !horario}
        >
          {isGuardando ? <ActivityIndicator color={apariencia.color("#FFF")} /> : <Text style={styles.btnText}>Apartar Horario</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderStep3 = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
       {!pagoAprobado && <TouchableOpacity style={styles.backBtn} onPress={salir}>
          <Feather name="arrow-left" size={20} color={apariencia.color(COLORS.navy)} />
          <Text style={styles.backText}>Volver a mis citas</Text>
        </TouchableOpacity>}

      <View style={styles.successHeader}>
        <Ionicons name="checkmark-circle" size={60} color={apariencia.color(COLORS.success)} />
        <Text style={styles.successTitle}>{pagoAprobado ? '¡Anticipo aprobado!' : '¡Horario Apartado!'}</Text>
        <Text style={styles.successSub}>
          {pagoAprobado ? 'Tu pago fue verificado. La cita está confirmada.'
            : timeLeft > 0 ? `Tienes ${formatTimeLeft()} para pagar el anticipo del 50% y asegurar la cita.`
            : 'El plazo de pago terminó. Si ya pagaste, consulta el estado antes de reservar nuevamente.'}
        </Text>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryBoxTitle}>Resumen de tu cita</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fecha:</Text>
          <Text style={styles.summaryVal}>{fechaCita(fecha)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Hora:</Text>
          <Text style={styles.summaryVal}>{horario}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Servicios:</Text>
          <Text style={[styles.summaryVal, { flex: 1, textAlign: 'right', marginLeft: 16 }]}>{serviciosApi.filter(s => serviciosSel.includes(s.id)).map(s => s.nombre).join(', ')}</Text>
        </View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Especialista:</Text><Text style={styles.summaryVal}>{empleadasApi.find(e => e.id === empleadaId)?.nombre}</Text></View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total:</Text>
          <Text style={styles.summaryVal}>{dinero(estadoPago?.precioFinal ?? duracionYPrecioTotal.precio)}</Text>
        </View>
        <View style={[styles.summaryRow, { borderTopWidth: 1, borderColor: apariencia.color('#EEE', 'border'), paddingTop: 10, marginTop: 10 }]}>
          <Text style={[styles.summaryLabel, { color: apariencia.color(COLORS.navy), fontWeight: 'bold' }]}>{pagoAprobado ? 'Anticipo aprobado (50%):' : 'Anticipo a pagar (50%):'}</Text>
          <Text style={[styles.summaryVal, { color: apariencia.color(COLORS.blue), fontWeight: 'bold', fontSize: 18 }]}>
            {dinero(Math.round(Number(estadoPago?.precioFinal ?? duracionYPrecioTotal.precio) * 50) / 100)}
          </Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryBoxTitle}>Estado del pago</Text>
        <Text accessibilityLiveRegion="polite" style={styles.summaryLabel}>
          {pagoAprobado ? 'Aprobado'
            : estadoPago?.paymentStatus === 'rejected' ? 'Pago rechazado. Revisa el motivo en Mercado Pago.'
            : ['pending', 'in_process', 'authorized'].includes(estadoPago?.paymentStatus || '') ? 'Pago pendiente de confirmación.'
            : estadoPago?.paymentStatus ? `Estado recibido: ${estadoPago.paymentStatus}`
            : 'Aún no hay un pago confirmado.'}
        </Text>
        {errorPago && <Text style={{ color: apariencia.color(COLORS.error), marginTop: 10 }}>{errorPago}</Text>}
        {!pagoAprobado && <TouchableOpacity style={[styles.btnPrimary, { marginTop: 14 }]} onPress={consultarPago} disabled={consultandoPago}>
          {consultandoPago ? <ActivityIndicator color={apariencia.color("#FFF")} /> : <Text style={styles.btnText}>Consultar estado del pago</Text>}
        </TouchableOpacity>}
      </View>

      {pagoAprobado && <View style={{ gap: 14, marginBottom: 20 }}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push({ pathname: '/cita/[id]', params: { id: citaCreadaId } })}><Text style={styles.btnText}>Ver cita y comprobante PDF</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => verReservas()}><Text style={styles.btnText}>Ver mis próximas citas</Text></TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => nuevaCita()}><Text style={styles.backText}>＋ Agendar otra cita</Text></TouchableOpacity>
      </View>}

      {!pagoAprobado && <View style={styles.termsBox}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: apariencia.color(COLORS.muted) }}>
            A esta reserva le aplican los términos y las políticas de reservación y cancelación.
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 5 }}>
            <TouchableOpacity onPress={() => router.push('/terminos')}>
              <Text style={{ fontSize: 12, color: apariencia.color(COLORS.blue), fontWeight: '700' }}>Ver términos</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: apariencia.color(COLORS.muted) }}> · </Text>
            <TouchableOpacity onPress={() => router.push('/privacidad')}>
              <Text style={{ fontSize: 12, color: apariencia.color(COLORS.blue), fontWeight: '700' }}>Privacidad</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>}

      {!pagoAprobado && <TouchableOpacity
        style={[styles.btnPrimary, (isGuardando || timeLeft <= 0) && { opacity: 0.5 }]}
        onPress={handlePagarAnticipo}
        disabled={isGuardando || timeLeft <= 0}
      >
        {isGuardando ? <ActivityIndicator color={apariencia.color("#FFF")} /> : (
          <>
            <MaterialCommunityIcons name="credit-card-outline" size={20} color={apariencia.color("#FFF")} style={{marginRight: 8}} />
            <Text style={styles.btnText}>Pagar con Mercado Pago</Text>
          </>
        )}
      </TouchableOpacity>}
    </ScrollView>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" disabled={isGuardando} onPress={salir}><Text style={styles.backText}>‹ Mis citas</Text></TouchableOpacity>
        <Text style={styles.title}>Agendar cita</Text>
        <View style={styles.stepperDots}>
          <View style={[styles.dot, activeStep >= 0 && styles.dotActive]} />
          <View style={[styles.dot, activeStep >= 1 && styles.dotActive]} />
          <View style={[styles.dot, activeStep >= 2 && styles.dotActive]} />
        </View>
      </View>
      {activeStep === 0 && renderStep1()}
      {activeStep === 1 && renderStep2()}
      {activeStep === 2 && renderStep3()}
      <SalidaApartadoModal visible={flujo.mostrarSalida} cancelando={flujo.cancelando} error={flujo.errorSalida}
        onConservar={flujo.conservar} onCancelar={() => void flujo.cancelar(reserva)} onContinuar={flujo.seguirPagando} />
    </SafeAreaView>
  );
}

function MisReservas({ onAgendar, filtroInicial }: { onAgendar: () => void; filtroInicial: FiltroCitas }) {
  const vm = useMisCitasViewModel('proximas', filtroInicial);
  return <ListaCitas vm={vm} nuevaCita={onAgendar} encabezado={<EncabezadoModulo titulo="Tus próximas citas" />} />;
}

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.navy },
  stepperDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  dotActive: { backgroundColor: COLORS.navy },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 12, marginTop: 10 },
  
  btnPrimary: {
    backgroundColor: COLORS.navy, paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
  },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginRight: 8 },

  // Step 2
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { marginLeft: 8, color: COLORS.navy, fontWeight: '600', fontSize: 14 },
  horizontalScroll: { marginBottom: 20 },
  emptyText: { color: COLORS.muted, fontSize: 14, fontStyle: 'italic', marginBottom: 20 },
  
  empCard: {
    alignItems: 'center', marginRight: 16, padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF', width: 90
  },
  empCardSelected: { borderColor: COLORS.navy, backgroundColor: '#F0F4FA' },
  empAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8
  },
  empName: { fontSize: 12, fontWeight: '500', color: COLORS.muted, textAlign: 'center' },
  empNameSelected: { color: COLORS.navy, fontWeight: '700' },

  dateCard: {
    alignItems: 'center', marginRight: 12, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF'
  },
  dateCardSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  dateName: { fontSize: 11, fontWeight: '600', color: COLORS.muted, marginBottom: 4 },
  dateNum: { fontSize: 16, fontWeight: '800', color: COLORS.navy },
  dateTextSelected: { color: '#FFF' },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotCard: {
    width: '30%', paddingVertical: 12, alignItems: 'center', borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF'
  },
  slotCardSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  slotCardOcupado: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0', opacity: 0.6 },
  slotText: { fontSize: 14, fontWeight: '600', color: COLORS.navy },
  slotTextSelected: { color: '#FFF' },
  slotTextOcupado: { color: '#94A3B8', textDecorationLine: 'line-through' },

  // Step 3
  successHeader: { alignItems: 'center', marginVertical: 20 },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.navy, marginTop: 12, marginBottom: 8 },
  successSub: { fontSize: 14, color: COLORS.muted, textAlign: 'center', paddingHorizontal: 20 },
  
  summaryBox: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.border
  },
  summaryBoxTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: COLORS.muted, fontSize: 14 },
  summaryVal: { color: COLORS.navy, fontWeight: '600', fontSize: 14 },

  termsBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border
  }
});
