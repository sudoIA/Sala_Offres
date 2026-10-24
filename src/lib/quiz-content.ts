// src/lib/quiz-content.ts
// Questions de quiz d'origine, avec des identifiants fixes (entretiens-01...).
// Servent à remplir la collection "quiz" une première fois (Admin > Quiz) et
// de repli si la base est vide ou inaccessible (site et API).

import { QUIZ_QUESTIONS } from "@/lib/entretiens-content";
import type { QuizQuestion } from "@/types/quiz";

export const INITIAL_QUIZ: QuizQuestion[] = QUIZ_QUESTIONS.map((q, i) => ({
  id: `entretiens-${String(i + 1).padStart(2, "0")}`,
  theme: "entretiens",
  question: q.question,
  options: q.options,
  order: i + 1,
}));
