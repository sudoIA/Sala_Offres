// src/app/api/admin/mfa/route.ts
// Réglages de la double authentification qui demandent le compte de service
// (Admin > Paramètres > Sécurité) :
// - GET : la méthode "code par application" (TOTP) est-elle activée sur le
//   projet Firebase ?
// - POST { action: "enable-totp" } : l'active (rien dans la console Firebase
//   ne permet de le faire sans ligne de commande).
// - POST { action: "reset", email } : retire la double authentification d'un
//   autre admin qui a perdu son téléphone, pour qu'il la réactive.

import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { identityToolkit, IdentityToolkitError, lookupAccounts, PROJECT_ID } from "@/lib/identity-admin";

interface ProviderConfig {
  state?: string;
  totpProviderConfig?: { adjacentIntervals?: number };
}

interface ProjectConfig {
  mfa?: { state?: string; enabledProviders?: string[]; providerConfigs?: ProviderConfig[] };
}

const CONFIG_PATH = `/admin/v2/projects/${PROJECT_ID}/config`;

function totpEnabled(config: ProjectConfig): boolean {
  return (config.mfa?.providerConfigs || []).some((p) => p.totpProviderConfig && p.state === "ENABLED");
}

function failure(err: unknown) {
  console.error("Réglage double authentification :", err);
  // 400/403/404 sur la configuration : Identity Platform n'est pas activé sur le projet.
  if (err instanceof IdentityToolkitError && [400, 403, 404].includes(err.status)) {
    return NextResponse.json({ ok: false, status: "unavailable", error: err.message }, { status: 200 });
  }
  return NextResponse.json({ ok: false, error: "Opération impossible pour le moment." }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const config = await identityToolkit<ProjectConfig>(CONFIG_PATH);
    return NextResponse.json({ ok: true, status: totpEnabled(config) ? "enabled" : "disabled" });
  } catch (err) {
    return failure(err);
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  let body: { action?: unknown; email?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // Corps invalide : traité comme une action inconnue ci-dessous.
  }

  try {
    if (body.action === "enable-totp") {
      const config = await identityToolkit<ProjectConfig>(CONFIG_PATH);
      // On garde les autres méthodes déjà configurées (SMS...), on ajoute le TOTP.
      const others = (config.mfa?.providerConfigs || []).filter((p) => !p.totpProviderConfig);
      const mfa = {
        ...(config.mfa || {}),
        providerConfigs: [...others, { state: "ENABLED", totpProviderConfig: { adjacentIntervals: 5 } }],
      };
      await identityToolkit(`${CONFIG_PATH}?updateMask=mfa`, { method: "PATCH", body: { mfa } });
      return NextResponse.json({ ok: true, status: "enabled" });
    }

    if (body.action === "reset") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email || email.length > 254) return NextResponse.json({ ok: false, error: "Adresse e-mail invalide." }, { status: 400 });
      const [account] = await lookupAccounts({ email: [email] });
      if (!account) return NextResponse.json({ ok: false, error: "Aucun compte avec cette adresse." }, { status: 404 });
      const role = await getAdminDb().collection("roles").doc(account.localId).get();
      if (role.data()?.role !== "admin") {
        return NextResponse.json({ ok: false, error: "Ce compte n'est pas administrateur." }, { status: 400 });
      }
      if (!account.mfaInfo?.length) return NextResponse.json({ ok: true, changed: false });
      // "mfa" vide = suppression de toutes les méthodes enregistrées.
      await identityToolkit(`/v1/projects/${PROJECT_ID}/accounts:update`, { method: "POST", body: { localId: account.localId, mfa: {} } });
      return NextResponse.json({ ok: true, changed: true });
    }

    return NextResponse.json({ ok: false, error: "Action inconnue." }, { status: 400 });
  } catch (err) {
    return failure(err);
  }
}
