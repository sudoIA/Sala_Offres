// src/components/Confetti.tsx
// Petite pluie de confettis en CSS pur (pas de dépendance externe), pour
// célébrer un bon score au quiz d'entretien.

"use client";

import { useState } from "react";

const COLORS = ["#3b9452", "#f8ea1b", "#e30613", "#1e6b31", "#ffffff"];
const PIECES = 40;

function generatePieces() {
  return Array.from({ length: PIECES }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 2.2 + Math.random() * 1.2,
    color: COLORS[i % COLORS.length],
    rotate: Math.random() * 360,
    key: i,
  }));
}

export function Confetti() {
  // Tirage une seule fois au montage (lazy initializer), jamais recalculé
  // au fil des rendus.
  const [pieces] = useState(generatePieces);

  return (
    <div className="confetti-wrap" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.key}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
