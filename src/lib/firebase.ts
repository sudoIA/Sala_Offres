// src/lib/firebase.ts
// Initialisation unique du SDK Firebase modulaire (v10+) pour toute l'application.
// Les fonctions Firestore/Auth s'importent directement depuis "firebase/*"
// dans chaque fichier ; ce module n'exporte que les instances déjà initialisées.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Identité "Web" du site dans Firebase (Console > Paramètres du projet >
// Vos applications > application Web). Historiquement, le site réutilisait
// l'identité de l'application Android ; App Check exige une application Web
// distincte, et la clé API Web peut alors être restreinte aux domaines du
// site sans toucher à celle de l'app mobile. Valeurs publiques par nature
// (elles sont visibles dans le navigateur de tout visiteur).
// TODO App Check : remplacer par la configuration de l'application Web
// "Sala - site web" une fois créée dans la console (voir docs/app-mobile-app-check.md).
const WEB_API_KEY = "AIzaSyATVsmjgNZD5j5jTkSbVCuw0dtHNMFop7A";
const WEB_APP_ID = "1:329607043816:android:774a1bf373ca8cca";

/** Clé de site reCAPTCHA v3 utilisée par App Check (publique par nature). */
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

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
// console). Ne s'active que si la clé reCAPTCHA v3 est configurée, et
// uniquement dans le navigateur.
if (typeof window !== "undefined" && RECAPTCHA_SITE_KEY) {
  try {
    // En local, reCAPTCHA ne valide pas "localhost" : Firebase affiche alors
    // dans la console du navigateur un jeton de débogage, à déclarer une fois
    // dans Console Firebase > App Check > Gérer les jetons de débogage.
    if (process.env.NODE_ENV === "development") {
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
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
