// src/lib/id-token.ts
// Vérification d'un jeton d'identité Firebase (ID token) côté serveur, selon
// la méthode documentée par Firebase pour les environnements sans SDK Admin :
// signature RS256 vérifiée avec les clés publiques de Google, émetteur et
// audience égaux au projet, jeton non expiré.
//
// Pourquoi pas firebase-admin/auth : sur les serveurs Vercel, ce module ne
// se charge pas (sa dépendance jwks-rsa appelle par require() la librairie
// jose, publiée au format ES module) - toutes les routes d'import d'offres
// répondaient 500. On utilise donc jose directement, importé normalement.

import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

const GOOGLE_KEYS_URL = new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");

// Clés publiques mises en cache par jose (rechargées quand Google les fait tourner).
const googleKeys = createRemoteJWKSet(GOOGLE_KEYS_URL);

export interface VerifiedIdToken {
  uid: string;
  email?: string;
  emailVerified: boolean;
  /** Méthode du second facteur utilisée à la connexion ("totp"...), absente sinon. */
  secondFactor?: string;
}

function secondFactorOf(firebase: unknown): string | undefined {
  const value = (firebase as { sign_in_second_factor?: unknown } | undefined)?.sign_in_second_factor;
  return typeof value === "string" && value ? value : undefined;
}

/** Lève une erreur si le jeton est invalide, expiré ou émis pour un autre projet. */
export async function verifyFirebaseIdToken(
  idToken: string,
  projectId: string,
  keys: JWTVerifyGetKey = googleKeys // remplaçable dans les tests
): Promise<VerifiedIdToken> {
  const { payload } = await jwtVerify(idToken, keys, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ["RS256"],
  });
  const uid = typeof payload.sub === "string" ? payload.sub : "";
  if (!uid || uid.length > 128) throw new Error("Jeton sans identifiant d'utilisateur valide.");
  // auth_time : date de connexion, jamais dans le futur (même règle que le SDK Admin).
  if (typeof payload.auth_time === "number" && payload.auth_time > Date.now() / 1000 + 300) {
    throw new Error("Date de connexion du jeton invalide.");
  }
  return {
    uid,
    email: typeof payload.email === "string" ? payload.email : undefined,
    emailVerified: payload.email_verified === true,
    secondFactor: secondFactorOf(payload.firebase),
  };
}
