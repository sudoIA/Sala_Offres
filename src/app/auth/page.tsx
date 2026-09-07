// src/app/auth/page.tsx
// Connexion / inscription candidat (espace différent de /connexion, réservé
// à l'administration).

"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthError } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { loginCandidate, loginWithGoogle, registerCandidate, sendResetEmail } from "@/lib/candidate-auth";

const CITIES = ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Oyo", "Autre"];

export default function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regFullName, setRegFullName] = useState("");
  const [regCity, setRegCity] = useState("Brazzaville");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");

  useEffect(() => {
    if (!authLoading && user) router.replace("/profile");
  }, [authLoading, user, router]);

  function clearAlerts() {
    setError("");
    setSuccess("");
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    clearAlerts();
    setLoginLoading(true);
    try {
      await loginCandidate(loginEmail.trim(), loginPassword);
      setSuccess("Connexion réussie ! Redirection...");
      setTimeout(() => router.push("/profile"), 800);
    } catch (err) {
      const authErr = err as AuthError;
      console.error(authErr);
      setError(authErr.code === "auth/too-many-requests" ? "Trop de tentatives. Veuillez patienter un instant." : "Identifiants incorrects ou compte inexistant.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    clearAlerts();
    if (regPassword !== regPasswordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setRegisterLoading(true);
    try {
      await registerCandidate(regEmail.trim(), regPassword, regFullName.trim(), regCity, regPhone.trim());
      setSuccess("Compte créé avec succès ! Bienvenue sur Sala.");
      setTimeout(() => router.push("/profile"), 1000);
    } catch (err) {
      const authErr = err as AuthError;
      console.error(authErr);
      let msg = "Erreur lors de la création du compte : " + authErr.message;
      if (authErr.code === "auth/email-already-in-use") msg = "Cette adresse email est déjà associée à un compte Sala.";
      else if (authErr.code === "auth/weak-password") msg = "Le mot de passe doit contenir au moins 6 caractères.";
      setError(msg);
    } finally {
      setRegisterLoading(false);
    }
  }

  async function handleGoogle() {
    clearAlerts();
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      setSuccess("Connexion Google réussie !");
      setTimeout(() => router.push("/profile"), 800);
    } catch (err) {
      const authErr = err as AuthError;
      console.error(authErr);
      if (authErr.code !== "auth/popup-closed-by-user") setError("Erreur Google Sign-In : " + authErr.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    clearAlerts();
    if (!loginEmail.trim()) {
      setError("Veuillez saisir votre adresse email pour réinitialiser le mot de passe.");
      return;
    }
    try {
      await sendResetEmail(loginEmail.trim());
      setSuccess("Un email de réinitialisation vous a été envoyé à : " + loginEmail.trim());
    } catch (err) {
      setError("Erreur : " + (err as Error).message);
    }
  }

  return (
    <div style={{ backgroundColor: "#f4f6f8", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="sala-topbar">
        <Link href="/" className="d-flex align-items-center text-decoration-none">
          <Image src="/img/logo_transparent.png" alt="Logo Sala" width={100} height={38} style={{ height: 38, width: "auto" }} className="me-2" />
          <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--sala-green)" }}>SALA</span>
        </Link>
        <Link href="/offres" className="btn-sala-outline py-1 px-3" style={{ fontSize: "0.85rem" }}>
          <i className="fas fa-briefcase me-1"></i> Voir les offres
        </Link>
      </header>

      <div className="container my-auto">
        <div className="candidate-auth-container">
          <div className="candidate-auth-banner">
            <div>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="badge bg-white text-success fw-bold px-3 py-1 rounded-pill">Espace Candidat</span>
              </div>
              <h2 className="text-white fw-bold mb-3">Votre tremplin pour l&apos;emploi au Congo</h2>
              <p className="text-white-50 mb-4">Créez votre compte en quelques secondes pour postuler en 1 clic et générer un CV prêt pour les recruteurs.</p>

              <div className="candidate-feature-item">
                <div className="candidate-feature-icon"><i className="fas fa-check text-white"></i></div>
                <span>Offres quotidiennes à Brazzaville &amp; Pointe-Noire</span>
              </div>
              <div className="candidate-feature-item">
                <div className="candidate-feature-icon"><i className="fas fa-file-alt text-white"></i></div>
                <span>Générateur de CV professionnel 100% gratuit</span>
              </div>
              <div className="candidate-feature-item">
                <div className="candidate-feature-icon"><i className="fas fa-bell text-white"></i></div>
                <span>Alertes opportunités et conseils d&apos;entretiens</span>
              </div>
            </div>

            <div className="pt-4 border-top border-white-50 mt-4">
              <small className="text-white-50">Une initiative sociale de l&apos;<strong>ONG Sala</strong> pour la jeunesse congolaise.</small>
            </div>
          </div>

          <div className="candidate-auth-form-side">
            <div className="candidate-auth-tabs">
              <button className={`candidate-auth-tab-btn${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); clearAlerts(); }}>
                Se connecter
              </button>
              <button className={`candidate-auth-tab-btn${tab === "register" ? " active" : ""}`} onClick={() => { setTab("register"); clearAlerts(); }}>
                Créer un compte
              </button>
            </div>

            {error && <div className="alert alert-danger py-2 px-3 small">{error}</div>}
            {success && <div className="alert alert-success py-2 px-3 small">{success}</div>}

            <button className="btn-google mb-2" type="button" onClick={handleGoogle} disabled={googleLoading}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
              </svg>
              <span>{googleLoading ? "Connexion avec Google..." : "Continuer avec Google"}</span>
            </button>

            <div className="candidate-auth-divider">ou avec votre adresse email</div>

            {tab === "login" ? (
              <form onSubmit={handleLogin}>
                <div className="candidate-form-field">
                  <label htmlFor="login-email">Adresse Email</label>
                  <input type="email" id="login-email" placeholder="nom@exemple.cg" required autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                </div>
                <div className="candidate-form-field">
                  <div className="d-flex justify-content-between align-items-center">
                    <label htmlFor="login-password" style={{ marginBottom: 0 }}>Mot de passe</label>
                    <a href="#" className="small text-decoration-none" style={{ color: "var(--sala-green)" }} onClick={handleForgotPassword}>Oublié ?</a>
                  </div>
                  <input type="password" id="login-password" placeholder="••••••••" required autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                </div>
                <button type="submit" className="btn-sala-primary w-100 py-2 mt-2" disabled={loginLoading}>
                  <i className="fas fa-sign-in-alt me-2"></i> {loginLoading ? "Connexion..." : "Se connecter"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="candidate-form-field">
                  <label htmlFor="reg-fullname">Nom complet</label>
                  <input type="text" id="reg-fullname" placeholder="Ex: Jean Paul MOUKOKO" required autoComplete="name" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} />
                </div>
                <div className="row">
                  <div className="col-sm-6">
                    <div className="candidate-form-field">
                      <label htmlFor="reg-city">Ville de résidence</label>
                      <select id="reg-city" value={regCity} onChange={(e) => setRegCity(e.target.value)}>
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c === "Autre" ? "Autre localité" : c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="candidate-form-field">
                      <label htmlFor="reg-phone">Téléphone (facultatif)</label>
                      <input type="tel" id="reg-phone" placeholder="+242 06 ..." value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="candidate-form-field">
                  <label htmlFor="reg-email">Adresse Email</label>
                  <input type="email" id="reg-email" placeholder="nom@exemple.cg" required autoComplete="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                </div>
                <div className="row">
                  <div className="col-sm-6">
                    <div className="candidate-form-field">
                      <label htmlFor="reg-password">Mot de passe</label>
                      <input type="password" id="reg-password" placeholder="Min. 6 caractères" required minLength={6} autoComplete="new-password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="candidate-form-field">
                      <label htmlFor="reg-password-confirm">Confirmer</label>
                      <input type="password" id="reg-password-confirm" placeholder="Retapez le mot de passe" required minLength={6} autoComplete="new-password" value={regPasswordConfirm} onChange={(e) => setRegPasswordConfirm(e.target.value)} />
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn-sala-accent w-100 py-2 mt-2" disabled={registerLoading}>
                  <i className="fas fa-user-plus me-2"></i> {registerLoading ? "Création du compte..." : "Créer mon compte"}
                </button>
              </form>
            )}

            <div className="text-center mt-4 pt-3 border-top">
              <small className="text-muted">
                Vous êtes administrateur de l&apos;ONG ?{" "}
                <Link href="/connexion" className="text-decoration-none fw-bold" style={{ color: "var(--sala-green)" }}>Accès Admin</Link>
              </small>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-3 text-center text-muted small">
        © 2026 ONG Sala — République du Congo • <Link href="/" className="text-muted text-decoration-none">Retour au site</Link>
      </footer>
    </div>
  );
}
