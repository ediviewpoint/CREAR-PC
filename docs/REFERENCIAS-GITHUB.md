# Revisión de repositorios de referencia

Revisados el 28/10/2026 a petición del responsable. No se importaron código, dependencias, plantillas ni datasets.

| Repositorio | Qué se verificó | Decisión para CREAR PC |
| --- | --- | --- |
| https://github.com/modernharp/PCPartsPicker | La raíz pública muestra únicamente README.md. Describe un servicio externo, precios regionales y plantillas; no publica la implementación de esas funciones. | Referencia conceptual. No hay código visible que podamos aprovechar. Las plantillas por presupuesto requieren más productos y precios reales que el MVP actual. |
| https://github.com/seanbrwh/PcPartPickerClone | README y estructura raíz con src, Server y DB. Declara React, Material UI, Redux, Express y PostgreSQL. | Posible referencia general de organización, sin ventaja demostrada frente al configurador actual. No se incorporó su estructura. |
| https://github.com/iambotcoder/BuildYourPC | README y estructura raíz de una aplicación JSP/Servlets/MySQL, con funciones descritas de tienda y ensamblado. | Referencia conceptual; sin beneficio concreto de integración para la interfaz Next.js actual. |

Las carpetas internas de los dos últimos repositorios y sus archivos de código no pudieron recuperarse por la herramienta web en esta revisión. No se evaluó la corrección de sus motores, seguridad ni cálculos; las funciones mencionadas arriba son descripciones de sus README, no capacidades probadas.

Se continuó con una mejora propia de presentación: estado para cotizar en el resumen, distinguiendo completitud, compatibilidad y precios de compra, sin cambiar la lógica de emisión.
