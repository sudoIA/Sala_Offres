// src/lib/firebase.ts
// Initialisation unique du SDK Firebase modulaire (v10+) pour toute l'application.
// Les fonctions Firestore/Auth/Storage s'importent directement depuis "firebase/*"
// dans chaque fichier ; ce module n'exporte que les instances déjà initialisées.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyATVsmjgNZD5j5jTkSbVCuw0dtHNMFop7A",
  authDomain: "sala-a6c15.firebaseapp.com",
  projectId: "sala-a6c15",
  storageBucket: "sala-a6c15.appspot.com",
  messagingSenderId: "329607043816",
  appId: "1:329607043816:android:774a1bf373ca8cca",
};

/** Bucket Firebase Storage, réutilisé pour construire des URLs d'images publiques. */
export const STORAGE_BUCKET = firebaseConfig.storageBucket;

// Évite une double initialisation en mode développement (Fast Refresh).
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check (protection anti-robots : seules les requêtes venant réellement
// du site sont acceptées par Firestore une fois l'application activée côté
// console). Ne s'active que si la clé reCAPTCHA v3 est configurée
// (NEXT_PUBLIC_RECAPTCHA_SITE_KEY) et uniquement dans le navigateur.
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    // Déjà initialisé (rechargement à chaud en développement).
    console.warn("App Check :", err);
  }
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
