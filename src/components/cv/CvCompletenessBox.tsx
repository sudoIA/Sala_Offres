// src/components/cv/CvCompletenessBox.tsx
// Évaluation légère de complétude du CV — encourage, ne bloque jamais.

import type { CvState } from "@/types/cv";

function computeCompleteness(cv: CvState) {
  const checks = [
    { label: "une photo de profil", done: !!cv.personal.photo },
    { label: "un objectif professionnel", done: !!cv.personal.bio },
    { label: "au moins une expérience", done: cv.experiences.length > 0 },
    { label: "au moins une formation", done: cv.education.length > 0 },
    { label: "au moins 3 compétences", done: cv.skills.length >= 3 },
    { label: "au moins 2 langues", done: cv.languages.length >= 2 },
    { label: "un loisir ou centre d'intérêt", done: cv.hobbies.length > 0 },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  return {
    percent: Math.round((doneCount / checks.length) * 100),
    missing: checks.filter((c) => !c.done).map((c) => c.label),
  };
}

export function CvCompletenessBox({ cv }: { cv: CvState }) {
  const { percent, missing } = computeCompleteness(cv);

  return (
    <div className="p-3 bg-white rounded-3 border shadow-sm mb-3" style={{ maxWidth: "210mm", marginLeft: "auto", marginRight: "auto" }}>
      <div className="d-flex align-items-center gap-3 flex-wrap">
        <span className="small fw-bold text-nowrap">CV complété à {percent}%</span>
        <div className="completeness-bar-track">
          <div className="completeness-bar-fill" style={{ width: `${percent}%` }}></div>
        </div>
      </div>
      <p className="small text-muted mb-0 mt-2">
        {missing.length === 0 ? (
          <span className="text-success fw-bold"><i className="fas fa-star me-1"></i> Votre CV est complet, bravo !</span>
        ) : (
          <>Pensez à ajouter : <strong>{missing.join(", ")}</strong>.</>
        )}
      </p>
    </div>
  );
}
