// src/hooks/useSiteSettings.ts
// Fournit les réglages du site (visibilité des sections, coordonnées de
// contact) aux composants React, avec les valeurs par défaut en attendant la
// réponse de Firestore — évite tout flash de contenu incorrect.

"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, loadSiteSettings, type SiteSettings } from "@/lib/site-settings";

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    loadSiteSettings().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}
