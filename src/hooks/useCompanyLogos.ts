// src/hooks/useCompanyLogos.ts
// Résout en arrière-plan le logo de chaque entreprise présente dans une
// liste d'offres, sans bloquer le rendu — voir resolveCompanyLogoUrl.
// Dédoublonne par nom d'entreprise pour éviter les recherches redondantes.

"use client";

import { useEffect, useState } from "react";
import { resolveCompanyLogoUrl } from "@/lib/job-helpers";

export function useCompanyLogos(companies: (string | null | undefined)[]): Record<string, string> {
  const uniqueKey = Array.from(new Set(companies.filter(Boolean) as string[])).sort().join("|");

  const [logos, setLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    const names = uniqueKey ? uniqueKey.split("|") : [];
    if (names.length === 0) {
      setLogos({});
      return;
    }

    let cancelled = false;
    (async () => {
      const entries = await Promise.all(names.map(async (name) => [name, await resolveCompanyLogoUrl(name)] as const));
      if (cancelled) return;
      const resolved: Record<string, string> = {};
      for (const [name, url] of entries) {
        if (url) resolved[name] = url;
      }
      setLogos(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [uniqueKey]);

  return logos;
}
