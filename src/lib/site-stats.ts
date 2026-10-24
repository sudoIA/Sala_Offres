// src/lib/site-stats.ts
// Compteurs anonymes du mois (collection "stats_monthly", un document par
// mois "AAAA-MM") pour le rapport mensuel admin : visites du site,
// consultations d'offres, quiz terminés. Aucune donnée sur le visiteur. Les
// règles Firestore n'autorisent qu'une augmentation de 1, et la lecture aux
// seuls admins.

import { doc, increment, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type MonthlyStat = "visits" | "jobViews" | "quizzes";

/** "2026-10" pour octobre 2026 (heure locale). */
export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function recordMonthlyStat(stat: MonthlyStat): void {
  // Le site local utilise la même base que la production : on ne fausse pas les chiffres.
  if (process.env.NODE_ENV !== "production") return;
  setDoc(doc(db, "stats_monthly", monthKey()), { [stat]: increment(1) }, { merge: true }).catch((err) =>
    console.warn("Statistique non comptée :", err)
  );
}

const VISIT_KEY = "sala_visit_counted";

/** Une visite par session de navigation ; ni robots, ni pages du back-office. */
export function recordVisit(pathname: string): void {
  if (pathname.startsWith("/admin") || pathname.startsWith("/connexion")) return;
  if (typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawler|spider|lighthouse/i.test(navigator.userAgent))) return;
  try {
    if (sessionStorage.getItem(VISIT_KEY)) return;
    sessionStorage.setItem(VISIT_KEY, "1");
  } catch {
    // sessionStorage indisponible (navigation privée stricte) : on compte quand même.
  }
  recordMonthlyStat("visits");
}
