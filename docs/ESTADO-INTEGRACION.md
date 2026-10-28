# CREAR PC — Versión mínima funcional

Actualizado: 28/10/2026.

## Alcance acordado

Una pieza por categoría: ocho componentes compatibles. El estilo de los productos
y las ampliaciones del catálogo se revisarán después.

La conexión proporcionada ya funciona y se guardó únicamente en .env.local.
Se aplicaron las migraciones 0000 a 0003 y se importaron solo ocho componentes.
No hay tiendas, precios ni stock ficticios. Los datasets amplios permanecen como
referencia local, pero no se cargan ni se muestran en esta versión.

## Probar

1. Abrir http://localhost:3000/catalog: aparecen ocho productos.
2. Abrir http://localhost:3000/build.
3. Pulsar “Cargar equipo de prueba”.
4. Pulsar “Preparar borrador local”.

El PDF muestra “Por cotizar” para los importes desconocidos y conserva la marca
BORRADOR. Una proforma emitida no acepta precios pendientes.
El guardado privado del build está conectado a PostgreSQL.

## Selección base

- AMD Ryzen 5 9600X.
- ASUS PRIME B650M-A WiFi.
- Kingston FURY Beast DDR5-5600, kit 2x16 GB.
- NVIDIA GeForce RTX 4060.
- Samsung 990 PRO 1 TB.
- Corsair CX650 650 W.
- DeepCool CH370.
- DeepCool AK400.

La selección se define en lib/catalog/mvp.ts y el importador está limitado a ella.

## Verificación

- 57 tests pasan, incluida compatibilidad de las ocho piezas.
- 16 pruebas de navegador pasan en desktop y móvil.
- TypeScript, lint y build de producción pasan.
- Borrador de ocho filas renderizado e inspeccionado: una página Carta.
- Conexión real comprobada: 8 componentes, 0 tiendas y 0 precios.
- RLS activado en las tablas de la aplicación; acceso directo de anon y
  authenticated revocado. Next.js conserva los controles de propietario y admin.

## Después

Revisar el diseño y sustituir las piezas base por el inventario que se vaya a usar.
Para cotizaciones comerciales se ingresarán precios y disponibilidad verificados.
No se continuará cargando el catálogo completo sin indicación del usuario.

Evidencia: output/review/catalogo-minimo.png y
output/pdf/crear-pc-borrador-minimo.pdf.

## Carga de precios y tiendas verificados

Flujo versionado (no reemplaza el panel /admin, lo complementa para datos auditables).

- Archivos en `data/prices/`: `stores.json` y `offers.json`. Vacíos por defecto —
  nunca completar con datos ficticios.
- Validación en `scripts/import-prices.ts` con las mismas reglas que
  `selectCurrentOffers`: moneda BOB, monto > 0, `sourceUrl` HTTPS, `observedAt`
  no futuro y dentro de los últimos 7 días.
- Tiendas identificadas por `slug` kebab-case (migración 0004). Upsert idempotente
  por slug; el insert de ofertas conserva historial.
- Comandos:
  - `pnpm prices:check` — valida los JSON sin tocar la base.
  - `pnpm db:import-prices` — aplica en transacción. Requiere `DATABASE_URL`.
