import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Switch
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCitasViewModel, getMinFechaReserva } from '../../viewmodels/useCitasViewModel';
import { resolveServicioImagenUrl } from '../../utils/resolveServicioImagenUrl';
import { API_URL } from '../../services/api';

const API_BASE = API_URL.replace(/\/api\/?$/, '');

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
  const {
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
  } = useCitasViewModel();

  if (isLoadingCatalogo) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={{ marginTop: 10, color: COLORS.navy }}>Cargando catálogo...</Text>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={{ color: COLORS.error, fontWeight: 'bold' }}>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

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
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionTitle}>Selecciona tus servicios</Text>
      {serviciosApi.map(srv => {
        const isSelected = serviciosSel.includes(srv.id);
        return (
          <TouchableOpacity 
            key={srv.id} 
            style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
            onPress={() => toggleServicio(srv.id)}
          >
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{srv.nombre}</Text>
              <Text style={styles.serviceMeta}>{srv.duracionMin} min • ${srv.precioMXN}</Text>
            </View>
            <View style={styles.checkbox}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.summaryFooter}>
        <View>
          <Text style={styles.summaryText}>Total: {duracionYPrecioTotal.duracion} min</Text>
          <Text style={styles.summaryPrice}>${duracionYPrecioTotal.precio} MXN</Text>
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={nextStep1}>
          <Text style={styles.btnText}>Continuar</Text>
          <Feather name="arrow-right" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => {
    const dates = generateDates();
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Feather name="arrow-left" size={20} color={COLORS.navy} />
          <Text style={styles.backText}>Volver a servicios</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>1. Elige a tu especialista</Text>
        {cargandoEstilistas ? (
          <ActivityIndicator color={COLORS.navy} style={{ marginVertical: 20 }} />
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
                    <Ionicons name="person" size={24} color={isSelected ? COLORS.navy : COLORS.muted} />
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
          <ActivityIndicator color={COLORS.navy} style={{ marginVertical: 20 }} />
        ) : !fecha || !empleadaId ? (
          <Text style={styles.emptyText}>Selecciona estilista y fecha primero.</Text>
        ) : slotsConEstado.length === 0 ? (
          <Text style={styles.emptyText}>No hay horarios disponibles para esta fecha.</Text>
        ) : (
          <View style={styles.slotsGrid}>
            {slotsConEstado.map(slot => {
              const isSelected = horario === slot.hora;
              const isOcupado = slot.estado !== 'disponible';
              return (
                <TouchableOpacity
                  key={slot.hora}
                  disabled={isOcupado}
                  style={[
                    styles.slotCard,
                    isSelected && styles.slotCardSelected,
                    isOcupado && styles.slotCardOcupado
                  ]}
                  onPress={() => setHorario(slot.hora)}
                >
                  <Text style={[
                    styles.slotText,
                    isSelected && styles.slotTextSelected,
                    isOcupado && styles.slotTextOcupado
                  ]}>{slot.hora}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.btnPrimary, { marginTop: 30 }, isGuardando && { opacity: 0.7 }]} 
          onPress={nextStep2}
          disabled={isGuardando}
        >
          {isGuardando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Apartar Horario</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderStep3 = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
       <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Feather name="arrow-left" size={20} color={COLORS.navy} />
          <Text style={styles.backText}>Cancelar y volver</Text>
        </TouchableOpacity>

      <View style={styles.successHeader}>
        <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
        <Text style={styles.successTitle}>¡Horario Apartado!</Text>
        <Text style={styles.successSub}>Tienes {formatTimeLeft()} para confirmar tu pago del 50% y asegurar la cita.</Text>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryBoxTitle}>Resumen de tu cita</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fecha:</Text>
          <Text style={styles.summaryVal}>{fecha}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Hora:</Text>
          <Text style={styles.summaryVal}>{horario}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Servicios:</Text>
          <Text style={styles.summaryVal}>{serviciosSel.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total:</Text>
          <Text style={styles.summaryVal}>${duracionYPrecioTotal.precio} MXN</Text>
        </View>
        <View style={[styles.summaryRow, { borderTopWidth: 1, borderColor: '#EEE', paddingTop: 10, marginTop: 10 }]}>
          <Text style={[styles.summaryLabel, { color: COLORS.navy, fontWeight: 'bold' }]}>Anticipo a pagar (50%):</Text>
          <Text style={[styles.summaryVal, { color: COLORS.blue, fontWeight: 'bold', fontSize: 18 }]}>
            ${(duracionYPrecioTotal.precio / 2).toFixed(2)} MXN
          </Text>
        </View>
      </View>

      <View style={styles.termsBox}>
        <Text style={{flex: 1, fontSize: 12, color: COLORS.muted}}>
          Acepto las políticas de cancelación. Entiendo que el anticipo no es reembolsable en caso de no asistir.
        </Text>
        <Switch 
          value={terminosAceptados} 
          onValueChange={setTerminosAceptados}
          trackColor={{ false: "#D1D5DB", true: COLORS.blue }}
          thumbColor="#FFF"
        />
      </View>

      <TouchableOpacity 
        style={[styles.btnPrimary, (!terminosAceptados || isGuardando) && { opacity: 0.5 }]} 
        onPress={handlePagarAnticipo}
        disabled={!terminosAceptados || isGuardando}
      >
        {isGuardando ? <ActivityIndicator color="#FFF" /> : (
          <>
            <MaterialCommunityIcons name="credit-card-outline" size={20} color="#FFF" style={{marginRight: 8}} />
            <Text style={styles.btnText}>Pagar con Mercado Pago</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agendar Cita</Text>
        <View style={styles.stepperDots}>
          <View style={[styles.dot, activeStep >= 0 && styles.dotActive]} />
          <View style={[styles.dot, activeStep >= 1 && styles.dotActive]} />
          <View style={[styles.dot, activeStep >= 2 && styles.dotActive]} />
        </View>
      </View>
      {activeStep === 0 && renderStep1()}
      {activeStep === 1 && renderStep2()}
      {activeStep === 2 && renderStep3()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.navy },
  stepperDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  dotActive: { backgroundColor: COLORS.navy },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 12, marginTop: 10 },
  
  // Step 1
  serviceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 16, borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border
  },
  serviceCardSelected: { borderColor: COLORS.navy, backgroundColor: '#F0F4FA' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '600', color: COLORS.navy, marginBottom: 4 },
  serviceMeta: { fontSize: 13, color: COLORS.muted },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF'
  },
  summaryFooter: {
    marginTop: 20, padding: 20, backgroundColor: '#FFF', borderRadius: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  summaryText: { fontSize: 12, color: COLORS.muted, fontWeight: '500' },
  summaryPrice: { fontSize: 18, fontWeight: '800', color: COLORS.navy },
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
