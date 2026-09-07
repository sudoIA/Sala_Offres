// src/components/CountdownGrid.tsx
// Compte à rebours Jours/Heures/Minutes avant la date limite d'une offre,
// rafraîchi toutes les minutes.

"use client";

import { useEffect, useState } from "react";
import { computeCountdown } from "@/lib/job-helpers";

export function CountdownGrid({ deadlineDate }: { deadlineDate: Date | null }) {
  const [countdown, setCountdown] = useState(() => computeCountdown(deadlineDate));

  useEffect(() => {
    setCountdown(computeCountdown(deadlineDate));
    const intervalId = setInterval(() => setCountdown(computeCountdown(deadlineDate)), 60000);
    return () => clearInterval(intervalId);
  }, [deadlineDate]);

  if (!countdown) return null;

  if (countdown.expired) {
    return (
      <div className="sala-countdown-grid mb-4">
        <div className="sala-countdown-box urgent" style={{ gridColumn: "1 / -1" }}>
          <div className="num">Expirée</div>
        </div>
      </div>
    );
  }

  const cls = countdown.urgent ? " urgent" : "";
  return (
    <div className="sala-countdown-grid mb-4">
      <div className={`sala-countdown-box${cls}`}>
        <div className="num">{String(countdown.days).padStart(2, "0")}</div>
        <div className="label">Jours</div>
      </div>
      <div className={`sala-countdown-box${cls}`}>
        <div className="num">{String(countdown.hours).padStart(2, "0")}</div>
        <div className="label">Heures</div>
      </div>
      <div className={`sala-countdown-box${cls}`}>
        <div className="num">{String(countdown.minutes).padStart(2, "0")}</div>
        <div className="label">Minutes</div>
      </div>
    </div>
  );
}
