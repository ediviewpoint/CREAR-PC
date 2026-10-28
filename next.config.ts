import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep visual-review builds separate from other development/build processes.
  distDir: process.env.CREARPC_PREVIEW === "1" ? ".next-preview" : ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.vercel-storage.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  typedRoutes: true,
  experimental: { serverActions: { bodySizeLimit: "22mb" } },
};

export default nextConfig;
