import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHomeViewModel } from '../../viewmodels/useHomeViewModel';
import { ServiciosSection } from '../../components/servicios/ServiciosSection';

// ── Paleta de colores fiel al diseño Figma ──────────────────
const C = {
  navy: '#10172A',
  navyCard: '#1E293B',
  grayText: '#64748B',
  grayLight: '#F1F5F9',
  border: '#E2E8F0',
  white: '#FFFFFF',
  orange: '#F59E0B',
  green: '#22C55E',
  red: '#EF4444',
};

// ── Helpers ──────────────────────────────────────────────────
const formatFechaCita = (fechaISO: string, horaISO: string): string => {
  try {
    const fecha = new Date(fechaISO);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const diaSemana = dias[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const hora = new Date(horaISO);
    const horas = hora.getHours();
    const minutos = String(hora.getMinutes()).padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const hora12 = ((horas % 12) || 12);
    return `${diaSemana} ${dia} ${mes} • ${hora12}:${minutos} ${ampm}`;
  } catch {
    return fechaISO;
  }
};

const colorEstado = (estado: string) => {
  switch (estado) {
    case 'CONFIRMADA': return C.green;
    case 'APARTADA': return C.orange;
    case 'CANCELADA': return C.red;
    default: return C.grayText;
  }
};


// ── Pantalla Principal ───────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [serviciosLayoutY, setServiciosLayoutY] = React.useState(0);

  const {
    isLoading,
    error,
    userNombre,
    serviciosPopulares,
    proximaCita,
    stats,
  } = useHomeViewModel();

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* HEADER SUPERIOR */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.topSubTitle}>LADY BARBER ITZÁ D'M</Text>
          <Text style={styles.topTitle}>Inicio</Text>
        </View>
        {/* Logo circular del negocio */}
        <View style={styles.logoCircular}>
          <Image
            source={require('../../../assets/images/logo-itza.png')}
            style={styles.logoCircularImg}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Estado de carga inicial */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.navyCard} />
          <Text style={styles.loadingText}>Cargando tu panel...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >

          {/* SECCIÓN BIENVENIDA */}
          <View style={styles.welcomeSection}>
            {/* Avatar usuario: ícono de persona */}
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={22} color={C.white} />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-sharp" size={9} color={C.white} />
              </View>
            </View>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeTitle}>¡Hola, {userNombre}! ✨</Text>
              <Text style={styles.welcomeSubtitle}>Tu momento de brillar te espera ✨</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <View style={styles.notificationDot} />
              <Ionicons name="notifications-outline" size={22} color={C.navy} />
            </TouchableOpacity>
          </View>

          {/* ESTADÍSTICAS RÁPIDAS */}
          {stats.total > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total citas</Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.statNumber, { color: '#D97706' }]}>{stats.pendientes}</Text>
                <Text style={styles.statLabel}>Pendientes</Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.statNumber, { color: '#16A34A' }]}>{stats.completadas}</Text>
                <Text style={styles.statLabel}>Completadas</Text>
              </View>
            </View>
          )}

          {/* TARJETA PRÓXIMA CITA — datos reales o placeholder */}
          <View style={styles.citaCard}>
            <View style={styles.citaCardHeader}>
              <View style={styles.citaCardHeaderLeft}>
                <View style={styles.dotIndicator} />
                <Text style={styles.citaCardLabel}>PRÓXIMA CITA</Text>
              </View>
              {proximaCita && (
                <View style={[styles.badgeEstado, { backgroundColor: `${colorEstado(proximaCita.estado)}25` }]}>
                  <Ionicons name="checkmark-circle-outline" size={13} color={colorEstado(proximaCita.estado)} style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeEstadoText, { color: colorEstado(proximaCita.estado) }]}>
                    {proximaCita.estado.charAt(0) + proximaCita.estado.slice(1).toLowerCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.citaCardDivider} />

            {proximaCita ? (
              <>
                <View style={styles.citaCardBody}>
                  <View style={styles.citaIconWrapper}>
                    <MaterialCommunityIcons name="content-cut" size={24} color={C.white} />
                  </View>
                  <View style={styles.citaInfo}>
                    <Text style={styles.citaServiceName} numberOfLines={1}>
                      {proximaCita.serviciosLabel || 'Servicio agendado'}
                    </Text>
                    <Text style={styles.citaDateText}>
                      {formatFechaCita(proximaCita.fecha, proximaCita.horaInicio)}
                    </Text>
                    {proximaCita.precioFinal > 0 && (
                      <Text style={styles.citaPrecio}>
                        ${Number(proximaCita.precioFinal).toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.citaCardFooter}>
                  <TouchableOpacity style={styles.btnDetalles}>
                    <Text style={styles.btnDetallesText}>Detalles</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnCambiar}>
                    <Text style={styles.btnCambiarText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // Sin citas próximas
              <View style={styles.noCitaContainer}>
                <Feather name="calendar" size={32} color="rgba(255,255,255,0.4)" />
                <Text style={styles.noCitaText}>No tienes citas próximas</Text>
                <TouchableOpacity
                  style={styles.btnDetalles}
                  onPress={() => router.push('/(tabs)/citas')}
                >
                  <Text style={styles.btnDetallesText}>Agendar ahora</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ACCIONES RÁPIDAS (Interactiva con Productos, Servicios, Agendar y Ubicación) */}
          <View style={styles.quickActions}>
            {[
              {
                icon: 'calendar-plus',
                label: 'Agendar',
                tipo: 'mci',
                onPress: () => router.push('/(tabs)/citas'),
              },
              {
                icon: 'spa-outline',
                label: 'Servicios',
                tipo: 'mci',
                onPress: () => {
                  scrollViewRef.current?.scrollTo({ y: serviciosLayoutY - 20, animated: true });
                },
              },
              {
                icon: 'shopping-bag',
                label: 'Productos',
                tipo: 'feather',
                onPress: () => router.push('/productos'),
              },
              {
                icon: 'map-marker-outline',
                label: 'Ubicación',
                tipo: 'mci',
                onPress: () => {
                  alert(
                    "📍 Lady Barber Itzá D'M\n\nDirección: Centro, Huejutla de Reyes, Hgo.\nHorario: Lunes a Sábado 9:00 AM - 8:00 PM\nTel: 771 123 4567"
                  );
                },
              },
            ].map((accion) => (
              <TouchableOpacity
                key={accion.label}
                style={styles.actionItem}
                onPress={accion.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconBg}>
                  {accion.tipo === 'mci' ? (
                    <MaterialCommunityIcons name={accion.icon as any} size={25} color="#1E293B" />
                  ) : (
                    <Feather name={accion.icon as any} size={23} color="#1E293B" />
                  )}
                </View>
                <Text style={styles.actionText}>{accion.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SECCIÓN NUESTROS SERVICIOS EXCLUSIVOS (Fiel a la captura 1) */}
          <View
            onLayout={(event) => {
              setServiciosLayoutY(event.nativeEvent.layout.y);
            }}
          >
            <ServiciosSection
              onAgendarServicio={(srv) => {
                router.push('/(tabs)/citas');
              }}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}


// ── Estilos generales ─────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: C.grayText, fontSize: 14 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.grayLight,
    backgroundColor: C.white,
  },
  topSubTitle: { fontSize: 10, fontWeight: '600', color: C.navyCard, letterSpacing: 0.5 },
  topTitle: { fontSize: 22, fontWeight: '700', color: C.navy },
  logoCircular: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: C.navyCard,
    borderWidth: 1.5,
    borderColor: '#F5C26B',
  },
  logoCircularImg: {
    width: '100%',
    height: '100%',
  },
  container: { flex: 1 },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.navyCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: C.navy,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.white,
  },
  welcomeTextContainer: { flex: 1 },
  welcomeTitle: { fontSize: 18, fontWeight: '700', color: C.navy },
  welcomeSubtitle: { fontSize: 13, color: C.grayText, marginTop: 2 },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    backgroundColor: C.orange,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.white,
    zIndex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: C.grayLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: { fontSize: 20, fontWeight: '700', color: C.navy },
  statLabel: { fontSize: 10, color: C.grayText, marginTop: 2, fontWeight: '500' },
  citaCard: {
    backgroundColor: C.navyCard,
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 16,
    marginBottom: 24,
  },
  citaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  citaCardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.white,
    marginRight: 8,
  },
  citaCardLabel: { color: C.white, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  badgeEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeEstadoText: { fontSize: 11, fontWeight: '600' },
  citaCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  citaCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  citaIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  citaInfo: { flex: 1 },
  citaServiceName: { color: C.white, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  citaDateText: { color: '#CBD5E1', fontSize: 13 },
  citaPrecio: { color: C.orange, fontSize: 13, fontWeight: '700', marginTop: 4 },
  citaCardFooter: { flexDirection: 'row', gap: 12 },
  noCitaContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  noCitaText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  btnDetalles: {
    backgroundColor: C.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnDetallesText: { color: C.navyCard, fontWeight: '600', fontSize: 13 },
  btnCambiar: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  btnCambiarText: { color: C.white, fontWeight: '500', fontSize: 13 },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  actionItem: { alignItems: 'center', width: '23%' },
  actionIconBg: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
  popularesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  popularesTitle: { fontSize: 18, fontWeight: '700', color: C.navy },
  verTodosText: { fontSize: 13, color: C.navyCard, fontWeight: '500' },
  popularesScroll: { paddingHorizontal: 20, gap: 16 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: { color: C.red, fontSize: 13, flex: 1 },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  emptyStateText: { color: C.grayText, fontSize: 14 },
});
