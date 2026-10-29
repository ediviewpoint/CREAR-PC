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
- Fases 2–6: pendientes de implementación y aceptación.

## Migración y revisión de la fase 1

La migración agrega las tablas administrativas sin borrar las del configurador. Drizzle queda temporalmente en el subsistema público existente; el panel nuevo usa únicamente Prisma. La migración de los productos antiguos conserva `legacyComponentId` y `datosCompatibilidad`; no reescala snapshots históricos de proformas.

En una base nueva: `pnpm prisma:migrate` y `pnpm prisma:seed`. En la base existente: primero `pnpm prisma:adopt` verifica todos los hashes de las siete migraciones anteriores; `pnpm prisma:adopt --apply` solo registra el baseline. Después se ejecutan migración y seed. Nunca usar `prisma db push` o `migrate reset` contra producción.

El ADMIN inicial exige `ADMIN_EMAIL` y una `ADMIN_PASSWORD` de al menos 16 caracteres; el seed crea un hash bcrypt y no reinicia cuentas ya existentes. `AUTH_SECRET` debe ser un secreto independiente. No hay credenciales de ejemplo ni registro público. Google es opcional, solo permite cuentas previamente creadas y correos verificados del dominio configurado.

`pnpm test:admin:base` prepara PostgreSQL aislado en memoria, aplica ambas migraciones, crea cuentas efímeras y usa Chromium para probar acceso, roles, tema persistente, indicadores y drawer móvil. No usa la conexión de producción ni imprime contraseñas. Las capturas quedan en `output/admin-base/`.

El TC inicial 6,96 se muestra como respaldo sin verificar hasta configurar `TIPO_CAMBIO_URL`; no se presenta como cotización del día. El panel usa provisionalmente `/admin` para conservar la portada pública, pendiente de la respuesta del dueño. Las pantallas de fases siguientes indican claramente su estado y todavía no se consideran terminadas.
