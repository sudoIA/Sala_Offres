// src/lib/firebase.ts
// Initialisation unique du SDK Firebase modulaire (v10+) pour toute l'application.
// Les fonctions Firestore/Auth/Storage s'importent directement depuis "firebase/*"
// dans chaque fichier ; ce module n'exporte que les instances déjà initialisées.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
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

// Évite une double initialisation en mode développement (Fast Refresh).
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
