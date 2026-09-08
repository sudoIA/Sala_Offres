// src/hooks/useEventImages.ts
// Résout en arrière-plan l'affiche (image) de chaque événement affiché,
// sans bloquer le rendu de la liste — voir resolveEventImageUrl.

"use client";

import { useEffect, useState } from "react";
import { resolveEventImageUrl } from "@/lib/event-helpers";
import type { SalaEvent } from "@/types/event";

export function useEventImages(events: SalaEvent[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const withImage = events.filter((evt) => evt.image);

    (async () => {
      const entries = await Promise.all(
        withImage.map(async (evt) => [evt.id, await resolveEventImageUrl(evt.image)] as const)
      );
      if (cancelled) return;
      const resolved: Record<string, string> = {};
      for (const [id, url] of entries) {
        if (url) resolved[id] = url;
      }
      setUrls(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [events]);

  return urls;
}
