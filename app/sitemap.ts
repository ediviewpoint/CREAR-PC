import type { MetadataRoute } from "next";
import { listCatalogForUi } from "@/lib/db/repos/catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crearpc.bo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/build`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/politicas/garantia`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/politicas/privacidad`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/politicas/terminos`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/politicas/cookies`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  if (!process.env.DATABASE_URL) return staticRoutes;

  try {
    const catalog = await listCatalogForUi();
    const componentRoutes: MetadataRoute.Sitemap = catalog.map((c) => ({
      url: `${SITE_URL}/catalog/${c.category}/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    return [...staticRoutes, ...componentRoutes];
  } catch {
    return staticRoutes;
  }
}
