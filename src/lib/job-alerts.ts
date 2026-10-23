// src/lib/job-alerts.ts
// Alertes emploi des candidats : préférences enregistrées dans leur profil
// (users/{uid}.jobAlerts) et règle de correspondance avec une offre. Fonctions
// pures, partagées par l'écran profil et la tâche planifiée qui envoie le
// récapitulatif quotidien par email (src/app/api/cron/collect-jobs).

export interface JobAlertPrefs {
  enabled: boolean;
  /** Mots-clés recherchés dans l'intitulé, l'entreprise ou la description (un seul suffit). */
  keywords: string[];
  /** Ville souhaitée, vide = toutes. */
  city: string;
  /** Type de contrat souhaité (voir ALERT_CONTRACTS), vide = tous. */
  contract: string;
}

export const EMPTY_JOB_ALERTS: JobAlertPrefs = { enabled: false, keywords: [], city: "", contract: "" };

/**
 * Types de contrat proposés, avec les formulations rencontrées dans les
 * offres réelles ("CDI", "Contrat à durée indéterminée", ...).
 */
export const ALERT_CONTRACTS: { value: string; label: string; pattern: RegExp }[] = [
  { value: "CDI", label: "CDI", pattern: /\bCDI\b|ind[ée]termin[ée]e/i },
  { value: "CDD", label: "CDD", pattern: /\bCDD\b|dur[ée]e d[ée]termin[ée]e/i },
  { value: "Stage", label: "Stage", pattern: /stage|stagiaire|intern/i },
  { value: "Consultant", label: "Consultant / Freelance", pattern: /consultan|freelance|prestataire|ind[ée]pendant/i },
];

export const MAX_ALERT_KEYWORDS = 10;

function normalize(text: string | undefined | null): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** "commercial, Comptable,  " -> ["commercial", "Comptable"] (dédoublonné, limité). */
export function parseKeywords(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input.split(",")) {
    const word = raw.trim().slice(0, 40);
    if (word && !seen.has(normalize(word))) {
      seen.add(normalize(word));
      result.push(word);
    }
  }
  return result.slice(0, MAX_ALERT_KEYWORDS);
}

interface MatchableJob {
  title?: string;
  company?: string;
  city?: string;
  contract?: string;
  body?: string;
}

/** Vrai si l'offre correspond aux critères de l'alerte (critères vides = ignorés). */
export function jobMatchesAlert(job: MatchableJob, prefs: JobAlertPrefs): boolean {
  if (prefs.city && !normalize(job.city).includes(normalize(prefs.city))) return false;

  if (prefs.contract) {
    const contract = ALERT_CONTRACTS.find((c) => c.value === prefs.contract);
    const text = `${job.contract || ""} ${job.title || ""}`;
    if (contract ? !contract.pattern.test(text) : !normalize(text).includes(normalize(prefs.contract))) return false;
  }

  if (prefs.keywords.length > 0) {
    const haystack = normalize(`${job.title} ${job.company} ${(job.body || "").replace(/<[^>]+>/g, " ")}`);
    if (!prefs.keywords.some((k) => haystack.includes(normalize(k)))) return false;
  }

  return true;
}
