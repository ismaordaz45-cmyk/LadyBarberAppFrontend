# Ubicación: dirección y Cómo llegar

Inicio → Ubicación abre un panel emergente con el nombre/logo del negocio, su dirección publicada y el botón Cómo llegar. No agrega otra ruta ni cambia de pestaña. La barra de navegación queda visible detrás de la ventana; mientras está abierta se interactúa con el panel. Se cierra con X, toque exterior o Atrás de Android. Respeta el modo claro/oscuro y las áreas seguras de gestos y botones.

## Datos y arquitectura

- El backend preparado en `LadyBarberBackend-inicio-resumen-negocio` agrega `ubicacion` a la lectura pública de `perfil_empresa`. La columna ya existe y la administra la web; no hay migraciones ni escritura en la base.
- `NegocioRepository.obtener({ actualizar: true })` permite recuperar cambios del administrador al abrir o actualizar Ubicación, conservando la caché habitual de encabezados y compartiendo solicitudes en curso.
- `useUbicacionViewModel` controla apertura, carga, reintento, cierre y errores. No consulta la API antes de abrir el panel y descarta resultados tardíos tras cerrarlo. Bloquea pulsaciones duplicadas al abrir Maps.
- `utils/ubicacion.ts` construye URLs oficiales de indicaciones y valida destinos. Prioriza coordenadas válidas o el enlace de Maps configurado; admite referencia textual como en la web y utiliza la dirección como respaldo. No inventa una dirección si falta información.
- `ubicacionService.ts` abre el enlace mediante Expo Linking. El destino se consulta en Google Maps o en el navegador según lo que tenga disponible el teléfono. Los enlaces de lugar/acortados se conservan para que Maps resuelva el establecimiento y permita consultar las indicaciones.
- `UbicacionModal` es la vista del panel. Muestra estados de carga/error, deshabilita Cómo llegar si faltan datos y permite actualizar.

No se configura un origen ni se consulta GPS en la app. No hay SDK de mapas, API keys, permisos nuevos o mapa incrustado. Las claves de URLs de Embed no se reenvían. No se modifica Mercado Pago, reservas ni comprobantes.

Inicio conserva su catálogo montado mientras refresca el resumen al volver del navegador/Maps, para no reiniciar filtros o página de servicios.

## Despliegue y prueba

Para consumir los datos reales en Render debe estar desplegado `GET /api/perfil-empresa`, preparado en la misma rama de backend del resumen de Inicio. Si un backend ya devuelve dirección sin `ubicacion`, el frontend sigue funcionando con esa dirección. La incorporación del campo es compatible y no requiere variables nuevas.

1. Recargar Expo y pulsar Inicio → Ubicación. Revisar nombre y dirección publicados.
2. Pulsar Cómo llegar; comprobar que Maps o el navegador muestra el establecimiento correcto. No es necesario realizar pagos.
3. Volver a la app, cerrar el panel y verificar que Inicio sigue en su posición y conserva filtros/página del catálogo.
4. Revisar el panel en Claro y Oscuro y con navegación por gestos y botones.
5. Desde la administración web, actualizar la dirección/ubicación mediante el flujo habitual. Abrir nuevamente el panel para recuperar el cambio.
6. Comprobar el reintento sin conexión y el mensaje si el perfil no tiene dirección ni ubicación publicada.

Las verificaciones visuales y la apertura nativa real de Maps quedan pendientes en el teléfono. No se hicieron commits, push, despliegues ni SQL en Hostinger.

## Validación automatizada

- Frontend: 482 pruebas aprobadas en 66 suites; incluye apertura desde Inicio sin navegación, cierre, claro/oscuro, área segura inferior, destinos y enlaces, errores, datos ausentes, respuestas tardías y doble pulsación.
- Backend: 66 pruebas unitarias/API y 13 de integración MySQL local aprobadas, incluida la lectura real del campo `ubicacion` en el perfil activo. Servidor efímero detenido y datos eliminados.
- TypeScript sin errores; lint con 0 errores y 38 advertencias existentes.
- `git diff --check` sin errores en ambos worktrees.
