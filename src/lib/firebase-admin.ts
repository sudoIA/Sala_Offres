// src/lib/firebase-admin.ts
// Initialise Firebase Admin (tâche planifiée de collecte d'offres et
// d'alertes, voir src/app/api/cron/collect-jobs/route.ts, et journal des
// erreurs, voir src/app/api/client-errors/route.ts). Contrairement au
// SDK client (@/lib/firebase.ts) utilisé partout ailleurs dans le site, le
// SDK Admin s'authentifie avec un compte de service et n'est jamais soumis
// aux règles de sécurité Firestore - à ne jamais importer depuis un
// composant "use client" ni exposer au navigateur.
//
// Nécessite une seule variable d'environnement côté serveur :
// FIREBASE_SERVICE_ACCOUNT = le contenu COMPLET du fichier .json téléchargé
// depuis Console Firebase > Paramètres du projet > Comptes de service >
// Générer une nouvelle clé privée (copié-collé tel quel, sans rien modifier
// dedans). Un seul bloc à copier-coller entièrement plutôt que d'en extraire
// un seul champ (la clé privée) à la main - beaucoup plus fiable, un copier
// partiel de la clé privée étant une source d'erreur fréquente.
//
// L'initialisation est différée (pas au chargement du module) pour ne pas
// faire échouer `next build` sur une machine où cette variable n'est pas
// définie (ex: en local, où seul le SDK client est utilisé).

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let appInstance: App | null = null;

/** Application Admin authentifiée par le compte de service. */
export function getAdminApp(): App {
  if (appInstance) return appInstance;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "Variable d'environnement FIREBASE_SERVICE_ACCOUNT manquante (contenu JSON complet du compte de service Firebase)."
    );
  }

  let serviceAccount: object;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT ne contient pas un JSON valide.");
  }

  // Application par défaut explicitement : ne jamais réutiliser une autre
  // application nommée qui existerait dans le même processus.
  appInstance = getApps().find((a) => a.name === "[DEFAULT]") ?? initializeApp({ credential: cert(serviceAccount) });
  return appInstance;
}

/**
 * Vrai si le compte de service est configuré (production Vercel). Les
 * lectures faites côté serveur passent alors par le SDK Admin, qui n'est pas
 * soumis à App Check : elles continuent de fonctionner une fois App Check
 * activé sur Firestore. En local (variable absente), on retombe sur le SDK
 * client comme avant.
 */
export function hasAdminCredentials(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
