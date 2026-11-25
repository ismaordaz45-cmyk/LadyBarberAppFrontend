# Catálogo de servicios al agendar

## Diagnóstico y decisión técnica

El primer paso de `src/app/(tabs)/citas.tsx` renderizaba todos los servicios con `.map()` dentro de un ScrollView vertical. `useCitasViewModel` obtiene catálogo y horario una vez por carga mediante `CitasRepository`, que delega el catálogo a `ServiciosRepository` y normaliza `GET /servicios`.

El backend actual expone `GET /api/servicios` en `routes/index.js`; `catalogoController.getServicios` delega a `catalogoRepository.getServicios`, cuya consulta devuelve el arreglo completo de servicios activos, ordenado por ID. No recibe parámetros de búsqueda, categoría ni paginación, y no expone un endpoint independiente de categorías.

Se conservó esa API para no alterar los consumidores actuales ni requerir despliegue de Render. La búsqueda y los filtros se aplican sobre una carga en memoria; una FlatList virtualiza las tarjetas que se muestran progresivamente. Los servicios seleccionados siguen en el VM de citas, separados de los filtros y de la ventana visible.

## Comportamiento

- Búsqueda dinámica por nombre, tolerante a mayúsculas y acentos; combina todas las palabras escritas.
- Categorías obtenidas exclusivamente del catálogo recibido. La opción Todas las categorías es un control de filtrado, no una categoría inventada.
- Para este flujo, el repositorio conserva la categoría vacía cuando el API no la proporciona. Una categoría General solo aparece si realmente viene en el API. El catálogo general fuera de agendamiento conserva su normalización anterior.
- Seis tarjetas iniciales y Ver más servicios de seis en seis. Al cambiar búsqueda/categoría se restablecen seis resultados sin borrar la selección.
- Tarjetas con imagen del sistema, nombre, descripción breve, precio con decimales y duración. Imagen ausente/fallida: placeholder de la marca sin impedir selección.
- Detalle completo reutilizando ServicioDetalleModal, con acción Seleccionar servicio o Quitar de mi selección. El uso anterior de ese modal conserva su etiqueta y comportamiento por defecto.
- Resumen fijo con servicios elegidos, duración y total; cada chip permite quitar una selección. Continuar usa el mismo flujo de estilista, fecha, disponibilidad, reserva y pago.
- FlatList directamente en el paso, sin envolverla en otro ScrollView vertical; IDs estables, selección en extraData, tarjetas memoizadas e imágenes expo-image con caché. Se adapta a una, dos o tres columnas según ancho y escala de fuente. No se fuerza getItemLayout porque texto y accesibilidad producen alturas variables.
- Carga, error con reintento, catálogo vacío y búsqueda sin coincidencias tienen estados separados.
- Escribir, cambiar categoría y Ver más no hacen consultas HTTP. Reintentar sí vuelve a cargar servicios y horario.

## Archivos y responsabilidades

| Archivo | Cambio y propósito |
| --- | --- |
| `src/viewmodels/useCatalogoReservaViewModel.ts` | Estado de búsqueda, categorías reales, índice normalizado, ventana de seis, detalle y selección derivada. No accede a la red. |
| `src/components/servicios/CatalogoServiciosReserva.tsx` | Cuadrícula virtualizada, controles, estados y resumen fijo. |
| `src/components/servicios/ServicioSeleccionCard.tsx` | Variante de tarjeta para selección múltiple, imágenes y acceso al detalle; mantiene la paleta existente. |
| `src/app/(tabs)/citas.tsx` | Sustituye solo la presentación del paso de servicios por el nuevo componente. |
| `src/viewmodels/useCitasViewModel.ts` | Compone el VM del catálogo, incorpora reintento y reinicio de filtros al empezar otra reserva. Mantiene las reglas de agendamiento existentes. |
| `src/repositories/serviciosRepository.ts` | Opción de normalización local para preservar categorías vacías sin generar General; no modifica la solicitud HTTP. |
| `src/repositories/citasRepository.ts` | Solicita esa normalización estricta únicamente en agendamiento. |
| `src/components/servicios/ServicioDetalleModal.tsx` | Etiqueta de acción opcional y omisión de insignias sin categoría; conserva valores por defecto de los consumidores anteriores. |
| Pruebas de VM, componentes y repositorios | Casos con 200 servicios, búsqueda/categoría combinadas, selección oculta, consulta única, reintento, imágenes y diseño adaptable. |

## Alcance y escalabilidad

La carga progresiva es de presentación: el API sigue descargando el catálogo completo. Para cientos de registros se evita crear simultáneamente todas las tarjetas e imágenes y se filtra un índice de nombres calculado una vez por catálogo. No es paginación de red ni una garantía de descarga liviana si el servidor incluye muchas imágenes base64 grandes.

Si el catálogo o su payload aumentan considerablemente, el siguiente paso sería diseñar paginación/búsqueda del servidor y un contrato de categorías completas, manteniendo compatibilidad con los consumidores que hoy esperan un arreglo. Ese cambio requeriría acordar parámetros, metadatos y tratamiento de selecciones fuera de página, probar la API y desplegar el backend. No se realizó en esta implementación.

No se cambia la base de datos, el esquema, los roles, los permisos ni el procesamiento de pagos. No se agregan dependencias ni se modifica el backend o el proyecto web. Se conservan los cambios locales anteriores del frontend.

## Prueba manual en Expo Go

1. Reiniciar Metro desde `LadyBarberApp-pago-citas-mercadopago` con la URL de API configurada y `npm start -- --go --clear`.
2. Abrir Citas → Agendar nueva cita. Verificar seis tarjetas iniciales, imágenes, precio y duración.
3. Buscar por un nombre real, combinar con una categoría y comprobar que no aparezcan categorías fabricadas.
4. Seleccionar varios servicios, cambiar filtros y limpiar la búsqueda. La selección, la duración y el total deben conservarse. Abrir un detalle, seleccionar/quitar desde el modal y comprobar el resumen.
5. Usar Ver más servicios y verificar que crezca de seis en seis; cambiar categoría debe volver a seis.
6. Continuar al paso de estilista y horario; volver a servicios y comprobar que siga la selección. No es necesario apartar ni pagar una nueva cita para validar esta presentación.
7. Probar un nombre inexistente, una imagen fallida y el reintento tras un error de red.
8. Revisar teléfono pequeño, fuente grande y orientación/tableta. La revisión visual en dispositivo sigue siendo necesaria.

Referencias: [FlatList React Native 0.86](https://reactnative.dev/docs/0.86/flatlist), [Expo Image SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/image/).

## Validación local

413 pruebas aprobadas en 54 suites, incluidos los casos de 200 servicios, filtros combinados, selección conservada y contrato de reserva sin cambios. TypeScript sin errores. La comprobación visual final con imágenes reales, teclado y tamaños del teléfono se realiza en Expo Go; no se ejecutaron reservas ni pagos reales para probar esta presentación.
