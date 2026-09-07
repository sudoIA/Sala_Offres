// js/site-settings.js
// Réglages globaux du site, stockés dans le document Firestore "settings/site".
// Utilisé par l'administration (pour les modifier) et par les pages publiques
// (pour afficher les bonnes coordonnées et masquer les sections désactivées).

import { db, doc, getDoc } from "./firebase-config.js";

export const DEFAULT_SETTINGS = {
  contactEmail: "contact.ongsala@gmail.com",
  contactCities: "Brazzaville & Pointe-Noire, République du Congo",
  socialFacebook: "",
  socialWhatsapp: "",
  socialInstagram: "",
  sectionsVisible: {
    evenements: true,
    annuaires: true,
    entretiens: true,
    legislation: true
  }
};

/**
 * Charge les réglages du site depuis Firestore, avec repli sur les valeurs par défaut
 * si le document n'existe pas encore ou en cas d'erreur (ex: hors-ligne).
 */
export async function loadSiteSettings() {
  try {
    const snap = await getDoc(doc(db, "settings", "site"));
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...DEFAULT_SETTINGS,
        ...data,
        sectionsVisible: { ...DEFAULT_SETTINGS.sectionsVisible, ...(data.sectionsVisible || {}) }
      };
    }
  } catch (e) {
    console.warn("Réglages du site indisponibles, utilisation des valeurs par défaut.", e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Masque les liens de navigation (haut et bas de page) correspondant aux sections
 * désactivées dans les réglages. Cherche les éléments par [data-nav-key="..."].
 */
export function applyNavVisibility(settings) {
  const visibility = settings?.sectionsVisible || DEFAULT_SETTINGS.sectionsVisible;
  Object.entries(visibility).forEach(([key, isVisible]) => {
    if (isVisible) return;
    document.querySelectorAll(`[data-nav-key="${key}"]`).forEach(el => {
      el.style.display = "none";
    });
  });
}

/**
 * Applique les coordonnées de contact aux éléments marqués [data-site-contact-email]
 * et [data-site-contact-cities] présents sur la page.
 */
export function applyContactInfo(settings) {
  document.querySelectorAll("[data-site-contact-email]").forEach(el => {
    el.textContent = settings.contactEmail;
    const link = el.closest("a");
    if (link) link.href = `mailto:${settings.contactEmail}`;
  });
  document.querySelectorAll("[data-site-contact-cities]").forEach(el => {
    el.textContent = settings.contactCities;
  });
  document.querySelectorAll("[data-site-contact-mailto]").forEach(el => {
    el.href = `mailto:${settings.contactEmail}`;
  });
}
