// src/types/legislation.ts
// Fiches thématiques du Droit du Travail (collection Firestore "legislation"),
// affichées sur la page publique /legislation.

export type LegislationTopic = "contrat" | "salaire" | "horaires" | "conges" | "rupture";

export const TOPIC_LABELS: Record<LegislationTopic, string> = {
  contrat: "Contrat de Travail",
  salaire: "Rémunération",
  horaires: "Temps de Travail",
  conges: "Congés & Repos",
  rupture: "Fin de Contrat",
};

export interface LegislationDoc {
  topic?: LegislationTopic;
  topicLabel?: string;
  articleRef?: string;
  order?: number;
  title?: string;
  intro?: string;
  bodyHtml?: string;
  faqQuestion?: string;
  faqAnswer?: string;
}

export interface LegislationFiche extends LegislationDoc {
  id: string;
}
