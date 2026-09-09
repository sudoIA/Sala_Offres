// src/lib/offline-cache.ts
// Sauvegarde locale (localStorage) du dernier contenu chargé — offres,
// événements, annuaires — pour qu'il reste consultable même sans connexion,
// y compris en changeant de page. Le "mode hors-ligne" (interrupteur dans la
// sidebar / la barre du haut en mobile) active ou désactive cette
// sauvegarde ; par défaut il est actif.

const ENABLED_KEY = "sala_offline_mode";
const PREFIX = "sala_offline_";

export function isOfflineModeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function setOfflineModeEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
    if (!enabled) {
      // On efface toutes les copies locales déjà enregistrées.
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => window.localStorage.removeItem(k));
    }
  } catch {
    // Stockage indisponible (navigation privée, quota...) : on ignore.
  }
}

interface StoredSnapshot<T> {
  savedAt: string;
  data: T;
}

/** Enregistre une copie locale d'un contenu (si le mode hors-ligne est actif). */
export function saveSnapshot<T>(key: string, data: T): void {
  if (typeof window === "undefined" || !isOfflineModeEnabled()) return;
  try {
    const payload: StoredSnapshot<T> = { savedAt: new Date().toISOString(), data };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(payload));
  } catch {
    // Quota dépassé ou stockage indisponible : on ignore silencieusement.
  }
}

/** Relit la dernière copie locale d'un contenu, si elle existe. */
export function loadSnapshot<T>(key: string): { savedAt: Date; data: T } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSnapshot<T>> | null;
    // Ignore silencieusement une entrée d'un ancien format (ou corrompue) au
    // lieu de planter : elle sera remplacée dès la prochaine sauvegarde.
    if (!parsed || typeof parsed !== "object" || !parsed.savedAt || parsed.data === undefined) {
      window.localStorage.removeItem(PREFIX + key);
      return null;
    }
    return { savedAt: new Date(parsed.savedAt), data: parsed.data };
  } catch {
    return null;
  }
}
