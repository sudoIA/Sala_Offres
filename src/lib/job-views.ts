// src/lib/job-views.ts
// Compteur de consultations des offres (collection "job_views", un document
// par offre : { count }), affiché dans le tableau de bord admin ("offres les
// plus consultées"). Anonyme : aucune donnée sur le visiteur. Une seule vue
// comptée par offre et par session de navigation. Les règles Firestore
// n'autorisent qu'une augmentation de 1, et la lecture aux seuls admins.

import { doc, increment, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SESSION_KEY = "sala_viewed_jobs";

export function recordJobView(jobId: string): void {
  try {
    const seen = new Set<string>(JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]"));
    if (seen.has(jobId)) return;
    seen.add(jobId);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...seen]));
  } catch {
    // sessionStorage indisponible (navigation privée stricte) : on compte quand même.
  }
  setDoc(doc(db, "job_views", jobId), { count: increment(1) }, { merge: true }).catch((err) =>
    console.warn("Vue d'offre non comptée :", err)
  );
}
