// src/components/QuizBadges.tsx
// Rangée de badges d'un quiz (obtenus en couleur, à débloquer en gris) et
// meilleur score. Voir src/lib/quiz-badges.ts.

import { BADGE_LEVELS, earnedBadges, type QuizThemeResult } from "@/lib/quiz-badges";

export function QuizBadges({ result, compact = false }: { result?: QuizThemeResult; compact?: boolean }) {
  const earned = new Set(earnedBadges(result).map((b) => b.key));
  return (
    <div>
      <div className={`quiz-badges${compact ? " compact" : ""}`}>
        {BADGE_LEVELS.map((b) => {
          const ok = earned.has(b.key);
          return (
            <div key={b.key} className={`quiz-badge${ok ? " earned" : ""}`} title={ok ? `${b.label} : obtenu` : `${b.label} : ${b.hint}`}>
              <span className="quiz-badge-icon"><i className={`fas ${ok ? b.icon : "fa-lock"}`}></i></span>
              <span className="quiz-badge-label">{b.label}</span>
              {!compact && <span className="quiz-badge-hint">{ok ? "Obtenu" : b.hint}</span>}
            </div>
          );
        })}
      </div>
      {result && (
        <p className="small text-muted text-center mt-2 mb-0">
          Meilleur score : <strong>{result.best} / {result.total}</strong> - {result.attempts} tentative{result.attempts > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
