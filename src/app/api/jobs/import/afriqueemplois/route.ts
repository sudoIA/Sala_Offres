// src/app/api/jobs/import/afriqueemplois/route.ts
// Collecte les offres Afriqueemplois.com et les renvoie normalisées, sans
// toucher à Firestore (voir la route ACPE équivalente pour le détail de
// l'architecture : c'est l'écran admin "Imports" qui écrit dans
// "emplois_import" une fois connecté en tant qu'admin).

import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-auth";
import { collectAfriqueemploisPage } from "@/lib/collectors/afriqueemplois";

export async function POST(req: NextRequest) {
  // Route réservée aux admins connectés : sinon n'importe qui pourrait
  // déclencher en boucle des collectes vers les sites sources.
  const denied = await requireStaff(req);
  if (denied) return denied;

  let page = 1;
  try {
    const body = await req.json();
    if (body && Number.isFinite(body.page)) page = Math.max(1, Math.trunc(body.page));
  } catch {
    // Corps vide ou non-JSON : on garde page = 1.
  }

  try {
    const result = await collectAfriqueemploisPage(page);
    return NextResponse.json({ ok: true, page: result.page, jobs: result.jobs, count: result.jobs.length });
  } catch (err) {
    console.error("Erreur collecte Afriqueemplois :", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
