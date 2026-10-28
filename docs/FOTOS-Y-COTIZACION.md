# Fotos y documento para entregar

## Fotos

Las fotos no son un requisito para descargar la cotización. Para que el catálogo muestre tus productos reales, colocar fotos del modelo exacto en public/products. Los ocho nombres están en public/products/README.md. Se detectan archivos WebP, JPG, JPEG y PNG, una imagen principal por modelo. Las imágenes registradas en la base de datos mantienen prioridad.

No existe aún un botón administrativo de subida: este flujo incorpora archivos al proyecto y requiere un nuevo despliegue para producción. Mientras falte una foto, permanece la ilustración identificada.

Los logos y nombres de marcas aparecen en catálogo, ampliación, ficha y configurador. Se añadieron las doce marcas solicitadas a la portada. Los nuevos nombres son tipográficos, a la espera de logotipos verificables; ver public/brands/SOURCES.md. No se amplió el catálogo ni se inventó stock.

## Documento actual

Desde Build: seleccionar piezas → revisar compatibilidad → preparar borrador local → completar datos del cliente → actualizar borrador y PDF → descargar.

El PDF muestra logo ELITEPC, cliente, emisor, fechas, componentes, cantidades, precio unitario, importe y totales. Las piezas propias quedan fuera de la compra. Los borradores conservan «Por cotizar» donde faltan precios y no incluyen un QR local engañoso. La edición de cliente se conserva en esta pestaña y regenera el PDF; no publica información del cliente.

Archivo de revisión: output/pdf/ELITEPC-borrador-revision.pdf. Ocho piezas en una hoja Carta. No es una cotización comercial emitida: cliente, precios y datos operativos están pendientes.

## Para emitir la cotización final

Completar docs/ENTREGA-COTIZACION.csv con los precios reales en Bs., tienda, disponibilidad y fecha de comprobación. Confirmar el nombre del cliente y los datos reales del emisor/contacto. Registrar ofertas verificadas en la administración existente y usar Generar proforma; no convertir el borrador en documento emitido cambiando solamente su etiqueta.

Las fotos de variantes comerciales concretas, especialmente la gráfica, deben coincidir con la referencia finalmente ofrecida. No usar la foto de otro fabricante para representar una tarjeta genérica de NVIDIA.

## Verificación

Build y TypeScript pasan con el catálogo de referencia. ESLint pasa en archivos modificados. Pruebas de navegador verifican las 19 marcas, el catálogo de ocho productos, edición de cliente, regeneración y descarga, además del recorrido de operación existente en PC y móvil. Seis pruebas de marcas/documento pasan tras el ajuste final de selectores; las diez pruebas de operación también pasaron en la revisión previa.

scripts/review-quote-delivery.mjs guarda el PDF, comprueba una página Carta y textos esenciales, y genera su imagen de revisión. scripts/review-brands.mjs revisa 7 logos locales y 12 nombres tipográficos en claro, oscuro y 320 px. Esta validación local no acredita emisión en PostgreSQL ni publicación de esta entrega.
