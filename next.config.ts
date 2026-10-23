import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// En-têtes de sécurité appliqués à toutes les pages. La CSP se limite
// volontairement aux directives sans risque de casse (pas de liste stricte
// de scripts, que Firebase Auth, la connexion Google et les CDN de polices
// / icônes rendraient fragile) : interdiction d'afficher le site dans une
// iframe tierce (clickjacking), pas de plugins, pas de <base> détourné.
// Forcer HTTPS (HSTS, upgrade-insecure-requests) uniquement en production :
// en local, le site tourne en http://localhost et ne doit pas être redirigé.
const isProd = process.env.NODE_ENV === "production";

const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: `frame-ancestors 'none'; object-src 'none'; base-uri 'self'${isProd ? "; upgrade-insecure-requests" : ""}`,
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Sans cela, une page visitée uniquement via la navigation client (next/link)
  // n'est jamais mise en cache par le service worker : y revenir hors-ligne
  // affiche une page blanche au lieu du contenu déjà chargé une première fois.
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);
