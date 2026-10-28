# CDX-01 / CDX-02 — Fundación visual

## Archivos
- app/styles/tokens.css: primitivas y roles semánticos, temas, escala, movimiento.
- components/design/ArtDirectionBoard.tsx: moodboard editorial con chasis SVG original.
- app/styles/art-direction.css: estilos acotados al moodboard.
- components/design/ArtDirectionBoard.stories.tsx: claro, oscuro, sistema y 320 px en ambos temas.
- docs/DESIGN-BRIEF.md §17: decisiones de arte y precedencia de paleta.

## Integración
No hay scaffold ni package.json en el momento de esta entrega. No se instalaron
dependencias ni se reemplazaron rutas de producto. No se requiere una librería
de iconos, canvas, animación o imágenes externas.

Cuando esté el scaffold, importar tokens.css desde app/layout.tsx antes de los
estilos globales. Renderizar ArtDirectionBoard en una ruta interna de revisión;
su CSS ya importa los tokens, por lo que también funciona como muestra aislada.
Las stories están listas para integrar en Storybook cuando exista su configuración.

Usar next/font/local o el mecanismo de fuentes del scaffold para Inter Tight,
Inter y JetBrains Mono. Exponer las variables --font-inter-tight, --font-inter,
--font-jetbrains-mono en el ancestro de la vista. Sin archivos de fuentes se usan
fallbacks del sistema; no se afirma fidelidad tipográfica hasta cargarlas.

No redefinir el tamaño raíz: 1 rem = 16 px; el cuerpo UI usa .9375 rem (15 px).
No usar font-size: 15px en html, pues alteraría toda la escala.

Tema: data-theme="light" o "dark" en html; sin atributo sigue al sistema.
El token --on-primary evita texto blanco sobre primario claro en modo oscuro.
--border es decorativo; inputs y límites necesarios usan --border-control.
Los breakpoints se expresan en media queries (640 / 1025 px); custom properties
no pueden sustituir condiciones de media queries CSS nativas.

## Alcance y verificación pendiente
Los botones del espécimen están deshabilitados deliberadamente, porque no existe
configurador conectado. El enlace editorial sí navega y el campo permite escribir.
Las etiquetas de estados son muestras de lenguaje, no resultados del motor.

Revisión estática: roles de color, tamaños, SVG accesible sin IDs duplicados,
ancho fluido, foco y reducción de movimiento. Antes de aprobar visualmente:
ejecutar stories en 320/640/1024/1440 px, teclado, temas del sistema y explícitos,
fuentes reales y reduced-motion. Lint, typecheck, build y captura de navegador
quedan pendientes del scaffold. LCP y CLS corresponden a CDX-03 en una ruta real.