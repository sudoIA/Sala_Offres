// src/types/legislation.ts
// Fiches thématiques du Droit du Travail (collection Firestore "legislation"),
// affichées sur la page publique /legislation.

export type LegislationTopic =
  | "contrat"
  | "salaire"
  | "horaires"
  | "conges"
  | "rupture"
  | "hygiene"
  | "representation"
  | "conflits";

export const TOPIC_LABELS: Record<LegislationTopic, string> = {
  contrat: "Contrat de Travail",
  salaire: "Rémunération",
  horaires: "Temps de Travail",
  conges: "Congés & Repos",
  rupture: "Fin de Contrat",
  hygiene: "Hygiène & Sécurité",
  representation: "Représentation & Syndicats",
  conflits: "Règlement des Conflits",
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
  /** Lien vers le texte de loi source, quand disponible. */
  sourceUrl?: string;
  sourceLabel?: string;
}

export interface LegislationFiche extends LegislationDoc {
  id: string;
}
