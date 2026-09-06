// js/profile-controller.js
// Gestion des données du profil candidat Sala Web

import { 
  auth, 
  db, 
  doc, 
  getDoc, 
  updateDoc, 
  signOut, 
  onAuthStateChanged,
  serverTimestamp 
} from "./firebase-config.js";

/**
 * Charge les informations du profil utilisateur connecté
 */
export async function loadUserProfile(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/**
 * Met à jour les informations du profil
 */
export async function updateUserProfile(uid, data) {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

/**
 * Déconnexion de l'utilisateur
 */
export async function logoutUser() {
  await signOut(auth);
  window.location.href = "index.html";
}
