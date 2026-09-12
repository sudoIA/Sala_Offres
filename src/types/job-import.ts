// src/types/job-import.ts
// Forme d'une offre collectée automatiquement depuis une source externe
// (ACPE, Emploi.cg, ...) avant validation par un administrateur. Distinct de
// "emplois" (JobDoc dans job.ts), qui reste la seule collection publiée sur
// le site : ces offres importées vivront dans "emplois_import" et ne sont
// converties vers "emplois" qu'après approbation manuelle.

export type ImportedJobStatus = "pending" | "approved" | "rejected" | "duplicate" | "expired";

export interface ImportedJob {
  title: string;
  // Optionnels : certaines sources (ex. les annonces "en texte libre" sur
  // Afriqueemplois.com) n'ont pas de champ entreprise/ville/contrat qu'on
  // puisse extraire avec confiance. Dans ce cas on ne devine rien — le champ
  // reste vide et l'admin le complète dans l'écran de relecture avant publication.
  company?: string;
  city?: string;
  contract?: string;
  salary?: string;
  description?: string;
  email?: string;
  /** Date limite au format ISO (YYYY-MM-DD), si connue. */
  deadline?: string;
  logo?: string;

  source: string;
  sourceUrl: string;
  sourceId: string;

  status: ImportedJobStatus;

  /** Dates ISO. */
  importedAt: string;
  lastCheckedAt?: string;

  duplicateOf?: string;
}
