# Citas, historial y comprobante

Referencia de diseño consultada solo en lectura: `ProyectSLB/frontend/src/componentes/cliente/MisCitasCliente.jsx` y `paginas/PagoExitoCita.jsx`.

## Flujo y arquitectura

- Citas abre próximas reservas del servidor, con actualizar, detalle y agendar nueva cita. Una reserva pagada no se cancela al comenzar otra.
- Historial muestra citas anteriores/terminadas/canceladas y apartados vencidos. El backend es la fuente de datos, también al reiniciar la aplicación e iniciar sesión de nuevo.
- El detalle permite actualizar información, continuar el pago, cancelar donde el servidor lo permite y descargar/guardar el comprobante cuando hay evidencia aprobada. Al pagar se muestra una nota con acceso a términos y políticas, sin pedir otra aceptación; la aceptación del registro se conserva.
- MVVM: vistas `citas`, `historial`, `cita/[id]`; ViewModels de reserva/listado/detalle/pago; `CitasRepository` consume API autenticada; `comprobanteCitaService` genera y guarda PDF con plantilla escapada en utils y el servicio común `guardarPdfService`.
- Se utilizan `expo-print` y `expo-file-system` compatibles con SDK 57. Android/iOS permiten elegir una carpeta para guardar el PDF. La opción Compartir PDF y su dependencia se retiraron; la versión web indica usar el teléfono.
- El PDF mantiene azul/dorado, folio, cliente, especialista, horario, servicios, total, importe registrado del anticipo y diferencia respecto al total. No es factura ni prueba de liquidaciones posteriores en caja.

## Horarios

Azul = disponible, gris = apartado pendiente de pago, dorado = confirmado. Todos tienen texto y etiquetas de accesibilidad. Ocupados y fuera del horario de cierre quedan deshabilitados. Se evalúa todo el intervalo del servicio, con límites de traslape abiertos y duración total.
Ocupación usa JWT, actualiza al enfocar la reserva/volver a primer plano y cada 30 segundos mientras está enfocada. Si falla, se bloquea reservar y se ofrece reintentar. La protección definitiva contra reservas simultáneas sigue en el backend.

## Validación manual en Expo Go

El nuevo detalle requiere desplegar primero `LadyBarberBackend-detalle-citas-comprobante` siguiendo el flujo de PR configurado. Los cambios siguen locales; no hay commit/push ni despliegue en esta etapa.

1. Reiniciar Metro desde este worktree con la URL de API configurada y caché limpia; abrir Expo Go.
2. Iniciar sesión con el cliente que realizó el pago ya aprobado: debe aparecer en próximas citas sin pagar nuevamente.
3. Abrir detalle y usar Descargar y guardar PDF; elegir una carpeta y revisar fecha, horario, folio, nombres, tabla, total, anticipo y saldo en un visor.
4. Volver a Citas, agendar otra reserva y comprobar que la confirmada anterior sigue existiendo.
5. Elegir el mismo especialista/fecha: el intervalo confirmado se ve dorado y no se puede seleccionar. Un apartado vigente se ve gris. Un disponible se ve azul.
6. Revisar que un servicio largo no pueda terminar después del cierre o invadir otra reserva.
7. Cerrar y reabrir la app, iniciar sesión y comprobar recuperación de citas. Revisar historial, refrescar y paginar si hay más de 40.
8. Probar desconexión: no mostrar una disponibilidad falsamente libre; reintentar al recuperar red.
9. Verificar estados vacío/error, tamaño de letra grande y legibilidad en teléfono. La revisión del selector de carpetas requiere dispositivo; repetirla en el AAB actualizado además de Expo Go.

## Comprobaciones locales

Validado el 16 de noviembre de 2026: 384 pruebas en 50 suites, TypeScript sin errores y lint con 0 errores y 53 advertencias. Backend: 63 pruebas unitarias/API y 10 de integración MySQL aprobadas. Se conservaron los cambios anteriores de pagos y lint ya presentes en el worktree.

Referencias de SDK utilizadas: [Expo Print 57](https://docs.expo.dev/versions/v57.0.0/sdk/print/) y [Expo FileSystem 57](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/).
