# Panel ElitePC · especificación del 29/10/2026

La especificación entregada por @elias el 29/10/2026 es la autoridad de este trabajo. Se implementan seis fases consecutivas, cada una con pruebas, commit y nota de lo pendiente. La versión publicada anterior se conserva mientras la rama `feat/admin-elitepc-20261029` se verifica.

## Fases y aceptación

1. **Base y layout:** modelos Prisma de la sección 9, migración y seed; Auth.js v5, bcrypt, roles y auditoría; sidebar de 104/240 px y drawer móvil; topbar con búsqueda, tipo de cambio, sucursales, tema y usuario; dashboard de cuatro indicadores. Aceptación: sesión, navegación, temas y TC.
2. **Listado:** API validada con roles, búsqueda y filtros en URL, paginación, tabla y tarjetas móviles, columnas persistentes, selección y acciones masivas transaccionales, edición rápida, arrastre fraccional y estados vacíos. Aceptación: 2.000 productos, búsqueda numérica y orden persistente.
3. **Formulario:** todos los bloques de la sección 5, schema compartido, título automático, centavos y BOB/USD, S/F y C/F, ofertas y costo, stock por sucursal, Blob, destacados, puntos clave, specs, etiquetas y opciones; historial, borrador local y conflictos. Aceptación: ejemplo 6.9 manual y permisos vendedor.
4. **IA:** SDK oficial de Claude, Route Handlers protegidos, normalización, evidencia y confianza, reintento de salida, SSE y plazo de 45 s, duplicados, fusión y deshacer; modelo exacto con caché; funciones de redacción; uso y límites; 12 fixtures y `test:ia`. Aceptación: cero inventos en fixtures, duplicados y revisión de precios.
5. **Batch e importación:** trabajos persistentes por ítem con concurrencia 3, texto/Excel/CSV/visión, mapeos reutilizables, bandeja, decisiones de duplicados, exportación y reporte. Aceptación: 20 productos y actualización por SKU sin duplicados.
6. **Integraciones:** ficha PDF y cotización con importes congelados, WooCommerce, WhatsApp, cron de ofertas con historial, interfaz ERP y Configuración completa. Aceptación: producto de IA → WordPress/PDF/WhatsApp sin retrabajo.

## Reglas transversales

- Next.js App Router, TypeScript, Tailwind, Prisma/PostgreSQL, Auth.js v5, SDK oficial de IA y Vercel Blob. Sin un nuevo framework ni ORM alternativo para el panel.
- Todos los montos nuevos son enteros en centavos. No reinterpretar ni reescalar snapshots históricos de proformas.
- Cada escritura de producto genera historial y cada consulta IA registra uso. Roles y ocultamiento del costo se controlan en el servidor.
- Toda salida IA es una propuesta; nunca se guarda o publica sin revisión y confirmación. No inventar datos faltantes.
- No introducir secretos en código, respuestas, cliente o repositorio.
- Las decisiones no especificadas se documentan con `// DECISION:`.
- Ventas, Tesorería, Contabilidad e Inventario ERP permanecen deshabilitados, sin pantallas que simulen operaciones reales.

## Confirmaciones pendientes

- Correo del ADMIN inicial (se conservará la contraseña actual únicamente al crear su hash inicial).
- Ubicación del panel: la especificación usa `/`, pero esa URL ya contiene la web pública. Se solicitó confirmar `/admin` o subdominio administrativo.
- Confirmar recargo C/F del 16%, SKU con prefijo Z y búsqueda web inicialmente desactivada. Los valores se mantienen configurables.
- El proveedor ya elegido por el dueño es Claude; la clave existente se conserva solo en secretos del servidor.

## Progreso

- Fase 1: implementada y verificada localmente. Prisma aplica ambas migraciones y seed idempotente en PostgreSQL aislado; pruebas de unicidad, permisos, bloqueo y auditoría pasan. Chromium verifica sesión real de ADMIN/LECTOR, dashboard, TC con aviso de respaldo, temas persistentes y drawer móvil. Lint y build de producción pasan. Pendiente de activación real: correo ADMIN, AUTH_SECRET y URL del tracker; no se migró ni desplegó producción.
- Fase 2: listado principal implementado y criterios de aceptación verificados localmente: 2.000 productos en menos de un segundo en PostgreSQL aislado, búsqueda por `5480` y `5.480`, orden fraccional persistente. Incluye filtros/paginación/orden en URL, chips, tabla y tarjetas móviles, selección, precio y disponibilidad rápidos con conflictos de versión, historial, borrado suave ADMIN, duplicación como borrador, categorías rápidas, columnas guardadas por usuario y límite de escrituras persistente. Chromium verifica además arrastre con teclado, columnas tras recargar, creación/renombrado de categorías, selección por pulsación larga y respuestas 401/403. Build, lint y 138 pruebas automatizadas pasan. Las acciones Excel, PDF, cotización y WordPress se conectarán en las fases 5/6 que las implementan; todavía no se ofrecen como acciones operativas.
- Fase 3: formulario manual funcional con schema compartido, precios en centavos, título automático, inventario por sucursal, variantes, etiquetas, galería Blob, editores reordenables, descripción enriquecida, borradores locales, control de versión e historial. La prueba en navegador crea y edita un producto y verifica sus centavos e historial; el servidor rechaza escritura de vendedores y oculta costos. Las fases 4–6 siguen pendientes; la especificación completa aún no está terminada.

## Preparación del despliegue

Fase 5: Batch con texto, imagen y Excel/CSV, separación automática o manual, concurrencia de tres, trabajos persistidos y reanudables, revisión editable, decisiones de duplicados, guardado idempotente por ítem, reintento/descarte y reporte CSV. Importación con hojas, mapeo sugerido/reutilizable, vista previa y resolución por SKU; exportación Excel con hoja de specs. Verificado con 20 propuestas en PostgreSQL y prueba de navegador que importa CSV, mapea, revisa y guarda. Las fotos de listas usan visión de Claude y las imágenes importadas se descargan/procesan en Blob. Sigue la fase 6 de integraciones.

Fase 4: extracción con SDK oficial de Claude, SSE, plazo de 45 segundos, validación/reintento, evidencia de specs, normalización determinista, confianza, duplicados, revisión y deshacer. Búsqueda de modelo con base interna/caché, fuentes y comparación; destacados, puntos clave, título, descripción, etiquetas, categoría y traducción desde menú IA. Uso y límites se registran en PostgreSQL. Las claves permanecen solo en servidor. Prueba real de 12 fixtures: 57 campos comprobados, cero inventos y cero diferencias en esa ejecución; ejemplo completo de 4–6 segundos para extracción. Pruebas simuladas cubren fusión y evidencia, reintento y duplicados sin guardado automático; Chromium comprueba extracción simulada → revisar → guardar en PostgreSQL. Esto no garantiza precisión universal fuera de los textos evaluados. Batch e integraciones todavía pendientes.

Se creó y conectó el almacén público Blob `elitepc-productos` a producción y preview. El secreto Auth.js se genera fuera del repositorio. La migración administrativa es aditiva y el catálogo anterior se incorpora con `scripts/migrate-admin-products.ts`, idempotente, conservando identificadores de compatibilidad y proformas. Productos sin precio propio confirmado pasan a borrador y revisión; no se inventa stock por sucursal.

DECISION: para no bloquear al dueño por un correo aún no definido, si no hay ningún ADMIN activo el primer ingreso con la contraseña anterior vincula el correo que el dueño escriba. La operación tiene bloqueo transaccional, límite de intentos y auditoría, y se cierra permanentemente después de crear esa primera cuenta. No permite crear usuarios adicionales. El seed con ADMIN_EMAIL continúa siendo otra opción de aprovisionamiento.

## Migración y revisión de la fase 1

La migración agrega las tablas administrativas sin borrar las del configurador. Drizzle queda temporalmente en el subsistema público existente; el panel nuevo usa únicamente Prisma. La migración de los productos antiguos conserva `legacyComponentId` y `datosCompatibilidad`; no reescala snapshots históricos de proformas.

En una base nueva: `pnpm prisma:migrate` y `pnpm prisma:seed`. En la base existente: primero `pnpm prisma:adopt` verifica todos los hashes de las siete migraciones anteriores; `pnpm prisma:adopt --apply` solo registra el baseline. Después se ejecutan migración y seed. Nunca usar `prisma db push` o `migrate reset` contra producción.

El ADMIN inicial exige `ADMIN_EMAIL` y una `ADMIN_PASSWORD` de al menos 16 caracteres; el seed crea un hash bcrypt y no reinicia cuentas ya existentes. `AUTH_SECRET` debe ser un secreto independiente. No hay credenciales de ejemplo ni registro público. Google es opcional, solo permite cuentas previamente creadas y correos verificados del dominio configurado.

`pnpm test:admin:base` prepara PostgreSQL aislado en memoria, aplica ambas migraciones, crea cuentas efímeras y usa Chromium para probar acceso, roles, tema persistente, indicadores y drawer móvil. No usa la conexión de producción ni imprime contraseñas. Las capturas quedan en `output/admin-base/`.

`pnpm test:admin:base --productos` agrega 2.000 productos efímeros y verifica las operaciones del listado contra sus rutas reales. `prisma/productos.test.ts` comprueba consultas, conversión de búsquedas de precio, stock por sucursal, costos omitidos, conflicto de versión, orden, borrado suave, duplicación sin inventar existencias y rollback de acciones masivas.

DECISION: TanStack Table se fija en la versión estable 8 para usar su API documentada. `fractional-indexing` genera claves de orden; PostgreSQL las compara con `COLLATE "C"`. Al reordenar con filtros se buscan los vecinos reales para evitar colisiones con filas ocultas. Los lotes cuentan una solicitud para el límite de 60 escrituras por minuto y generan un historial por cada producto afectado.

El TC inicial 6,96 se muestra como respaldo sin verificar hasta configurar `TIPO_CAMBIO_URL`; no se presenta como cotización del día. El panel usa provisionalmente `/admin` para conservar la portada pública, pendiente de la respuesta del dueño. Las pantallas de fases siguientes indican claramente su estado y todavía no se consideran terminadas.
