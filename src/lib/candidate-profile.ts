// src/lib/candidate-profile.ts
// Lecture/écriture du profil candidat (collection Firestore "users").

import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
