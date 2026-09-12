// src/app/verifier-email/page.tsx
// Étape obligatoire après l'inscription (ou à la connexion si jamais
// confirmée) : tant que l'email n'est pas vérifié via le lien reçu, le
// candidat ne peut pas accéder à son profil ni sauvegarder son CV en ligne —
// ceci évite les comptes créés avec une adresse email fictive.

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resendVerificationEmail } from "@/lib/candidate-auth";
import { logoutUser } from "@/lib/candidate-profile";

export default function VerifierEmailPage() {
  const { user, loading: authLoading, emailVerified, refreshEmailVerified } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (emailVerified) {
      router.replace("/profile");
    }
  }, [authLoading, user, emailVerified, router]);

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

  if (authLoading || !user || emailVerified) {
    return (
      <div className="admin-auth-checking">
        <div className="spinner-border text-success"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f4f6f8", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
            background: "#ffffff",
            borderRadius: 20,
            boxShadow: "0 10px 35px rgba(0, 0, 0, 0.06)",
            border: "1px solid var(--sala-border)",
          }}
        >
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center"
            style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--sala-green)" }}
          >
            <i className="fas fa-envelope-open-text text-white" style={{ fontSize: "1.4rem" }}></i>
          </div>
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
        </div>
      </div>
    </div>
  );
}
