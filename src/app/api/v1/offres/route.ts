// src/app/api/v1/offres/route.ts
// GET /api/v1/offres : offres actives (visibles, non expirées), de la plus
// récente à la plus ancienne. Filtres : q, ville, contrat. Pagination : page,
// limit (20 par défaut, 50 au plus). `ids` (jusqu'à 50, séparés par des
// virgules) ne garde que ces offres : favoris d'un candidat (savedJobs).

import { NextRequest } from "next/server";
import { apiJson, apiOptions, handleGet, intParam, textParam } from "@/lib/api/http";
import { readCollection } from "@/lib/api/server-data";
import { isJobActive, matchesJobFilters, toApiJob } from "@/lib/api/serializers";
import { attachCompanies } from "@/lib/api/company-links";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  return handleGet(req, async () => {
    const page = intParam(req, "page", 1, 1, 1000);
    const limit = intParam(req, "limit", 20, 1, 50);
    const filters = { q: textParam(req, "q"), ville: textParam(req, "ville"), contrat: textParam(req, "contrat") };
    const ids = new Set(
      textParam(req, "ids", 50 * 30)
        .split(",")
        .map((id) => id.trim())
        .filter((id) => /^[\w-]{1,128}$/.test(id))
        .slice(0, 50)
    );

    const siteUrl = getSiteUrl();
    const docs = await readCollection("emplois", { after: "deadline" });
    const jobs = docs
      .filter((d) => isJobActive(d) && (ids.size === 0 || ids.has(d.id)))
      .map((d) => toApiJob(d, siteUrl))
      .filter((job) => matchesJobFilters(job, filters))
      .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));

    const total = jobs.length;
    const data = jobs.slice((page - 1) * limit, page * limit);
    await attachCompanies(data);

    return apiJson({ data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  });
}

export const OPTIONS = apiOptions;
