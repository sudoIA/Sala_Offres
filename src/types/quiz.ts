// src/types/quiz.ts
// Questions de quiz (collection Firestore "quiz"), partagées entre le site et
// l'application mobile. Un document = une question à choix multiple.

export type QuizTheme = "entretiens" | "droit_du_travail";

export const QUIZ_THEME_LABELS: Record<QuizTheme, string> = {
  entretiens: "Préparation aux entretiens",
  droit_du_travail: "Droit du travail",
};

export interface QuizOption {
  text: string;
  correct: boolean;
  /** Affichée après la réponse, que l'option soit juste ou non. */
  explanation: string;
}

export interface QuizDoc {
  theme: QuizTheme;
  question: string;
  options: QuizOption[];
  order: number;
}

export interface QuizQuestion extends QuizDoc {
  id: string;
}
