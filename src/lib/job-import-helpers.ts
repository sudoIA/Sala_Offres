// src/lib/job-import-helpers.ts
// Fonctions pures utilisées par l'écran admin "Imports" : identifiant de
// document stable et détection de doublons avec les offres déjà publiées
// (company + title + city normalisés, V1 du plan d'automatisation). La
// conversion d'une offre importée vers le format "emplois" se fait dans
// JobFormModal, pour permettre à l'admin de la relire et l'ajuster avant
// publication plutôt que de l'écrire telle quelle.

import type { ImportedJob } from "@/types/job-import";
import type { Job } from "@/types/job";

/** Fenêtre (en jours) des offres publiées comparées pour détecter un doublon. */
export const DEDUPE_WINDOW_DAYS = 180;

const COMBINING_DIACRITICS = new RegExp(String.fromCharCode(91, 0x0300) + "-" + String.fromCharCode(0x036f, 93), "g");

/** Identifiant de document Firestore stable pour une offre importée : rejouer
 * la collecte d'une même page ne crée donc jamais de doublon dans
 * "emplois_import", ça met seulement à jour lastCheckedAt (voir useJobImports). */
export function buildImportDocId(source: string, sourceId: string): string {
  return `${source}_${sourceId}`;
}

/** Minuscules, sans accents, ponctuation normalisée : pour comparer deux
 * chaînes sans être sensible à la casse/accentuation/espacement. */
export function normalizeForDedup(text: string): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupKey(company: string, title: string, city: string): string {
  return `${normalizeForDedup(company)}|${normalizeForDedup(title)}|${normalizeForDedup(city)}`;
}

/** Cherche, parmi les offres déjà publiées, une correspondance
 * entreprise+titre+ville (V1 de dédoublonnage, cf. document de plan). Si
 * l'offre importée n'a pas d'entreprise ou de ville identifiée (annonce en
 * texte libre non entièrement extraite), on ne tente pas la comparaison
 * plutôt que de la faire sur une clé partielle peu fiable. */
export function findDuplicatePublishedJob(imported: Pick<ImportedJob, "company" | "title" | "city">, published: Job[]): Job | null {
  if (!imported.company || !imported.city) return null;
  const key = dedupKey(imported.company, imported.title, imported.city);
  return published.find((job) => dedupKey(job.company || "", job.title || "", job.city || "") === key) || null;
}

/** Date limite appliquée à une offre publiée automatiquement sans date connue. */
export const DEFAULT_DEADLINE_DAYS = 30;

/**
 * Champs "emplois" d'une offre importée publiée AUTOMATIQUEMENT (sources de
 * confiance activées dans Admin > Paramètres) - même forme que ce qu'écrit
 * JobFormModal après relecture manuelle. Les dates sont des `Date` : le SDK
 * Admin (tâche planifiée) les convertit lui-même en Timestamp Firestore.
 */
export function importToJobData(job: ImportedJob, now: Date) {
  const deadline = job.deadline
    ? new Date(`${job.deadline}T23:59:59`)
    : new Date(now.getTime() + DEFAULT_DEADLINE_DAYS * 24 * 3600 * 1000);
  return {
    title: job.title.trim(),
    company: (job.company || "").trim(),
    city: (job.city || "").trim(),
    email: job.email || "",
    contract: job.contract || "",
    timestamp: now,
    deadline,
    body: job.description || "",
    languages: null,
    competences: [],
    visibility: true,
    site: job.sourceUrl || null,
    image: job.logo || null,
    tel: null,
  };
}

/** Retire les clés à `undefined` (Firestore refuse d'écrire une valeur undefined). */
export function stripUndefined<T extends object>(obj: T): Partial<T> {
  const clean: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((key) => {
    if (obj[key] !== undefined) clean[key] = obj[key];
  });
  return clean;
}
