# Privacidad

Actualizada el 28 de octubre de 2026 · Bolivia

## Alcance y responsable

Este aviso describe el código de la versión mínima de CREAR PC, el configurador de ELITEPC. Antes de abrir el servicio comercial al público se debe completar la identidad legal del responsable y publicar un canal operativo en [Contacto](/contacto).

No se presentan correos de privacidad ni direcciones físicas sin confirmar como si fueran canales activos.

## Datos que utiliza esta versión

- Catálogo y configuración: piezas, cantidades, nombre del build y cuáles ya tenés.
- Guardado en línea: esos datos y un identificador de propietario derivado de una cookie aleatoria.
- Proforma emitida: nombre del cliente y, si los ingresás, CI/NIT y teléfono, junto con los ítems y las condiciones de la cotización.
- Borrador local: configuración y documento guardados en el almacenamiento de la pestaña.
- Administración: cookie de sesión para el personal que inicia sesión.

No se solicitan tarjetas ni se procesan pagos. No hay cuentas de clientes con Clerk ni analítica de visitas instalada en esta versión. Los servidores y sus proveedores pueden tratar registros técnicos necesarios para operar el servicio; su configuración debe revisarse al publicar.

## Uso y visibilidad

Los datos se usan para guardar tu configuración, controlar el acceso y generar el documento solicitado. No hay envío automático a WhatsApp ni reparto automático de tus datos a tiendas.

Un build privado requiere el navegador autorizado o acceso administrativo. Si activás la opción de enlace público, su configuración será visible para quien tenga el enlace; los datos personales del cliente de una proforma no forman parte de esa vista pública. Evitá poner nombres completos o teléfonos en el título de un build público.

Las proformas guardadas tienen controles de propietario y administración. Compartir el PDF descargado divulga los datos que elegiste incluir.

## Dónde se guarda

La base de datos conectada utiliza Supabase PostgreSQL. El despliegue previsto utiliza Vercel; no se afirma aquí que el hosting público ya esté activo. La región de alojamiento, los proveedores de registros y las condiciones de tratamiento deben documentarse con la configuración definitiva. No se garantiza desde este aviso una localización específica ni una equivalencia legal internacional.

## Conservación

El borrador local depende del almacenamiento de la pestaña. Podés eliminarlo al limpiar los datos del sitio; cerrar la pestaña normalmente finaliza esa sesión, aunque algunos navegadores la restauran.

Los builds y las proformas guardados permanecen en la base hasta que se eliminen. Esta versión no tiene una tarea automática de borrado por antigüedad. No prometemos anonimización a los 30 días ni eliminación a los dos años que el sistema todavía no ejecuta. Antes de la operación comercial se debe aprobar y configurar un período de conservación justificado.

## Consultas y derechos

Podés solicitar información sobre tus datos y pedir corrección o eliminación a través del canal real que se publique en [Contacto](/contacto). No envíes una copia completa de tu documento por defecto: primero se debe acordar una verificación proporcional de titularidad.

La Constitución reconoce la privacidad y contempla la Acción de Protección de Privacidad respecto de registros públicos o privados. Consultá los [arts. 21 y 130 de la Constitución (SENAPI)](https://www.senapi.gob.bo/normativas/constitucion-politica-del-estado/constitucion-politica-del-estado-plurinacional-de-bolivia).

## Medidas implementadas

El acceso administrativo y el acceso de propietario se comprueban en el servidor. Las cookies de sesión son HttpOnly; la conexión pública debe utilizar HTTPS. La base tiene controles de acceso y RLS activado. No afirmamos que exista MFA, BotID, una política de backups verificada ni un plazo automático de notificación de incidentes de 72 horas.

Ver el detalle de [cookies y almacenamiento](/politicas/cookies). Este aviso se actualizará si cambia el tratamiento de datos.
