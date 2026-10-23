// src/components/ErrorReporter.tsx
// Signale au serveur (src/app/api/client-errors) les erreurs JavaScript non
// gérées rencontrées par les visiteurs en production, pour les voir dans
// Admin > Journal au lieu de les découvrir quand un utilisateur s'en plaint.
// Une même erreur n'est envoyée qu'une fois par page, et au plus 5 au total.

"use client";

import { useEffect } from "react";

const MAX_REPORTS_PER_PAGE = 5;

export function ErrorReporter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const sent = new Set<string>();

    function report(message: string, stack?: string) {
      if (!message || sent.has(message) || sent.size >= MAX_REPORTS_PER_PAGE) return;
      // Bruit sans intérêt : extensions de navigateur, scripts tiers opaques.
      if (/^Script error\.?$/.test(message) || /extension:\/\//.test(stack || "")) return;
      sent.add(message);
      const payload = JSON.stringify({ message, stack: stack || "", page: window.location.pathname });
      // sendBeacon survit à une fermeture de page ; fetch en secours.
      if (!navigator.sendBeacon?.("/api/client-errors", new Blob([payload], { type: "application/json" }))) {
        fetch("/api/client-errors", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      }
    }

    const onError = (e: ErrorEvent) => report(e.message, e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      report(reason instanceof Error ? reason.message : String(reason), reason instanceof Error ? reason.stack : undefined);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
