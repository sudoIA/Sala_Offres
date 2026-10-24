// src/app/api/v1/parametres/route.ts
// GET /api/v1/parametres : coordonnées, réseaux sociaux et sections visibles
// (réglages Admin > Paramètres), complétés par les valeurs par défaut du site.

import { NextRequest } from "next/server";
import { apiJson, apiOptions, handleGet } from "@/lib/api/http";
import { readDocument } from "@/lib/api/server-data";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/site-settings";

export const runtime = "nodejs";

const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);

export function GET(req: NextRequest) {
  return handleGet(req, async () => {
    const doc = await readDocument("settings", "site");
    const sections = (doc?.sectionsVisible || {}) as Partial<SiteSettings["sectionsVisible"]>;
    const d = DEFAULT_SETTINGS;
    const data: SiteSettings = {
      contactEmail: str(doc?.contactEmail, d.contactEmail),
      contactCities: str(doc?.contactCities, d.contactCities),
      socialFacebook: str(doc?.socialFacebook, d.socialFacebook),
      socialWhatsapp: str(doc?.socialWhatsapp, d.socialWhatsapp),
      socialInstagram: str(doc?.socialInstagram, d.socialInstagram),
      socialLinkedin: str(doc?.socialLinkedin, d.socialLinkedin),
      sectionsVisible: { ...d.sectionsVisible, ...sections },
    };
    return apiJson({ data });
  });
}

export const OPTIONS = apiOptions;
