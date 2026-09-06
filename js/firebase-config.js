// js/firebase-config.js
// Configuration centralisée Firebase Modular SDK (v10.12.0) pour l'application Sala Web

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Configuration du projet Firebase Sala
export const firebaseConfig = {
  apiKey: "AIzaSyATVsmjgNZD5j5jTkSbVCuw0dtHNMFop7A",
  authDomain: "sala-a6c15.firebaseapp.com",
  projectId: "sala-a6c15",
  storageBucket: "sala-a6c15.appspot.com",
  messagingSenderId: "329607043816",
  appId: "1:329607043816:android:774a1bf373ca8cca"
};

// Initialisation unique
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Provider Google pour le Sign-In utilisateur
export const googleProvider = new GoogleAuthProvider();

// Export des fonctions Firestore et Auth utiles pour simplifier les imports
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  ref,
  uploadBytes,
  getDownloadURL
};
