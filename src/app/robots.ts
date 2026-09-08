// src/app/robots.ts
// Génère /robots.txt : autorise l'exploration du site public, ferme le
// back-office et les zones de connexion, référence le sitemap.

import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/connexion", "/profile"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
