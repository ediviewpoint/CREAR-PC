# ARQUITECTURA — CREAR PC

> **Destinatario:** Claude (yo) y cualquier dev que mantenga el proyecto.
> **Nivel:** C4 Context + Container + mapa de dependencias.

---

## 1. C4 — Context

```
                    ┌──────────────────────┐
                    │     Usuario final    │
                    │ (gamer, estudiante,  │
                    │  tiendista, pyme)    │
                    └──────────┬───────────┘
                               │ HTTPS
                               ▼
                    ┌──────────────────────┐
                    │     CREAR PC         │
                    │  (Next.js on Vercel) │
                    └──────────┬───────────┘
         ┌─────────────────────┼─────────────────────────────┐
         ▼                     ▼                             ▼
┌─────────────────┐  ┌─────────────────┐           ┌─────────────────┐
│    Supabase     │  │   Vercel Blob   │           │  AI Gateway     │
│    Postgres     │  │  (imágenes,     │           │  (opcional —    │
│  (catálogo +    │  │   PDFs proforma)│           │  recomendador,  │
│   builds +      │  │                 │           │  descripciones) │
│   proformas)    │  │                 │           │                 │
└─────────────────┘  └─────────────────┘           └─────────────────┘
```

---

## 2. C4 — Containers (Next.js)

```
Next.js 16 App Router — Fluid Compute (Node.js 24)
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx           — header + footer marketing
│   │   ├── page.tsx             — landing
│   │   └── politicas/
│   │       ├── garantia/page.tsx
│   │       ├── privacidad/page.tsx
│   │       ├── terminos/page.tsx
│   │       └── proforma/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── build/
│   │   │   ├── page.tsx         — configurador
│   │   │   └── [id]/page.tsx    — build compartida
│   │   ├── catalog/
│   │   │   ├── page.tsx
│   │   │   └── [cat]/[slug]/page.tsx
│   │   └── proforma/[id]/page.tsx
│   ├── (admin)/
│   │   └── admin/...
│   └── api/
│       ├── compat/route.ts
│       ├── proforma/[id]/pdf/route.ts
│       └── og/proforma/[id]/route.ts
├── components/
│   ├── ui/                     — shadcn custom
│   ├── build/
│   ├── catalog/
│   └── proforma/
├── lib/
│   ├── db/                     — Drizzle client + schema
│   ├── compat/                 — motor de compatibilidad (puro)
│   ├── pricing/                — cálculos de precios y descuentos
│   ├── proforma/               — generador PDF + numeración
│   ├── schemas/                — Zod shared
│   └── utils/
├── data/
│   └── seed/                   — JSON por Gemini
├── drizzle/                    — migraciones generadas
├── public/
│   └── brand/
├── docs/
├── scripts/
│   ├── seed.ts
│   └── refresh-prices.ts
├── vercel.ts
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

## 3. Capas y dependencias (de dentro hacia afuera)

1. **Dominio puro (`lib/compat`, `lib/pricing`, `lib/schemas`)** — Sin IO, sin React, sin acceso a DB. Puro TS, 100% testeable.
2. **Repos (`lib/db/repos/*`)** — Única capa que habla con Drizzle. Interfaces definidas, implementación en Drizzle.
3. **Server Actions / Route Handlers** — Orquestan dominio + repos. Validan input con Zod.
4. **React Server Components** — Fetch desde repos directamente (sin API intermedia).
5. **Client Components** — Interacciones, llaman Server Actions.
6. **UI primitives (`components/ui`)** — Visuales puras, agnósticas a dominio.

Regla fundamental: **las capas internas NO conocen las externas**.

---

## 4. Rendering strategy

| Ruta | Estrategia | Razón |
|---|---|---|
| `/` landing | `use cache` + prerender | Totalmente estática. |
| `/catalog` | `use cache` con tag `catalog` | Se invalida al actualizar precios. |
| `/catalog/[cat]/[slug]` | `use cache` con tag `component:<id>` | Igual. |
| `/build` | Dynamic (SSR) | Depende de interacción cliente. |
| `/build/[id]` | Dynamic con cache corto (`cacheLife('minutes')`) | Shared builds. |
| `/proforma/[id]` | Dynamic — fuerza fresh | Documento legal. |
| `/api/compat` | Dynamic — Fluid Compute | Validación en tiempo real. |
| `/api/proforma/[id]/pdf` | Dynamic — streaming | PDF generado al vuelo. |

**Invalidation:** `updateTag("catalog")` cuando `scripts/refresh-prices.ts` corre (cron diario).

---

## 5. Flujo de datos — configurador

```
Usuario abre /build
  │
  ├── RSC: fetch stores + catalog base (cache: catalog)
  │
  ▼
Usuario añade CPU
  │
  ├── Client → Server Action addComponent(buildId, componentId)
  │     ├── validar input (zod)
  │     ├── repo.builds.addItem(...)
  │     ├── repo.components.get(componentId)
  │     ├── repo.builds.getWithItems(buildId)
  │     ├── compat.evaluateBuild(build)
  │     └── return { build, compatReport }
  │
  ▼
UI actualiza panel derecho (consumo, compat, total)
```

---

## 6. Generación de PROFORMA

```
Usuario clickea "Generar proforma"
  │
  ├── Modal pide clientName, CI/NIT, teléfono, email (todos opcionales salvo nombre)
  │
  ▼
Server Action createProforma(buildId, clientData)
  │
  ├── Genera código secuencial PRO-YYYY-NNNNN (sequence Postgres)
  ├── Snapshot de precios actuales en Bs. (congelado)
  ├── Guarda row en `proformas`
  └── Return proforma.id
  │
  ▼
Redirect a /proforma/[id]
  │
  ▼
Vista web (RSC) + botón "Descargar PDF"
  │
  ├── Click → GET /api/proforma/[id]/pdf
  │     ├── Fetch proforma + build items + components
  │     ├── Render con @react-pdf/renderer (streaming)
  │     ├── Suben a Vercel Blob (opcional, para re-descargas)
  │     └── Stream PDF al navegador
```

---

## 7. Autenticación (Fase 2)

- Provider: **Clerk** vía Vercel Marketplace (JWT, sesión, email + Google).
- Middleware (`middleware.ts`) protege `/admin/*`, `/me/*`.
- Roles custom en `publicMetadata.role`:
  - `user` — guarda sus builds.
  - `shop_owner` — crea proformas con branding de su tienda.
  - `admin` — gestiona catálogo.

Server Actions de `admin/*` verifican rol antes de ejecutar.

---

## 8. Variables de entorno

```
# Database (Supabase Postgres — driver postgres-js)
DATABASE_URL=
# Opcional, cliente Supabase JS para acciones serverless con RLS
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Blob
BLOB_READ_WRITE_TOKEN=

# Clerk (Fase 2)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# AI Gateway (opcional, Fase 2+)
AI_GATEWAY_API_KEY=

# Config general
NEXT_PUBLIC_SITE_URL=https://crearpc.bo
NEXT_PUBLIC_SITE_NAME="CREAR PC"
CRON_SECRET=                      # para proteger /api/cron/*
```

Todas se obtienen con `vercel env pull .env.local`.

---

## 9. Seguridad

- Headers (en `vercel.ts`):
  - `Content-Security-Policy` estricto (fuentes de scripts explícitas).
  - `X-Frame-Options: DENY`.
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- Rate limit en `/api/compat` y `/api/proforma/*/pdf`.
- Vercel **BotID** activo en endpoints de PDF (anti-abuso).
- Inputs sanitizados (DOMPurify server-side para notas de tiendista).
- Secretos: todos vía env, nunca commiteados. `.env*` en `.gitignore`.

---

## 10. Observabilidad

- `Vercel Analytics` + `Speed Insights` (zero config).
- Logs estructurados con `pino` (JSON a stdout → Vercel Logs).
- Error reporting: Sentry (opcional, Fase 2).
- Vercel **Agent** (beta) para code reviews y anomalías.

---

## 11. CI/CD

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node@v4 (node 24)
      - setup-pnpm
      - pnpm install --frozen-lockfile
      - pnpm lint
      - pnpm typecheck
      - pnpm test
      - pnpm build
```

Vercel auto-deploys por branch. `main` → prod, `dev` → preview, PRs → preview.

---

## 12. Internationalization

- Primario: `es-BO` (Español Bolivia).
- Preparar `next-intl` desde el día 1 pero con un solo locale activo. Futuro: `pt-BR` para turistas / expats, `en-US`.

---

## 13. Decisiones arquitectónicas pendientes (ADRs a crear)

- **ADR-001:** Monorepo vs single app → **single app**.
- **ADR-002:** Drizzle vs Prisma → **Drizzle** (edge-friendly, type-safe sin generar).
- **ADR-003:** Clerk vs Auth.js → **Clerk** (vía Marketplace).
- **ADR-004:** Neon vs Supabase vs Vercel Postgres → **Supabase** (confirmado tras el MVP; RLS nativo, driver `postgres-js`, Vercel Marketplace). La propuesta inicial era Neon pero se cambió por soporte RLS listo y menor fricción con el panel admin.
- **ADR-005:** PDF: react-pdf vs puppeteer → **react-pdf** (sin headless chrome, cold-start-friendly).
- **ADR-006:** Three.js vs CSS 3D vs SVG → **a decidir con Codex**.

---

## 14. Testing strategy

- **Unit (Vitest):** `lib/compat`, `lib/pricing`, `lib/proforma/sequence`.
- **Integration (Vitest + testcontainers Postgres):** repos.
- **E2E (Playwright):** flujo armar-build → proforma → descargar PDF.
- **Visual regression:** Chromatic (opcional, Fase 3).
- **Accessibility:** `@axe-core/playwright` en el pipeline E2E.
