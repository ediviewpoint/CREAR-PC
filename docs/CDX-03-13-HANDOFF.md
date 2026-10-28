# CDX-03 a CDX-13 / Cinco tandas visuales

## Tanda 1: CDX-12 / CDX-13

- public/brand/: wordmark, monograma C.PC e isométrico. SVG y PNG transparentes
  1x/2x/3x en navy, monocromo profundo y blanco inverso.
- favicon-16/32/48/180.png, favicon.ico, apple-touch-icon.png y favicon.svg
  adaptable a prefers-color-scheme.
- og-default.png: 1200x630. Fuentes PDF y licencias en public/fonts/.
- app/layout.tsx: icons, Open Graph y Twitter.
- app/api/og/proforma/[id]/route.ts: @vercel/og, nombre y total desde la misma
  instantánea usada por la web/PDF. IDs inexistentes o no públicos responden 404.
- Regenerar assets: node scripts/generate-brand.mjs.

## Tanda 2: CDX-03

- app/page.tsx, components/landing/CaseExperience.tsx y visuals/CaseDrawing.tsx.
- Headline y CTAs solicitados, tres features y origen local.
- SVG técnico original: responde al mouse sin auto-spin. Reduced-motion mantiene
  el dibujo estático. Sin imágenes pesadas ni Three.js.
- Capturas en output/qa/landing-light-1440.png, landing-dark-1440.png y
  landing-light-320.png.

## Tanda 3: CDX-04 / CDX-05

- app/(app)/build/page.tsx y components/build/BuildWorkbench.tsx.
- Tres paneles a partir de 1024 px, dos paneles + resumen inferior en tablet.
- Estado cliente, motor evaluateBuild(BuildView), formatBob, potencia con margen,
  eliminación de piezas y separación de componentes propios.
- ComponentCard, ProductVisual y ProductZoom en components/catalog/.
- Modal nativo con foco, cierre Escape y devolución de foco al disparador.
- La validación parcial nunca se presenta como equipo completo.
- Generar proforma requiere compatibilidad, piezas esenciales, algún componente
  por comprar y precios conocidos. Prepara un borrador local sin inventar un
  correlativo oficial ni llamar a acciones con precios cero.
- Capturas: output/qa/build-light-320.png, build-light-768.png,
  build-light-1440.png, build-dark-320.png y build-dark-1440.png.

## Tanda 4: CDX-07 / CDX-08

- app/(app)/catalog/page.tsx y catalog/[cat]/[slug]/page.tsx.
- Filtros de categoría/marca/nombre/precio; el límite de precio excluye piezas sin
  cotización. Galería con zoom, especificaciones y espacio para benchmarks con
  fuente. No se fabrican fotografías, stock, tiendas ni resultados de rendimiento.
- lib/catalog/load.ts valida los JSON disponibles con schemas del dominio. La UI
  usa esquemas vectoriales claramente identificados si no hay fotos.
- app/(app)/proforma/[id]/page.tsx y components/proforma/ProformaPDF.tsx.
- PDF Carta 612x792 pt (215.9x279.4 mm), Inter y JetBrains Mono registradas
  localmente, QR, cliente, emisor, cantidades, totales, descuento y condiciones.
- La vista web inserta exactamente el PDF; ofrece además una tabla HTML accesible
  basada en la misma instantánea. No se promete equivalencia píxel a píxel entre
  el HTML de apoyo y el PDF.
- /proforma/ejemplo y output/pdf/crear-pc-ejemplo.pdf son ejemplos identificados
  con importes ficticios; /proforma/local lee el borrador de esta pestaña.
- Proformas guardadas: lib/proforma/load.ts consume los repositorios existentes
  solamente cuando el build está marcado isPublic. No expone documentos privados.
  Comprueba que los totales reconstruidos coincidan con los almacenados.
- No se modificaron lib/db/, lib/compat/, lib/pricing/, data/seed/ ni políticas.

## Tanda 5: CDX-09 / CDX-10 / CDX-11

- Ocho SVG custom en components/icons/, trazo 1.5 px. Sin Lucide.
- Motion: reveal 400 ms/stagger 60 ms; cards lift 2 px/scale 1.015; cambio de
  categoría 320 ms; resumen flash navy 300 ms; check 500 ms; error shake 2 px/200 ms.
- Reduced-motion elimina desplazamiento, escala, giro y tiempos no esenciales.
- components/build/useBuildWizard.ts: botones, swipe horizontal y progreso.
- En <640 px se muestra una categoría y una pieza candidata a la vez; botones
  permiten recorrer alternativas. Desktop conserva la grilla, paginada a 6 piezas.
- Todas las superficies son opacas; blanco, navy y neutros fríos de tokens.css.
  Estados con símbolos y texto; sin rojo/verde/ámbar.

## Verificación

- npm run typecheck, npm run lint, npx vitest run y npm run build.
- node scripts/verify-visual.mjs: rutas, filtros, modal Escape, piezas propias,
  bloqueo del build incompleto, wizard por botones y swipe, temas, 320/768/1440,
  reduced-motion, PDF, OG y dimensiones de favicons.
- node scripts/verify-local-proforma.mjs: PDF generado en cliente y URL blob.
- node scripts/render-pdf-qa.mjs: texto PDF, Carta, una página, rasterización.
- node scripts/check-pdf-layout.mjs: ocho filas, condiciones y QR en una hoja.
- node scripts/verify-performance.mjs: build de producción en :3011, 390x844,
  caché desactivada, 1.6 Mbps, latencia 150 ms, CPU x4.
- Resultado observado antes del último ajuste del pie PDF: LCP 1128 ms;
  CLS 0.000034. Medición local de laboratorio, no datos de usuarios reales.
- Evidencia y reportes JSON: output/qa/. Comprobar las rutas después de cada
  cambio de dataset o integración de precios.

## Límites que siguen siendo de datos/backend

Ver CDX-NEEDS-LOGIC.md. El catálogo visual lee seeds; no inventa precios en Bs.
Los precios, fotografías y benchmarks se conectan mediante CatalogComponent.
Las acciones existentes aún asignan unitPriceBob=0 y no conservan la propiedad
de piezas: no se usan para emitir una cotización que podría resultar incorrecta.

## Cierre de esta entrega
- 36 tests pasan. TypeScript y build de producción pasan.
- ESLint: cero errores; tres avisos en archivos previos a estas tandas.
- Los archivos de components/build y app/(app)/build se comprobaron además con
  --no-ignore. Se corrigió la entrada genérica build de .gitignore a /build/,
  para que Git y Prettier conserven esas rutas de producto.
- Verificación de navegador final completada sin page errors.
- PDF de ejemplo y prueba compacta de ocho filas renderizados e inspeccionados.
- Precio/stock ausentes se muestran como pendientes; emisión oficial y snapshots
  quedan descritos en CDX-NEEDS-LOGIC.md.
