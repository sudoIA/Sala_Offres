// src/app/api/jobs/import/acpe/route.ts
// Collecte les offres ACPE et les renvoie normalisées, sans toucher à
// Firestore : c'est l'écran admin ("Imports") qui, une fois connecté avec un
// compte administrateur, écrit lui-même le résultat dans "emplois_import"
// (voir useJobImports.ts) — ainsi les règles de sécurité Firestore standard
// (isAdmin()) s'appliquent normalement, sans avoir besoin d'identifiants
// serveur séparés (Firebase Admin SDK).

import { NextRequest, NextResponse } from "next/server";
import { collectAcpePage, enrichAcpeJob } from "@/lib/collectors/acpe";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  let page = 1;
  let withDetails = false;
  try {
    const body = await req.json();
    if (body && Number.isFinite(body.page)) page = Math.max(1, Math.trunc(body.page));
    if (body && typeof body.withDetails === "boolean") withDetails = body.withDetails;
  } catch {
    // Corps vide ou non-JSON : on garde les valeurs par défaut.
  }

  try {
    const result = await collectAcpePage(page);
    let jobs = result.jobs;

    if (withDetails) {
      const enriched = [];
      for (const job of jobs) {
        enriched.push(await enrichAcpeJob(job));
        await sleep(300); // Espace les requêtes vers la page détail pour rester poli avec le serveur ACPE.
      }
      jobs = enriched;
    }

    return NextResponse.json({ ok: true, page: result.page, totalOffersLabel: result.totalOffersLabel, jobs, count: jobs.length });
  } catch (err) {
    console.error("Erreur collecte ACPE :", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
