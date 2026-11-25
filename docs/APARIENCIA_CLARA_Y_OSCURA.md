# Apariencia clara y oscura

En Mi perfil → Apariencia el cliente puede elegir Claro, Oscuro o Del dispositivo. La selección se aplica de inmediato a toda la aplicación y se conserva al cerrarla. Del dispositivo sigue el tema del sistema y es la opción inicial si todavía no hay una preferencia.

## Arquitectura

- Modelo: `models/Apariencia.ts` define los valores admitidos.
- Repository: `repositories/aparienciaRepository.ts` guarda únicamente el modo en un pequeño archivo JSON del directorio privado de la app. En web utiliza localStorage. No pide permisos de almacenamiento ni transmite la preferencia a un servidor.
- ViewModel: `usePreferenciaApariencia.ts` recupera la elección, evita que una lectura tardía sobrescriba una selección reciente y serializa escrituras rápidas. Informa fallos de almacenamiento conservando el tema aplicado durante la sesión.
- Provider: `providers/AparienciaProvider.tsx` comparte la apariencia y sincroniza el aspecto nativo de diálogos, teclado y fondo de la ventana. El acceso desde las vistas se realiza mediante `useAparienciaViewModel.ts`.
- Paleta central: `constants/apariencia.ts` mantiene los colores de Claro y Oscuro. Su adaptador distingue superficies, texto y bordes para reutilizar los estilos actuales; por ejemplo, transforma un fondo blanco sin oscurecer el texto blanco de los botones.
- `use-themed-styles.ts` adapta los estilos de cada vista sin modificar los originales; `TextoApp.tsx` aporta un color legible a textos que no tenían uno explícito. Las nuevas vistas pueden usar directamente los colores semánticos del ViewModel.
- `_layout.tsx` aplica el tema de navegación y la barra de estado. Espera la lectura de preferencias antes de retirar el splash para evitar mostrar primero otro tema.

## Cobertura
La pantalla de acceso usa un único título «Inicio de sesión», con el poste de barbería animado junto al texto y sin insignia exclusiva ni encabezado superior duplicado. Conserva el indicador de carga y los errores reales de autenticación. El pie bajo los enlaces legales obtiene el nombre desde useNegocioViewModel → NegocioRepository → GET /api/perfil-empresa; si no está disponible, muestra únicamente «Acceso seguro» sin inventar el nombre ni bloquear el acceso. El contenido respeta el área segura del dispositivo.


Inicio, Citas, Historial, Perfil, catálogo de productos, selección de servicios, detalle y vista previa de citas, formularios de acceso/registro/recuperación, documentos legales y modales reutilizables usan la misma apariencia. Los campos tienen un teclado y un placeholder acordes al tema. Se conservan las áreas seguras de encabezados y barra inferior para gestos y botones.

Las fotografías, logos, el poste de barbero, el splash de marca y los archivos PDF conservan sus colores. El checkout externo de Mercado Pago mantiene su propia apariencia. No se invierten imágenes ni se altera la generación de comprobantes.

No requiere paquetes nuevos, permisos, cambios de variables, API, base de datos o despliegue de Render. El backend en capas permanece intacto.

## Prueba en Expo Go

1. Recargar la app y entrar en Mi perfil → Apariencia → Oscuro.
2. Recorrer Inicio, Citas, Historial, Productos y el asistente de agendamiento. Revisar textos, filtros, botones, horarios y barra inferior.
3. Abrir detalle de cita, vista previa, detalle de servicio y edición de perfil. Confirmar que los modales y campos son legibles.
4. Volver a Claro y comprobar que la distribución y la selección/reserva siguen funcionando.
5. Elegir Del dispositivo, cambiar el modo en Ajustes del teléfono y regresar a la aplicación.
6. Cerrar y abrir de nuevo la app para confirmar que recuerda la elección. Cerrar sesión y revisar que acceso, registro, recuperación y documentos legales respetan el modo elegido.
7. Confirmar que las fotos y el PDF no cambian de color. No es necesario realizar otro pago.

La preferencia pertenece a este dispositivo; no se sincroniza entre teléfonos. Borrar los datos de la app o reinstalarla restablece la opción Del dispositivo. Las verificaciones visuales nativas siguen pendientes en el teléfono.

Cambios locales, sin commit, push ni despliegue.

## Validación automatizada

- 451 pruebas aprobadas en 62 suites.
- Persistencia nativa, lectura inválida, fallo de almacenamiento, selecciones rápidas y lectura tardía cubiertos.
- Cambio desde Perfil, actualización de encabezado/modal y seguimiento del dispositivo comprobados en pruebas de componentes.
- Contraste mínimo 4.5:1 comprobado para los pares principales de texto, enlaces, botones y estados de pago en las paletas correspondientes.
- TypeScript sin errores; lint con 0 errores y 38 advertencias existentes.
- `git diff --check` sin errores.
