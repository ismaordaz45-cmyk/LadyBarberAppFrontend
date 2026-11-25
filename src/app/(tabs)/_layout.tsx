import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAVY = '#1E3A5F';
const GRAY = '#8B9BB4';
const WHITE = '#FFFFFF';

export default function TabLayout() {
  const apariencia = useAparienciaViewModel();
  const insets = useSafeAreaInsets();
  // Mantener el espacio de los controles y sumar el área real del sistema,
  // que cambia entre navegación por gestos, tres botones y orientación.
  const espacioInferior = 12 + insets.bottom;
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: apariencia.color(NAVY),
        tabBarInactiveTintColor: apariencia.color(GRAY),
        tabBarStyle: {
          backgroundColor: apariencia.color(WHITE, 'background'),
          borderTopWidth: 0,
          elevation: 2, // Sombra suave en Android
          shadowColor: '#000', // Sombra en iOS
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          height: 58 + espacioInferior,
          paddingBottom: espacioInferior,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontFamily: 'sans-serif', // Inter/SF Pro equivalente nativo
          fontWeight: '500',
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen name="compras" options={{ href: null, title: 'Mis compras' }} />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={apariencia.color(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="citas"
        options={{
          title: 'Citas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={apariencia.color(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="tienda"
        initialParams={{ seccion: 'carrito' }}
        listeners={({ navigation }) => ({ tabPress: () => navigation.setParams({ seccion: 'carrito', visita: String(Date.now()) }) })}
        options={{
          title: 'Carrito',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={apariencia.color(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={apariencia.color(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={apariencia.color(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
