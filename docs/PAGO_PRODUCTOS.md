# Checkout de productos con Mercado Pago

## Flujo móvil

Productos conserva las pestañas Catálogo y Carrito y la barra inferior. Se agrega Revisar pedido y pagar: el backend recalcula el importe y devuelve un pedido con precios y cantidades persistidos. El cliente revisa ese resumen antes de abrir Mercado Pago. El carrito es una estimación; el resumen muestra el total que realmente se cobrará, completo en MXN y con recogida en el salón.

`usePagoProductosViewModel` → `PedidosRepository` utiliza las rutas protegidas `/pedidos`. `PedidoActivoRepository` guarda solo el ID del pedido por cuenta, antes de permitir abrir checkout. Si no se puede guardar o recuperar, se bloquea un pago nuevo. Se consulta al volver del navegador, al regresar la app a primer plano y mediante Consultar estado del pedido. El regreso del navegador no confirma el pago.

`ResumenPedido` muestra los productos, total, folio y resultado. Solo una compra confirmada por el servidor actualiza el carrito. Los pedidos con pago recibido pero sin existencias suficientes muestran revisión por el salón y no permiten pagar otra vez. Los pagos pendientes permanecen activos para consultar. Antes de descartar un checkout vencido se concilia para detectar una aprobación cuyo webhook no llegó.

El carrito guarda juntos sus artículos y los IDs de pedidos aplicados. Retira solo las unidades compradas y no vuelve a descontarlas al repetir la consulta o reiniciar. Los artículos adicionales permanecen; durante un pedido activo se bloquea quitar o cambiar cantidades, aunque se puede seguir explorando y agregando desde el catálogo. Las escrituras se preparan en un temporal y se reemplaza el archivo anterior después de escribir, con cola por cuenta.

Se conservan MVVM + Repository, temas, áreas seguras y los pagos de citas. No se agregan paquetes, permisos, SDK de pago en el teléfono ni credenciales en el frontend. Perfil → Mis compras y el PDF están implementados y se describen en [MIS_COMPRAS_Y_COMPROBANTES.md](MIS_COMPRAS_Y_COMPROBANTES.md). El plazo de recogida es de 24 horas; se difiere el control de entrega por personal. No requiere variables nuevas.

## Cómo probar
La cancelación ahora usa POST /api/pedidos/:id/cancelar. Necesita desplegar la rama backend feature/cancelar-pedido-productos; el despliegue inicial de productos no contiene esta ruta. El cliente confirma antes de cancelar y conserva los artículos. Se espera confirmación del servidor antes de borrar el pedido activo local. Pagos aprobados o en proceso no se dan por cancelados; errores de red o del servidor conservan el pedido para reintentar. No se realizan reembolsos.


Primero integrar y desplegar el backend `feature/pago-productos-mercadopago` siguiendo el flujo habitual. Sin ese despliegue, Render todavía no reconoce `/api/pedidos`; no realizar un pago todavía.

En CMD, en la app móvil:

```bat
cd /d "C:\Users\Latitude 5320 eq1\Documents\Proyectos\LadyBarberApp-pago-citas-mercadopago"
set "EXPO_PUBLIC_API_URL=https://ladybarberappbackend-prod.onrender.com/api"
npm start -- --go --clear
```

1. Iniciar sesión y agregar un producto con existencias. Abrir Carrito → Revisar pedido y pagar; comprobar el precio completo y las cantidades del resumen antes de continuar.
2. Abrir Mercado Pago con comprador y tarjeta de prueba, como se hizo con las citas. Si Android dirige a la cuenta personal, no pagar allí: copiar el enlace visible del pedido y abrirlo en Chrome incógnito con el comprador de prueba.
3. Volver a la app y consultar el estado. La aprobación solo debe mostrar Compra confirmada después de la transacción de stock/venta; conservar el folio para la recogida.
4. Repetir la consulta y cerrar/reabrir la app. No debe duplicarse la venta ni la resta del carrito. Comprobar que artículos adicionales permanezcan.
5. Probar pago pendiente/rechazado y salida del navegador sin pagar. Ninguno debe confirmar compra ni vaciar el carrito. Probar ambas apariencias y navegación inferior.
6. Si aparece Pago recibido, en revisión, no pagar otra vez: verificar existencias y logs del backend. El estado no autoriza una recogida confirmada ni ejecuta un reembolso automático.

Validación local: 542 pruebas móviles aprobadas en 77 suites, TypeScript sin errores y lint con cero errores y 36 advertencias. No se ejecutaron pagos reales ni se modificó la web.
