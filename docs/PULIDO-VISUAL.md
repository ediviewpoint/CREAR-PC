# Pulido visual — Goline y recorrido de producto

28/10/2026.

## Goline

public/brands/goline.svg sustituye la foto ampliada. Es una reconstrucción vectorial del identificador GO LINE observado en el empaque, con tipografía y geometría aproximadas, solicitada por el negocio. No se presenta como archivo original o aprobado por el fabricante. La referencia y procedencia se conservan en public/brands/SOURCES.md.

Todas las marcas usan ahora el mismo componente de imagen; se retiró el recorte CSS especial de Goline.

## Mejoras del recorrido

- Navegación principal con indicación de página activa.
- Selector de tema con iconografía custom; conserva su comportamiento sin persistencia ni cookies nuevas.
- Entrada progresiva de tarjetas con Motion, sin ocultar el contenido si falta JavaScript y respetando reduced-motion.
- Categorías de tarjetas en español y distintivo de pieza elegida.
- Modal de componente con ilustración, modelo, especificaciones y acceso a ficha técnica; diseño adaptable; cierre nativo con Escape y recuperación de foco.
- Estado de búsqueda vacía con botón para restablecer los filtros.
- Acceso al resumen en el configurador móvil y foco visual en el destino.
- Estados hover/focus en controles, tablas administrativas, políticas, formularios y pantallas de error.

No se modificaron productos, precios, motor de compatibilidad ni condiciones comerciales.

## Verificación final

- Build de producción y TypeScript pasan.
- Lint pasa sin advertencias.
- 24 pruebas de navegador pasan en PC y móvil sobre http://localhost:3002.
- 44 comprobaciones de rutas en claro/oscuro y 320/1440 px sin desborde ni errores JavaScript.
- Modales revisados visualmente en claro, oscuro y móvil.

La validación final de interacciones se ejecutó sobre el servidor de producción local, después de terminar la compilación, para evitar interferencias con las recompilaciones de desarrollo. El puerto 3002 es una revisión local, no un despliegue público.

Capturas: output/review/modal-pulido-escritorio.png, modal-pulido-oscuro.png, modal-pulido-movil.png y marcas-goline-vector-movil.png.
