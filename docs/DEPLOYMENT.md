# Publicación de CREAR PC

Proyecto: `merlasmvz-5229s-projects/crear-pc`.
Dominio principal verificado: https://www.ofertas333.com.
Alias: https://crear-pc.vercel.app y https://ofertas333.com.

## Verificación y publicación

```powershell
npm run lint
npm run typecheck
npm test
npm run test:production-config
npm run test:migration-history
npm run test:review-database
npm run build
```

Después de revisar y subir el commit a GitHub, desplegar al proyecto ya vinculado:

```powershell
npx --yes vercel deploy --prod --yes
```

Las variables de producción se gestionan en Vercel; no subir `.env.local` ni copiar sus valores en archivos del repositorio. Las variables públicas se incorporan durante la compilación, por lo que requieren un nuevo despliegue después de cambiarlas.

## Base de datos

Verificar el destino y el historial antes de aplicar migraciones:

```powershell
npm run db:check
npm run db:migrations:check
```

`db:check` y `db:migrations:check` son de solo lectura. Para aplicar las pendientes en el destino confirmado, usar `npm run db:migrate`. No ejecutar semillas de demostración sobre la base comercial.

Las migraciones hasta `0006_own_store_prices` están aplicadas en la base configurada. Se mantienen los ocho productos iniciales; las tiendas, precios y disponibilidad reales se cargan desde el panel.

## Comprobación posterior

```powershell
npm run smoke -- --base=https://www.ofertas333.com
```

Comprobar también el acceso público **Admin**, el ingreso con contraseña, el listado de productos y la visualización móvil. Los ensayos que crean productos y proformas deben usar `scripts/admin-review-server.mjs` con su base aislada, no la base comercial.

`GET /api/health` comprueba conexión y presencia de variables. No confirma por sí solo precios vigentes, identidad comercial ni copias de seguridad.

## Datos comerciales y recuperación

La publicación técnica no sustituye la carga del NIT, precios, stock y datos reales del negocio. Consultar [preparación de producción](PREPARAR-PRODUCCION.md) y [administración de productos](ADMINISTRAR-PRODUCTOS.md).

Para revertir una publicación, promover desde Vercel un despliegue anterior conocido. Esto no revierte migraciones ni datos de PostgreSQL. Confirmar respaldos y ensayar restauraciones en una base separada.

## Limpieza

Se retiraron los scripts antiguos que modificaban secretos, dominios y conexiones automáticamente, y cuatro revisiones locales sustituidas por las pruebas vigentes. No se usan como mecanismo de despliegue. `.vercelignore` excluye archivos de entorno, cachés, compilaciones y resultados locales del paquete publicado.
