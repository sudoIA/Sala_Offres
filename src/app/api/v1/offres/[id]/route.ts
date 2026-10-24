// src/app/api/v1/offres/[id]/route.ts
// GET /api/v1/offres/{id} : détail d'une offre. 404 si elle n'existe pas,
// est masquée ou a expiré (comme sur le site).

import { NextRequest } from "next/server";
import { apiError, apiJson, apiOptions, handleGet } from "@/lib/api/http";
import { readDocument } from "@/lib/api/server-data";
import { isJobActive, toApiJob } from "@/lib/api/serializers";
import { resolveImage } from "@/lib/api/images";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

export function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handleGet(req, async () => {
    const { id } = await ctx.params;
    if (!/^[\w-]{1,128}$/.test(id)) return apiError(400, "Identifiant invalide.");
    const doc = await readDocument("emplois", id);
    if (!doc || !isJobActive(doc)) return apiError(404, "Offre introuvable ou expirée.");
    const job = toApiJob(doc, getSiteUrl());
    job.logo = await resolveImage("entreprises", job.company, true);
    return apiJson({ data: job });
  });
}

export const OPTIONS = apiOptions;
