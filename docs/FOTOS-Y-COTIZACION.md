# Fotos y documento para entregar

## Fotos

Las fotos no son un requisito para descargar la cotización. Para que el catálogo muestre tus productos reales, colocar fotos del modelo exacto en public/products. Los ocho nombres están en public/products/README.md. Se detectan archivos WebP, JPG, JPEG y PNG, una imagen principal por modelo. Las imágenes registradas en la base de datos mantienen prioridad.

El panel permite subir la foto directamente en `/admin/componentes/nuevo` o al editar un producto. Acepta JPG, PNG y WebP hasta 3 MB; convierte la imagen a WebP y la guarda en la base de datos. No requiere modificar GitHub ni desplegar de nuevo. Los archivos de `public/products` siguen disponibles como alternativa. Mientras falte una foto, permanece la ilustración identificada.

Los logos y nombres de marcas aparecen en catálogo, ampliación, ficha y configurador. La portada incluye las diecinueve marcas confirmadas, diecisiete con archivo de logo local. Diamond y PUSKILL conservan nombre tipográfico por las excepciones documentadas en public/brands/SOURCES.md. Las marcas no crean productos ni stock automáticamente: las nuevas fichas se agregan desde el panel. Si un logo falla, su nombre sigue visible.

## Documento actual

Desde Build: seleccionar piezas → revisar compatibilidad → preparar borrador local → completar datos del cliente → actualizar borrador y PDF → descargar.

El PDF muestra logo ELITEPC, cliente, emisor, fechas, componentes, cantidades, precio unitario, importe y totales. Las piezas propias quedan fuera de la compra. Los borradores conservan «Por cotizar» donde faltan precios y no incluyen un QR local engañoso. La edición de cliente se conserva en esta pestaña y regenera el PDF; no publica información del cliente.

Archivo de revisión: output/pdf/ELITEPC-borrador-revision.pdf. Ocho piezas en una hoja Carta. No es una cotización comercial emitida: cliente, precios y datos operativos están pendientes.

## Para emitir la cotización final

Completar docs/ENTREGA-COTIZACION.csv con los precios reales en Bs., tienda, disponibilidad y fecha de comprobación. Confirmar el nombre del cliente y los datos reales del emisor/contacto. Registrar ofertas verificadas en la administración existente y usar Generar proforma; no convertir el borrador en documento emitido cambiando solamente su etiqueta.

Las fotos de variantes comerciales concretas, especialmente la gráfica, deben coincidir con la referencia finalmente ofrecida. No usar la foto de otro fabricante para representar una tarjeta genérica de NVIDIA.

## Verificación

Build y TypeScript pasan con el catálogo de referencia. ESLint pasa en archivos modificados. Pruebas de navegador verifican las 19 marcas, el catálogo de ocho productos, edición de cliente, regeneración y descarga, además del recorrido de operación existente en PC y móvil. Seis pruebas de marcas/documento pasan tras el ajuste final de selectores; las diez pruebas de operación también pasaron en la revisión previa.

scripts/review-quote-delivery.mjs guarda el PDF, comprueba una página Carta y textos esenciales, y genera su imagen de revisión. scripts/review-brands.mjs revisa 17 logos locales y 2 nombres tipográficos en claro, oscuro y 320 px. La revisión final pasa 111 pruebas unitarias/integración, 46 pruebas de navegador del sitio y 2 recorridos completos de administración en escritorio y móvil, además de lint global, TypeScript y build. La administración se verificó con PostgreSQL temporal, incluidos producto nuevo, foto, precio, publicación, edición, desactivación, emisión y descarga del PDF y conservación del documento emitido. Esto no acredita emisión en la base de producción ni publicación de esta entrega. El flujo operativo está en [ADMINISTRAR-PRODUCTOS.md](ADMINISTRAR-PRODUCTOS.md).
