# data/prices — Precios y tiendas verificados

Fuente de verdad versionada para alimentar la tabla `prices` sin inventar datos.

## Archivos

- `stores.json` — tiendas que operan. Vacío por defecto.
- `offers.json` — observaciones de precio por tienda/componente. Vacío por defecto.
- `stores.example.json`, `offers.example.json` — plantillas, **no se cargan**.

## Flujo

```
pnpm prices:check          # valida sin tocar la base
pnpm db:import-prices      # aplica en transacción (requiere DATABASE_URL)
```

El script hace upsert idempotente de tiendas por `slug` y, para cada oferta,
inserta un registro nuevo en `prices` conservando el historial. Los filtros de
`selectCurrentOffers` muestran solo la oferta más reciente por tienda.

## Esquema de `stores.json`

| campo       | requerido | formato                                      |
| ----------- | --------- | -------------------------------------------- |
| `slug`      | sí        | kebab-case, único (ej. `mi-tienda-santa-cruz`) |
| `name`      | sí        | 2–120 chars                                  |
| `city`      | sí        | 2–80 chars                                   |
| `address`   | no        | string                                       |
| `phone`     | no        | string                                       |
| `whatsapp`  | no        | string                                       |
| `website`   | no        | URL                                          |
| `isActive`  | no        | boolean (default `true`)                     |

## Esquema de `offers.json`

| campo           | requerido | regla                                                                 |
| --------------- | --------- | --------------------------------------------------------------------- |
| `componentSlug` | sí        | slug existente en la tabla `components`                               |
| `storeSlug`     | sí        | slug declarado en `stores.json`                                       |
| `amountBob`     | sí        | número > 0, ≤ 1 000 000, se guarda con 2 decimales                    |
| `inStock`       | sí        | boolean                                                               |
| `stockQty`      | no        | entero ≥ 0                                                            |
| `observedAt`    | sí        | ISO datetime, no futuro, dentro de los últimos 7 días                 |
| `sourceUrl`     | sí        | URL HTTPS de la página donde se observó el precio                     |

Las mismas reglas que aplica `lib/catalog/offers.ts::selectCurrentOffers`. Si
una oferta no cumple, nunca aparecerá en el catálogo público — mejor rechazarla
en la importación.

## Qué NO hacer

- Inventar tiendas o precios para "llenar" el catálogo. Si falta un dato real,
  dejar `offers.json` sin esa entrada; el UI muestra "Por cotizar".
- Capturar `observedAt` en el futuro o con más de 7 días de antigüedad.
- Usar monedas distintas de BOB. Para USD habría que ampliar el filtro primero.
- Scrapear tiendas bolivianas de forma agresiva (ver `CLAUDE.md`).
