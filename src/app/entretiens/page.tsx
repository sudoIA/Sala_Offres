// src/app/entretiens/page.tsx
// Préparation aux entretiens : guide des questions fréquentes + quiz interactif.

"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FabCv } from "@/components/layout/FabCv";
import { InterviewQuiz } from "@/components/entretiens/InterviewQuiz";
import { INTERVIEW_QUESTIONS } from "@/lib/entretiens-content";

type Mode = "guide" | "quiz";

export default function EntretiensPage() {
  const [mode, setMode] = useState<Mode>("guide");

  return (
    <div className="sala-layout-wrapper">
      <AppSidebar />
      <div className="sala-main-content">
        <AppTopbar />

        <div className="container py-4" style={{ maxWidth: 840 }}>
          <div className="text-center mb-4">
            <span className="badge-sala-green px-3 py-1 mb-2"><i className="fas fa-user-tie me-1"></i> Coaching Recrutement</span>
            <h1 className="h2 fw-bold text-dark mb-2">Préparation aux Entretiens</h1>
            <p className="text-muted">
              Maîtrisez les codes des recruteurs au Congo, évitez les pièges classiques et entraînez-vous avec notre Quiz interactif.
            </p>

            <div className="btn-group p-1 bg-white border rounded-pill shadow-sm mt-2" role="group">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-4 fw-bold ${mode === "guide" ? "btn-success" : "btn-light text-muted"}`}
                onClick={() => setMode("guide")}
              >
                <i className="fas fa-book-open me-1"></i> Guide des Questions
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-4 fw-bold ${mode === "quiz" ? "btn-success" : "btn-light text-muted"}`}
                onClick={() => setMode("quiz")}
              >
                <i className="fas fa-vial me-1"></i> Quiz d&apos;entraînement
              </button>
            </div>
          </div>

          {mode === "guide" && (
            <div>
              {INTERVIEW_QUESTIONS.map((q) => (
                <div className="interview-card" key={q.number}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-light text-dark border fw-bold">Question {q.number}</span>
                    <h5 className="fw-bold mb-0 text-dark">{q.question}</h5>
                  </div>
                  <p className="text-muted small mb-3">
                    <strong>Ce que cherche le recruteur :</strong> {q.seeking}
                  </p>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100">
                        <span className="badge-do mb-2 d-inline-block"><i className="fas fa-check"></i> Ce qu&apos;il faut dire</span>
                        <p className="small text-secondary mb-0">{q.doText}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100">
                        <span className="badge-dont mb-2 d-inline-block"><i className="fas fa-times"></i> À éviter absolument</span>
                        <p className="small text-secondary mb-0">{q.dontText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mode === "quiz" && <InterviewQuiz />}
        </div>
      </div>

      <FabCv />
      <BottomNav />
    </div>
  );
}
