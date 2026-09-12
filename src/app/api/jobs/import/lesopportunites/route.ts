// src/app/api/jobs/import/lesopportunites/route.ts
// Collecte les offres "Les Opportunités du Monde" (République du Congo) et
// les renvoie normalisées, sans toucher à Firestore (voir la route ACPE
// équivalente pour le détail de l'architecture).

import { NextRequest, NextResponse } from "next/server";
import { collectLesOpportunitesPage } from "@/lib/collectors/lesopportunites";

export async function POST(req: NextRequest) {
  let page = 1;
  try {
    const body = await req.json();
    if (body && Number.isFinite(body.page)) page = Math.max(1, Math.trunc(body.page));
  } catch {
    // Corps vide ou non-JSON : on garde page = 1.
  }

  try {
    const result = await collectLesOpportunitesPage(page);
    return NextResponse.json({ ok: true, page: result.page, jobs: result.jobs, count: result.jobs.length });
  } catch (err) {
    console.error("Erreur collecte Les Opportunités :", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
