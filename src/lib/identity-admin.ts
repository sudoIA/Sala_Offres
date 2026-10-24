// src/lib/identity-admin.ts
// Appels à l'API REST de Firebase Authentication (Identity Toolkit) avec le
// compte de service, côté serveur uniquement. Remplace firebase-admin/auth,
// qui ne se charge pas sur les serveurs Vercel (voir id-token.ts).

import { getAdminApp, hasAdminCredentials } from "@/lib/firebase-admin";

export const PROJECT_ID = "sala-a6c15";
const BASE = "https://identitytoolkit.googleapis.com";

/** `path` commence par "/v1/..." ou "/admin/v2/...". Lève une erreur lisible si la réponse n'est pas 2xx. */
export async function identityToolkit<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!hasAdminCredentials()) throw new Error("Compte de service Firebase absent (FIREBASE_SERVICE_ACCOUNT).");
  const credential = getAdminApp().options.credential;
  if (!credential) throw new Error("Compte de service Firebase absent.");
  const { access_token } = await credential.getAccessToken();
  const res = await fetch(BASE + path, {
    method: init.method || "GET",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new IdentityToolkitError(res.status, detail?.error?.message || "");
  }
  return (await res.json()) as T;
}

export class IdentityToolkitError extends Error {
  constructor(public status: number, public reason: string) {
    super(`Firebase Authentication a répondu ${status}${reason ? ` (${reason})` : ""}`);
  }
}

export interface AuthAccount {
  localId: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  /** Millisecondes depuis 1970, en texte ; absent si le compte ne s'est jamais connecté. */
  lastLoginAt?: string;
  mfaInfo?: { mfaEnrollmentId: string; displayName?: string; totpInfo?: object }[];
}

export async function lookupAccounts(query: { localId?: string[]; email?: string[] }): Promise<AuthAccount[]> {
  const data = await identityToolkit<{ users?: AuthAccount[] }>(`/v1/projects/${PROJECT_ID}/accounts:lookup`, { method: "POST", body: query });
  return data.users || [];
}

/** Crée un compte sans mot de passe : la personne le choisit via l'e-mail « mot de passe oublié ». */
export async function createAccount(email: string, displayName: string): Promise<AuthAccount> {
  return identityToolkit<AuthAccount>(`/v1/projects/${PROJECT_ID}/accounts`, {
    method: "POST",
    body: { email, ...(displayName ? { displayName } : {}) },
  });
}

export async function updateAccount(localId: string, changes: { displayName?: string }): Promise<void> {
  await identityToolkit(`/v1/projects/${PROJECT_ID}/accounts:update`, { method: "POST", body: { localId, ...changes } });
}
