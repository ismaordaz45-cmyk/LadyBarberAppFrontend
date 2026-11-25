# Salida de agendamiento y apartados pendientes

## Comportamiento

- Citas abre el listado “Tus próximas citas”. Al cambiar de pestaña o abrir otra pantalla se restablece esta vista, sin cancelar reservas del servidor.
- “Agendar nueva cita” inicia una selección nueva. Las reservas previas se recuperan por el API, aunque se cierre o reinicie la app.
- Atrás de Android durante el asistente regresa al listado; con un apartado pendiente abre el mismo diálogo que “Mis citas” o “Volver a mis citas”. El regreso explícito a servicios en el paso de fecha conserva su función.
- El diálogo usa azul marino, dorado y azul del proyecto y tres acciones explícitas: conservar y ver mis citas, cancelar apartado y volver al listado, seguir con el pago.
- Conservar abre “Por pagar”, sin petición de cancelación o creación, y sin reiniciar los 30 minutos originales. La tarjeta permite continuar el pago desde el detalle de la misma cita.
- Cancelar espera confirmación del servidor. Durante la operación bloquea pulsaciones duplicadas; si falla, conserva la reserva y muestra el error para reintentar o conservar.
- Se elimina el filtro “En atención”. Las citas con ese estado continúan visibles en “Todas”.

## Vigencia

El backend existente ya excluye de la ocupación los apartados de más de 30 minutos al consultar disponibilidad y crear reservas. No se requiere un temporizador activo en el teléfono para liberar el espacio. La lista móvil clasifica los vencidos como historial a partir de `creadoEn`, actualizando su reloj cada 30 segundos. El servidor sigue siendo quien valida la vigencia al intentar pagar.

El contador del asistente no muestra alertas mientras está oculto. No hay cambios de API, base de datos, firma de Mercado Pago ni backend web.

## Prueba manual en Expo Go

1. Abrir Citas → Agendar nueva cita; volver con Atrás de Android. Debe aparecer el listado, sin ir a Inicio.
2. Iniciar agendamiento, cambiar a Inicio y regresar a Citas. Debe aparecer “Tus próximas citas”.
3. Apartar un horario y tocar “Volver a mis citas”. Elegir “Seguir con el pago” y verificar que permanece el mismo apartado y contador.
4. Abrir el diálogo otra vez y elegir “Conservar y ver mis citas”. Debe quedar seleccionado “Por pagar”; comprobar mismo folio y servicio.
5. Abrir “Continuar pago” y verificar que recupera la misma reserva. No hace falta completar otro pago para revisar la navegación.
6. Cerrar/reabrir la app y consultar “Por pagar”: el apartado vigente debe seguir visible. Al cumplir el plazo original desaparece de próximas y aparece como vencido en Historial (refresco del reloj hasta 30 segundos).
7. En otra reserva de prueba, elegir cancelar y verificar que vuelve al listado después de la respuesta del servidor. Con fallo de red debe conservar la reserva y mostrar el error.

Cambios exclusivamente locales en el frontend, respetando MVVM + Repository. La comprobación visual en teléfono sigue pendiente.

## Validación automatizada

- 424 pruebas aprobadas en 56 suites, incluyendo navegación, Atrás de Android, conservación, reanudación, cancelación con error/doble pulsación y vencimiento sin reiniciar el plazo.
- TypeScript sin errores; lint con 0 errores y las 53 advertencias existentes.
- `git diff --check` sin errores.
- No se realizaron commits, push, despliegues ni operaciones en Hostinger.
