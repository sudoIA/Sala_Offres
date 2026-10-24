// src/lib/admin-auth.ts
// Vérifie côté serveur qu'une requête API vient d'un membre connecté de
// l'équipe, avec le rôle voulu (voir staff-roles.ts) : requireAdmin pour les
// réglages et l'équipe, requireStaff pour la collecte des offres, ouverte
// aussi aux modérateurs.
//
// Le navigateur de l'admin envoie son jeton Firebase ("Authorization: Bearer
// <idToken>"). On vérifie sa signature avec les clés publiques de Google
// (voir id-token.ts) - ce qui ne demande que l'identifiant du projet, pas de
// compte de service - puis on lit
// roles/{uid} : par le SDK Admin en production (compte de service présent,
// non soumis à App Check), sinon via l'API REST Firestore AVEC ce même jeton,
// donc sous les règles de sécurité habituelles (cas du développement local,
// où FIREBASE_SERVICE_ACCOUNT n'est pas défini).
//
// Si l'équipe a rendu la double authentification obligatoire (voir mfa.ts),
// le jeton doit en plus prouver une connexion avec le code à 6 chiffres.

import { NextResponse, type NextRequest } from "next/server";
import { getAdminDb, hasAdminCredentials } from "@/lib/firebase-admin";
import { verifyFirebaseIdToken } from "@/lib/id-token";
import { isStaffRole, type StaffRole } from "@/lib/staff-roles";

const PROJECT_ID = "sala-a6c15";

/** Règle d'équipe "double authentification obligatoire" (settings/security, voir mfa.ts). */
async function adminMfaRequired(idToken: string): Promise<boolean> {
  if (hasAdminCredentials()) {
    const snap = await getAdminDb().collection("settings").doc("security").get();
    return snap.data()?.adminMfaRequired === true;
  }
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/security`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" });
  if (!res.ok) return false;
  const data = (await res.json()) as { fields?: { adminMfaRequired?: { booleanValue?: boolean } } };
  return data.fields?.adminMfaRequired?.booleanValue === true;
}

async function readRole(uid: string, idToken: string): Promise<StaffRole | null> {
  // En production, lecture par le SDK Admin (non soumis à App Check).
  if (hasAdminCredentials()) {
    const snap = await getAdminDb().collection("roles").doc(uid).get();
    const role = snap.data()?.role;
    return isStaffRole(role) ? role : null;
  }
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/roles/${encodeURIComponent(uid)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as { fields?: { role?: { stringValue?: string } } };
  const role = data.fields?.role?.stringValue;
  return isStaffRole(role) ? role : null;
}

export interface StaffCaller {
  uid: string;
  role: StaffRole;
}

/**
 * Identifie le membre de l'équipe à l'origine de la requête, ou renvoie une
 * réponse d'erreur (401/403) s'il n'est pas connecté ou n'a pas l'un des
 * rôles `allowed`.
 */
export async function authenticateStaff(req: NextRequest, allowed: StaffRole[]): Promise<StaffCaller | NextResponse> {
  const header = req.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!idToken) {
    return NextResponse.json({ ok: false, error: "Connexion administrateur requise." }, { status: 401 });
  }

  try {
    const decoded = await verifyFirebaseIdToken(idToken, PROJECT_ID);
    const role = await readRole(decoded.uid, idToken);
    if (!role || !allowed.includes(role)) {
      return NextResponse.json({ ok: false, error: "Accès réservé aux administrateurs." }, { status: 403 });
    }
    if (!decoded.secondFactor && (await adminMfaRequired(idToken))) {
      return NextResponse.json({ ok: false, error: "Double authentification requise : reconnectez-vous avec votre code." }, { status: 403 });
    }
    return { uid: decoded.uid, role };
  } catch (err) {
    console.warn("Jeton admin refusé :", err);
    return NextResponse.json({ ok: false, error: "Session expirée, reconnectez-vous." }, { status: 401 });
  }
}

/** `null` si la requête vient d'un administrateur, sinon la réponse d'erreur. */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const caller = await authenticateStaff(req, ["admin"]);
  return caller instanceof NextResponse ? caller : null;
}

/** `null` si la requête vient d'un administrateur ou d'un modérateur, sinon la réponse d'erreur. */
export async function requireStaff(req: NextRequest): Promise<NextResponse | null> {
  const caller = await authenticateStaff(req, ["admin", "moderateur"]);
  return caller instanceof NextResponse ? caller : null;
}
