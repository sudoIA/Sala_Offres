// src/app/api/v1/actualites/route.ts
// GET /api/v1/actualites : articles News Sala publiés (visibles), du plus
// récent au plus ancien.

import { NextRequest } from "next/server";
import { apiJson, apiOptions, handleGet } from "@/lib/api/http";
import { readCollection } from "@/lib/api/server-data";
import { toApiNews } from "@/lib/api/serializers";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  return handleGet(req, async () => {
    const siteUrl = getSiteUrl();
    const docs = await readCollection("news", { equals: ["visibility", true] });
    const data = docs
      .filter((d) => d.visibility === true)
      .map((d) => toApiNews(d, siteUrl))
      .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
    return apiJson({ data });
  });
}

export const OPTIONS = apiOptions;
