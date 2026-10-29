import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync();
SplashScreen.hideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="registro" />
        <Stack.Screen name="recuperar-password" />
        <Stack.Screen name="restablecer-password" />
        <Stack.Screen name="productos" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
