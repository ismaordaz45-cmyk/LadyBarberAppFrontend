# Inicio, catálogo paginado y encabezados

## Cambios

- Inicio consume el resumen autenticado real al entrar, regresar de otra pestaña, volver la app al primer plano o actualizar manualmente. No contiene contadores de ejemplo. Un error se presenta como información no disponible, en lugar de aparentar cero citas.
- Acepta precios DECIMAL recibidos como texto; muestra fecha y hora del negocio sin reinterpretar las horas locales como UTC.
- Próxima cita muestra exclusivamente la próxima reserva vigente del servidor y permite abrir su detalle. Se retiran el botón duplicado “Agendar ahora”, la campana, emojis y mensajes decorativos.
- Agendar abre directamente el asistente. Agendar desde una tarjeta o su detalle transmite solo el ID del servicio: se verifica contra el catálogo activo, se preselecciona con su precio/duración actuales y queda listo para continuar. No reserva automáticamente ni envía precios provenientes de la navegación.
- Servicios en Inicio muestra páginas de seis tarjetas. Buscar y filtrar se combinan y regresan a la primera página, sin más consultas HTTP. Anterior/Siguiente recorren las coincidencias y regresan al principio del catálogo.
- Una sola FlatList contiene el panel y los servicios. Al llegar al catálogo quedan fijos su título, búsqueda y categorías. No se anidan listas verticales; el panel inicial se desplaza para dejar espacio a los servicios.
- El encabezado de Inicio, Citas e Historial queda fuera del desplazamiento, con logo de 64 puntos y SafeAreaView de react-native-safe-area-context para no invadir la barra del dispositivo. Perfil conserva “Mi perfil” fijo y elimina “ESPACIO EXCLUSIVO”; vuelve a consultar su resumen al entrar.

## Origen de los datos y API

El backend nuevo está separado en `LadyBarberBackend-inicio-resumen-negocio`, rama `feature/inicio-resumen-negocio`, desde origin/develop (ac7431d). Mantiene ruta → controlador → servicio → repositorio.

- `GET /api/perfil-empresa`: lectura pública de nombre, logo, dirección, teléfono y horario del primer perfil activo de la tabla existente `perfil_empresa`, verificada en el código del backend web en modo lectura. No expone datos privados del cliente ni agrega escritura. El cliente comparte peticiones concurrentes y cachea el perfil cinco minutos.
- `GET /api/cliente/resumen`: contrato compatible. Próxima cita excluye canceladas, pasadas y apartados con 30 minutos cumplidos, ordena por hora e ID e incluye servicios. Pendientes cuenta reservas vigentes por atender; Total incluye todo el historial; Completadas cuenta el estado COMPLETADA. Los filtros temporales de las horas usan BUSINESS_TIME_ZONE, conservando el reloj SQL para la vigencia desde creadoEn.
- No se modifica `/servicios`: ya entrega el catálogo activo sin paginación. La paginación de seis elementos es de presentación; se sigue descargando el arreglo completo una vez. Un catálogo mucho mayor o imágenes pesadas necesitaría una ampliación posterior de filtrado/paginación del API.
- No hay migraciones ni variables nuevas. El nombre y logo dinámicos y el resumen corregido requieren integrar/desplegar este backend mediante el flujo habitual. Con Render anterior puede faltar el nombre; se conserva el logo local como respaldo y no se inventa un nombre de empresa.

## Archivos principales

- `useHomeViewModel.ts`, `usePerfilViewModel.ts`: actualización de resúmenes al recuperar foco.
- `useServiciosViewModel.ts`, `ServiciosSection.tsx`: páginas de seis y controles fijos del catálogo.
- `useCitasViewModel.ts`, `useFlujoCitasViewModel.ts`, `app/(tabs)/citas.tsx`: entrada directa y preselección validada.
- `negocioRepository.ts`, `useNegocioViewModel.ts`, `EncabezadoModulo.tsx`: perfil público, caché y encabezado reutilizable.
- `app/(tabs)/index.tsx`, `historial.tsx`, `perfil.tsx`, `ListaCitas.tsx`: integración de vistas y encabezados.

## Verificación en teléfono

1. Recargar Expo y comprobar que Inicio no invade la hora/notch, el logo es visible y no hay campana ni emojis.
2. Agendar desde el acceso rápido: debe abrir servicios, no “Tus próximas citas”.
3. Agendar un servicio desde Inicio o su vista de detalle: debe estar seleccionado, con su precio y el botón Continuar habilitado. Volver a Inicio/Citas no debe repetir automáticamente esa selección.
4. Bajar al catálogo, recorrer seis tarjetas y usar Siguiente/Anterior. El título y filtros quedan visibles; filtrar o buscar restablece página y desplazamiento.
5. Comprobar encabezados fijos en Citas, Historial y Perfil.
6. Después de desplegar el backend: comparar resumen de Inicio/Perfil con las citas propias; verificar que la próxima sea la más cercana vigente. El nombre debe coincidir con el perfil activo de la web. No requiere crear otro pago.

No se hicieron commits, push, despliegues ni SQL en Hostinger. La prueba visual nativa queda pendiente.

## Validación automatizada

- Frontend: 430 pruebas aprobadas en 57 suites. Casos nuevos cubren precio DECIMAL, actualización del resumen, 200 servicios paginados, filtros combinados, encabezado del catálogo fijo, caché del negocio y preselección de servicio con precio real.
- TypeScript sin errores; lint con 0 errores y 39 advertencias.
- Backend: 66 pruebas unitarias/API y 13 de integración MySQL local aprobadas. Servidor efímero detenido y datos eliminados.
- `git diff --check` sin errores en ambos worktrees.
