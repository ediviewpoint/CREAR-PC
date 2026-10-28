# Preparación para operar el sitio

## Diagnóstico del 28 de octubre de 2026

La conexión configurada en el entorno local respondió al diagnóstico de solo lectura: 8 productos, 0 tiendas, 0 precios, 0 equipos guardados y 0 proformas. Esto describe esa base en el momento de consultar; no verifica qué variables tiene el alojamiento publicado ni certifica que los productos sean datos comerciales definitivos.

La revisión de configuración detectó dos pendientes: `LEGAL_NIT` y `NEXT_PUBLIC_SITE_URL` con el origen HTTPS definitivo. Las demás variables esenciales están presentes y superan comprobaciones de formato; sus valores e identidad comercial deben ser confirmados por el responsable del negocio. No se guardan credenciales en este documento.

La comprobación inicial detectó que faltaba `components.warranty_months`. Se verificó que las cinco migraciones anteriores coincidían con el historial, sin huecos ni cambios de contenido, y se aplicó `0005_product_warranty` mediante el migrador. La verificación posterior confirmó seis migraciones aplicadas, ninguna pendiente y todas las tablas y columnas esenciales presentes. Se conservaron los 8 productos y las cantidades de las demás tablas.

Después se incorporó `0006_own_store_prices` para distinguir la tienda propia de las cotizaciones externas. Se verificó el historial antes de aplicarla y la base quedó actualizada sin crear tiendas ni precios. La creación y edición incluyen precio y stock en el mismo formulario: al guardar el primer precio se solicitan los datos reales de la tienda. Los precios propios no vencen a los siete días. La actualización pasó 119 pruebas automatizadas y ocho recorridos de navegador en escritorio y móvil, además de la compilación de producción y lint.

La navegación posterior añadió **Admin** en el menú público y **Administración** al pie, ingreso con opción de mostrar u ocultar contraseña, redirección de sesiones activas al resumen, sección activa y regreso a la web. El resumen incluye accesos rápidos y avisos de precios faltantes; Productos permite filtrar por disponibilidad de precio. Diez recorridos de escritorio y móvil verificaron acceso, cierre de sesión y operación del panel. La entrada desde la portada también se comprobó contra la base configurada, sin crear registros.

La compilación de producción y las 112 pruebas de aplicación pasaron. El panel se revisó en `http://127.0.0.1:3005` contra la base configurada: acceso, listado de 8 productos, apertura de una ficha existente con garantía, pantalla CSV, precios públicos por cotizar y redirección de visitantes sin sesión. Esa revisión de navegador no creó ni editó registros. Evidencia local: `output/review/connected-admin-report.json`.

Para repetir esa revisión, iniciar una compilación de producción en el puerto 3005 y ejecutar `node scripts/review-connected-admin.mjs`. Si Playwright no tiene un navegador instalado, definir `QA_CHROMIUM` con la ruta de un Chromium local. El script carga la contraseña desde el entorno y no la imprime.

## Comandos de diagnóstico

```powershell
npm run production:check
npm run db:check
npm run db:migrations:check
npm run test:production-config
npm run test:migration-history
```

`production:check` no abre conexiones de red ni modifica archivos. Carga las variables de entorno y muestra únicamente nombres, estados y acciones pendientes. Termina con código 1 si hay pendientes; esto es un resultado de diagnóstico esperado. Detecta configuración local, contraseñas de revisión y varios valores de ejemplo. No puede comprobar la autenticidad de los datos proporcionados.

`db:check` usa una transacción de solo lectura. Comprueba conexión, cantidades y algunas tablas y columnas esenciales. No aplica migraciones, crea productos ni consulta datos de clientes. Un resultado positivo no acredita todo el historial de migraciones ni la configuración de respaldos.

`db:migrations:check` compara el historial aplicado con las fechas y hashes de los archivos de esta versión, también en solo lectura. Señala migraciones pendientes, contenido modificado, entradas desconocidas, duplicados y huecos. Si existe catálogo sin historial, indica que debe revisarse la adopción antes de usar el migrador.

Ejecutá estos comandos también en el entorno de destino: las variables locales no demuestran que el alojamiento esté configurado.

## Datos que debe aportar el negocio

| Dato                                        | Dónde se configura                                              |
| ------------------------------------------- | --------------------------------------------------------------- |
| Origen público HTTPS definitivo             | `NEXT_PUBLIC_SITE_URL`                                          |
| Razón social, NIT, dirección y ciudad       | `LEGAL_RESPONSIBLE`, `LEGAL_NIT`, `LEGAL_ADDRESS`, `LEGAL_CITY` |
| Correo y WhatsApp verificados               | `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_SUPPORT_WHATSAPP`     |
| Productos y especificaciones definitivas    | Panel → Componentes                                             |
| Fotos del modelo exacto y garantía ofrecida | Ficha de cada producto                                          |
| Tiendas reales                              | Panel → Tiendas                                                 |
| Precio propio en Bs. y disponibilidad       | Ficha del producto → Precio y disponibilidad                    |

La contraseña administrativa debe configurarse como secreto del servidor. Usá una propia, distinta de la contraseña del entorno aislado. No copies credenciales en GitHub, documentos, capturas ni variables `NEXT_PUBLIC_`.

## Orden de puesta en marcha

1. Confirmar el alojamiento, dominio y base persistente de destino. Configurar sus secretos y datos comerciales.
2. Confirmar un respaldo recuperable de esa base antes de aplicar cambios de esquema. Revisar el historial y aplicar las migraciones pendientes con `npm run db:migrate` en el destino correcto.
3. Cargar tiendas y ofertas reales. Revisar productos, fotos y garantías; publicar únicamente fichas completas. La importación CSV crea borradores y no agrega precios.
4. Ejecutar los diagnósticos en el destino y compilar de nuevo después de cambiar variables públicas, que Next.js incorpora al navegador durante la compilación.
5. Publicar la versión revisada. En el dominio HTTPS, entrar al panel, cargar y recuperar una foto, armar un equipo y emitir una cotización de prueba identificada como tal. Confirmar numeración, cliente, precios, vigencia, descarga del PDF y que los cambios posteriores no alteren el documento emitido.
6. Confirmar que un visitante sin sesión no puede administrar productos ni ver fotos de borradores.

No ejecutar semillas de demostración sobre la base comercial para completar datos faltantes.

## Respaldos y recuperación

Confirmar en el proveedor de PostgreSQL la frecuencia de respaldo, retención y responsable de recuperación. Las fotos cargadas desde el panel se almacenan en la base: el respaldo debe incluir `component_images`, además del catálogo, ofertas, equipos, proformas y sus contadores.

Antes del uso comercial, restaurar un respaldo en una base separada. Verificar cantidades, abrir una foto y recuperar una proforma histórica con su PDF. Documentar fecha, resultado y tiempo de recuperación sin incluir credenciales ni datos de clientes. No restaurar sobre la base comercial como prueba.

La revisión local no configura ni garantiza los respaldos del proveedor. La publicación y el ensayo en el dominio de destino quedan pendientes hasta tener acceso y datos definitivos.
