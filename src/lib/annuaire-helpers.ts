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

/** Texte du badge affiché en haut de la carte. */
export function annuaireBadgeLabel(category: AnnuaireCategory, item: AnnuaireItem): string {
  if (category === "universities") return item.type || "Enseignement Supérieur";
  if (category === "companies") return item.sector || "Entreprise";
  return item.type || "Club d'Anglais";
}

/** Résumé court pour la carte : le champ "summary" s'il est renseigné, sinon un extrait de la description. */
export function annuaireCardSummary(item: AnnuaireItem): string {
  const summary = (item.summary || "").trim();
  if (summary) return summary;
  const desc = (item.description || "").trim();
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
