// src/lib/import-sources.ts
// Liste des sources de collecte connectées — utilisée à la fois côté client
// (écran admin "Imports", sélecteur de source) et côté serveur (tâche
// planifiée, voir src/app/api/cron/collect-jobs/route.ts). Module neutre
// (pas de "use client") pour rester importable depuis une route API Node.

export const IMPORT_SOURCES = [
  { key: "acpe", label: "ACPE" },
  { key: "afriqueemplois", label: "Afriqueemplois.com" },
  { key: "lesopportunites", label: "Les Opportunités du Monde" },
] as const;

export type ImportSourceKey = (typeof IMPORT_SOURCES)[number]["key"];
