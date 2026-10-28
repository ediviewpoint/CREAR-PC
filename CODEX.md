# CODEX.md — Punto de entrada para OpenAI Codex

**Tu misión:** diseñar la capa visual de CREAR PC. Entregar un sitio **premium, único, boliviano**, inspirado en **Apple (Mac Pro / macOS)** + **ROG Strix**. Blanco y azul marino. **Prohibido** cualquier estética gaming genérica o "IA-sparkle".

---

## 1. Antes de empezar

Leé en este orden:
1. [`README.md`](./README.md) — Visión, público, hoja de ruta.
2. [`docs/DESIGN-BRIEF.md`](./docs/DESIGN-BRIEF.md) — **TU BRIEF COMPLETO**. Paleta, tipografía, componentes, prohibiciones.
3. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Rutas Next.js que vas a diseñar.

---

## 2. Tus tareas (lista corta — detalle en README §7.1)

- `CDX-01` Moodboard y dirección de arte.
- `CDX-02` Design tokens en `app/styles/tokens.css`.
- `CDX-03` Landing hero cinematográfico.
- `CDX-04` Configurador "mesa de trabajo" (3 paneles).
- `CDX-05` `<ComponentCard />` radicalmente custom.
- `CDX-06` Modo oscuro premium (navy profundo, no cyan).
- `CDX-07` Página de componente estilo Apple.
- `CDX-08` UI web + layout PDF de proforma.
- `CDX-09` Iconografía custom (no Lucide pelado).
- `CDX-10` Microanimaciones Motion One.
- `CDX-11` Responsive mobile = wizard.
- `CDX-12` Logo + wordmark (3 variantes).
- `CDX-13` Favicons + OG dinámico.

---

## 3. Entregable mínimo por tarea

Para cada tarea Codex entrega:
- **Archivos:** `.tsx` / `.css` / `.svg` listos para pegar.
- **Rutas:** paths concretos dentro de `app/`, `components/`, `public/`.
- **Captura o storybook:** screenshot o archivo `.stories.tsx` (si usamos Storybook).

---

## 4. Reglas inviolables

- Paleta estricta (ver `docs/DESIGN-BRIEF.md §3`).
- Tipografía Inter Tight / Inter / JetBrains Mono.
- WCAG AA mínimo.
- `prefers-reduced-motion` respetado.
- Mobile first (320px no se rompe).
- NO emojis en UI.
- NO gaming RGB. NO glassmorphism. NO IA-sparkle.

---

## 5. Interface con Claude

- Claude te deja scaffold Next.js + tokens vacíos + rutas con `<TODO />`.
- Codex rellena componentes y estilos.
- Si Codex necesita un hook / util del lado lógico, abre un issue `[CDX-needs-logic]` con la firma esperada; Claude lo implementa.

---

## 6. Formato de entrega preferido

Para cada entregable, en un bloque claro:

```
### CDX-03 · Landing hero

**Archivos:**
- app/(marketing)/page.tsx
- components/landing/Hero.tsx
- app/styles/landing.css

**Dependencias nuevas:**
- motion@12.0.0

**Notas:**
- Respeta `prefers-reduced-motion` desactivando el canvas.
- Hero image en public/brand/hero-case.webp (pendiente de generar).
```

---

## 7. Qué NO hacer

- No tocar `lib/compat/`, `lib/pricing/`, `lib/db/` (eso es de Claude).
- No tocar `data/seed/` (eso es de Gemini).
- No introducir dependencies pesadas sin justificar (ej.: evitar `@react-three/drei` completo si solo necesitás una escena simple).
- No modificar textos legales de `docs/POLICIES/` sin consultar.
