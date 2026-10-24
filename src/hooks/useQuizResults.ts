// src/hooks/useQuizResults.ts
// Meilleurs scores et badges des quiz (voir src/lib/quiz-badges.ts) : copie
// de l'appareil, fusionnée avec le profil du candidat connecté.

"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { addAttempt, mergeResults, newlyEarned, readLocalResults, saveLocalResults, type BadgeLevel, type QuizResults } from "@/lib/quiz-badges";
import { recordMonthlyStat } from "@/lib/site-stats";
import type { QuizTheme } from "@/types/quiz";

export function useQuizResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<QuizResults>({});

  useEffect(() => {
    const local = readLocalResults();
    setResults(local);
    if (!user) return;
    let cancelled = false;
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (cancelled || !snap.exists()) return;
        const merged = mergeResults(local, (snap.data().quizResults || {}) as QuizResults);
        setResults(merged);
        saveLocalResults(merged);
      })
      .catch(() => {
        // Profil illisible (hors-ligne...) : la copie de l'appareil suffit.
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  /** Enregistre une tentative terminée et renvoie les badges qu'elle vient de débloquer. */
  const record = useCallback(
    (theme: QuizTheme, score: number, total: number): BadgeLevel[] => {
      const before = results[theme];
      const after = addAttempt(before, score, total);
      const next = { ...results, [theme]: after };
      setResults(next);
      saveLocalResults(next);
      recordMonthlyStat("quizzes");
      if (user) {
        updateDoc(doc(db, "users", user.uid), { [`quizResults.${theme}`]: after }).catch(() => {
          // Pas de profil candidat (compte admin...) : gardé sur l'appareil seulement.
        });
      }
      return newlyEarned(before, after);
    },
    [results, user]
  );

  return { results, record };
}
