// src/lib/mfa.ts
// Double authentification des comptes admin, par code à 6 chiffres généré
// par une application (Google Authenticator, Microsoft Authenticator...),
// méthode "TOTP" de Firebase Auth. Pas de SMS : gratuit et sans réseau.
//
// Règle d'équipe (document "settings/security", champ adminMfaRequired) :
// tant qu'elle est désactivée, chaque admin peut activer la protection pour
// son propre compte ; une fois activée, le back-office, les routes /api
// admin ET les règles Firestore exigent une connexion avec le code.

import {
  getMultiFactorResolver,
  multiFactor,
  TotpMultiFactorGenerator,
  type Auth,
  type MultiFactorError,
  type TotpSecret,
  type User,
  type UserCredential,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const MFA_ISSUER = "Sala Admin";

/** Le compte a-t-il une application d'authentification enregistrée ? */
export function hasTotp(user: User): boolean {
  return multiFactor(user).enrolledFactors.some((f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID);
}

/** La session en cours a-t-elle été ouverte avec le code (et pas seulement le mot de passe) ? */
export async function sessionUsedSecondFactor(user: User): Promise<boolean> {
  const result = await user.getIdTokenResult();
  return Boolean(result.signInSecondFactor);
}

/** Étape 1 de l'activation : clé secrète + lien à transformer en QR code. */
export async function startTotpEnrollment(user: User): Promise<{ secret: TotpSecret; uri: string }> {
  const session = await multiFactor(user).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  return { secret, uri: secret.generateQrCodeUrl(user.email || "admin", MFA_ISSUER) };
}

/** Étape 2 : le code affiché par l'application confirme l'enregistrement. */
export async function finishTotpEnrollment(user: User, secret: TotpSecret, code: string): Promise<void> {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code.trim());
  await multiFactor(user).enroll(assertion, "Application d'authentification");
}

export async function removeTotp(user: User): Promise<void> {
  const factor = multiFactor(user).enrolledFactors.find((f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  if (factor) await multiFactor(user).unenroll(factor);
}

/** Erreur Firebase signalant qu'un code est demandé pour finir la connexion. */
export function isMfaRequired(err: unknown): err is MultiFactorError {
  return (err as { code?: string })?.code === "auth/multi-factor-auth-required";
}

/** Termine une connexion (ou une ré-authentification) interrompue par isMfaRequired. */
export async function resolveTotpSignIn(auth: Auth, err: MultiFactorError, code: string): Promise<UserCredential> {
  const resolver = getMultiFactorResolver(auth, err);
  const hint = resolver.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  if (!hint) throw new Error("Aucune application d'authentification n'est enregistrée sur ce compte.");
  return resolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim()));
}

/** Messages lisibles pour les erreurs les plus courantes. */
export function mfaErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || "";
  if (code === "auth/invalid-verification-code" || code === "auth/missing-code") return "Code incorrect. Saisissez le code à 6 chiffres affiché en ce moment dans l'application.";
  if (code === "auth/requires-recent-login") return "Pour des raisons de sécurité, déconnectez-vous puis reconnectez-vous avant de modifier la double authentification.";
  if (code === "auth/operation-not-allowed") return "La double authentification n'est pas encore activée sur le projet Firebase (Paramètres > Sécurité).";
  if (code === "auth/unverified-email") return "Votre adresse e-mail doit d'abord être vérifiée.";
  if (code === "auth/too-many-requests") return "Trop de tentatives. Patientez quelques minutes.";
  if (code === "auth/totp-challenge-timeout" || code === "auth/code-expired") return "Le délai est dépassé. Recommencez la connexion.";
  return (err as Error)?.message || "Erreur inconnue.";
}

export interface SecurityPolicy {
  adminMfaRequired: boolean;
}

/** Règle d'équipe (lecture publique : elle ne contient aucun secret). */
export async function loadSecurityPolicy(): Promise<SecurityPolicy> {
  try {
    const snap = await getDoc(doc(db, "settings", "security"));
    return { adminMfaRequired: snap.exists() && snap.data().adminMfaRequired === true };
  } catch {
    return { adminMfaRequired: false };
  }
}
