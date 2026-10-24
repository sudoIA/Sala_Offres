// src/app/connexion/page.tsx
// Connexion de l'espace administration (design validé : panneau de marque
// vert + formulaire).

"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, type AuthError, type MultiFactorError, type UserCredential } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { isMfaRequired, mfaErrorMessage, resolveTotpSignIn } from "@/lib/mfa";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fadingOut, setFadingOut] = useState(false);
  // Double authentification : connexion interrompue, en attente du code à 6 chiffres.
  const [mfaError, setMfaError] = useState<MultiFactorError | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  async function finishLogin(result: UserCredential) {
    const roleDoc = await getDoc(doc(db, "roles", result.user.uid));
    const role = roleDoc.exists() ? roleDoc.data().role : "user";

    if (role === "admin") {
      setSuccess("Connexion réussie ! Redirection...");
      setFadingOut(true);
      setTimeout(() => router.push("/admin"), 500);
    } else {
      setError("Accès réservé aux administrateurs de l'ONG Sala.");
      await signOut(auth);
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e: FormEvent) {
    e.preventDefault();
    if (!mfaError) return;
    setLoading(true);
    setError("");
    try {
      await finishLogin(await resolveTotpSignIn(auth, mfaError, mfaCode));
    } catch (err) {
      setError(mfaErrorMessage(err));
      setMfaCode("");
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setSuccess("");
      setError("Veuillez renseigner votre email et mot de passe.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await finishLogin(await signInWithEmailAndPassword(auth, email.trim(), password));
    } catch (err) {
      if (isMfaRequired(err)) {
        // Mot de passe correct : il reste le code de l'application.
        setMfaError(err);
        setSuccess("");
        setLoading(false);
        return;
      }
      const authErr = err as AuthError;
      console.error("Erreur login :", authErr);
      let message = "Erreur de connexion : " + authErr.message;
      if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(authErr.code)) {
        message = "Identifiants invalides. Vérifiez votre adresse email et mot de passe.";
      }
      setSuccess("");
      setError(message);
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setSuccess("");
      setError("Veuillez entrer votre adresse email pour réinitialiser votre mot de passe.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setError("");
      setSuccess("Un email de réinitialisation vous a été envoyé à : " + email.trim());
    } catch (err) {
      const authErr = err as AuthError;
      setSuccess("");
      setError("Erreur : " + authErr.message);
    }
  }

  return (
    <div className="auth-page-bg">
      <div className="auth-shell" style={fadingOut ? { opacity: 0, transform: "scale(0.97)", transition: "opacity 0.4s ease, transform 0.4s ease" } : undefined}>
        <div className="auth-brand-panel">
          <div className="auth-brand-logo">
            <div className="auth-brand-logo-badge">
              <Image src="/img/logo_transparent.png" alt="Logo Sala" width={76} height={76} style={{ width: 76, height: 76, objectFit: "contain" }} />
            </div>
            <span>SALA</span>
          </div>
          <div className="auth-brand-body">
            <h1>Espace Administration</h1>
            <p>Gérez les offres d&apos;emploi, les événements, les annuaires et le contenu de la plateforme Sala en toute simplicité.</p>
            <div className="auth-brand-features">
              <div><i className="fas fa-check"></i> Réservé à l&apos;équipe de l&apos;ONG Sala</div>
              <div><i className="fas fa-check"></i> Connexion sécurisée par Firebase</div>
              <div><i className="fas fa-check"></i> Toutes vos modifications en temps réel</div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <span className="auth-badge"><i className="fas fa-lock"></i> Accès réservé</span>
          <h2>Connexion</h2>
          <p>Connectez-vous avec vos identifiants administrateur.</p>

          {error && <div className="auth-alert error">{error}</div>}
          {success && <div className="auth-alert success">{success}</div>}

          {mfaError ? (
            <form onSubmit={handleMfaSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="mfa-code">Code de votre application d&apos;authentification</label>
                <div className="auth-input-wrap">
                  <i className="fas fa-shield-alt icon-left"></i>
                  <input
                    type="text"
                    id="mfa-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    style={{ letterSpacing: "0.3em", fontWeight: 700 }}
                  />
                </div>
              </div>
              <button type="submit" className="auth-submit" disabled={loading || mfaCode.length !== 6}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <span>Valider le code</span>}
              </button>
              <div className="auth-links">
                <a onClick={() => { setMfaError(null); setMfaCode(""); setError(""); }}>Revenir au mot de passe</a>
              </div>
            </form>
          ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Adresse email</label>
              <div className="auth-input-wrap">
                <i className="fas fa-envelope icon-left"></i>
                <input
                  type="email"
                  id="email"
                  placeholder="admin@sala.cg"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Mot de passe</label>
              <div className="auth-input-wrap">
                <i className="fas fa-lock icon-left"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  title="Afficher / masquer le mot de passe"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <span>Se connecter</span>}
            </button>

            <div className="auth-links">
              <a onClick={handleResetPassword}>Mot de passe oublié ?</a>
            </div>
          </form>
          )}

          <Link href="/" className="auth-back-link">
            <i className="fas fa-arrow-left"></i> Retour au site Sala
          </Link>
        </div>
      </div>
    </div>
  );
}
