// src/app/api/admin/team/route.ts
// Équipe du back-office (Admin > Équipe), réservée aux administrateurs :
// - GET : membres (roles/*) avec leur e-mail, leur nom, leur rôle, leur
//   dernière connexion et l'état de leur double authentification ;
// - POST { action: "add", email, name, role } : donne un rôle à un compte
//   existant, ou crée le compte s'il n'existe pas encore (sans mot de
//   passe : le navigateur envoie ensuite l'e-mail pour le choisir) ;
// - POST { action: "update", uid, role?, name? } : change le rôle ou le nom ;
// - POST { action: "remove", uid } : retire l'accès au back-office (le
//   compte reste un simple compte candidat).
// Garde-fous : on ne change ni ne retire son propre rôle, et l'équipe garde
// toujours au moins un administrateur.

import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { authenticateStaff } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { createAccount, IdentityToolkitError, lookupAccounts, updateAccount } from "@/lib/identity-admin";
import { isStaffRole, staffDisplayName, type StaffRole, type TeamMember } from "@/lib/staff-roles";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function cleanName(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

async function adminCount(): Promise<number> {
  const snap = await getAdminDb().collection("roles").where("role", "==", "admin").count().get();
  return snap.data().count;
}

export async function GET(req: NextRequest) {
  const caller = await authenticateStaff(req, ["admin"]);
  if (caller instanceof NextResponse) return caller;
  try {
    const roles = await getAdminDb().collection("roles").get();
    const docs = roles.docs.filter((d) => isStaffRole(d.data().role));
    const accounts = docs.length ? await lookupAccounts({ localId: docs.map((d) => d.id) }) : [];
    const byUid = new Map(accounts.map((a) => [a.localId, a]));
    const members: TeamMember[] = docs.map((d) => {
      const data = d.data();
      const account = byUid.get(d.id);
      const email = account?.email || String(data.email || "");
      return {
        uid: d.id,
        email,
        name: staffDisplayName(account?.displayName, data.name),
        role: data.role as StaffRole,
        mfa: !!account?.mfaInfo?.length,
        lastLoginAt: account?.lastLoginAt ? new Date(Number(account.lastLoginAt)).toISOString() : null,
      };
    });
    members.sort((a, b) => a.role.localeCompare(b.role) || (a.name || a.email).localeCompare(b.name || b.email, "fr"));
    return NextResponse.json({ ok: true, members });
  } catch (err) {
    console.error("Lecture de l'équipe :", err);
    return fail(500, "Lecture de l'équipe impossible pour le moment.");
  }
}

export async function POST(req: NextRequest) {
  const caller = await authenticateStaff(req, ["admin"]);
  if (caller instanceof NextResponse) return caller;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // Corps invalide : traité comme une action inconnue ci-dessous.
  }
  const db = getAdminDb();

  try {
    if (body.action === "add") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const name = cleanName(body.name);
      if (!EMAIL_RE.test(email) || email.length > 254) return fail(400, "Adresse e-mail invalide.");
      if (!isStaffRole(body.role)) return fail(400, "Rôle inconnu.");

      let [account] = await lookupAccounts({ email: [email] });
      let created = false;
      if (account) {
        const existing = await db.collection("roles").doc(account.localId).get();
        if (isStaffRole(existing.data()?.role)) return fail(409, "Ce compte fait déjà partie de l'équipe.");
        if (name && !account.displayName) await updateAccount(account.localId, { displayName: name });
      } else {
        account = await createAccount(email, name);
        created = true;
      }
      await db.collection("roles").doc(account.localId).set({
        role: body.role,
        name: name || account.displayName || "",
        email,
        addedBy: caller.uid,
        addedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, uid: account.localId, created });
    }

    const uid = typeof body.uid === "string" ? body.uid : "";
    if (!/^[\w-]{1,128}$/.test(uid)) return fail(400, "Membre inconnu.");
    const ref = db.collection("roles").doc(uid);
    const current = (await ref.get()).data();
    if (!isStaffRole(current?.role)) return fail(404, "Ce compte ne fait pas partie de l'équipe.");

    if (body.action === "update") {
      const changes: Record<string, unknown> = {};
      if (body.role !== undefined && body.role !== current.role) {
        if (!isStaffRole(body.role)) return fail(400, "Rôle inconnu.");
        if (uid === caller.uid) return fail(400, "Vous ne pouvez pas changer votre propre rôle. Demandez à un autre administrateur.");
        if (current.role === "admin" && (await adminCount()) <= 1) return fail(400, "Impossible : c'est le dernier administrateur.");
        changes.role = body.role;
      }
      if (body.name !== undefined) {
        const name = cleanName(body.name);
        if (!name) return fail(400, "Le nom ne peut pas être vide.");
        changes.name = name;
        await updateAccount(uid, { displayName: name });
      }
      if (Object.keys(changes).length) await ref.update(changes);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "remove") {
      if (uid === caller.uid) return fail(400, "Vous ne pouvez pas retirer votre propre accès. Demandez à un autre administrateur.");
      if (current.role === "admin" && (await adminCount()) <= 1) return fail(400, "Impossible : c'est le dernier administrateur.");
      await ref.delete();
      return NextResponse.json({ ok: true });
    }

    return fail(400, "Action inconnue.");
  } catch (err) {
    console.error("Gestion de l'équipe :", err);
    if (err instanceof IdentityToolkitError && err.reason === "EMAIL_EXISTS") return fail(409, "Un compte existe déjà avec cette adresse.");
    return fail(500, "Opération impossible pour le moment.");
  }
}
