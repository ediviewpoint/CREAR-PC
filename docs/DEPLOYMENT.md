# DEPLOYMENT — CREAR PC (ELITEPC)

**Última actualización:** 28/10/2026.

Proyecto Vercel: `merlasmvz-5229s-projects/crear-pc`
Alias de producción: https://crear-pc.vercel.app

---

## 1. Estado del deploy

| Entorno | URL | Protección |
|---|---|---|
| **production** | https://crear-pc.vercel.app | Pública (sin SSO) |
| preview | https://crear-{hash}-merlasmvz-5229s-projects.vercel.app | Vercel SSO |
| development | http://localhost:3000 | — |

Health check en runtime: `GET /api/health` → JSON con status de DB, env críticas y datos del vendor.

---

## 2. Variables de entorno

Las que YA están seteadas en Vercel (los 3 ambientes):

```
DATABASE_URL                         (secret — Supabase pooler)
ADMIN_PASSWORD                       (secret — login /admin, mínimo 16 chars)
CRON_SECRET                          (secret — autoriza /api/cron/*)
NEXT_PUBLIC_SITE_URL                 https://crear-pc.vercel.app
NEXT_PUBLIC_SITE_NAME                CREAR PC
NEXT_PUBLIC_SITE_LOCALE              es-BO
NEXT_PUBLIC_DEFAULT_CURRENCY         BOB
NEXT_PUBLIC_SUPABASE_URL             https://ajxidbnxeutyhwzanytk.supabase.co
BCB_RATE_SOURCE                      manual
BCB_USD_BOB                          6.96
```

Las que **faltan completar** (opcionales — la UI degrada graciosamente):

```
NEXT_PUBLIC_SUPABASE_ANON_KEY        (Supabase → Settings → API → anon public)
SUPABASE_SERVICE_ROLE_KEY            (Supabase → Settings → API → service_role)
LEGAL_RESPONSIBLE                    (razón social del vendedor)
LEGAL_NIT                            (NIT fiscal boliviano)
LEGAL_ADDRESS                        (dirección física)
LEGAL_CITY                           (default: Santa Cruz de la Sierra, Bolivia)
NEXT_PUBLIC_CONTACT_EMAIL            (si está, /contacto activa el link)
NEXT_PUBLIC_SUPPORT_WHATSAPP         (si está, aparece en footer)
```

---

## 3. Scripts de administración

```powershell
# Pushear secrets desde .env.local a Vercel (whitelist)
node scripts/push-secrets.mjs

# Fijar NEXT_PUBLIC_SITE_URL a un dominio nuevo
# (editar la constante url dentro de scripts/set-site-url.mjs)
node scripts/set-site-url.mjs

# Pushear env vars no-secret (SITE_NAME, LOCALE, etc.)
node scripts/set-vercel-env.mjs
```

Estos scripts usan `spawnSync` de Node (no PowerShell) para evitar BOM UTF-8 que Vercel rechaza como "whitespace in header value".

---

## 4. Pipeline de deploy

### Preview (automático por PR o manual)

```powershell
vercel deploy --yes
```

### Producción

```powershell
# 1) Verificar quality gate localmente
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# 2) Promover
vercel deploy --prod --yes
```

El build en Vercel vuelve a correr `typecheck` + `build`, así que un typecheck limpio local no garantiza prod — un typecheck más estricto puede fallar en Linux + TS más reciente (ocurrió una vez con `instanceof` dentro de `evaluateAll` callback — fix en commit `fix: cast HTMLImageElement en e2e/brands.spec.ts`).

---

## 5. Dominios custom (pendiente)

Cuando ELITEPC tenga `crearpc.bo` o similar:

```powershell
vercel domains add crearpc.bo
vercel domains add www.crearpc.bo
# luego apuntar DNS A/CNAME según indique Vercel.
# después:
node scripts/set-site-url.mjs    # editar url = "https://crearpc.bo"
vercel deploy --prod --yes
```

---

## 6. Supabase

Project: `ajxidbnxeutyhwzanytk`
Pooler region: `aws-0-us-east-1`.

- Migraciones aplicadas: `drizzle/0000` → `drizzle/0003` (ver `docs/ESTADO-INTEGRACION.md`).
- RLS activado en tablas de aplicación.
- 8 componentes del MVP ya cargados vía `lib/catalog/mvp.ts`.
- Sin tiendas, precios ni stock ficticios.

Para re-correr migraciones o seed:

```powershell
pnpm db:migrate
pnpm db:seed
```

---

## 7. Observabilidad

- **Logs**: Vercel Dashboard → Logs. `lib/logger.ts` (pino) escribe JSON a stdout.
- **Health**: `GET /api/health` reporta DB + env + vendor fields pendientes.
- **Analytics**: Vercel Analytics activo (cookieless).

---

## 8. Cron Jobs

Definidos en `vercel.ts` → `crons`:

| Path | Schedule | Zona Bolivia |
|---|---|---|
| `/api/cron/refresh-prices` | `0 4 * * *` | 00:00 BOT diario |
| `/api/cron/expire-proformas` | `15 4 * * *` | 00:15 BOT diario |
| `/api/cron/weekly-report` | `0 12 * * 1` | 08:00 BOT lunes |

Protegidos por `CRON_SECRET` en header `Authorization: Bearer <secret>`. Vercel lo adjunta automáticamente al llamar los crons.

---

## 9. Rotación de secretos

- `ADMIN_PASSWORD` → tras cualquier compartición accidental, generar nuevo con:
  ```powershell
  node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
  ```
  y correr `node scripts/push-secrets.mjs` después de guardarlo en `.env.local`.

- `CRON_SECRET` → mismo procedimiento.

- `DATABASE_URL` → rotar password en Supabase Dashboard → Settings → Database → Reset database password. Luego actualizar `.env.local` y pushear.

- **El token Vercel `vck_...` compartido en chat el 2026-10-27 debe estar revocado** en https://vercel.com/account/tokens.

---

## 10. Troubleshooting

### Deploy falla con "whitespace in header value"
Alguna env var tiene BOM o `\n` final. Usar `node scripts/push-secrets.mjs` (no PowerShell `echo | vercel env add`).

### `/admin` redirige en loop
`ADMIN_PASSWORD` no está en el entorno runtime. Verificar `vercel env ls` y re-deploy.

### `/api/health` reporta `database.ok=false`
`DATABASE_URL` ausente o pooler Supabase inaccesible. Correr `node scripts/push-secrets.mjs` tras verificar `.env.local`.

### Build local pasa pero Vercel falla typecheck
TS en Linux es más estricto con narrow en callbacks. Hacer cast explícito en vez de confiar en `instanceof`.
