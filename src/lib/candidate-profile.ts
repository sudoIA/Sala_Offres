// src/lib/candidate-profile.ts
// Lecture/écriture du profil candidat (collection Firestore "users").

import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import type { JobAlertPrefs } from "@/lib/job-alerts";
import type { UserProfile, UserProfileDoc } from "@/types/user-profile";

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) return { id: snap.id, ...(snap.data() as UserProfileDoc) };
  return null;
}

export interface ProfileUpdateData {
  fullName: string;
  city: string;
  phone: string;
  bio: string;
  skills: string[];
}

export async function updateUserProfile(uid: string, data: ProfileUpdateData): Promise<void> {
  await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function saveJobAlerts(uid: string, jobAlerts: JobAlertPrefs): Promise<void> {
  await updateDoc(doc(db, "users", uid), { jobAlerts, updatedAt: serverTimestamp() });
}

/**
 * Suppression définitive du compte candidat par lui-même : CV enregistrés,
 * profil, puis compte Firebase Auth. `reauthenticate` doit avoir été appelé
 * juste avant (Firebase exige une connexion récente pour supprimer un
 * compte) : on s'en assure AVANT d'effacer les données, pour ne jamais
 * laisser un compte vidé de son profil mais toujours existant.
 */
export async function deleteCandidateAccount(user: User): Promise<void> {
  const cvs = await getDocs(collection(db, "users", user.uid, "cvs"));
  await Promise.all(cvs.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "users", user.uid));
  await deleteUser(user);
}

/** Reconnexion exigée par Firebase avant une suppression de compte. */
export async function reauthenticate(user: User, password?: string): Promise<void> {
  const usesGoogle = user.providerData.some((p) => p.providerId === "google.com");
  if (usesGoogle && !password) {
    await reauthenticateWithPopup(user, googleProvider);
    return;
  }
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email || "", password || ""));
}
