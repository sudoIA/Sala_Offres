// src/lib/job-helpers.ts
// Petits utilitaires partagés entre les pages Offres : pastilles colorées
// d'entreprise, compte à rebours d'expiration, favoris locaux (localStorage).

import { findStorageFileUrl } from "@/lib/storage-lookup";

/**
 * Cherche le logo d'une entreprise dans le dossier Storage "entreprises/"
 * (partagé avec l'annuaire des entreprises) à partir de son nom. Renvoie
 * null si aucun fichier ne correspond — CompanyTile affiche alors ses
 * initiales comme avant.
 */
export function resolveCompanyLogoUrl(company?: string | null): Promise<string | null> {
  return findStorageFileUrl("entreprises", company, { bidirectional: true });
}

const TILE_PALETTES = [
  { bg: "#e0f2fe", color: "#0284c7" }, // bleu
  { bg: "#fefce8", color: "#b45309" }, // ambre
  { bg: "#eaf6ed", color: "#1e6b31" }, // vert
  { bg: "#f3e8ff", color: "#7e22ce" }, // violet
  { bg: "#ffe4e6", color: "#be123c" }, // rose
];

export interface TilePalette {
  bg: string;
  color: string;
}

/** Initiales d'une entreprise (2-3 lettres) pour la pastille. */
export function getInitials(name?: string | null): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Couleur de pastille déterministe (même entreprise = même couleur). */
export function getCompanyTileColor(name?: string | null): TilePalette {
  const str = name || "?";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return TILE_PALETTES[Math.abs(hash) % TILE_PALETTES.length];
}

export interface Countdown {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  urgent: boolean;
}

/** Calcule Jours/Heures/Minutes restants avant une date limite. */
export function computeCountdown(deadlineDate: Date | null): Countdown | null {
  if (!deadlineDate) return null;
  const diffMs = deadlineDate.getTime() - Date.now();
  if (diffMs <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, urgent: true };

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

  return { expired: false, days, hours, minutes, urgent: days <= 7 };
}

export interface Expiry {
  expired: boolean;
  text: string;
  urgent?: boolean;
}

/** Délai d'expiration lisible pour les cartes de liste (ex: "Expire dans 3 jrs"). */
export function formatExpiry(deadlineDate: Date | null): Expiry | null {
  if (!deadlineDate) return null;
  const diffMs = deadlineDate.getTime() - Date.now();
  if (diffMs <= 0) return { expired: true, text: "Expiré" };

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return { expired: false, text: "Expire aujourd'hui", urgent: true };
  if (diffDays <= 7) return { expired: false, text: `Expire dans ${diffDays} jrs`, urgent: true };
  if (diffDays <= 14) return { expired: false, text: "Expire dans 2 semaines", urgent: false };
  if (diffDays <= 30) return { expired: false, text: `Expire dans ${Math.ceil(diffDays / 7)} semaines`, urgent: false };
  return { expired: false, text: `Date limite : ${deadlineDate.toLocaleDateString("fr-FR")}`, urgent: false };
}

const FAVORIS_KEY = "sala_favoris";

function readFavoris(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORIS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isFavori(jobId: string): boolean {
  return readFavoris().includes(jobId);
}

/** Bascule un favori local (par appareil) et renvoie le nouvel état. */
export function toggleFavori(jobId: string): boolean {
  const favoris = readFavoris();
  const idx = favoris.indexOf(jobId);
  if (idx >= 0) {
    favoris.splice(idx, 1);
  } else {
    favoris.push(jobId);
  }
  try {
    localStorage.setItem(FAVORIS_KEY, JSON.stringify(favoris));
  } catch {
    // Stockage indisponible (navigation privée) : le favori reste en mémoire pour cette session seulement.
  }
  return favoris.includes(jobId);
}

/** Partage une offre via l'API native si disponible, sinon copie le lien. */
export function shareJob(job: { title?: string; company?: string }, shareUrl: string): void {
  if (typeof navigator !== "undefined" && navigator.share) {
    navigator
      .share({
        title: job.title,
        text: `Offre d'emploi Sala : ${job.title} chez ${job.company}`,
        url: shareUrl,
      })
      .catch(() => {});
  } else if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("Lien de l'offre copié dans le presse-papier !");
    });
  }
}
