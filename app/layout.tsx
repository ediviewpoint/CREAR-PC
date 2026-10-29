import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";
import "./elite-admin.css";
import "./elite-products.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const tight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "ELITEPC · CREAR PC — Armá tu PC en Bolivia", template: "%s · CREAR PC" },
  description:
    "Elegí cada pieza con criterio. Configurador boliviano, compatibilidad y proforma PDF en Bs. Hecho en Santa Cruz.",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "es_BO",
    url: "/",
    siteName: "CREAR PC",
    title: "Armá tu PC. Con precios de Bolivia.",
    description: "Precisión en cada pieza. Hecho en Santa Cruz.",
    images: [
      {
        url: "/brand/og-default.png",
        width: 1200,
        height: 630,
        alt: "CREAR PC — Armá tu PC. Con precios de Bolivia.",
      },
    ],
  },
  twitter: { card: "summary_large_image", title: "CREAR PC", images: ["/brand/og-default.png"] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#050F24" },
  ],
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-BO" className={`${inter.variable} ${tight.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Saltar al contenido
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
