// src/lib/site-url.ts
// URL absolue du site, utilisée pour les métadonnées (Open Graph, sitemap,
// robots.txt). Vercel expose automatiquement le domaine de production via
// VERCEL_PROJECT_PRODUCTION_URL ; NEXT_PUBLIC_SITE_URL permet de le
// surcharger explicitement (ex : un futur nom de domaine personnalisé).

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
