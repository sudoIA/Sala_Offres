// src/app/api/v1/entreprises/[id]/route.ts
// GET /api/v1/entreprises/{id} : fiche d'une entreprise de l'annuaire et
// ses offres actives (même rapprochement par nom que la page
// /entreprises/{id} du site, voir src/lib/company-match.ts).

import { NextRequest } from "next/server";
import { apiError, apiJson, apiOptions, handleGet } from "@/lib/api/http";
import { readCollection, readDocument } from "@/lib/api/server-data";
import { isJobActive, toApiAnnuaire, toApiJob } from "@/lib/api/serializers";
import { resolveImage } from "@/lib/api/images";
import { matchesCompanyItem } from "@/lib/company-match";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

export function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handleGet(req, async () => {
    const { id } = await ctx.params;
    if (!/^[\w-]{1,128}$/.test(id)) return apiError(400, "Identifiant invalide.");
    const doc = await readDocument("entreprises", id);
    if (!doc) return apiError(404, "Entreprise introuvable.");

    const company = toApiAnnuaire(doc, "entreprises");
    const siteUrl = getSiteUrl();
    const jobs = (await readCollection("emplois", { after: "deadline" }))
      .filter((d) => isJobActive(d) && matchesCompanyItem(d.company as string, doc))
      .map((d) => toApiJob(d, siteUrl))
      .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));

    const [logo, photo] = await Promise.all([
      resolveImage("entreprises", doc.logo, true),
      resolveImage("entreprises", doc.photo, true).then((p) => p || resolveImage("entreprises", doc["image batiment"], true)),
    ]);
    company.logo = logo;
    company.photo = photo;
    jobs.forEach((job) => {
      job.companyId = id;
      job.logo = logo;
    });

    return apiJson({ data: { ...company, url: `${siteUrl.replace(/\/$/, "")}/entreprises/${encodeURIComponent(id)}`, offres: jobs } });
  });
}

export const OPTIONS = apiOptions;
