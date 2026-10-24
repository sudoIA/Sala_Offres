// src/hooks/useQuiz.ts
// Questions de quiz (collection "quiz") : lecture publique par thème, liste
// en temps réel pour le back-office, et copie initiale des questions qui
// étaient écrites dans le code du site.

"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDocs, onSnapshot, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { INITIAL_QUIZ } from "@/lib/quiz-content";
import type { QuizDoc, QuizQuestion, QuizTheme } from "@/types/quiz";

export { INITIAL_QUIZ };

function byOrder(a: QuizQuestion, b: QuizQuestion) {
  return (a.order || 0) - (b.order || 0);
}

/**
 * Questions d'un thème pour les pages publiques. Tri côté client (pas
 * d'index composite à créer). Repli sur les questions d'origine si la base
 * est vide ou inaccessible.
 */
export function usePublicQuiz(theme: QuizTheme) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fallback = INITIAL_QUIZ.filter((q) => q.theme === theme);
    getDocs(query(collection(db, "quiz"), where("theme", "==", theme)))
      .then((snap) => {
        if (cancelled) return;
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as QuizDoc) })).filter((q) => q.options?.length >= 2);
        setQuestions(list.length ? list.sort(byOrder) : fallback);
      })
      .catch((err) => {
        console.warn("Quiz Firestore inaccessible, utilisation des questions intégrées.", err);
        if (!cancelled) setQuestions(fallback);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [theme]);

  return { questions, loading };
}

/** Toutes les questions, en temps réel (back-office). */
export function useQuizAdmin() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "quiz"),
      (snapshot) => {
        setQuestions(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as QuizDoc) })).sort(byOrder));
        setLoading(false);
      },
      (err) => {
        console.error("Erreur chargement quiz :", err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { questions, loading };
}

/** Copie les questions d'origine absentes de la base. Renvoie le nombre ajouté. */
export async function importInitialQuiz(existingIds: Set<string>): Promise<number> {
  const batch = writeBatch(db);
  let added = 0;
  for (const { id, ...data } of INITIAL_QUIZ) {
    if (existingIds.has(id)) continue;
    batch.set(doc(db, "quiz", id), data);
    added++;
  }
  if (added > 0) await batch.commit();
  return added;
}
