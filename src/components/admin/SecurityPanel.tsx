// src/components/admin/SecurityPanel.tsx
// Admin > Paramètres > Sécurité : double authentification (code à 6
// chiffres d'une application) pour son compte, règle d'équipe qui la rend
// obligatoire pour tous les admins, et dépannage d'un admin qui a perdu son
// téléphone. Voir src/lib/mfa.ts.

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MfaEnrollment } from "@/components/admin/MfaEnrollment";
import { hasTotp, loadSecurityPolicy, mfaErrorMessage, removeTotp, sessionUsedSecondFactor } from "@/lib/mfa";
import { confirmAction, notify } from "@/lib/notify";
import { logAdminAction } from "@/lib/admin-log";

type ProjectStatus = "loading" | "enabled" | "disabled" | "unavailable" | "error";

export function SecurityPanel() {
  const { user } = useAuth();
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("loading");
  const [required, setRequired] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [strongSession, setStrongSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const callApi = useCallback(
    async (method: "GET" | "POST", body?: object) => {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/admin/mfa", {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken || ""}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      return (await res.json().catch(() => ({ ok: false }))) as { ok: boolean; status?: string; error?: string; changed?: boolean };
    },
    [user]
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    setEnrolled(hasTotp(user));
    setStrongSession(await sessionUsedSecondFactor(user));
    setRequired((await loadSecurityPolicy()).adminMfaRequired);
    const data = await callApi("GET").catch(() => ({ ok: false, status: undefined }));
    setProjectStatus(data.status === "enabled" || data.status === "disabled" || data.status === "unavailable" ? data.status : "error");
  }, [user, callApi]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return null;

  async function enableOnProject() {
    setBusy(true);
    const data = await callApi("POST", { action: "enable-totp" });
    setBusy(false);
    if (data.ok) {
      setProjectStatus("enabled");
      notify("Double authentification activée sur le projet.");
      logAdminAction("settings", "securite", "Méthode « code par application » activée sur le projet");
    } else {
      setProjectStatus(data.status === "unavailable" ? "unavailable" : "error");
      notify(data.error || "Activation impossible.", "error");
    }
  }

  async function disableMine() {
    if (!user) return;
    if (!(await confirmAction("Désactiver la double authentification ?", "Votre compte ne sera plus protégé que par le mot de passe.", "#dc3545"))) return;
    setBusy(true);
    try {
      await removeTotp(user);
      notify("Double authentification désactivée.");
      logAdminAction("settings", "securite", "Double authentification désactivée sur son compte");
      await refresh();
    } catch (err) {
      notify(mfaErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  async function setPolicy(value: boolean) {
    const text = value
      ? "Chaque admin devra installer une application d'authentification et saisir un code à chaque connexion. Les admins qui ne l'ont pas encore configurée le feront à leur prochaine visite."
      : "Les admins pourront de nouveau se connecter avec leur seul mot de passe.";
    if (!(await confirmAction(value ? "Rendre la double authentification obligatoire ?" : "Ne plus l'exiger ?", text, value ? "#3b9452" : "#dc3545"))) return;
    setBusy(true);
    try {
      await setDoc(doc(db, "settings", "security"), { adminMfaRequired: value }, { merge: true });
      setRequired(value);
      notify(value ? "Double authentification obligatoire pour tous les admins." : "Double authentification facultative.");
      logAdminAction("settings", "securite", value ? "Double authentification rendue obligatoire" : "Double authentification rendue facultative");
    } catch (err) {
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function resetOther(e: FormEvent) {
    e.preventDefault();
    const email = resetEmail.trim();
    if (!email) return;
    if (!(await confirmAction("Réinitialiser sa double authentification ?", `${email} pourra se connecter avec son seul mot de passe, puis devra la réactiver avec son nouveau téléphone.`, "#dc3545"))) return;
    setBusy(true);
    const data = await callApi("POST", { action: "reset", email });
    setBusy(false);
    if (data.ok) {
      notify(data.changed ? "Double authentification réinitialisée." : "Ce compte n'avait pas de double authentification.");
      if (data.changed) logAdminAction("settings", "securite", `Double authentification réinitialisée pour ${email}`);
      setResetEmail("");
    } else {
      notify(data.error || "Réinitialisation impossible.", "error");
    }
  }

  const canRequire = enrolled && strongSession && projectStatus === "enabled";

  return (
    <div className="admin-panel">
      <h2><i className="fas fa-shield-alt me-2"></i>Sécurité : double authentification</h2>
      <p className="admin-page-subtitle mb-3">
        En plus du mot de passe, un code à 6 chiffres donné par une application sur votre téléphone. Un mot de passe volé ne suffit plus pour entrer dans le back-office.
      </p>

      <h3 className="h6 fw-bold mt-3">1. Sur le projet Firebase</h3>
      {projectStatus === "loading" && <div className="spinner-border spinner-border-sm text-success"></div>}
      {projectStatus === "enabled" && <p className="small text-success mb-0"><i className="fas fa-check-circle me-1"></i>Activée : les admins peuvent l&apos;utiliser.</p>}
      {projectStatus === "disabled" && (
        <div>
          <p className="small mb-2">La méthode « code par application » n&apos;est pas encore activée sur le projet.</p>
          <button className="btn btn-success btn-sm rounded-pill" onClick={enableOnProject} disabled={busy}>Activer sur le projet</button>
        </div>
      )}
      {projectStatus === "unavailable" && (
        <div className="alert alert-warning small mb-0">
          Le projet Firebase doit d&apos;abord passer à <strong>Identity Platform</strong> : console Firebase → Authentication → Paramètres →
          « Passer à Firebase Authentication with Identity Platform ». La double authentification par application ne génère aucun coût
          (pas de SMS). Revenez ensuite ici et cliquez sur « Activer sur le projet ».
        </div>
      )}
      {projectStatus === "error" && <p className="small text-muted mb-0">État indisponible (normal en local, sans compte de service).</p>}

      <h3 className="h6 fw-bold mt-4">2. Mon compte ({user.email})</h3>
      {enrolled ? (
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <span className="small text-success"><i className="fas fa-check-circle me-1"></i>Activée</span>
          {!required && (
            <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={disableMine} disabled={busy}>Désactiver</button>
          )}
          {!strongSession && <span className="small text-muted">Reconnectez-vous une fois avec votre code pour que la session en cours en profite.</span>}
        </div>
      ) : projectStatus === "enabled" ? (
        <MfaEnrollment user={user} onDone={() => { notify("Double authentification activée sur votre compte."); logAdminAction("settings", "securite", "Double authentification activée sur son compte"); refresh(); }} />
      ) : (
        <p className="small text-muted mb-0">Disponible dès que l&apos;étape 1 est faite.</p>
      )}

      <h3 className="h6 fw-bold mt-4">3. Règle de l&apos;équipe</h3>
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          id="mfa-required"
          checked={required}
          disabled={busy || (!required && !canRequire)}
          onChange={(e) => setPolicy(e.target.checked)}
        />
        <label className="form-check-label small" htmlFor="mfa-required">
          Obligatoire pour tous les admins (back-office, imports et base de données)
        </label>
      </div>
      {!required && !canRequire && (
        <p className="small text-muted mt-1 mb-0">
          Pour l&apos;activer, configurez d&apos;abord votre propre compte puis reconnectez-vous avec votre code : vous ne risquez ainsi pas de vous bloquer.
        </p>
      )}

      <h3 className="h6 fw-bold mt-4">4. Un admin a perdu son téléphone ?</h3>
      <form className="d-flex gap-2 flex-wrap" onSubmit={resetOther}>
        <input
          type="email"
          className="form-control form-control-sm"
          style={{ maxWidth: 280 }}
          placeholder="Adresse e-mail de l'admin"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
        />
        <button className="btn btn-outline-secondary btn-sm rounded-pill" disabled={busy || !resetEmail.trim()}>Réinitialiser</button>
      </form>
    </div>
  );
}
