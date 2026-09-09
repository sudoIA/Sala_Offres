import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
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
