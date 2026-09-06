// js/job-ui-helpers.js
// Petits utilitaires partagés entre offres.html et job-detail.html :
// pastilles colorées d'entreprise, compte à rebours d'expiration, favoris locaux.

const TILE_PALETTES = [
  { bg: "#e0f2fe", color: "#0284c7" }, // bleu
  { bg: "#fefce8", color: "#b45309" }, // ambre
  { bg: "#eaf6ed", color: "#1e6b31" }, // vert
  { bg: "#f3e8ff", color: "#7e22ce" }, // violet
  { bg: "#ffe4e6", color: "#be123c" }, // rose
];

/** Initiales d'une entreprise (2-3 lettres) pour la pastille */
export function getInitials(name) {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Couleur de pastille déterministe (même entreprise = même couleur) */
export function getCompanyTileColor(name) {
  const str = name || "?";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const palette = TILE_PALETTES[Math.abs(hash) % TILE_PALETTES.length];
  return palette;
}

/** Calcule Jours/Heures/Minutes restants avant une date limite */
export function computeCountdown(deadlineDate) {
  if (!deadlineDate) return null;
  const diffMs = deadlineDate.getTime() - Date.now();
  if (diffMs <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, urgent: true };

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

  return { expired: false, days, hours, minutes, urgent: days <= 7 };
}

const FAVORIS_KEY = "sala_favoris";

function readFavoris() {
  try {
    return JSON.parse(localStorage.getItem(FAVORIS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isFavori(jobId) {
  return readFavoris().includes(jobId);
}

/** Bascule un favori local (par appareil) et renvoie le nouvel état */
export function toggleFavori(jobId) {
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
    // Stockage indisponible (navigation privée) : le favori reste en mémoire pour cette session seulement
  }
  return favoris.includes(jobId);
}
