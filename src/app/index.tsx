import { Redirect } from 'expo-router';

export default function Index() {
  // Por ahora, como la pantalla de inicio principal que estamos armando es el Login,
  // redirigimos automáticamente a /login al abrir la app.
  // En el futuro, aquí se validará si el usuario ya tiene sesión iniciada.
  return <Redirect href="/login" />;
}
