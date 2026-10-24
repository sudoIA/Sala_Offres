// src/app/api/jobs/import/custom/route.ts
// Collecte d'une source ajoutée par l'équipe (Admin > Imports > Sources
// personnalisées) avec le collecteur générique. Sert aussi au bouton
// "Tester" avant l'ajout d'une source. Comme les autres routes d'import, ne
// touche pas à Firestore : c'est le navigateur de l'admin qui écrit le
// résultat dans "emplois_import".

import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-auth";
import { assertPublicHttpUrl, collectGenericSource } from "@/lib/collectors/generic";
import { isCustomSourceKey } from "@/lib/custom-sources";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Route réservée aux admins connectés : elle interroge un site au choix.
  const denied = await requireStaff(req);
  if (denied) return denied;

  let body: { source?: string; url?: string; selector?: string; keyword?: string; defaultCompany?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const source = body.source && isCustomSourceKey(body.source) ? body.source : "custom_test";
  try {
    assertPublicHttpUrl(body.url || "");
    const result = await collectGenericSource(source, {
      url: body.url || "",
      selector: (body.selector || "").trim() || undefined,
      keyword: (body.keyword || "").trim() || undefined,
      defaultCompany: (body.defaultCompany || "").trim().slice(0, 120) || undefined,
    });
    return NextResponse.json({ ok: true, method: result.method, jobs: result.jobs, count: result.jobs.length });
  } catch (err) {
    console.error("Erreur collecte source personnalisée :", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
