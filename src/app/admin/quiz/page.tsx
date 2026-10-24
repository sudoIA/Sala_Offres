// src/app/admin/quiz/page.tsx
// Gestion des questions de quiz (collection "quiz"), lues par le site et par
// l'application mobile.

"use client";

import { useMemo, useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { importInitialQuiz, INITIAL_QUIZ, useQuizAdmin } from "@/hooks/useQuiz";
import { QuizFormModal } from "@/components/admin/QuizFormModal";
import { confirmDelete, notify } from "@/lib/notify";
import { logAdminAction } from "@/lib/admin-log";
import { QUIZ_THEME_LABELS, type QuizQuestion, type QuizTheme } from "@/types/quiz";

export default function AdminQuizPage() {
  const { questions, loading } = useQuizAdmin();
  const [theme, setTheme] = useState<QuizTheme>("entretiens");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuizQuestion | null>(null);
  const [importing, setImporting] = useState(false);

  const existingIds = useMemo(() => new Set(questions.map((q) => q.id)), [questions]);
  const missingCount = INITIAL_QUIZ.filter((q) => !existingIds.has(q.id)).length;
  const importNeeded = missingCount > 0;
  const filtered = questions.filter((q) => q.theme === theme);

  function openEditor(question: QuizQuestion | null) {
    setEditing(question);
    setModalOpen(true);
  }

  async function handleImport() {
    setImporting(true);
    try {
      const added = await importInitialQuiz(existingIds);
      if (added) await logAdminAction("create", "quiz", `${added} question(s) importée(s)`);
      notify(added ? `${added} question(s) copiée(s) dans la base.` : "Toutes les questions sont déjà dans la base.");
    } catch (err) {
      console.error("Erreur import quiz :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(question: QuizQuestion) {
    if (!(await confirmDelete("cette question"))) return;
    try {
      await deleteDoc(doc(db, "quiz", question.id));
      await logAdminAction("delete", "quiz", question.question, question.id);
      notify("Question supprimée.");
    } catch (err) {
      console.error("Erreur suppression question de quiz :", err);
      notify("Erreur lors de la suppression.", "error");
    }
  }

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Quiz</h1>
          <p className="admin-page-subtitle">
            Questions des quiz du site (Entretiens, Droit du Travail) et de l&apos;application mobile.
          </p>
        </div>
        <button className="btn-sala-primary" onClick={() => openEditor(null)}>
          <i className="fas fa-plus me-1"></i> Ajouter une question
        </button>
      </div>

      {!loading && importNeeded && (
        <div className="alert alert-info d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="small">
            <i className="fas fa-info-circle me-1"></i>
            {missingCount} question{missingCount > 1 ? "s" : ""} d&apos;origine (quiz Entretiens et Droit du Travail) {missingCount > 1 ? "ne sont" : "n'est"} pas encore dans la base.
            Copiez-les pour pouvoir les modifier ici.
          </span>
          <button className="btn-sala-primary btn-sm" onClick={handleImport} disabled={importing}>
            {importing ? "Copie en cours..." : "Copier les questions dans la base"}
          </button>
        </div>
      )}

      <div className="d-flex gap-2 mb-3 flex-wrap">
        {(Object.keys(QUIZ_THEME_LABELS) as QuizTheme[]).map((key) => (
          <button key={key} className={`topic-pill${theme === key ? " active" : ""}`} onClick={() => setTheme(key)}>
            {QUIZ_THEME_LABELS[key]} ({questions.filter((q) => q.theme === key).length})
          </button>
        ))}
      </div>

      {theme === "droit_du_travail" && (
        <p className="small text-muted">
          Le quiz Droit du Travail apparaît sur la page Droit du Travail du site. Tant que la base ne contient aucune question de ce thème,
          le site et l&apos;API affichent les 10 questions d&apos;origine, tirées des fiches du guide.
        </p>
      )}

      <div className="admin-card-grid">
        {loading && (
          <div className="admin-card-empty admin-empty">
            <div className="spinner-border text-success"></div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="admin-card-empty admin-empty">Aucune question dans ce quiz pour le moment.</div>
        )}

        {!loading &&
          filtered.map((q) => {
            const correct = q.options?.find((o) => o.correct);
            return (
              <div className="admin-card" key={q.id}>
                <div className="title fw-semibold mb-2">{q.question}</div>
                <div className="admin-card-meta">
                  <span className="admin-badge">{q.options?.length || 0} réponses</span>
                  {correct && (
                    <span className="text-truncate" title={correct.text}>
                      <i className="fas fa-check text-success"></i>
                      {correct.text}
                    </span>
                  )}
                </div>
                <div className="admin-card-footer">
                  <span className="text-muted small">Ordre : {q.order ?? "-"}</span>
                  <div className="admin-actions">
                    <button className="btn-icon btn-icon-edit" title="Modifier" onClick={() => openEditor(q)}>
                      <i className="fas fa-pen"></i>
                    </button>
                    <button className="btn-icon btn-icon-delete" title="Supprimer" onClick={() => handleDelete(q)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <QuizFormModal
        open={modalOpen}
        question={editing}
        defaultTheme={theme}
        nextOrder={filtered.length + 1}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
