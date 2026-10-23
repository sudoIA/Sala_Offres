// src/lib/firebase.ts
// Initialisation unique du SDK Firebase modulaire (v10+) pour toute l'application.
// Les fonctions Firestore/Auth s'importent directement depuis "firebase/*"
// dans chaque fichier ; ce module n'exporte que les instances déjà initialisées.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Identité "Web" du site dans Firebase (Console > Paramètres du projet >
// Vos applications > application Web). Historiquement, le site réutilisait
// l'identité de l'application Android ; App Check exige une application Web
// distincte, et la clé API Web peut alors être restreinte aux domaines du
// site sans toucher à celle de l'app mobile. Valeurs publiques par nature
// (elles sont visibles dans le navigateur de tout visiteur).
// Application Web "Sala - site web", créée le 23/10/2026 (la clé et l'appId
// Android restent ceux de l'app mobile, voir docs/app-mobile-app-check.md).
const WEB_API_KEY = "AIzaSyBOUDvMP-5A8PxhHwxPseMFRfkEpeHdePY";
const WEB_APP_ID = "1:329607043816:web:1b86d8a85cedc6ec4e475d";

/**
 * Clé de site reCAPTCHA utilisée par App Check (publique par nature).
 * Enregistrée dans Console Firebase > App Check via "Fraud Defense" (ex
 * reCAPTCHA Enterprise) : Firebase n'accepte plus le reCAPTCHA v3 classique.
 * Domaine autorisé : ongsala.com et ses sous-domaines.
 */
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6Leyjf0tAAAAADjDAiS9Cg9Zr9p1Z19Q57h0OQvq";

const firebaseConfig = {
  apiKey: WEB_API_KEY,
  authDomain: "sala-a6c15.firebaseapp.com",
  projectId: "sala-a6c15",
  storageBucket: "sala-a6c15.appspot.com",
  messagingSenderId: "329607043816",
  appId: WEB_APP_ID,
};

/** Bucket Firebase Storage, réutilisé pour construire des URLs d'images publiques. */
export const STORAGE_BUCKET = firebaseConfig.storageBucket;

// Évite une double initialisation en mode développement (Fast Refresh).
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check (protection anti-robots : seules les requêtes venant réellement
// du site sont acceptées par Firestore une fois l'application activée côté
// console). Ne s'active que si la clé reCAPTCHA est configurée, et
// uniquement dans le navigateur.
if (typeof window !== "undefined" && RECAPTCHA_SITE_KEY) {
  try {
    // En local, reCAPTCHA ne valide pas "localhost" : on utilise un jeton de
    // débogage fixe (NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN dans .env.local, jamais
    // commité), déclaré une fois dans Console Firebase > App Check > Gérer les
    // jetons de débogage. Sans lui, Firebase en génère un nouveau à chaque
    // fois et l'affiche dans la console du navigateur.
    if (process.env.NODE_ENV === "development") {
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
        process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN || true;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    // Déjà initialisé (rechargement à chaud en développement).
    console.warn("App Check :", err);
  }
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
