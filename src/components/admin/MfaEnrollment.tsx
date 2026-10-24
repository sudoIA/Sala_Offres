// src/components/admin/MfaEnrollment.tsx
// Activation de la double authentification pour le compte connecté :
// QR code à scanner avec une application (Google Authenticator...), puis
// saisie du premier code pour confirmer. Utilisé dans Paramètres > Sécurité
// et en écran obligatoire quand l'équipe exige la double authentification.

"use client";

import { useState, type FormEvent } from "react";
import QRCode from "qrcode";
import type { TotpSecret, User } from "firebase/auth";
import { finishTotpEnrollment, mfaErrorMessage, startTotpEnrollment } from "@/lib/mfa";

export function MfaEnrollment({ user, onDone }: { user: User; onDone: () => void }) {
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    try {
      const { secret: s, uri } = await startTotpEnrollment(user);
      setSecret(s);
      setQr(await QRCode.toDataURL(uri, { width: 220, margin: 1 }));
    } catch (err) {
      setError(mfaErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    if (!secret) return;
    setBusy(true);
    setError("");
    try {
      await finishTotpEnrollment(user, secret, code);
      onDone();
    } catch (err) {
      setError(mfaErrorMessage(err));
      setBusy(false);
    }
  }

  if (!secret) {
    return (
      <div>
        <p className="small text-muted mb-3">
          Installez d&apos;abord sur votre téléphone une application d&apos;authentification gratuite : <strong>Google Authenticator</strong> ou{" "}
          <strong>Microsoft Authenticator</strong>. À chaque connexion, elle vous donnera un code à 6 chiffres en plus de votre mot de passe.
        </p>
        {error && <div className="alert alert-danger small">{error}</div>}
        <button className="btn btn-success rounded-pill" onClick={start} disabled={busy}>
          {busy ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-qrcode me-2"></i>Commencer</>}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={confirm}>
      <ol className="small mb-3 ps-3">
        <li>Ouvrez l&apos;application et choisissez « Ajouter » puis « Scanner un QR code ».</li>
        <li>Scannez ce code :</li>
      </ol>
      <div className="text-center mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr && <img src={qr} alt="QR code à scanner avec l'application d'authentification" width={220} height={220} style={{ background: "#fff", padding: 8, borderRadius: 12 }} />}
      </div>
      <details className="small mb-3">
        <summary className="text-muted" style={{ cursor: "pointer" }}>Impossible de scanner ? Saisir la clé à la main</summary>
        <code className="d-block mt-2 p-2 bg-light rounded" style={{ wordBreak: "break-all" }}>{secret.secretKey}</code>
      </details>
      <label className="form-label small fw-bold" htmlFor="mfa-enroll-code">3. Saisissez le code à 6 chiffres affiché par l&apos;application</label>
      <div className="d-flex gap-2 flex-wrap">
        <input
          id="mfa-enroll-code"
          className="form-control"
          style={{ maxWidth: 160, letterSpacing: "0.3em", fontWeight: 700 }}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
        />
        <button className="btn btn-success rounded-pill" disabled={busy || code.length !== 6}>
          {busy ? <i className="fas fa-spinner fa-spin"></i> : "Activer"}
        </button>
      </div>
      {error && <div className="alert alert-danger small mt-3 mb-0">{error}</div>}
    </form>
  );
}
