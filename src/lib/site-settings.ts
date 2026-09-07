// src/lib/site-settings.ts
// Réglages globaux du site, stockés dans le document Firestore "settings/site".
// Modifiés depuis l'administration, consommés par les pages publiques via le
// hook useSiteSettings() pour afficher les bonnes coordonnées et masquer les
// sections désactivées.

import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface SectionsVisible {
  evenements: boolean;
  annuaires: boolean;
  entretiens: boolean;
  legislation: boolean;
}

export interface SiteSettings {
  contactEmail: string;
  contactCities: string;
  socialFacebook: string;
  socialWhatsapp: string;
  socialInstagram: string;
  sectionsVisible: SectionsVisible;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  contactEmail: "contact.ongsala@gmail.com",
  contactCities: "Brazzaville & Pointe-Noire, République du Congo",
  socialFacebook: "",
  socialWhatsapp: "",
  socialInstagram: "",
  sectionsVisible: {
    evenements: true,
    annuaires: true,
    entretiens: true,
    legislation: true,
  },
};

/**
 * Charge les réglages du site depuis Firestore, avec repli sur les valeurs par
 * défaut si le document n'existe pas encore ou en cas d'erreur (ex: hors-ligne).
 */
export async function loadSiteSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(doc(db, "settings", "site"));
    if (snap.exists()) {
      const data = snap.data() as Partial<SiteSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...data,
        sectionsVisible: { ...DEFAULT_SETTINGS.sectionsVisible, ...(data.sectionsVisible || {}) },
      };
    }
  } catch (e) {
    console.warn("Réglages du site indisponibles, utilisation des valeurs par défaut.", e);
  }
  return DEFAULT_SETTINGS;
}
