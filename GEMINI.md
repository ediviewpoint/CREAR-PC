# GEMINI.md — Punto de entrada para Google Gemini

**Tu misión:** poblar CREAR PC con **datos reales y verificables** de componentes de PC, precios bolivianos, benchmarks y reglas de compatibilidad. Tu búsqueda web y manejo de datos tabulares son tu ventaja — usala.

---

## 1. Antes de empezar

Leé en este orden:
1. [`README.md`](./README.md) — Visión general.
2. [`docs/DATA-SCHEMA.md`](./docs/DATA-SCHEMA.md) — **TU ESQUEMA**. Entidades, campos, unidades.
3. [`docs/COMPATIBILITY-RULES.md`](./docs/COMPATIBILITY-RULES.md) — Reglas que vas a codificar.

---

## 2. Tus tareas (lista corta — detalle en README §7.2)

- `GEM-01` Esquema de datos completo (ya tenés base en DATA-SCHEMA.md — proponé mejoras).
- `GEM-02` Dataset de **CPUs** (~200 modelos actuales).
- `GEM-03` Dataset de **GPUs** (~150 modelos).
- `GEM-04` Dataset de **placas madre** (~250).
- `GEM-05` Dataset de **RAM**.
- `GEM-06` Dataset de **cases**.
- `GEM-07` Dataset de **PSUs**.
- `GEM-08` Dataset de **almacenamiento**.
- `GEM-09` Dataset de **coolers** (aire + AIO).
- `GEM-10` **Reglas de compatibilidad** (ya documentadas, revisá y completá).
- `GEM-11` **Precios bolivianos** (Santa Cruz: Compumundo, PCWorld, Compushop, Multicenter, etc. — **verificar vigencia antes de citar**).
- `GEM-12` Script de recolección periódica de precios.
- `GEM-13` **Benchmarks** por componente.
- `GEM-14` Recomendador por propósito/presupuesto.
- `GEM-15` Fórmula de consumo total.
- `GEM-16` Detector de cuello de botella.
- `GEM-17` Normalización de unidades.
- `GEM-18` **Fuentes y citas** en cada entry.

---

## 3. Formato de entrega

Carpeta `data/seed/`:

```
data/seed/
├── cpus.json
├── gpus.json
├── mobos.json
├── ram.json
├── storage.json
├── psus.json
├── cases.json
├── coolers_air.json
├── coolers_aio.json
├── stores.json
├── prices.json
└── benchmarks.json
```

Cada archivo es un **array de objetos** que cumple el schema Zod definido por Claude. Ejemplo de un entry en `cpus.json` está en `docs/DATA-SCHEMA.md §10`.

**No usar comentarios** (JSON puro). Si necesitás contexto en dev, usar campo opcional `_notes`.

---

## 4. Reglas de calidad inviolables

1. **Unidades SI**. Siempre. mm, W, GHz, MB/s, Bs.
2. **Decimales de precio**: `3800.00`, nunca `3800`.
3. **Slugs estables**: `<marca>-<modelo>-<diferenciador>`, lowercase, kebab.
4. **`sources[]` lleno** — mínimo 1 URL por entry crítico.
5. **`fetchedAt`** en ISO 8601 UTC.
6. **Nombres oficiales de fabricante**. Nada de "RTX4070" si el fabricante escribe "RTX 4070".
7. **Si una spec no está disponible**: `null` + nota en `_notes`. **Nunca inventar.**
8. **Precios bolivianos**: fecha explícita + tienda explícita + rango (mín–máx) + URL si existe.
9. **Imágenes**: URL temporal del fabricante acceptable (Claude las migra a Vercel Blob).

---

## 5. Precios en Bolivia — tiendas de referencia

**Verificá vigencia antes de citarlas** (algunas pueden haber cerrado o cambiado nombre):

- Compumundo (Santa Cruz, La Paz)
- PCWorld Bolivia
- Compushop
- Multicenter
- Mega Supertienda
- Innova Store
- Tiendas en Mercado Mutualista (Santa Cruz)
- Mall Ventura (Santa Cruz)
- Tecnologic (Santa Cruz)
- Mercado Libre Bolivia (precios de particulares, usar con cautela)

Para cada tienda, idealmente incluir:
- Nombre.
- Ciudad.
- Teléfono/WhatsApp.
- Web (si tiene).
- Confianza (alta/media/baja).

---

## 6. Qué NO hacer

- No scraper agresivo. Respeta `robots.txt`. Si una tienda no tiene catálogo online público, dejar el campo precio como `null` y marcar `source: "manual"`.
- No tocar `lib/compat/` ni `components/` (Codex y Claude).
- No inventar precios "aproximados" sin fuente.
- No usar precios de Argentina / Chile / USA sin convertir y aclarar.
- No commitear datasets a `main` sin PR revisado.

---

## 7. Entrega progresiva

**Semana 1:** CPUs + GPUs top 30 cada uno (los más vendidos en Bolivia hoy).
**Semana 2:** Mobos + RAM + PSUs top 30 cada uno.
**Semana 3:** Cases + coolers + storage top 30 cada uno.
**Semana 4:** Benchmarks y recomendador.
**Semana 5–6:** Precios bolivianos para los top 30 por categoría.

---

## 8. Interface con Claude

- Claude provee los schemas Zod en `lib/schemas/`. Gemini valida sus JSON contra esos schemas antes de entregar.
- Si Gemini necesita extender un schema, abre issue `[GEM-schema-extend]` describiendo el nuevo campo y su justificación.
- Si Gemini encuentra una regla de compat no documentada, la agrega en `docs/COMPATIBILITY-RULES.md` con numeración (`R-17`, `W-09`, etc.).
