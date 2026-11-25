# PDF en Expo Go y navegación de citas

Actualización: la opción Compartir PDF fue retirada por solicitud del usuario. La acción actual es Descargar y guardar PDF mediante el selector de carpetas; consultar `GUARDAR_PDF_Y_VISTA_PREVIA.md`. La explicación de compartir que sigue corresponde al antecedente del error, no a una opción vigente.

## Corrección de compartir PDF

La captura de Android muestra `ExpoSharing.shareAsync: Not allowed to read file under given URL`. El código nativo de Sharing valida permisos de lectura antes de compartir; Print genera su archivo usando la caché del contexto Android, que puede ser distinta a la carpeta del proyecto en Expo Go.

El servicio solicita ahora el contenido base64 al generador y lo escribe en un `File` bajo `Paths.cache` de la app con el nombre `Comprobante_Cita_<folio>.pdf`. Solo comparte la URI propia después de verificar que existe y no está vacío. No intenta copiar ni leer la URI original rechazada y no pide acceso general al almacenamiento. El archivo no se elimina al cerrar el selector porque la aplicación receptora puede seguir leyéndolo; queda en caché administrada por el sistema.

Se agregó `expo-file-system` compatible con SDK 57 mediante `expo install`. Las APIs utilizadas están incluidas en Expo Go. No se modifica la validación del pago ni la plantilla del comprobante.

Referencias: [Expo Print SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/print/), [Expo FileSystem SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem.md), [Expo Sharing SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/).

## Listas para el cliente

- Próximas citas: fecha más cercana por defecto; opción Últimas reservas por fecha de creación. Filtros Todas, Confirmadas, Por pagar y En atención.
- Historial: visitas más recientes por defecto y opción Más antiguas. Filtros Todas, Completadas, Canceladas, Confirmadas, Vencidas y No asistí.
- Se muestran seis coincidencias inicialmente, con contador. Ver más amplía de seis en seis; Ver menos vuelve a seis y al inicio. Cambiar filtro, orden o actualizar restablece seis resultados.
- Una selección sin resultados ofrece Mostrar todas; los filtros mantienen etiquetas de selección accesibles.
- El ViewModel lee las páginas de 40 del contrato existente del backend y combina por ID antes de ordenar y filtrar. Esto permite ordenar globalmente aunque existan más de 40 reservas, manteniendo solo seis tarjetas iniciales. Se cancela el procesamiento al abandonar la vista o cambiar de sesión; una paginación que no avanza muestra error en lugar de consultar indefinidamente.
- Vista, ViewModel, repositorio y servicio de archivos conservan su separación. No se requieren cambios del backend, SQL, variables de Render ni un nuevo pago para probar esta actualización.

## Prueba en el teléfono

1. Detener Metro con Ctrl+C.
2. En CMD abrir `LadyBarberApp-pago-citas-mercadopago`, configurar `EXPO_PUBLIC_API_URL` a la API de Render y ejecutar `npm start -- --go --clear`.
3. Abrir el nuevo QR, iniciar sesión y entrar al detalle de una cita con anticipo aprobado.
4. Usar Descargar y guardar PDF, elegir una carpeta autorizada y comprobar que el archivo se abre desde Archivos, como se describe en `GUARDAR_PDF_Y_VISTA_PREVIA.md`.
5. Verificar los importes, servicios, horario y folio en el PDF. Esta revisión nativa requiere el dispositivo; las pruebas automáticas usan módulos nativos simulados.
6. En Citas e Historial comprobar seis tarjetas como máximo al inicio, filtros, orden, contador, Ver más y Ver menos. Con menos de siete coincidencias no se muestra Ver más.

Los cambios quedan locales, sin commit ni push del frontend.

Validación del 17 de noviembre de 2026: 394 pruebas aprobadas en 52 suites; TypeScript sin errores; lint con 0 errores y 53 advertencias. Se cubren la URI de caché propia, escritura base64, datos ausentes/archivo vacío, fallos nativos, orden global, filtros, paginación de seis y navegación de las tarjetas. La validación final de compartir/guardar en Expo Go sigue pendiente en el teléfono.
