import { routes, type VercelConfig } from "@vercel/config/v1";

/**
 * Configuración del proyecto CREAR PC en Vercel.
 * Documentación: https://vercel.com/docs/project-configuration/vercel-ts
 *
 * Headers de seguridad, rewrites de /politicas/*, y un cron diario que
 * dispara /api/cron/refresh-prices para refrescar la vista materializada
 * de precios actuales.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crearpc.bo";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "pnpm build",
  installCommand: "pnpm install --frozen-lockfile",
  devCommand: "pnpm dev",

  // -----------------------------------------------------------
  // Rewrites — mantienen URLs cortas en marketing/políticas.
  // -----------------------------------------------------------
  rewrites: [
    routes.rewrite("/garantia", "/politicas/garantia"),
    routes.rewrite("/privacidad", "/politicas/privacidad"),
    routes.rewrite("/terminos", "/politicas/terminos"),
    routes.rewrite("/cookies", "/politicas/cookies"),
  ],

  // -----------------------------------------------------------
  // Redirects permanentes para dominios legacy o rutas antiguas.
  // -----------------------------------------------------------
  redirects: [
    { source: "/configurador", destination: "/build", permanent: true },
    { source: "/armador", destination: "/build", permanent: true },
  ],

  // -----------------------------------------------------------
  // Headers — seguridad global.
  //
  // CSP estricto: estilos inline permitidos (Tailwind JIT + fonts),
  // scripts solo del propio origen y Vercel Analytics,
  // conexiones a Blob / Supabase / Vercel.
  // -----------------------------------------------------------
  headers: [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://*.vercel-insights.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob: https: ",
            "connect-src 'self' https://*.vercel-insights.com https://*.vercel-analytics.com https://*.vercel-storage.com https://*.supabase.co wss://*.supabase.co",
            "frame-ancestors 'self'",
            "frame-src 'self' blob:",
            "worker-src 'self' blob:",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
            "upgrade-insecure-requests",
          ].join("; "),
        },
      ],
    },
    // Cache agresivo para assets estáticos.
    routes.cacheControl("/_next/static/(.*)", {
      public: true,
      maxAge: "1 year",
      immutable: true,
    }),
    routes.cacheControl("/public/(.*)", {
      public: true,
      maxAge: "1 week",
      immutable: true,
    }),
  ],

  // -----------------------------------------------------------
  // Crons — Vercel Cron Jobs (plan Pro requerido para múltiples).
  // -----------------------------------------------------------
  crons: [
    { path: "/api/cron/ofertas-vencidas", schedule: "0 8 * * *" },
    // Refresca precios de componentes desde las tiendas registradas.
    { path: "/api/cron/refresh-prices", schedule: "0 4 * * *" }, // diario 04:00 UTC = 00:00 BOT
    // Expira proformas vencidas.
    { path: "/api/cron/expire-proformas", schedule: "15 4 * * *" }, // diario 00:15 BOT
    // Reporte semanal de builds populares (lunes).
    { path: "/api/cron/weekly-report", schedule: "0 12 * * 1" }, // lunes 08:00 BOT
  ],

  // -----------------------------------------------------------
  // Runtime — Fluid Compute (default) + Node.js 22 LTS.
  // -----------------------------------------------------------
  functions: {
    "app/api/proforma/[id]/pdf/route.ts": {
      maxDuration: 60, // generación PDF puede tomar segundos
      memory: 1024,
    },
    "app/api/cron/refresh-prices/route.ts": {
      maxDuration: 300,
      memory: 1024,
    },
  },

  env: {
    NEXT_PUBLIC_SITE_URL: siteUrl,
    NEXT_PUBLIC_SITE_LOCALE: "es-BO",
    NEXT_PUBLIC_DEFAULT_CURRENCY: "BOB",
  },
};

export default config;
