# CLAUDE.md — Contexto permanente para Claude Code

Este archivo se auto-carga en cada sesión. Mantener corto. Fuente de verdad del proyecto: [`README.md`](./README.md) y [`docs/`](./docs/).

---

## 1. Qué es CREAR PC
Configurador de PCs a medida para Bolivia (Santa Cruz). Catálogo + validador de compatibilidad + proforma PDF. Precios en Bs. Estética Apple + ROG Strix — nada gaming genérico, nada UI-de-IA.

## 2. Stack decidido
- Next.js 16 App Router · TypeScript strict · Tailwind v4 · shadcn/ui (personalizado).
- Drizzle ORM + Supabase Postgres (driver `postgres-js`).
- Vercel (Fluid Compute, Node 24) · `vercel.ts` para config.
- `@react-pdf/renderer` para proformas.
- Clerk (Fase 2) para auth.

## 3. División de trabajo entre IAs
- **Codex** — Diseño/UI/UX. Brief: [`docs/DESIGN-BRIEF.md`](./docs/DESIGN-BRIEF.md).
- **Gemini** — Datos/compatibilidades/precios BO. Brief: [`docs/DATA-SCHEMA.md`](./docs/DATA-SCHEMA.md) + [`docs/COMPATIBILITY-RULES.md`](./docs/COMPATIBILITY-RULES.md).
- **Claude (yo)** — Arquitectura/lógica/legal/deploy. Brief: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) + [`docs/POLICIES/`](./docs/POLICIES/).

## 4. Convenciones críticas
- Idioma de UI y copy: **español boliviano (es-BO)**. Código y nombres de variables: **inglés**.
- Moneda: **Bolivianos (Bs.)** con dos decimales. Formato `Bs. 15.230,00` (separador miles `.`, decimales `,`).
- Unidades SI: mm, W, GHz, MB/s. Nada de "6.4 GT/s" en un sitio y "6400 MT/s" en otro.
- Commits Conventional en español: `feat:`, `fix:`, `docs:`, `chore:`.
- Branches: `main`, `dev`, `feat/*`, `fix/*`.
- TypeScript strict · nada de `any` · imports absolutos `@/`.
- Nada de emojis en código / UI.

## 5. Reglas de diseño inviolables (recordatorio)
- NO gaming neon/RGB. NO glassmorphism. NO gradientes AI-purple. NO Lucide sin personalizar.
- Paleta: blanco (`#FFFFFF`) + azul marino (`#13284A` claro / `#050F24` oscuro). Acentos < 5% superficie.
- Tipografía: Inter Tight + Inter + JetBrains Mono.

## 6. Reglas legales inviolables
- Toda proforma incluye disclaimer "no es factura, no habilita crédito fiscal".
- Validez default 7 días.
- Políticas de privacidad alineadas a Ley 164 + DS 1793 bolivianos (ARCO en 15 días hábiles).
- Garantía: NO somos vendedor, somos intermediario informativo.

## 7. Comandos frecuentes (cuando exista scaffold)
```
pnpm dev
pnpm typecheck
pnpm test
pnpm db:migrate
pnpm db:seed
vercel env pull .env.local
```

## 8. Qué NO hacer sin confirmar con Elías
- Elegir dominio final.
- Instalar auth (Clerk) antes de Fase 2.
- Cerrar la licencia (MIT propuesto, no confirmado).
- Scraping agresivo a tiendas bolivianas.
