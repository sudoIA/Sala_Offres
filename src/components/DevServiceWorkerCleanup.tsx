// src/components/DevServiceWorkerCleanup.tsx
// En développement uniquement : désinstalle tout service worker resté
// enregistré sur localhost (par exemple après un `next build` / `next start`
// local). Sinon il continue de servir depuis son cache une ancienne version
// du JavaScript pendant 24 h, et les modifications du code n'apparaissent
// pas malgré les rafraîchissements - piège déjà rencontré sur ce projet.

"use client";

import { useEffect } from "react";

export function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      if (registrations.length === 0) return;
      await Promise.all(registrations.map((r) => r.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      console.info("Service worker de développement retiré : rechargez la page pour voir la dernière version.");
    });
  }, []);

  return null;
}
