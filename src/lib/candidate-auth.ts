// src/lib/candidate-auth.ts
// Logique d'authentification candidat (Email/MDP + Google Sign-In).

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

/** Inscription candidat avec création de son profil dans Firestore. */
export async function registerCandidate(
  email: string,
  password: string,
  fullName: string,
  city = "Brazzaville",
  phone = ""
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
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
    updatedAt: serverTimestamp(),
  });

  return user;
}

/** Connexion candidat par email et mot de passe. */
export async function loginCandidate(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/** Connexion / Inscription via Google Sign-In. */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userDocRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
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
      updatedAt: serverTimestamp(),
    });
  }

  return user;
}

/** Réinitialisation du mot de passe. */
export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}
