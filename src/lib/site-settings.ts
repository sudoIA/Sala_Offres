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
  actualites: boolean;
}

export interface SiteSettings {
  contactEmail: string;
  contactCities: string;
  socialFacebook: string;
  socialWhatsapp: string;
  socialInstagram: string;
  socialLinkedin: string;
  sectionsVisible: SectionsVisible;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  contactEmail: "contact.ongsala@gmail.com",
  contactCities: "Brazzaville & Pointe-Noire, République du Congo",
  socialFacebook: "https://www.facebook.com/ongsala",
  socialWhatsapp: "",
  socialInstagram: "https://www.instagram.com/ongsala20?stkn=MWh0eW8ybTBmNXFkNw==",
  socialLinkedin: "https://www.linkedin.com/company/sala/",
  sectionsVisible: {
    evenements: true,
    annuaires: true,
    entretiens: true,
    legislation: true,
    // Masquée par défaut : à activer dans Admin > Paramètres une fois les
    // premiers articles News Sala publiés (évite une page vide).
    actualites: false,
  },
};

// Une seule lecture partagée : menu, barre du bas, pied de page et en-tête
// demandent tous ces réglages à chaque page. Rafraîchie au plus toutes les
// 5 minutes (le changement fait par un admin apparaît donc sous 5 min).
const SETTINGS_TTL_MS = 5 * 60 * 1000;
let cached: { at: number; promise: Promise<SiteSettings> } | null = null;

/**
 * Charge les réglages du site depuis Firestore, avec repli sur les valeurs par
 * défaut si le document n'existe pas encore ou en cas d'erreur (ex: hors-ligne).
 */
export function loadSiteSettings(): Promise<SiteSettings> {
  if (!cached || Date.now() - cached.at > SETTINGS_TTL_MS) {
    cached = { at: Date.now(), promise: fetchSiteSettings() };
  }
  return cached.promise;
}

/** À appeler après une modification des réglages (Admin > Paramètres). */
export function clearSiteSettingsCache(): void {
  cached = null;
}

async function fetchSiteSettings(): Promise<SiteSettings> {
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
