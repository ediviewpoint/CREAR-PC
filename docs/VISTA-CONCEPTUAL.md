# Vista conceptual — Preview Studio

Actualizado el 28/10/2026.

## Qué ofrece

- Ensamblado: gabinete conceptual con ocho puntos seleccionables y guías de ubicación.
- Por piezas: separación de las capas; las guías acompañan las posiciones de cada componente.
- Categorías: tablero de ocho tarjetas con icono, marca, modelo, estado y cantidad cuando corresponde.
- Control Marcas: alterna la identificación por marca sin alterar la selección.
- Inspector: nombre completo, tres especificaciones, pieza propia/seleccionada, enlace de ficha y botón para elegir/cambiar.
- Progreso por categorías, estados vacíos y representación discontinua de lo pendiente.
- Móvil: Mostrar vista permite desplegar el panel; controles y mapa verificados a 320 px.

Explorar zonas o tarjetas mantiene la vista en su lugar. Solo Elegir/Cambiar lleva el foco al selector del configurador. Los controles son botones de teclado y el modelo de cada tarjeta seleccionada está asociado mediante aria-describedby.

## Marcas

PreviewBrand.tsx utiliza los logos locales verificados de lib/brand-showcase.ts. Para AMD en procesadores muestra AMD Ryzen. Si una marca del componente no tiene un logo disponible, muestra su nombre tipográfico —por ejemplo NVIDIA, Kingston, Samsung, Corsair o DeepCool— sin inventar un logotipo ni una alianza comercial.

## Archivos

- components/build/BuildPreview.tsx: modos, tablero, puntos e inspector.
- components/build/PreviewBrand.tsx: identificación de marca.
- components/visuals/CaseDrawing.tsx: capas SVG y offsets compartidos para el despiece.
- app/styles/preview-studio.css: sistema visual adaptable, container queries y reduced-motion.
- e2e/concept-preview.spec.ts: selección, categorías, marcas, transformación real del despiece, navegación y eliminación de piezas.

No se agregaron dependencias, componentes al catálogo, precios, stock ni datos comerciales. La vista es conceptual: no simula dimensiones, ventilación ni geometría exacta de los modelos.

## Vista previa estable

La configuración normal conserva .next. Para revisar en paralelo sin que otra compilación reemplace los archivos estáticos, CREARPC_PREVIEW=1 utiliza .next-preview, excluido de Git, lint y escaneo general de TypeScript.

En PowerShell, compilar primero:

```powershell
$env:CREARPC_PREVIEW='1'
pnpm build
```

Después, con la misma variable:

```powershell
$env:CREARPC_PREVIEW='1'
pnpm exec next start --port 3002 --hostname 127.0.0.1
```

No ejecutar una nueva compilación contra .next-preview mientras se valida esa misma instancia. Las compilaciones normales de otras tareas pueden continuar en .next.

## Revisión

Build, TypeScript y lint pasan. Capturas de estados vacío, ensamblado, despiece, categorías, oscuro y móvil disponibles en output/review/preview-studio-*.png. Revisión a 320 px sin desbordes ni errores JavaScript. El script de revisión comprueba que CSS esté cargado antes de capturar.

URL local: http://127.0.0.1:3002/build. Cargar equipo de prueba y alternar las tres vistas. No es un despliegue público.
