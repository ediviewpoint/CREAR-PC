# Auditoría del recorrido visual

28/10/2026. Inspección de código y navegador local en http://127.0.0.1:3003. No se modificó el producto durante esta auditoría.

## Avance posterior a la auditoría

Implementados: selección automática por pestaña, combinación de la pieza de una ficha con el equipo existente, prioridad de builds guardadas explícitas, recuperación de nombre/propiedad/cantidades, selector antes del preview, resumen de tablet sin superposición sticky, deshacer de eliminación/reemplazo/equipo de prueba, etiquetas de kits de RAM y acceso desde avisos a las categorías involucradas. La ficha ahora muestra la categoría en español.

Las secciones siguientes conservan los hallazgos originales para trazabilidad. Fotografías exactas, armonización de marca, modelos propios fuera del catálogo y auditoría completa de accesibilidad continúan pendientes. Guardar en sessionStorage no equivale a guardar en línea; el borrador se conserva en la pestaña actual y depende de que el navegador permita almacenamiento.

## Prioridad 1 — Continuidad de la selección

Reproducido: cargar ocho componentes, abrir la ficha del procesador desde la tarjeta y pulsar «Usar en mi build». El configurador vuelve con una sola pieza. El estado inicial usa el componente de la URL, sin combinarlo con el equipo anterior. La selección local solo se escribe al guardar o preparar borrador; no protege automáticamente este recorrido.

Objetivo: conservar la selección al consultar fichas y combinar el componente elegido con el equipo existente, manteniendo piezas propias y cantidades. Hace falta definir la recuperación inicial y la prioridad entre una build guardada, el borrador local y el componente de la URL.

## Prioridad 2 — Seleccionar antes de explorar

Sin desbordes horizontales en 320, 390, 768 y 1440 px. Sin embargo, la vista conceptual, los tableros y las instrucciones desplazan la acción principal. Medición orientativa con viewport de 900 px de alto: el botón de añadir apareció a unos 2350 px en móvil, 3480 px en tablet y 2730 px en escritorio. Son coordenadas de una sesión de desarrollo, no métricas de rendimiento.

Objetivo: mostrar la categoría y su acción antes; compactar el preview, reservar el tablero completo al modo Categorías y ofrecer acceso permanente al selector. Revisar especialmente la posición sticky del resumen de tablet para que no compita con el contenido.

## Prioridad 3 — Estados y acciones reversibles

- Falta deshacer después de quitar o reemplazar una pieza.
- «Cargar equipo de prueba» sustituye la selección completa inmediatamente; debería preservar el trabajo previo o permitir recuperarlo.
- El aviso de selección se ubica junto al buscador, aunque la acción de quitar también está en el resumen. Revisar una confirmación cercana a cada acción.
- Los conflictos aparecen con códigos técnicos y mensajes; pueden ofrecer un acceso directo a las categorías involucradas usando los datos `involved` del reporte actual.
- Cantidad de RAM requiere una etiqueta explícita de kits, con cantidad de módulos y capacidad resultante cuando los datos permitan calcularlo.

## Prioridad 4 — Contenido y alcance

- Solo hay una referencia por categoría por decisión del MVP: no es un fallo del filtro ni debe ampliarse el catálogo automáticamente.
- «Ya lo tengo» permite identificar un modelo existente en el catálogo; no registra piezas arbitrarias. Conviene aclararlo y diseñar el futuro flujo de modelo no encontrado con validación técnica.
- Fotos exactas de los ocho productos pendientes. Conservar las ilustraciones identificadas como esquemas hasta tener archivos y procedencia verificables.
- La GPU puede ser opcional para completitud si el procesador tiene gráficos integrados; la presentación 8/8 no debe confundirse con el criterio técnico del motor.

## Prioridad 5 — Coherencia de marca y lenguaje

- Encabezado y pie presentan ELITEPC con CREAR PC como producto; favicon y OG conservan los activos geométricos originales de CREAR PC. Revisar su convivencia como un sistema de marca.
- La ficha de producto imprime la clave de categoría (`cpu`, `mobo`, etc.) en lugar de la etiqueta española.
- Homogeneizar «build», «equipo», «chasis/gabinete» y textos de acciones sin cambiar el significado técnico.
- Revisar encabezado y logotipo a tamaños pequeños, en tema oscuro y en previsualizaciones para compartir.

## Prioridad 6 — Cierre visual verificable

- Pantallas de carga para catálogo y configurador: no hay archivos loading.tsx en estas rutas.
- Auditoría específica de contraste y tamaños de interacción; las pruebas de desborde no acreditan WCAG AA.
- Comprobar teclado, foco después de quitar/reemplazar y zoom de texto al 200%.
- Revisar tiempos de carga y estabilidad sobre una compilación de producción después de resolver los errores globales de TypeScript.
- El tema elegido no se conserva al recargar. Es una decisión pendiente de experiencia, no un fallo en la alternancia actual.

Orden recomendado: continuidad de selección → jerarquía del selector → deshacer y conflictos accionables → imágenes y marca → accesibilidad y carga.
