# Diseño del recorrido de armado

28/10/2026. Alcance: interfaz del configurador y presentación de componentes.

## Cambios

- Progreso basado en categorías seleccionadas y acceso a la próxima pendiente.
- Guía de función y comprobaciones para las ocho categorías.
- Confirmación accesible al añadir, reemplazar, quitar o cambiar la propiedad de una pieza.
- Navegación entre pasos también en escritorio, con desplazamiento al selector y respeto de reduced-motion.
- Búsqueda vacía con recuperación directa de resultados; se oculta la paginación cuando hay una sola opción.
- Resumen con categorías pendientes seleccionables, cambio de modelo y cambio entre pieza propia y compra.
- Total vacío representado con una raya, evitando presentar un equipo vacío como cotización de cero bolivianos.
- Marcas locales verificadas en las tarjetas; nombres tipográficos cuando no hay logotipo disponible.
- Ocho ilustraciones SVG originales de categoría sustituyen los iconos ampliados. No representan modelos exactos. Las imágenes de producto existentes tienen prioridad.

Se mantiene la identidad blanco/navy, los estados de selección y las transiciones existentes. No se añadieron dependencias ni se modificaron catálogo, precios, garantías o motor de compatibilidad.

## Archivos principales

- components/build/BuildWorkbench.tsx
- components/build/category-guide.ts
- components/catalog/ComponentCard.tsx
- components/catalog/HardwareStudy.tsx
- components/catalog/ProductVisual.tsx
- app/styles/assembly.css
- e2e/assembly-flow.spec.ts
- scripts/review-assembly.mjs

## Verificación

Seis pruebas de navegador pasan en escritorio y móvil para el nuevo recorrido y la vista conceptual. Revisión visual en claro, oscuro y a 320 px sin desbordes ni errores JavaScript. ESLint pasa en los archivos de esta entrega.

La compilación global no pudo completarse: TypeScript detectó que falta `slug` de tienda en app/_actions/admin.ts y lib/quote/__tests__/integration.test.ts. Esos archivos no se modificaron en esta entrega. Lint global presenta dos advertencias por tipos sin uso en scripts/import-prices.ts.

Capturas en output/review/assembly-*.png. Vista de desarrollo local: http://127.0.0.1:3003/build. No se publicó esta entrega.

## Continuidad y jerarquía — segunda entrega

- Se conserva automáticamente la selección local por pestaña. Volver desde una ficha combina la pieza elegida con el resto del equipo, sin perder el nombre, cantidades ni propiedad de una pieza que ya estaba seleccionada.
- Una build recibida explícitamente del servidor tiene prioridad sobre el borrador local. Los borradores guardan referencias al catálogo y recuperan las fichas actuales; no persisten precios ni permisos públicos.
- Se toleran borradores inválidos y almacenamiento bloqueado. El guardado explícito informa si no pudo escribir en la pestaña.
- El selector precede a la vista conceptual; en móvil se compactan las ilustraciones y los espacios. El resumen de tablet deja de superponerse al contenido.
- Deshacer recupera el estado anterior a quitar, reemplazar o cargar el equipo de prueba. No se presenta como historial completo.
- Avisos con nivel en español y botones que llevan a las categorías involucradas. Cantidades de RAM etiquetadas como kits.
- e2e/build-continuity.spec.ts cubre vuelta desde fichas, recarga, cantidades, propiedad, borradores dañados, almacenamiento bloqueado, combinación desde URL y deshacer.
- scripts/preview-offline.mjs permite revisar el catálogo de referencia sin cambiar .env.local: `node scripts/preview-offline.mjs`, `node scripts/preview-offline.mjs build` y `node scripts/preview-offline.mjs start`. Puerto 3003. Esta revisión no acredita conexión con PostgreSQL.
- Compilación de producción y TypeScript pasan en esta segunda entrega; los errores globales registrados en la primera revisión ya no se reproducen.
- Catorce pruebas de navegador pasan sobre la compilación de producción en escritorio y móvil. ESLint pasa en todos los archivos modificados. Capturas claro/oscuro/320 px regeneradas sin desbordes ni errores JavaScript.

## Carga y accesibilidad — tercera entrega

- Estados de carga compartidos para catálogo, fichas y configurador, con paneles de referencia visual, aviso de carga y animación suave que se desactiva con reduced-motion.
- El configurador utiliza el mismo estado mientras recupera la selección local.
- Si una imagen de producto falla, aparece la ilustración de su categoría y una etiqueta de foto no disponible. Las imágenes usan el texto alternativo de catálogo cuando está presente.
- Al quitar desde el resumen, el foco pasa a Deshacer; al deshacer, vuelve al título del equipo. El diálogo conserva cierre Escape y recuperación de foco.
- Controles principales del resumen y modos de vista con altura mínima de 44 px; etiquetas de preview más legibles; campos móviles con texto de 16 px.
- e2e/build-usability.spec.ts añade recorridos de teclado y ampliación del tamaño base de texto al 200%. Dieciséis pruebas pasan en producción para continuidad, usabilidad y catálogo/modal en escritorio y móvil.
- Build, TypeScript y ESLint de los archivos modificados pasan. Revisión en catálogo de referencia, sin acreditar conexión con PostgreSQL.
- scripts/review-usability.mjs comprueba cuatro anchos (320, 390, 768 y 1440) en claro/oscuro, sin desbordes ni errores JS. Las 16 muestras de contraste de textos/acciones principales superan 4.5:1. Es una revisión parcial y no acredita conformidad WCAG completa.
- Evidencia: output/review/usability-light.png, usability-dark.png y usability-contrast.json.

## Contenido pendiente

Las fotos exactas de los ocho modelos siguen pendientes de archivos y procedencia verificables. Las ilustraciones se identifican como esquemas de categoría. Agregar modelos adicionales o permitir componentes que no existen en el catálogo requiere ampliar el flujo de datos; la interfaz actual conserva el alcance de una referencia por categoría.
