// js/auth-controller.js
// Logique d'authentification candidat (Email/MDP + Google Sign-In) pour Sala Web

import { 
  auth, 
  db, 
  googleProvider,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail,
  doc, 
  getDoc, 
  serverTimestamp 
} from "./firebase-config.js";
import { setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Inscription candidat avec création de son profil dans Firestore
 */
export async function registerCandidate(email, password, fullName, city = "Brazzaville", phone = "") {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Création du document profil dans 'users'
  const userDocRef = doc(db, "users", user.uid);
  await setDoc(userDocRef, {
    uid: user.uid,
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    city: city.trim(),
    phone: phone.trim(),
    role: "candidat",
    photoURL: user.photoURL || null,
    bio: "",
    skills: [],
    savedJobs: [],
    applications: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return user;
}

/**
 * Connexion candidat par email et mot de passe
 */
export async function loginCandidate(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Connexion / Inscription via Google Sign-In
 */
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Vérifier si le profil existe déjà
  const userDocRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    // Premier login Google : initialiser le document
    await setDoc(userDocRef, {
      uid: user.uid,
      fullName: user.displayName || "Candidat Sala",
      email: user.email,
      photoURL: user.photoURL || null,
      city: "Brazzaville",
      phone: user.phoneNumber || "",
      role: "candidat",
      bio: "",
      skills: [],
      savedJobs: [],
      applications: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  return user;
}

/**
 * Réinitialisation du mot de passe
 */
export async function sendResetEmail(email) {
  await sendPasswordResetEmail(auth, email);
}
