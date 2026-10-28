# Cierre de la versión mínima

Alcance: ocho piezas compatibles, una por categoría. No ampliar el catálogo para cerrar esta versión.

## Paso 1 — Configurador y borrador

- Catálogo limitado a ocho productos, sin precios inventados.
- Equipo completo compatible con un clic.
- Borrador PDF de una página, con importes «Por cotizar».
- Al preparar el borrador se conserva también la selección local.
- Desde el borrador se puede volver al configurador y pulsar «Recuperar selección local».
- La selección local permanece en la misma pestaña; no equivale al guardado en PostgreSQL ni a un enlace compartible.

## Paso 2 — Datos reales de operación

Antes de emitir cotizaciones comerciales:

- Confirmar las ocho piezas que se ofrecerán realmente.
- Registrar tienda, precio en Bs., disponibilidad y fuente verificada desde la administración existente.
- Confirmar nombre y contacto del emisor, correo de contacto y condiciones operativas.
- Configurar NEXT_PUBLIC_CONTACT_EMAIL: es la variable que usa /contacto. El correo de respaldo actual debe confirmarse antes de publicar.

No cargar precios de ejemplo en producción. Sin ofertas verificadas, conservar el flujo de borrador.

## Paso 3 — Publicación

- Definir URL pública y configurar NEXT_PUBLIC_SITE_URL.
- Configurar DATABASE_URL, ADMIN_PASSWORD y CRON_SECRET en el hosting como secretos.
- Revisar el acceso administrativo y ejecutar lint, TypeScript, tests y build antes del despliegue.
- Abrir catálogo, configurador, build guardado y PDF desde la URL publicada; comprobar acceso privado desde otra sesión.
- Revisar los textos legales existentes con el responsable antes del uso comercial.

La base local conectada y el build de producción no prueban que exista un despliegue público. La publicación y los datos comerciales aún están pendientes.

## Paso 4 — Revisión visual y entrega

Revisar juntos las fichas de los ocho productos, las imágenes y el aspecto final. Entregar URL pública, instrucciones de administración y comprobación del recorrido completo.