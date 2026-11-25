import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AparienciaProvider } from '../providers/AparienciaProvider';
import { useAparienciaViewModel } from '../viewmodels/useAparienciaViewModel';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return <AparienciaProvider><NavegacionPrincipal /></AparienciaProvider>;
}

function NavegacionPrincipal() {
  const { esOscuro, colors, lista } = useAparienciaViewModel();
  useEffect(() => { if (lista) void SplashScreen.hideAsync(); }, [lista]);
  const base = esOscuro ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, background: colors.background,
    card: colors.surface, text: colors.text, border: colors.border, primary: colors.link } };
  return (
    <ThemeProvider value={theme}>
      <StatusBar style={esOscuro ? 'light' : 'dark'} />
      {!lista ? <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={colors.text} /></View> :
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="registro" />
        <Stack.Screen name="recuperar-password" />
        <Stack.Screen name="restablecer-password" />
        <Stack.Screen name="privacidad" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="terminos" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="productos" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>}
    </ThemeProvider>
  );
}
