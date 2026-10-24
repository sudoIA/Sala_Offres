// src/components/entretiens/InterviewQuiz.tsx
// Quiz d'entraînement interactif à choix multiple. Les questions viennent de
// la collection "quiz" (Admin > Quiz), par thème : entretiens ou droit du
// travail. Chaque quiz terminé met à jour le meilleur score et les badges
// (voir src/lib/quiz-badges.ts).

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePublicQuiz } from "@/hooks/useQuiz";
import { useQuizResults } from "@/hooks/useQuizResults";
import { QuizBadges } from "@/components/QuizBadges";
import type { BadgeLevel } from "@/lib/quiz-badges";
import type { QuizOption, QuizTheme } from "@/types/quiz";
import { Confetti } from "@/components/Confetti";
import { EncourageFace } from "@/components/EncourageFace";

type Phase = "intro" | "play" | "result";

const TEXTS: Record<QuizTheme, { title: string; subtitle: string; excellent: string; good: string; study: string }> = {
  entretiens: {
    title: "Quiz d'Évaluation : Êtes-vous prêt pour l'entretien ?",
    subtitle: "questions concrètes pour tester vos réflexes face à un recruteur.",
    excellent: "Vous maîtrisez parfaitement la posture et les réponses attendues par les recruteurs congolais. Vous avez toutes les chances de réussir votre prochain entretien !",
    good: "Vous avez de bons réflexes professionnels. Relisez le guide des questions pour sécuriser les points où vous avez hésité.",
    study: "L'entretien d'embauche obéit à des codes stricts. Consultez attentivement nos fiches de conseils ci-dessus pour vous entraîner à nouveau.",
  },
  droit_du_travail: {
    title: "Quiz : Connaissez-vous vos droits au travail ?",
    subtitle: "questions pour tester vos connaissances du Code du travail congolais.",
    excellent: "Vous connaissez très bien vos droits et devoirs de travailleur. Bravo !",
    good: "Vous avez de bonnes bases. Relisez les fiches où vous avez hésité pour les consolider.",
    study: "Le Code du travail vous protège : prenez le temps de lire les fiches ci-dessus, puis réessayez.",
  },
};

/** `minQuestions` : en dessous, le quiz ne s'affiche pas du tout. */
export function InterviewQuiz({ theme = "entretiens", minQuestions = 1 }: { theme?: QuizTheme; minQuestions?: number }) {
  const { questions, loading } = usePublicQuiz(theme);
  const texts = TEXTS[theme];
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<QuizOption | null>(null);
  const { results, record } = useQuizResults();
  const [newBadges, setNewBadges] = useState<BadgeLevel[]>([]);

  function start() {
    setStep(0);
    setScore(0);
    setSelected(null);
    setPhase("play");
  }

  function handleAnswer(opt: QuizOption) {
    if (selected) return;
    setSelected(opt);
    if (opt.correct) setScore((s) => s + 1);
  }

  function next() {
    if (step + 1 < questions.length) {
      setStep((s) => s + 1);
      setSelected(null);
    } else {
      setNewBadges(record(theme, score, questions.length));
      setPhase("result");
    }
  }

  if (minQuestions > 1 && (loading || questions.length < minQuestions)) return null;

  if (phase === "intro") {
    return (
      <div className="interview-card p-4 text-center">
        <i className="fas fa-graduation-cap fa-3x text-success mb-3"></i>
        <h4 className="fw-bold mb-2">{texts.title}</h4>
        <p className="text-muted mb-4">
          {loading ? "Chargement des questions..." : `${questions.length} ${texts.subtitle}`}
        </p>
        <button className="btn-sala-primary rounded-pill px-5 py-3 fw-bold" onClick={start} disabled={loading || questions.length === 0}>
          Commencer le Quiz ({Math.max(1, questions.length)} min) <i className="fas fa-play ms-2"></i>
        </button>
        <div className="mt-4 mx-auto" style={{ maxWidth: 520 }}>
          <div className="small fw-bold text-muted mb-2">{results[theme] ? "Vos badges" : "Badges à gagner"}</div>
          <QuizBadges result={results[theme]} compact />
        </div>
      </div>
    );
  }

  if (phase === "play") {
    const q = questions[step];
    return (
      <div className="interview-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="badge-sala-green">Question {step + 1} / {questions.length}</span>
          <span className="small text-muted">Score : {score} pt{score > 1 ? "s" : ""}</span>
        </div>

        <h5 className="fw-bold mb-4">{q.question}</h5>
        <div>
          {q.options.map((opt, i) => {
            const cls = selected
              ? opt === selected
                ? opt.correct
                  ? " correct"
                  : " incorrect"
                : ""
              : "";
            return (
              <div key={i} className={`quiz-option${cls}`} onClick={() => handleAnswer(opt)} style={{ pointerEvents: selected ? "none" : "auto" }}>
                <span className="badge bg-light text-dark border me-2">{String.fromCharCode(65 + i)}</span> {opt.text}
              </div>
            );
          })}
        </div>

        {selected && (
          <div className={`alert mt-3 small ${selected.correct ? "alert-success" : "alert-danger"}`}>
            <i className={`fas ${selected.correct ? "fa-check-circle" : "fa-times-circle"} me-1`}></i>{" "}
            <strong>{selected.correct ? "Excellente réponse !" : "Pas tout à fait..."}</strong> {selected.explanation}
          </div>
        )}

        <div className="text-end mt-4">
          {selected && (
            <button className="btn-sala-primary rounded-pill px-4" onClick={next}>
              {step + 1 < questions.length ? "Question suivante" : "Voir le résultat"} <i className="fas fa-arrow-right ms-2"></i>
            </button>
          )}
        </div>
      </div>
    );
  }

  const percent = score / questions.length;
  const icon =
    percent >= 0.8 ? { i: "fa-trophy text-warning", title: "Excellent ! Vous êtes fin prêt(e)", msg: texts.excellent }
    : percent >= 0.6 ? { i: "fa-thumbs-up text-success", title: "Bon niveau, quelques détails à peaufiner", msg: texts.good }
    : { i: "fa-book-reader text-primary", title: "Prenez le temps d'étudier le guide", msg: texts.study };

  return (
    <div className="interview-card p-5 text-center">
      {percent >= 0.8 ? (
        <>
          <Confetti />
          <i className={`fas ${icon.i} fa-4x mb-3`}></i>
        </>
      ) : (
        <EncourageFace />
      )}
      <h3 className="fw-bold mb-2">{icon.title}</h3>
      <p className="text-muted mb-4">{icon.msg}</p>
      <div className="h2 fw-bold text-success mb-3">{score} / {questions.length}</div>
      {newBadges.length > 0 && (
        <div className="alert alert-success small mx-auto" style={{ maxWidth: 520 }} role="status">
          <i className="fas fa-award me-1"></i>
          {newBadges.length > 1 ? "Nouveaux badges débloqués" : "Nouveau badge débloqué"} : <strong>{newBadges.map((b) => b.label).join(", ")}</strong>
        </div>
      )}
      <div className="mx-auto mb-4" style={{ maxWidth: 560 }}>
        <QuizBadges result={results[theme]} />
      </div>
      <div className="d-flex flex-wrap justify-content-center gap-3">
        <button className="btn-sala-outline rounded-pill px-4" onClick={() => setPhase("intro")}>Recommencer</button>
        <Link href="/offres" className="btn-sala-primary rounded-pill px-4">Postuler à une offre</Link>
      </div>
    </div>
  );
}
