# Entrega conjunta del cliente: actividades 07 a 12

Esta entrega conserva juntas las funciones que comparten componentes, repositorios y ViewModels. Cada actividad de Trello puede enlazar el mismo PR y el commit final de main, detallando su alcance.

- 07 Gestión de citas: selección de servicios, categorías reales, búsqueda, seis tarjetas iniciales, especialista, horarios y apartado vigente.
- 08 Consulta y cancelación: próximas citas, detalle, filtro Por pagar, conservar/cancelar apartado, navegación y vencimiento original.
- 09 Ubicación: perfil público del salón y panel Cómo llegar, sin SDK ni permisos de ubicación.
- 10 Compra de productos: catálogo y detalle con imagen, carrito por cuenta, cantidades, existencias y resumen del pedido.
- 11 Pagos: anticipos y compras con Mercado Pago, consulta/reconciliación, pedido activo y comprobantes con evidencia del servidor. Nota informativa de términos al pagar, conservando la aceptación del registro.
- 12 Historial: citas filtradas y ordenadas, Mis compras con tres resultados iniciales, vista previa y descarga/guardado de PDF con plazo de recogida de 24 horas.

Incluye mejoras compartidas de Inicio/Perfil con datos reales, temas claro/oscuro, áreas seguras, barra inferior con Carrito, confirmaciones de cierre de sesión y cancelación, animación al agregar y limpieza del acceso. Respeta MVVM + Repository.

## Dependencia del backend

La ruta POST /api/pedidos/:id/cancelar pertenece a la rama backend feature/cancelar-pedido-productos. Debe integrarse y desplegarse antes de probar la cancelación desde el AAB. Sin esa ruta, el cliente conserva el pedido y muestra el error; no inventa una cancelación. No requiere migraciones, variables nuevas ni SQL en Hostinger.

## Validación y publicación

Validación del 24 de noviembre de 2026: 563 pruebas en 78 suites aprobadas en ejecución aislada; TypeScript sin errores, lint con cero errores y 36 advertencias. Exportación del bundle Android completada con la API pública de Render. Una ejecución previa simultánea con la compilación agotó el límite de 5 segundos en la prueba de Ubicación; la repetición conserva ese límite y todas sus aserciones.

Se incluyen pruebas de vistas, ViewModels, repositorios, modelos, enlaces y archivos. Los fallos de red, cambios de sesión, respuestas tardías, límites de stock, pagos no aprobados, cancelación del selector y errores de guardado se verifican con datos ficticios. Las pruebas nativas y de Mercado Pago en modo test se repiten en el teléfono; Jest simula esos servicios.

GitHub Actions instala con npm ci y ejecuta TypeScript, lint y Jest en serie con --runInBand, igual que la validación local, para limitar el uso simultáneo de memoria. El AAB firmado continúa siendo una acción manual de main después de aprobar CI. Su nombre se obtiene de la versión y versionCode de app.json. Antes de generar una actualización se debe confirmar el mayor versionCode existente en Play Console; la firma y el identificador del paquete se conservan.

Flujo de integración: feature → develop → release → main, mediante PR, checks y revisión humana. La solicitud de acceso a producción en Play Console no sustituye las pruebas del AAB actualizado ni publica automáticamente esta entrega.
