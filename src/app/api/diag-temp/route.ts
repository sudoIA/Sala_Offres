// TEMPORAIRE - diagnostic des erreurs 500 en production (à supprimer).
// Charge chaque module suspect et renvoie seulement le message d'erreur.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const msg = (err: unknown) => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).slice(0, 400);

export async function GET() {
  const results: Record<string, string> = { node: process.version };
  const tries: [string, () => Promise<unknown>][] = [
    ["firebase-admin/auth", () => import("firebase-admin/auth")],
    ["admin-auth", () => import("@/lib/admin-auth")],
    ["alert-emails", () => import("@/lib/alert-emails")],
    ["collectors/generic", () => import("@/lib/collectors/generic")],
    ["collectors/acpe", () => import("@/lib/collectors/acpe")],
    ["isomorphic-dompurify", async () => {
      const m = await import("isomorphic-dompurify");
      return m.default.sanitize("<b>x</b><script>y</script>");
    }],
    ["jobs-server", () => import("@/lib/jobs-server")],
    ["id-token (jose)", async () => {
      const { verifyFirebaseIdToken } = await import("@/lib/id-token");
      return verifyFirebaseIdToken("faux.jeton.x", "sala-a6c15");
    }],
    ["sanitize-html (dompurify)", async () => (await import("@/lib/sanitize-html")).sanitizeHtml("<b>x</b>")],
    ["verifyIdToken (faux jeton)", async () => {
      const { getApps, initializeApp } = await import("firebase-admin/app");
      const { getAuth } = await import("firebase-admin/auth");
      const app = getApps().find((a) => a.name === "diag") ?? initializeApp({ projectId: "sala-a6c15" }, "diag");
      return getAuth(app).verifyIdToken("faux");
    }],
  ];
  for (const [name, fn] of tries) {
    try {
      const out = await fn();
      results[name] = typeof out === "string" ? `ok (${out})` : "ok";
    } catch (err) {
      results[name] = msg(err);
    }
  }
  return NextResponse.json(results, { headers: { "Cache-Control": "no-store" } });
}
