# Logos de marcas — ELITEPC

## Logos incorporados en la revisión final

Se añadieron diez SVG locales: Toshiba, Seagate, Western Digital, Hitachi, Kingston, Crucial, MSI, Hikvision, TEAMGROUP y Apacer. La procedencia exacta está en DOWNLOADS.json. Algunos son símbolos monocromos de Simple Icons, otros son archivos de marca conservados en repositorios de recursos; no se atribuyen a descargas directas del fabricante. Los nombres junto a cada símbolo identifican la marca. Se ajustó únicamente el lienzo SVG para quitar márgenes internos excesivos, conservando trazados, colores y proporciones.

Referencias de contraste de identidad: https://www.msi.com/page/msi-logos, https://www.kingston.com/, https://www.westerndigital.com/company/newsroom/brand-assets, https://www.hikvision.com/, https://www.teamgroupinc.com/en/, https://www.apacer.com/en/. Las marcas pertenecen a sus respectivos titulares; los archivos no acreditan una alianza comercial.

Se descartaron explícitamente un icono de instalador .msi, un icono ajeno rotulado Western Digital y un marcador genérico de Hikvision. La revisión visual está en output/review/brand-assets-contact-sheet.png. Los SVG incorporados no contienen scripts, manejadores de eventos ni referencias a recursos HTTP externos.

Pendientes externos: Diamond necesita identificar el fabricante exacto. Para PUSKILL se localizó un PNG identificado como oficial en https://github.com/WesleySMacedo/puskill-ai-ready/blob/236829fb2f67a8c38ccfc029312462600fb2181f/public/assets/branding/logo_puskill_oficial_black.png; los conectores de esta sesión rechazan el contenido binario y la descarga directa desde el proceso local está bloqueada. Ambas marcas conservan su nombre tipográfico; no se fabricó un logo sustituto. El texto de ampliación siguiente describe el estado anterior a esta revisión.

## Ampliación solicitada

El responsable añadió Toshiba, Seagate, Western Digital, Hitachi, Kingston, Crucial, MSI, Hikvision, TEAMGROUP, Apacer, PUSKILL y Diamond. Se muestran por ahora como nombres tipográficos neutrales; no son recreaciones de sus logotipos. La descarga directa de nuevos archivos no estuvo disponible en este entorno. Sustituirlos por originales verificables cuando se proporcionen los archivos. No se asigna a Diamond una identidad comercial concreta más allá del nombre dado por el responsable, ni se confunde Hikvision con Hiksemi.

La ampliación solo afecta a presentación y reconocimiento de marcas; conserva los ocho componentes del MVP y no declara stock. Las fuentes opcionales de lib/brand-showcase.ts son páginas de referencia; no se presentan como procedencia de archivos que no se descargaron.

Descargados el 28 de octubre de 2026. La lista de marcas trabajadas fue confirmada por el responsable de ELITEPC en la conversación. No representa stock, certificación ni un programa de socios.

| Marca     | Archivo local        | Procedencia del archivo                                                                                                             |
| --------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| AMD Ryzen | amd-ryzen.svg        | https://upload.wikimedia.org/wikipedia/commons/4/49/AMD_Ryzen_logo.svg                                                              |
| Intel     | intel.svg            | https://upload.wikimedia.org/wikipedia/commons/6/6a/Intel_logo_%282020%2C_dark_blue%29.svg                                          |
| ASUS      | asus.svg             | https://www.asus.com/media/img/2017/images/n-logo-asus.svg                                                                          |
| GIGABYTE  | gigabyte.svg         | SVG inline del encabezado de https://www.gigabyte.com/                                                                              |
| ASRock    | asrock.svg           | https://upload.wikimedia.org/wikipedia/commons/0/01/ASRock_Logo.svg                                                                 |
| MacroVIP  | macrovip.png         | https://macrovip.com/wp-content/uploads/2023/08/macrovip-logo.png                                                                   |
| Goline    | goline-packaging.png | https://static.doocacommerce.com.br/chipbyte/product/placa-mae-goline-intel-1155-gl-b75-ma-1625001863789_1200x628%2Bfill_ffffff.png |

## Identificación y uso

Ryzen se presenta como familia de procesadores AMD. Intel aparece una sola vez, con el descriptor procesadores/plataforma Intel; no se atribuye a Intel la fabricación de todas las placas con chipset Intel.

Goline: no se localizó un archivo independiente oficial fiable. Se conserva la foto original del empaque GL-B75-MA como referencia. A pedido del negocio se reemplazó el recorte ampliado por goline.svg: una reconstrucción vectorial del identificador GO LINE visible en el empaque, con tipografía y geometría aproximadas. No es un archivo descargado ni aprobado por el fabricante. Debe sustituirse por su original cuando esté disponible. No se utilizó el logo de Goline.ai, que corresponde a otra empresa. No se importan las condiciones de garantía del empaque o del comercio de referencia.

Los archivos se sirven localmente; no hay hotlinking en la página. Los SVG se verificaron contra contenido activo obvio antes de guardarse. La imagen raster inicial de Intel se sustituyó por un SVG limpio.

Los archivos originales conservan sus colores y proporciones. Goline es la excepción de reconstrucción vectorial documentada arriba, usando navy y blanco. La atribución de titulares figura en la sección pública. La disponibilidad web de un archivo no constituye una cesión de derechos ni prueba una relación comercial oficial con el fabricante.

Páginas de procedencia:

- AMD Ryzen: https://commons.wikimedia.org/wiki/File:AMD_Ryzen_logo.svg
- Recursos oficiales AMD: https://www.amd.com/en/partner/browse-by-product/ryzen-resources.html
- Intel: https://commons.wikimedia.org/wiki/File:Intel_logo_(2020,_dark_blue).svg
- ASUS: https://www.asus.com/
- GIGABYTE: https://www.gigabyte.com/
- ASRock: https://commons.wikimedia.org/wiki/File:ASRock_Logo.svg
- MacroVIP: https://macrovip.com/es/
- Goline: https://www.chipbyte.com.br/intel/placa-mae-goline-intel-lga-1155-gl-b75-ma/2122

## Integración

Datos de presentación: lib/brand-showcase.ts. Componente: components/brand/BrandsSection.tsx. Estilos: app/styles/brands.css. Ubicación: portada, ancla /#marcas. Entrada Motion con reduced-motion respetado; sin carrusel automático.

No se agregaron componentes al catálogo, migraciones ni dependencias. Claude puede conectar posteriormente su administración de marcas, conservando estas fuentes y la separación entre marcas trabajadas e inventario actual.
