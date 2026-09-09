// src/components/EncourageFace.tsx
// Petit visage triste mais animé (CSS pur), affiché quand le score du quiz
// d'entretien n'atteint pas l'objectif de 80% — pour encourager la personne
// à réessayer plutôt que de la décourager.

export function EncourageFace() {
  return (
    <div className="encourage-face-wrap" aria-hidden="true">
      <span className="encourage-face-pulse"></span>
      <i className="far fa-frown encourage-face-icon"></i>
    </div>
  );
}
