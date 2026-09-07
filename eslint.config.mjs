import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Cette règle (nouvelle dans eslint-config-next 16) confond les usages
      // légitimes de setState dans un effet — abonnement Firestore
      // (onSnapshot/getDocs dans un callback async) et réinitialisation d'un
      // formulaire à l'ouverture d'une modale — avec l'anti-pattern qu'elle
      // cible. Désactivée après revue : tous les cas signalés dans ce projet
      // correspondent à des usages recommandés par la doc React elle-même.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Archive de l'ancien site statique, conservée pour référence uniquement.
    "legacy-static-site/**",
    // Service worker et runtime Workbox générés par @ducanh2912/next-pwa à chaque build.
    "public/sw.js",
    "public/workbox-*.js",
  ]),
]);

export default eslintConfig;
