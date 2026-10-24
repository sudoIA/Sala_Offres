// src/lib/job-helpers.ts
// Petits utilitaires partagés entre les pages Offres : pastilles colorées
// d'entreprise, compte à rebours d'expiration, favoris (sur l'appareil, et
// dans le profil du candidat connecté : voir favorites-sync.ts).

import { findStorageFileUrl } from "@/lib/storage-lookup";
import { findCompany, loadCompanyDirectory } from "@/hooks/useCompanyDirectory";
import { saveFavoriToAccount } from "@/lib/favorites-sync";

/**
 * Logo d'une entreprise : d'abord celui de sa fiche dans l'annuaire des
 * entreprises (URL, ou nom de fichier du dossier Storage "entreprises/"),
 * sinon un fichier de ce dossier dont le nom ressemble au sien. Renvoie
 * null si rien ne correspond - CompanyTile affiche alors ses initiales.
 */
export async function resolveCompanyLogoUrl(company?: string | null): Promise<string | null> {
  const logo = findCompany(await loadCompanyDirectory(), company)?.logo?.trim();
  if (logo && /^https?:\/\//i.test(logo)) return logo;
  if (logo) {
    const fromFiche = await findStorageFileUrl("entreprises", logo.replace(/\.[^.]+$/, ""), { bidirectional: true });
    if (fromFiche) return fromFiche;
  }
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

/** Ex: "à l'instant", "il y a 5 min", "il y a 2h" - pour l'indicateur "Mise à jour ...". */
export function formatRelativeTime(date: Date): string {
  const diffSec = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSec < 30) return "à l'instant";
  if (diffSec < 60) return "il y a moins d'1 min";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffDays = Math.round(diffH / 24);
  return `il y a ${diffDays} j`;
}

const FAVORIS_KEY = "sala_favoris";
/** Événement émis quand les favoris de l'appareil sont remplacés par ceux du compte. */
export const FAVORIS_EVENT = "sala-favoris";

/** Identifiants des offres mises en favori sur cet appareil (Profil > Favoris). */
export function readFavoris(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(FAVORIS_KEY) || "[]");
    return Array.isArray(list) ? list.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** Remplace les favoris de l'appareil (synchronisation avec le compte). */
export function writeFavoris(ids: string[], notifyPage = false): void {
  try {
    localStorage.setItem(FAVORIS_KEY, JSON.stringify(ids));
  } catch {
    // Stockage indisponible (navigation privée).
  }
  if (notifyPage) window.dispatchEvent(new Event(FAVORIS_EVENT));
}

export function isFavori(jobId: string): boolean {
  return readFavoris().includes(jobId);
}

/** Bascule un favori (appareil + compte si connecté) et renvoie le nouvel état. */
export function toggleFavori(jobId: string): boolean {
  const favoris = readFavoris();
  const idx = favoris.indexOf(jobId);
  if (idx >= 0) {
    favoris.splice(idx, 1);
  } else {
    favoris.push(jobId);
  }
  writeFavoris(favoris);
  const saved = favoris.includes(jobId);
  saveFavoriToAccount(jobId, saved);
  return saved;
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
