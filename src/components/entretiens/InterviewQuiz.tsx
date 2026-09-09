// src/components/entretiens/InterviewQuiz.tsx
// Quiz d'entraînement interactif (10 questions à choix multiple).

"use client";

import { useState } from "react";
import Link from "next/link";
import { QUIZ_QUESTIONS, type QuizOption } from "@/lib/entretiens-content";
import { Confetti } from "@/components/Confetti";
import { EncourageFace } from "@/components/EncourageFace";

type Phase = "intro" | "play" | "result";

export function InterviewQuiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<QuizOption | null>(null);

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
    if (step + 1 < QUIZ_QUESTIONS.length) {
      setStep((s) => s + 1);
      setSelected(null);
    } else {
      setPhase("result");
    }
  }

  if (phase === "intro") {
    return (
      <div className="interview-card p-4 text-center">
        <i className="fas fa-graduation-cap fa-3x text-success mb-3"></i>
        <h4 className="fw-bold mb-2">Quiz d&apos;Évaluation : Êtes-vous prêt pour l&apos;entretien ?</h4>
        <p className="text-muted mb-4">10 questions concrètes pour tester vos réflexes face à un recruteur.</p>
        <button className="btn-sala-primary rounded-pill px-5 py-3 fw-bold" onClick={start}>
          Commencer le Quiz (10 min) <i className="fas fa-play ms-2"></i>
        </button>
      </div>
    );
  }

  if (phase === "play") {
    const q = QUIZ_QUESTIONS[step];
    return (
      <div className="interview-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="badge-sala-green">Question {step + 1} / {QUIZ_QUESTIONS.length}</span>
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
              {step + 1 < QUIZ_QUESTIONS.length ? "Question suivante" : "Voir le résultat"} <i className="fas fa-arrow-right ms-2"></i>
            </button>
          )}
        </div>
      </div>
    );
  }

  const percent = score / QUIZ_QUESTIONS.length;
  const icon =
    percent >= 0.8 ? { i: "fa-trophy text-warning", title: "Excellent ! Vous êtes fin prêt(e)", msg: "Vous maîtrisez parfaitement la posture et les réponses attendues par les recruteurs congolais. Vous avez toutes les chances de réussir votre prochain entretien !" }
    : percent >= 0.6 ? { i: "fa-thumbs-up text-success", title: "Bon niveau, quelques détails à peaufiner", msg: "Vous avez de bons réflexes professionnels. Relisez le guide des questions pour sécuriser les points où vous avez hésité." }
    : { i: "fa-book-reader text-primary", title: "Prenez le temps d'étudier le guide", msg: "L'entretien d'embauche obéit à des codes stricts. Consultez attentivement nos fiches de conseils ci-dessus pour vous entraîner à nouveau." };

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
      <div className="h2 fw-bold text-success mb-4">{score} / {QUIZ_QUESTIONS.length}</div>
      <div className="d-flex flex-wrap justify-content-center gap-3">
        <button className="btn-sala-outline rounded-pill px-4" onClick={() => setPhase("intro")}>Recommencer</button>
        <Link href="/offres" className="btn-sala-primary rounded-pill px-4">Postuler à une offre</Link>
      </div>
    </div>
  );
}
