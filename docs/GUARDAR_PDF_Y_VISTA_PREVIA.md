# Guardar comprobantes y vista previa de citas

## Guardado en el dispositivo

La acción **Descargar y guardar PDF** está disponible en el detalle y en la vista previa de una cita con anticipo aprobado verificado. El ViewModel consulta de nuevo el detalle antes de generar el comprobante.

El servicio abre `Directory.pickDirectoryAsync()` de Expo FileSystem. El cliente elige una carpeta y concede acceso mediante el selector del teléfono. No se solicitan permisos generales sobre todo el almacenamiento ni permisos de fotos/contactos. El acceso es el de la carpeta elegida; no se conserva su URI para escribir después sin interacción del usuario.

- Android: se crea un documento PDF con `Directory.createFile` en la URI `content://` autorizada por el selector. No se usa `File.create` sobre una URI SAF.
- iOS: se crea un `File` dentro de la carpeta seleccionada y se escribe durante la sesión autorizada del selector.
- El contenido se genera en base64 y se escribe como bytes PDF. Se verifican existencia y tamaño antes de confirmar éxito.
- El nombre incluye folio y marca de tiempo para conservar comprobantes guardados anteriormente. Si la creación no tuvo éxito, no se borra ningún archivo previo. Si falla la escritura de un archivo nuevo, se intenta retirar solo ese archivo incompleto.
- Cancelar el selector no genera PDF ni se anuncia como guardado. Rechazar permisos o fallar al escribir muestra un mensaje recuperable.
- El PDF guardado está en la carpeta elegida, no únicamente en la caché de Expo Go. Su conservación depende de esa carpeta/proveedor; el cliente puede abrirlo después desde su aplicación de archivos.
- Por solicitud del usuario, se retiró la opción Compartir PDF del detalle y la vista previa, junto con su servicio, dependencia y plugin. Solo se ofrece descargar y guardar en la carpeta elegida.

Referencia: [Expo FileSystem SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem.md). Se reutilizan los módulos de SDK 57 ya instalados; no se agregaron dependencias, permisos generales ni configuración nativa nueva en esta etapa.

## Vista previa desde Citas e Historial

Cada tarjeta tiene botones separados **Vista previa** y **Ver detalle**. La vista previa es una hoja nativa con el diseño azul/dorado y los datos de la reservación: folio, fecha, horario, cliente, especialista y servicios. Cuando el servidor confirma la evidencia aprobada, también muestra el anticipo, saldo según ese anticipo, referencia de pago y la acción para descargar y guardar PDF.

La vista previa no es un visor de páginas PDF: presenta los mismos datos verificados que se usan para generar el comprobante. Una reserva pendiente puede previsualizarse, pero no se presenta como pagada ni se habilita su comprobante de anticipo.

El modal reutiliza `useDetalleCitaViewModel`; la generación y el acceso a archivos permanecen en `comprobanteCitaService`, y el repositorio conserva las consultas autenticadas. Se descartan respuestas tardías al cerrar o cambiar de cita. Los controles se bloquean durante el guardado para evitar acciones duplicadas.

## Prueba en Expo Go y app instalada

1. Reiniciar Metro desde `LadyBarberApp-pago-citas-mercadopago`, con la API de Render configurada, usando `npm start -- --go --clear`.
2. En Citas, abrir **Vista previa** de una reserva con pago aprobado. Comprobar datos y elegir **Descargar y guardar PDF**.
3. En el selector, elegir o crear una carpeta como `Documentos/Comprobantes` y autorizar su uso. Algunas versiones de Android restringen las carpetas raíz; elegir una subcarpeta permitida.
4. Esperar la confirmación de guardado. Abrir la aplicación Archivos del teléfono, localizar el nombre indicado y abrir el PDF. Cerrar y reabrir la app para confirmar que el archivo sigue disponible fuera de su caché.
5. Repetir desde Historial y desde el detalle completo. Verificar que guardar dos veces no reemplace el archivo anterior.
6. Cancelar el selector y probar una carpeta sin permisos o un fallo de escritura: no debe aparecer un mensaje de éxito.
7. Abrir una reserva sin anticipo aprobado: debe permitir la vista previa y mostrar que el comprobante pagado aún no está disponible.
8. En un build instalado, repetir la prueba del selector de carpetas y la apertura del PDF. Las pruebas automatizadas simulan los módulos nativos; la autorización real depende del dispositivo y debe verificarse manualmente.

No requiere cambios del backend, despliegues de Render, SQL ni otro pago. Los cambios del frontend siguen locales, sin commit ni push.

Validación del 17 de noviembre de 2026: 405 pruebas aprobadas en 52 suites, TypeScript sin errores y lint con 0 errores y 53 advertencias. Se verifican guardado Android/iOS, cancelación y rechazo del selector, limpieza de archivos nuevos incompletos sin borrar archivos previos, consulta del pago antes del guardado, y vista previa/guardado desde Citas e Historial. Sigue pendiente la comprobación nativa de permisos y apertura del archivo en el teléfono.
