// js/cv-controller.js
// Contrôleur de l'état du Générateur de CV Sala Web

import { auth, db, doc, getDoc, collection, addDoc, serverTimestamp } from "./firebase-config.js";

// État initial par défaut du CV
export const cvState = {
  template: "classic", // "classic" | "marine" | "moderne"
  personal: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    address: "",
    city: "Brazzaville",
    country: "République du Congo",
    birthDate: "",
    photo: null, // Data URL
    bio: ""
  },
  experiences: [],
  education: [],
  projects: [],
  skills: [],
  hobbies: [],
  languages: [
    { name: "Français", level: "Courant" }
  ]
};

// Sauvegarde automatique dans sessionStorage
export function saveLocalCV() {
  try {
    sessionStorage.setItem("sala_current_cv", JSON.stringify(cvState));
  } catch (e) {
    console.warn("Impossible de sauvegarder localement le CV :", e);
  }
}

// Chargement depuis sessionStorage
export function loadLocalCV() {
  try {
    const saved = sessionStorage.getItem("sala_current_cv");
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(cvState, parsed);
      return true;
    }
  } catch (e) {
    console.warn("Erreur lors de la lecture locale du CV :", e);
  }
  return false;
}

// Sauvegarde dans Firestore pour l'utilisateur connecté
export async function saveCVToFirestore() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Vous devez être connecté pour sauvegarder votre CV en ligne.");
  }

  const cvDocData = {
    ...cvState,
    userId: user.uid,
    updatedAt: serverTimestamp()
  };

  const userCvsCollection = collection(db, "users", user.uid, "cvs");
  const docRef = await addDoc(userCvsCollection, cvDocData);
  return docRef.id;
}
