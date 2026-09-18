// src/lib/annuaire-helpers.ts
// Logique partagée par les 3 catégories d'annuaires (universités, entreprises,
// clubs d'anglais) : badge, résumé de carte, liste de détails et carte de
// localisation. Garder ce fichier permet d'appliquer le même modèle
// carte-compacte + détail-complet partout, sans dupliquer la logique par
// catégorie dans chaque page.

import type { AnnuaireCategory, AnnuaireItem } from "@/types/annuaire";

const CARD_SUMMARY_MAX_LENGTH = 140;

/** Suffixe de classe CSS par catégorie (voir globals.css : "uni" | "comp" | "club"). */
export function annuaireCategoryClass(category: AnnuaireCategory): "uni" | "comp" | "club" {
  if (category === "universities") return "uni";
  if (category === "companies") return "comp";
  return "club";
}

/**
 * Titre générique pour la barre de la modale de détail — le nom de la fiche
 * est déjà affiché juste en dessous, à côté du logo, pas besoin de le
 * répéter ici.
 */
export function annuaireModalTitle(category: AnnuaireCategory): string {
  if (category === "universities") return "Établissement";
  if (category === "companies") return "Entreprise";
  return "Club d'Anglais";
}

/** Titre de la section "Présentation" du détail, adapté à la catégorie. */
export function annuairePresentationTitle(category: AnnuaireCategory): string {
  if (category === "universities") return "Présentation de l'Institution";
  if (category === "companies") return "Présentation de l'Entreprise";
  return "Présentation du Club";
}

/** Texte du badge affiché en haut de la carte. */
export function annuaireBadgeLabel(category: AnnuaireCategory, item: AnnuaireItem): string {
  if (category === "universities") return item.type || item.statut || "Enseignement Supérieur";
  if (category === "companies") return item.sector || item.statut || "Entreprise";
  return item.type || item.statut || "Club d'Anglais";
}

/** Nom complet si renseigné (champ "full_name" de certains imports), sinon le nom court. */
export function annuaireFullName(item: AnnuaireItem): string {
  return item.full_name || item.name || "Sans nom";
}

/** Description : champ "description" ou, à défaut, "contenu" (certains imports). */
export function annuaireDescription(item: AnnuaireItem): string {
  return (item.description || item.contenu || "").trim();
}

/** Site web : champ "website" ou, à défaut, "site" (certains imports). */
export function annuaireWebsite(item: AnnuaireItem): string {
  return item.website || item.site || "";
}

/** Numéros de téléphone (phone/tel/tel2), sans doublons. */
export function annuairePhones(item: AnnuaireItem): string[] {
  const values = [item.phone, item.tel, item.tel2].map((v) => (v || "").trim()).filter(Boolean);
  return Array.from(new Set(values));
}

/** Adresses email (email/email2), sans doublons. */
export function annuaireEmails(item: AnnuaireItem): string[] {
  const values = [item.email, item.email2].map((v) => (v || "").trim()).filter(Boolean);
  return Array.from(new Set(values));
}

/** Résumé court pour la carte : le champ "summary" s'il est renseigné, sinon un extrait de la description. */
export function annuaireCardSummary(item: AnnuaireItem): string {
  const summary = (item.summary || "").trim();
  if (summary) return summary;
  const desc = annuaireDescription(item);
  if (!desc) return "";
  return desc.length > CARD_SUMMARY_MAX_LENGTH ? desc.slice(0, CARD_SUMMARY_MAX_LENGTH).trim() + "…" : desc;
}

/** Étiquette + liste de puces à afficher dans le détail (filières / domaines / activités). */
export function annuaireDetailChips(category: AnnuaireCategory, item: AnnuaireItem): { label: string; items: string[] } {
  if (category === "universities") return { label: "Filières & Départements", items: item.faculties || [] };
  if (category === "companies") return { label: "Domaines d'activité", items: item.services || [] };
  return { label: "Activités proposées", items: item.activities || [] };
}

/** Adresse à utiliser pour la carte (universités/entreprises: address, clubs: location). */
export function annuaireAddress(item: AnnuaireItem): string {
  return item.address || item.location || "";
}

/** Horaires à afficher (champ générique "hours", ou "schedule" pour les clubs). */
export function annuaireHours(item: AnnuaireItem): string {
  return item.hours || item.schedule || "";
}

/**
 * URL d'intégration Google Maps (sans clé API) construite à partir du nom,
 * de l'adresse et de la ville. Retourne null si on n'a rien de localisable.
 */
export function annuaireMapEmbedUrl(item: AnnuaireItem): string | null {
  const location = annuaireAddress(item);
  const query = [item.name, location, item.city, "Congo"].filter(Boolean).join(", ");
  if (!query.trim()) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

/** Lien "Itinéraire" (Google Maps, calcul d'itinéraire vers l'adresse). */
export function annuaireDirectionsUrl(item: AnnuaireItem): string | null {
  const location = annuaireAddress(item);
  const query = [item.name, location, item.city, "Congo"].filter(Boolean).join(", ");
  if (!query.trim()) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
