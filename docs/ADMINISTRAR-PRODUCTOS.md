# Productos y cotizaciones

## Entrar desde la web

Elegí **Admin** en el menú superior o **Administración** al pie de cualquier página. Ambos accesos llevan a `/admin`: si no hay sesión, se solicita la contraseña; si ya ingresaste, abren el panel directamente. No se necesita nombre de usuario. En el ingreso, **Mostrar / Ocultar** permite comprobar la contraseña antes de enviarla.

Dentro del panel, el menú señala la sección actual. **Volver a la web** permite revisar el sitio público y **Cerrar sesión** termina el acceso administrativo. El resumen ofrece accesos a añadir productos, importar CSV y consultar el catálogo, junto con avisos de productos publicados sin precio disponible. En Productos se puede filtrar por estado y por disponibilidad de precio.

## Preparación del sitio publicado

GitHub guarda el código. El alojamiento ejecuta la aplicación y PostgreSQL guarda productos, fotos, tiendas, precios y proformas. Configurar `DATABASE_URL` y `ADMIN_PASSWORD` (mínimo 16 caracteres) en el servidor; aplicar las migraciones con `npm run db:migrate` antes de usar el panel. Las fotos cargadas se respaldan junto con la base de datos. Esta entrega no aplica cambios a la base comercial ni despliega automáticamente.

Sin `DATABASE_URL` se muestra el catálogo de referencia, sin administración persistente. Con una base configurada se muestran sus productos publicados, incluso si el catálogo queda vacío. Una caída de la base muestra un error recuperable y no sustituye tus productos por ejemplos.

## Agregar un producto

### Completar con Claude

En **Añadir producto** o **Editar**, usar **Completar con Claude**: pegar la referencia exacta, una descripción o la ficha del fabricante. Si el nombre ya está escrito, puede usarse sin repetirlo. **Buscar fuentes en la web** permite consultar datos del modelo; desmarcarlo para extraer únicamente del texto pegado.

Claude muestra una propuesta de identificación y especificaciones con su fuente y los datos pendientes. **Aplicar a campos vacíos** conserva lo que ya escribiste. Para sustituirlo, marcar explícitamente **Reemplazar campos ya completados**. En productos existentes no se cambia la categoría ni el identificador del enlace. Revisar los datos antes de guardar; una propuesta no publica ni guarda automáticamente.

Para varias fichas, abrir **Cargar con IA** desde el resumen o el listado. Pegar hasta diez productos por tanda, revisar las propuestas, corregir nombres y marcas y seleccionar cuáles guardar. Se crean como borradores sin fotos, precios ni garantía comercial. Los identificadores repetidos se rechazan sin guardar una tanda parcial.

Las consultas y búsquedas usan el saldo de tu cuenta de Claude. Solo se envía el texto de productos introducido para la consulta; no se adjuntan credenciales, precios ni clientes del catálogo. Los campos desconocidos o con valores sin respaldo se dejan pendientes.

1. Entrar a `/admin/login` con la contraseña configurada en el servidor.
2. Abrir `/admin/componentes` → **Añadir producto**.
3. Escribir nombre, marca y categoría. Revisar el identificador del enlace: queda fijo después del alta.
4. Completar la ficha técnica con los datos del fabricante, usando los campos del formulario. Se admiten nueve categorías: CPU, GPU, placa madre, RAM, almacenamiento, fuente, gabinete, disipador y refrigeración AIO.
5. Subir una foto del modelo exacto (JPG, PNG o WebP, hasta 3 MB). La foto es opcional; se puede reemplazar o quitar después.
6. **Guardar borrador** permite continuar más tarde. Para publicar, completar los datos técnicos y el enlace de la fuente, marcar **Publicar en el catálogo y configurador** y guardar.
7. En **Precio y disponibilidad**, elegir **Con precio** o **Por cotizar**. Con precio, escribir el importe real en Bs., la cantidad opcional y si está disponible para vender. La primera vez, completar ahí mismo el nombre y la ciudad reales de tu tienda; se reutilizará en los siguientes productos.
8. Guardar registra ficha, fotos, tienda inicial y precio en una sola operación. Un error no deja un producto creado a medias. Para conservarlo sin publicar, usar **Guardar borrador**; si está marcada la publicación también se ofrece ese botón para guardar sin exigir una ficha técnica completa.

Los productos publicados aparecen en catálogo y configurador. Si no tienen oferta vigente disponible, muestran **Por cotizar**. Los precios propios se mantienen hasta actualizarlos o retirarlos; las cotizaciones externas conservan la vigencia de siete días. El stock informado no se descuenta ni reserva automáticamente al emitir una proforma.

Para modificar tu precio o disponibilidad, abrir la ficha del producto. Si no cambian, guardar no duplica observaciones; si cambian, se conserva el historial anterior. **Por cotizar** retira el precio propio al guardar. No elimina las cotizaciones de otras tiendas, que se gestionan en `/admin/precios` y pueden seguir mostrándose si son válidas. Las proformas emitidas conservan su copia original de los importes.

En `/admin/tiendas` y `/admin/precios` se registran tiendas y cotizaciones externas. Esas entradas requieren fuente y vencen a los siete días; el panel, el feed y la importación externa no reemplazan los precios propios del formulario.

## Editar o retirar

### Galería y copias

Cada producto admite hasta seis fotos JPG, PNG o WebP, de 3 MB cada una. Usá **Añadir otras vistas** para ampliar la galería y **Elegir foto principal** para decidir qué imagen representa al producto. Las descripciones se editan junto a cada vista. Marcá las vistas que quieras quitar y guardá; si retirás la principal, otra foto conservada ocupa su lugar.

**Duplicar**, en el listado, crea una ficha nueva como borrador con sus especificaciones y garantía. Revisá el nombre y la referencia exacta antes de publicarla. La copia necesita sus propias fotos y precios.

### Importación CSV

En **Importar CSV**, descargá la plantilla de la categoría y guardá el archivo como CSV UTF-8. Se admiten hasta 100 productos y 1 MB. Primero elegí **Validar y previsualizar**: se revisan las columnas, los datos y los identificadores ya existentes. Después confirmá la importación.

Todos los productos importados quedan como borradores, sin fotos ni precios. Si alguna fila es inválida o un identificador ya existe al confirmar, no se guarda ninguna fila del archivo. Corregí el CSV y volvé a validarlo.

Buscar el producto en el listado y elegir **Editar**. Guardar actualiza la ficha y conserva su identificador. Si otra persona cambió el mismo producto, se pide recargar para evitar sobrescribirlo.

**Desactivar** retira la pieza del catálogo y del configurador, conservando su registro y las cotizaciones ya emitidas. **Publicar** permite reactivarla si la ficha está completa. No hay eliminación irreversible en este panel.

## Entregar una cotización

En `/build`, elegir componentes, cantidades y piezas propias; revisar compatibilidad y precios. Completar los datos reales del emisor en las variables de entorno documentadas en `.env.example`. Con datos y ofertas verificados, elegir **Generar proforma**, completar el cliente y emitir. El documento conserva una copia de los importes y condiciones al momento de emitirlo; las ediciones posteriores del catálogo no lo recalculan.

Si faltan datos o precios, usar **Preparar borrador local**. Este documento permite revisar y descargar un PDF, pero no sustituye una proforma comercial emitida. No inventar importes, disponibilidad ni información del cliente.

## Revisión aislada para desarrollo

Después de `node scripts/preview-offline.mjs build`, ejecutar `node scripts/admin-review-server.mjs`. Este proceso crea una base temporal en memoria y abre el sitio en `http://127.0.0.1:3004`. Sus precios, tienda y emisor son ficticios y se pierden al detenerlo; no lee ni escribe la base comercial.

En otra terminal PowerShell:

```powershell
$env:ADMIN_E2E='1'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3004'
npx playwright test e2e/admin-products.spec.ts --project=chromium --workers=1
```

La prueba usa exclusivamente la contraseña del entorno aislado definida en ese script. No usarla como contraseña del sitio publicado.
