// src/components/admin/QuizFormModal.tsx
// Formulaire de création/édition d'une question de quiz : 2 à 4 réponses,
// une seule juste, chacune avec son explication.

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/Modal";
import { notify } from "@/lib/notify";
import { logAdminAction } from "@/lib/admin-log";
import { QUIZ_THEME_LABELS, type QuizDoc, type QuizOption, type QuizQuestion, type QuizTheme } from "@/types/quiz";
import { normalizeDashes } from "@/lib/dashes";

interface QuizFormModalProps {
  open: boolean;
  question: QuizQuestion | null;
  defaultTheme: QuizTheme;
  nextOrder: number;
  onClose: () => void;
}

const EMPTY_OPTION: QuizOption = { text: "", correct: false, explanation: "" };

export function QuizFormModal({ open, question, defaultTheme, nextOrder, onClose }: QuizFormModalProps) {
  const [theme, setTheme] = useState<QuizTheme>(defaultTheme);
  const [text, setText] = useState("");
  const [order, setOrder] = useState(1);
  const [options, setOptions] = useState<QuizOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTheme(question?.theme || defaultTheme);
    setText(question?.question || "");
    setOrder(question?.order || nextOrder);
    setOptions(
      question?.options?.length
        ? question.options.map((o) => ({ ...EMPTY_OPTION, ...o }))
        : [{ ...EMPTY_OPTION, correct: true }, { ...EMPTY_OPTION }, { ...EMPTY_OPTION }]
    );
  }, [open, question, defaultTheme, nextOrder]);

  function setOption(index: number, patch: Partial<QuizOption>) {
    setOptions((list) => list.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function setCorrect(index: number) {
    setOptions((list) => list.map((o, i) => ({ ...o, correct: i === index })));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleaned = options
      .map((o) => ({ text: o.text.trim(), correct: o.correct, explanation: o.explanation.trim() }))
      .filter((o) => o.text);
    if (cleaned.length < 2) return notify("Indiquez au moins 2 réponses.", "error");
    if (cleaned.filter((o) => o.correct).length !== 1) return notify("Cochez une (et une seule) bonne réponse.", "error");

    setSaving(true);
    const data: QuizDoc = normalizeDashes({ theme, question: text.trim(), options: cleaned, order: order || 1 });
    try {
      if (question) {
        await setDoc(doc(db, "quiz", question.id), data);
        await logAdminAction("update", "quiz", data.question, question.id);
        notify("Question mise à jour.");
      } else {
        const ref = await addDoc(collection(db, "quiz"), data);
        await logAdminAction("create", "quiz", data.question, ref.id);
        notify("Question ajoutée.");
      }
      onClose();
    } catch (err) {
      console.error("Erreur enregistrement question de quiz :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={question ? "Modifier la question" : "Ajouter une question"}>
      <form className="job-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="quizTheme">Quiz</label>
            <select id="quizTheme" value={theme} onChange={(e) => setTheme(e.target.value as QuizTheme)}>
              {(Object.keys(QUIZ_THEME_LABELS) as QuizTheme[]).map((key) => (
                <option key={key} value={key}>{QUIZ_THEME_LABELS[key]}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="quizOrder">Ordre d&apos;affichage</label>
            <input id="quizOrder" type="number" min={1} value={order} onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)} />
          </div>
        </div>
        <div className="form-group full-width">
          <label htmlFor="quizQuestion">Question</label>
          <textarea id="quizQuestion" rows={2} value={text} onChange={(e) => setText(e.target.value)} required maxLength={500} />
        </div>

        {options.map((opt, i) => (
          <div className="form-group full-width border rounded-3 p-3 mb-2" key={i}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="mb-0 d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                <input type="radio" name="quizCorrect" checked={opt.correct} onChange={() => setCorrect(i)} style={{ width: "auto" }} />
                Réponse {String.fromCharCode(65 + i)} {opt.correct && <span className="text-success small">(bonne réponse)</span>}
              </label>
              {options.length > 2 && (
                <button type="button" className="btn-icon btn-icon-delete" title="Retirer cette réponse" onClick={() => setOptions((list) => list.filter((_, j) => j !== i))}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <input type="text" placeholder="Texte de la réponse" value={opt.text} onChange={(e) => setOption(i, { text: e.target.value })} maxLength={300} className="mb-2" />
            <input
              type="text"
              placeholder="Explication affichée après la réponse"
              value={opt.explanation}
              onChange={(e) => setOption(i, { explanation: e.target.value })}
              maxLength={500}
            />
          </div>
        ))}
        {options.length < 4 && (
          <button type="button" className="btn btn-link btn-sm px-0 mb-3" onClick={() => setOptions((list) => [...list, { ...EMPTY_OPTION }])}>
            <i className="fas fa-plus me-1"></i> Ajouter une réponse
          </button>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-sala-primary" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
