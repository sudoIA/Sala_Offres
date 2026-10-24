// src/app/api/v1/offres/route.ts
// GET /api/v1/offres : offres actives (visibles, non expirées), de la plus
// récente à la plus ancienne. Filtres : q, ville, contrat. Pagination : page,
// limit (20 par défaut, 50 au plus).

import { NextRequest } from "next/server";
import { apiJson, apiOptions, handleGet, intParam, textParam } from "@/lib/api/http";
import { readCollection } from "@/lib/api/server-data";
import { isJobActive, matchesJobFilters, toApiJob } from "@/lib/api/serializers";
import { resolveImage } from "@/lib/api/images";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  return handleGet(req, async () => {
    const page = intParam(req, "page", 1, 1, 1000);
    const limit = intParam(req, "limit", 20, 1, 50);
    const filters = { q: textParam(req, "q"), ville: textParam(req, "ville"), contrat: textParam(req, "contrat") };

    const siteUrl = getSiteUrl();
    const docs = await readCollection("emplois", { after: "deadline" });
    const jobs = docs
      .filter((d) => isJobActive(d))
      .map((d) => toApiJob(d, siteUrl))
      .filter((job) => matchesJobFilters(job, filters))
      .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));

    const total = jobs.length;
    const data = jobs.slice((page - 1) * limit, page * limit);
    await Promise.all(data.map(async (job) => (job.logo = await resolveImage("entreprises", job.company, true))));

    return apiJson({ data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  });
}

export const OPTIONS = apiOptions;
