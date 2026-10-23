// src/lib/custom-sources.ts
// Sources de collecte ajoutées par l'équipe depuis Admin > Imports (collection
// Firestore "import_sources"), en plus des sources intégrées d'import-sources.ts.
// Module neutre (client + serveur).

export interface CustomSourceConfig {
  name: string;
  /** Page qui liste les offres (ou flux RSS) du site. */
  url: string;
  /** Optionnel : ne garder que les offres contenant ce mot (ex. "Congo"). */
  keyword?: string;
  /**
   * Optionnel : entreprise à indiquer sur toutes les offres de ce site
   * (ex. "MTN Congo" pour la page carrières de MTN), au lieu de la saisir à
   * chaque relecture.
   */
  defaultCompany?: string;
  /** Optionnel (avancé) : sélecteur CSS des liens vers les offres. */
  selector?: string;
  /** Incluse dans la collecte automatique quotidienne. */
  enabled: boolean;
}

export interface CustomSource extends CustomSourceConfig {
  id: string;
  lastRunAt?: string;
  lastCount?: number;
  lastError?: string | null;
}

const CUSTOM_PREFIX = "custom_";

/** Clé de source stockée sur chaque offre importée ("custom_<id>"). */
export function customSourceKey(id: string): string {
  return `${CUSTOM_PREFIX}${id}`;
}

export function isCustomSourceKey(key: string): boolean {
  return key.startsWith(CUSTOM_PREFIX);
}
