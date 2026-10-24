// src/app/api/v1/route.ts
// GET /api/v1 : sommaire de l'API publique (lecture seule). Documentation
// complète pour les développeurs : docs/api-v1.md.

import { NextRequest } from "next/server";
import { apiJson, apiOptions, handleGet } from "@/lib/api/http";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  return handleGet(req, async () => {
    const base = `${getSiteUrl().replace(/\/$/, "")}/api/v1`;
    return apiJson(
      {
        name: "API Sala",
        version: "1",
        description: "API publique en lecture seule des contenus du site Sala (ongsala.com).",
        endpoints: {
          offres: `${base}/offres?page=1&limit=20&q=&ville=&contrat=`,
          offre: `${base}/offres/{id}`,
          evenements: `${base}/evenements?ville=`,
          evenement: `${base}/evenements/{id}`,
          annuaires: `${base}/annuaires?categorie=universites|entreprises|clubs&ville=`,
          entreprise: `${base}/entreprises/{id}`,
          droitDuTravail: `${base}/droit-du-travail?theme=`,
          quiz: `${base}/quiz?theme=entretiens|droit_du_travail`,
          actualites: `${base}/actualites`,
          parametres: `${base}/parametres`,
        },
        limits: { requestsPerMinutePerIp: 120, cacheSeconds: 300 },
      },
      3600
    );
  });
}

export const OPTIONS = apiOptions;
