// src/app/verifier-email/page.tsx
// Deux usages de cette même page :
// 1. Étape obligatoire après l'inscription : tant que l'email n'est pas
//    vérifié, le candidat ne peut pas accéder à son profil ni sauvegarder
//    son CV en ligne (voir hooks/useCvBuilder.ts) — évite les comptes créés
//    avec une adresse fictive.
// 2. Page de retour du lien de vérification reçu par email (voir
//    actionCodeSettings dans candidate-auth.ts, qui pointe ici plutôt que
//    vers la page générique non brandée de Firebase). Dans ce cas l'URL
//    contient ?mode=verifyEmail&oobCode=..., et personne n'est forcément
//    connecté sur cet appareil (le lien peut être ouvert depuis un autre
//    téléphone/navigateur que celui de l'inscription).

"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { resendVerificationEmail } from "@/lib/candidate-auth";
import { logoutUser } from "@/lib/candidate-profile";

function BrandedShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "var(--sala-bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="sala-topbar">
        <Link href="/" className="d-flex align-items-center text-decoration-none">
          <Image src="/img/logo_transparent.png" alt="Logo Sala" width={100} height={38} style={{ height: 38, width: "auto" }} className="me-2" />
          <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--sala-green)" }}>SALA</span>
        </Link>
      </header>

      <div className="container my-auto d-flex justify-content-center">
        <div
          className="candidate-auth-form-side"
          style={{
            maxWidth: 460,
            textAlign: "center",
            background: "var(--sala-surface)",
            borderRadius: 20,
            boxShadow: "0 10px 35px rgba(0, 0, 0, 0.06)",
            border: "1px solid var(--sala-border)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function IconBadge({ icon, color }: { icon: string; color: string }) {
  return (
    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, borderRadius: "50%", background: color }}>
      <i className={`fas ${icon} text-white`} style={{ fontSize: "1.4rem" }}></i>
    </div>
  );
}

function VerifierEmailInner() {
  const { user, loading: authLoading, emailVerified, refreshEmailVerified } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const isVerifyLink = searchParams.get("mode") === "verifyEmail" && !!oobCode;

  const [linkStatus, setLinkStatus] = useState<"checking" | "success" | "error" | null>(isVerifyLink ? "checking" : null);
  const [linkError, setLinkError] = useState("");
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Cas 2 : retour du lien reçu par email — applique le code auprès de
  // Firebase indépendamment de la session locale (l'appareil qui ouvre le
  // lien n'est pas forcément celui utilisé pour l'inscription).
  useEffect(() => {
    if (!isVerifyLink || !oobCode) return;
    applyActionCode(auth, oobCode)
      .then(() => {
        setLinkStatus("success");
        refreshEmailVerified().catch(() => {});
      })
      .catch((err: unknown) => {
        setLinkStatus("error");
        const code = (err as { code?: string } | null)?.code;
        setLinkError(
          code === "auth/invalid-action-code"
            ? "Ce lien a expiré ou a déjà été utilisé."
            : "Impossible de vérifier cet email pour le moment."
        );
      });
  }, [isVerifyLink, oobCode, refreshEmailVerified]);

  // Cas 1 : écran d'attente après inscription.
  useEffect(() => {
    if (isVerifyLink) return;
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (emailVerified) {
      router.replace("/profile");
    }
  }, [isVerifyLink, authLoading, user, emailVerified, router]);

  async function handleCheck() {
    setError("");
    setMessage("");
    setChecking(true);
    try {
      const verified = await refreshEmailVerified();
      if (verified) {
        setMessage("Email vérifié ! Redirection...");
        setTimeout(() => router.replace("/profile"), 600);
      } else {
        setError("Pas encore vérifié. Ouvrez le lien reçu par email, puis réessayez ici.");
      }
    } catch {
      setError("Impossible de vérifier pour le moment. Réessayez dans un instant.");
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    if (!user) return;
    setError("");
    setMessage("");
    setResending(true);
    try {
      await resendVerificationEmail(user);
      setMessage("Email renvoyé à " + user.email);
    } catch {
      setError("Impossible de renvoyer l'email pour le moment. Réessayez dans un instant.");
    } finally {
      setResending(false);
    }
  }

  async function handleLogout() {
    await logoutUser();
    router.replace("/auth");
  }

  // --- Retour du lien de vérification ---
  if (isVerifyLink) {
    if (linkStatus === "success") {
      return (
        <BrandedShell>
          <IconBadge icon="fa-check" color="var(--sala-green)" />
          <h4 className="fw-bold mb-2">Email vérifié !</h4>
          <p className="text-muted mb-3">Votre adresse email a bien été confirmée. Votre compte Sala est maintenant actif.</p>
          {user && emailVerified ? (
            <button className="btn-sala-primary w-100 py-2" onClick={() => router.replace("/profile")}>
              Accéder à mon profil
            </button>
          ) : (
            <Link href="/auth" className="btn-sala-primary w-100 py-2 d-block">
              Se connecter
            </Link>
          )}
        </BrandedShell>
      );
    }

    if (linkStatus === "error") {
      return (
        <BrandedShell>
          <IconBadge icon="fa-exclamation" color="var(--sala-red)" />
          <h4 className="fw-bold mb-2">Lien invalide</h4>
          <p className="text-muted mb-3">{linkError}</p>
          <Link href="/auth" className="btn-sala-outline w-100 py-2 d-block">
            Retour à la connexion
          </Link>
        </BrandedShell>
      );
    }

    return (
      <BrandedShell>
        <div className="spinner-border text-success mb-3"></div>
        <p className="text-muted mb-0">Vérification de votre email en cours...</p>
      </BrandedShell>
    );
  }

  // --- Écran d'attente après inscription ---
  if (authLoading || !user || emailVerified) {
    return (
      <div className="admin-auth-checking">
        <div className="spinner-border text-success"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <BrandedShell>
      <IconBadge icon="fa-envelope-open-text" color="var(--sala-green)" />
      <h4 className="fw-bold mb-2">Vérifiez votre adresse email</h4>
      <p className="text-muted mb-3">
        Nous avons envoyé un email de confirmation à <strong>{user.email}</strong>. Ouvrez-le et cliquez sur le
        lien de vérification, puis revenez sur cette page.
      </p>

      {error && <div className="alert alert-danger py-2 px-3 small">{error}</div>}
      {message && <div className="alert alert-success py-2 px-3 small">{message}</div>}

      <button className="btn-sala-primary w-100 py-2 mb-2" onClick={handleCheck} disabled={checking}>
        <i className="fas fa-check-circle me-2"></i> {checking ? "Vérification..." : "J'ai vérifié mon email"}
      </button>
      <button className="btn-sala-outline w-100 py-2 mb-3" onClick={handleResend} disabled={resending}>
        {resending ? "Envoi..." : "Renvoyer l'email de vérification"}
      </button>

      <button className="btn btn-link text-muted small" onClick={handleLogout}>
        Mauvaise adresse email ? Se déconnecter
      </button>
    </BrandedShell>
  );
}

export default function VerifierEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-auth-checking">
          <div className="spinner-border text-success"></div>
        </div>
      }
    >
      <VerifierEmailInner />
    </Suspense>
  );
}
