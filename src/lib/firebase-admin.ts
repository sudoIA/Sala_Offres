// src/lib/firebase-admin.ts
// Initialise Firebase Admin (uniquement pour la tâche planifiée de collecte
// d'offres, voir src/app/api/cron/collect-jobs/route.ts). Contrairement au
// SDK client (@/lib/firebase.ts) utilisé partout ailleurs dans le site, le
// SDK Admin s'authentifie avec un compte de service et n'est jamais soumis
// aux règles de sécurité Firestore — à ne jamais importer depuis un
// composant "use client" ni exposer au navigateur.
//
// Nécessite 3 variables d'environnement côté serveur (Console Firebase >
// Paramètres du projet > Comptes de service > Générer une nouvelle clé
// privée) : FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
// L'initialisation est différée (pas au chargement du module) pour ne pas
// faire échouer `next build` sur une machine où ces variables ne sont pas
// définies (ex: en local, où seul le SDK client est utilisé).

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let dbInstance: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (dbInstance) return dbInstance;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Sur Vercel, les retours à la ligne de la clé privée sont stockés échappés
  // ("\n" littéral) : il faut les reconvertir en vrais retours à la ligne.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Variables d'environnement Firebase Admin manquantes (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)."
    );
  }

  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  dbInstance = getFirestore(app);
  return dbInstance;
}
