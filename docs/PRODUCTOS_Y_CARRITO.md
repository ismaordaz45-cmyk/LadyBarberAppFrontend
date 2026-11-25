# Catálogo y carrito para recoger en el salón

La primera entrega incluye el catálogo y carrito móvil. El checkout implementado después se describe en [PAGO_PRODUCTOS.md](PAGO_PRODUCTOS.md); requiere desplegar las rutas nuevas del backend antes de probar un pago. No modifica el esquema ni el proyecto web.

## Diseño y arquitectura

- `components/productos/TiendaScreen.tsx`: pestañas Catálogo y Carrito, encabezado compartido con nombre/logo del negocio, búsqueda y filtros fijos, estados de carga/error/vacío y tarjetas responsivas. FlatList virtualiza las tarjetas; se muestran seis y se agregan seis con Ver más productos.
- `app/(tabs)/tienda.tsx` y el layout de Tabs mantienen la barra inferior actual. Productos se abre desde Inicio sin agregar una quinta pestaña inferior. `app/productos.tsx` redirige los enlaces anteriores a esta ruta.
- `useProductosViewModel`: conserva las existencias que antes se perdían, busca ignorando acentos, combina categorías realmente recibidas con disponibilidad y orden por precio. Cuando la API solo entrega la categoría Productos, no muestra categorías ficticias ni un selector redundante. Reinicia el límite al cambiar filtros; el filtrado no realiza nuevas consultas. Se vuelve a consultar al regresar al módulo.
- `useCarritoViewModel` → `CarritoRepository`: cantidades, eliminación, vaciado con confirmación y recuperación por cuenta. Solo se guardan identificadores y cantidades en el dispositivo; imágenes, precios y existencias se obtienen del catálogo. Totales estimados calculados en centavos. Desactivar o agotar un producto no elimina silenciosamente lo guardado: se solicita ajustar o quitarlo.
- `models/Carrito.ts`: reglas de cantidades enteras y existencias, normalización de datos guardados. El carrito no reserva ni descuenta inventario. Los límites de UI no sustituyen la futura validación en el servidor.
- `sessionStore.subscribe`: avisa cambios de sesión sin sondeo periódico. Se oculta inmediatamente el carrito anterior; las lecturas pendientes no pueden recuperar artículos de otra cuenta y las escrituras se serializan. No cambia contratos de autenticación ni el flujo de Mercado Pago.
- `ProductoCard` e `ImagenProducto`: imagen con respaldo, descripción, precio, existencias y Agregar; mismo diseño en temas claro/oscuro. No se agregan dependencias ni permisos.

## Prueba en teléfono con el backend actual de Render

En CMD:

```bat
cd /d "C:\Users\Latitude 5320 eq1\Documents\Proyectos\LadyBarberApp-pago-citas-mercadopago"
set "EXPO_PUBLIC_API_URL=https://ladybarberappbackend-prod.onrender.com/api"
npm start -- --go --clear
```

1. Abrir el QR en Expo Go, iniciar sesión y entrar desde Inicio → Productos. Verificar barra inferior y espacio del sistema con gestos o botones.
2. Buscar un producto, activar Disponibles, alternar precio y usar Ver más. Los filtros y encabezado deben permanecer visibles.
3. Agregar productos y abrir Carrito. Cambiar cantidades, comprobar el total y el límite de existencias, quitar un artículo y probar Conservar / Sí, vaciar.
4. Cambiar entre Inicio, Citas, Historial y Productos. El carrito debe conservarse. Cerrar sesión y entrar con otra cuenta: no debe mostrar los artículos anteriores. Entrar de nuevo con la primera cuenta y verificar recuperación.
5. Cerrar/reabrir la app y entrar con la misma cuenta. Comprobar persistencia y temas claro/oscuro. Ante errores de almacenamiento se muestra aviso y reintento; no se sustituye un carrito que no pudo leerse.

No hace falta desplegar cambios del backend para explorar el catálogo o editar el carrito. El botón Revisar pedido y pagar sí requiere el nuevo backend desplegado. No se necesita otro pago de cita.

## Estado local
La barra inferior incluye Carrito (icono de carrito) y abre esa sección directamente. Inicio → Productos conserva la entrada al catálogo. Ambos accesos usan la misma instancia de tienda, carrito y pago. Perfil → Mis compras y comprobantes utiliza el icono de bolsa de compras.

Después de agregar y guardar un producto se muestra una confirmación breve con animación y Ver carrito, también dentro de la vista previa. Respeta la reducción de movimiento del dispositivo. No muestra éxito al fallar el guardado ni después de cambiar de cuenta. No requiere despliegue del backend ni nuevas dependencias.

El catálogo permite tocar la imagen o la información de la tarjeta para abrir una vista previa con imagen completa, descripción, precio y existencias. Incluye Agregar al carrito y Seguir explorando, además de cierre con X o Atrás. Conserva filtros y posición del catálogo; reutiliza las reglas del carrito sin nuevas consultas ni cambios del backend o de pagos.

Pedidos, pagos, Mis compras, vista previa y PDF guardable están implementados. El comprobante muestra un plazo de 24 horas; se difieren códigos y control de entrega única. Falta integrar/desplegar backend y probar checkout y guardado en teléfono.

## Validación local
542 pruebas móviles en 77 suites; TypeScript sin errores y lint sin errores (36 advertencias). No se hicieron commits ni push.
