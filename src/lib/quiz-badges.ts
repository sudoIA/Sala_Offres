// src/lib/quiz-badges.ts
// Meilleurs scores et badges des quiz (entretiens, droit du travail).
// Gardés sur l'appareil (localStorage) et, pour un candidat connecté, dans
// son profil (users/{uid}.quizResults) pour les retrouver partout.

import type { QuizTheme } from "@/types/quiz";

export interface QuizThemeResult {
  /** Bonnes réponses de la meilleure tentative, sur `total` questions. */
  best: number;
  total: number;
  attempts: number;
  /** Date ISO de la dernière tentative. */
  lastAt: string;
}

export type QuizResults = Partial<Record<QuizTheme, QuizThemeResult>>;

export interface BadgeLevel {
  key: "premier-pas" | "bon-niveau" | "expert" | "sans-faute";
  label: string;
  icon: string;
  /** Part minimale de bonnes réponses (0 = il suffit de terminer). */
  min: number;
  hint: string;
}

export const BADGE_LEVELS: BadgeLevel[] = [
  { key: "premier-pas", label: "Premier pas", icon: "fa-shoe-prints", min: 0, hint: "Terminer le quiz" },
  { key: "bon-niveau", label: "Bon niveau", icon: "fa-thumbs-up", min: 0.6, hint: "60 % de bonnes réponses" },
  { key: "expert", label: "Expert", icon: "fa-medal", min: 0.8, hint: "80 % de bonnes réponses" },
  { key: "sans-faute", label: "Sans faute", icon: "fa-trophy", min: 1, hint: "Toutes les réponses justes" },
];

function ratio(r: { best: number; total: number }): number {
  return r.total > 0 ? r.best / r.total : 0;
}

/** Badges obtenus pour un thème (dans l'ordre de BADGE_LEVELS). */
export function earnedBadges(result?: QuizThemeResult): BadgeLevel[] {
  if (!result || result.attempts < 1) return [];
  return BADGE_LEVELS.filter((b) => ratio(result) >= b.min);
}

/** Ajoute une tentative : le meilleur score est gardé (en proportion, le nombre de questions pouvant changer). */
export function addAttempt(previous: QuizThemeResult | undefined, score: number, total: number, at = new Date()): QuizThemeResult {
  const attempt = { best: score, total };
  const keepPrevious = previous && ratio(previous) >= ratio(attempt);
  return {
    best: keepPrevious ? previous.best : score,
    total: keepPrevious ? previous.total : total,
    attempts: (previous?.attempts || 0) + 1,
    lastAt: at.toISOString(),
  };
}

/** Badges gagnés par cette tentative (absents avant, présents après). */
export function newlyEarned(before: QuizThemeResult | undefined, after: QuizThemeResult): BadgeLevel[] {
  const had = new Set(earnedBadges(before).map((b) => b.key));
  return earnedBadges(after).filter((b) => !had.has(b.key));
}

function isResult(value: unknown): value is QuizThemeResult {
  const r = value as QuizThemeResult;
  return !!r && typeof r.best === "number" && typeof r.total === "number" && typeof r.attempts === "number";
}

/** Fusion appareil + profil : pour chaque thème, le meilleur score et le plus grand nombre de tentatives. */
export function mergeResults(a: QuizResults, b: QuizResults): QuizResults {
  const merged: QuizResults = {};
  for (const theme of ["entretiens", "droit_du_travail"] as QuizTheme[]) {
    const x = isResult(a[theme]) ? a[theme] : undefined;
    const y = isResult(b[theme]) ? b[theme] : undefined;
    if (!x || !y) {
      const only = x || y;
      if (only) merged[theme] = only;
      continue;
    }
    const best = ratio(x) >= ratio(y) ? x : y;
    merged[theme] = {
      best: best.best,
      total: best.total,
      attempts: Math.max(x.attempts, y.attempts),
      lastAt: x.lastAt > y.lastAt ? x.lastAt : y.lastAt,
    };
  }
  return merged;
}

const STORAGE_KEY = "sala_quiz_results";

export function readLocalResults(): QuizResults {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return mergeResults(parsed, {});
  } catch {
    return {};
  }
}

export function saveLocalResults(results: QuizResults): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // Stockage indisponible (navigation privée) : les badges restent pour cette page seulement.
  }
}
