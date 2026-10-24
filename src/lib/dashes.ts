// src/lib/dashes.ts
// Choix éditorial de Sala : pas de tiret long (— ou –) dans les textes du
// site, seulement le tiret court "-". Appliqué à chaque enregistrement
// (formulaires admin, imports d'offres) et au nettoyage ponctuel de la base
// (Admin > Paramètres).

const LONG_DASHES = /[—–]/g;

export function replaceLongDashes(text: string): string {
  return text.replace(LONG_DASHES, "-");
}

export function hasLongDash(text: string): boolean {
  return /[—–]/.test(text);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Remplace les tirets longs dans toutes les chaînes d'une valeur (objets
 * simples et tableaux inclus). Les autres valeurs (dates, Timestamp
 * Firestore, nombres...) sont rendues telles quelles.
 */
export function normalizeDashes<T>(value: T): T {
  if (typeof value === "string") return replaceLongDashes(value) as T;
  if (Array.isArray(value)) return value.map((v) => normalizeDashes(v)) as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) out[key] = normalizeDashes(v);
    return out as T;
  }
  return value;
}

/**
 * Champs d'un document à réécrire pour en retirer les tirets longs
 * (uniquement ceux qui changent), ou null s'il n'y a rien à faire.
 */
export function dashFieldUpdates(data: Record<string, unknown>): Record<string, unknown> | null {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const cleaned = normalizeDashes(value);
    if (JSON.stringify(cleaned) !== JSON.stringify(value)) updates[key] = cleaned;
  }
  return Object.keys(updates).length ? updates : null;
}
