// src/lib/admin-auth.ts
// Vérifie côté serveur qu'une requête API vient d'un administrateur connecté.
//
// Le navigateur de l'admin envoie son jeton Firebase ("Authorization: Bearer
// <idToken>"). On vérifie sa signature avec le SDK Admin - ce qui ne demande
// que l'identifiant du projet, pas de compte de service - puis on lit
// roles/{uid} : par le SDK Admin en production (compte de service présent,
// non soumis à App Check), sinon via l'API REST Firestore AVEC ce même jeton,
// donc sous les règles de sécurité habituelles (cas du développement local,
// où FIREBASE_SERVICE_ACCOUNT n'est pas défini).

import { NextResponse, type NextRequest } from "next/server";
import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getAdminDb, hasAdminCredentials } from "@/lib/firebase-admin";

const PROJECT_ID = "sala-a6c15";
// Application nommée, distincte de celle de firebase-admin.ts (qui, elle,
// utilise le compte de service) pour ne jamais se marcher dessus.
const VERIFIER_APP_NAME = "id-token-verifier";

function verifierApp(): App {
  return getApps().find((a) => a.name === VERIFIER_APP_NAME) ?? initializeApp({ projectId: PROJECT_ID }, VERIFIER_APP_NAME);
}

async function hasAdminRole(uid: string, idToken: string): Promise<boolean> {
  // En production, lecture par le SDK Admin (non soumis à App Check).
  if (hasAdminCredentials()) {
    const snap = await getAdminDb().collection("roles").doc(uid).get();
    return snap.data()?.role === "admin";
  }
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/roles/${encodeURIComponent(uid)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" });
  if (!res.ok) return false;
  const data = (await res.json()) as { fields?: { role?: { stringValue?: string } } };
  return data.fields?.role?.stringValue === "admin";
}

/**
 * Renvoie une réponse d'erreur (401/403) si la requête ne vient pas d'un
 * admin connecté, ou `null` si elle peut continuer.
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const header = req.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!idToken) {
    return NextResponse.json({ ok: false, error: "Connexion administrateur requise." }, { status: 401 });
  }

  try {
    const decoded = await getAuth(verifierApp()).verifyIdToken(idToken);
    if (!(await hasAdminRole(decoded.uid, idToken))) {
      return NextResponse.json({ ok: false, error: "Accès réservé aux administrateurs." }, { status: 403 });
    }
    return null;
  } catch (err) {
    console.warn("Jeton admin refusé :", err);
    return NextResponse.json({ ok: false, error: "Session expirée, reconnectez-vous." }, { status: 401 });
  }
}
