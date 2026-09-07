// src/app/admin/parametres/page.tsx
// Mon compte (profil, mot de passe) + réglages du site (coordonnées,
// visibilité des sections dans les menus publics).

"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_SETTINGS, loadSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { notify } from "@/lib/notify";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [accountName, setAccountName] = useState("");
  const [accountPhoto, setAccountPhoto] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);

  useEffect(() => {
    if (user) {
      setAccountName(user.displayName || "");
      setAccountPhoto(user.photoURL || "");
    }
    loadSiteSettings().then(setSettings);
  }, [user]);

  async function handleAccountSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingAccount(true);
    try {
      await updateProfile(user, { displayName: accountName.trim() || null, photoURL: accountPhoto.trim() || null });
      notify("Profil mis à jour.");
    } catch (err) {
      console.error("Erreur mise à jour du profil :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSavingAccount(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !user.email) return;
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      notify("Mot de passe mis à jour.");
    } catch (err) {
      const code = (err as { code?: string }).code;
      const message =
        code === "auth/wrong-password" || code === "auth/invalid-credential"
          ? "Mot de passe actuel incorrect."
          : "Erreur : " + (err as Error).message;
      notify(message, "error");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleContactSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingContact(true);
    try {
      await setDoc(
        doc(db, "settings", "site"),
        {
          contactEmail: settings.contactEmail.trim(),
          contactCities: settings.contactCities.trim(),
          socialFacebook: settings.socialFacebook.trim(),
          socialWhatsapp: settings.socialWhatsapp.trim(),
          socialInstagram: settings.socialInstagram.trim(),
        },
        { merge: true }
      );
      notify("Coordonnées enregistrées.");
    } catch (err) {
      console.error("Erreur enregistrement des coordonnées :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSavingContact(false);
    }
  }

  async function handleVisibilitySubmit(e: FormEvent) {
    e.preventDefault();
    setSavingVisibility(true);
    try {
      await setDoc(doc(db, "settings", "site"), { sectionsVisible: settings.sectionsVisible }, { merge: true });
      notify("Visibilité enregistrée. Les visiteurs verront le changement à leur prochain chargement de page.");
    } catch (err) {
      console.error("Erreur enregistrement de la visibilité :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSavingVisibility(false);
    }
  }

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Paramètres</h1>
          <p className="admin-page-subtitle">Votre compte administrateur et les réglages généraux du site.</p>
        </div>
      </div>

      <div className="admin-panel">
        <h2><i className="fas fa-user-circle me-2"></i>Mon compte</h2>
        <form onSubmit={handleAccountSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="accountName">Nom affiché</label>
              <input id="accountName" type="text" placeholder="Ex: Jean-Paul Moukoko" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="accountPhoto">Photo de profil (URL)</label>
              <input id="accountPhoto" type="url" placeholder="https://..." value={accountPhoto} onChange={(e) => setAccountPhoto(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={user?.email || ""} disabled />
            </div>
          </div>
          <div className="form-actions" style={{ textAlign: "left" }}>
            <button type="submit" className="btn-sala-primary" disabled={savingAccount}>
              {savingAccount ? "Enregistrement..." : "Enregistrer mon profil"}
            </button>
          </div>
        </form>

        <hr style={{ borderColor: "var(--sala-border)", margin: "20px 0" }} />

        <h2 style={{ fontSize: "0.95rem" }}><i className="fas fa-key me-2"></i>Changer mon mot de passe</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="currentPassword">Mot de passe actuel</label>
              <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">Nouveau mot de passe</label>
              <input id="newPassword" type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
          </div>
          <div className="form-actions" style={{ textAlign: "left" }}>
            <button type="submit" className="btn-sala-outline" disabled={savingPassword}>
              {savingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-panel">
        <h2><i className="fas fa-address-card me-2"></i>Coordonnées affichées sur le site</h2>
        <form onSubmit={handleContactSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="setContactEmail">Email de contact public</label>
              <input
                id="setContactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings((s) => ({ ...s, contactEmail: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="setContactCities">Villes / zone d&apos;action</label>
              <input
                id="setContactCities"
                type="text"
                value={settings.contactCities}
                onChange={(e) => setSettings((s) => ({ ...s, contactCities: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="setFacebook">Facebook (optionnel)</label>
              <input
                id="setFacebook"
                type="url"
                placeholder="https://facebook.com/..."
                value={settings.socialFacebook}
                onChange={(e) => setSettings((s) => ({ ...s, socialFacebook: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="setWhatsapp">WhatsApp (optionnel)</label>
              <input
                id="setWhatsapp"
                type="url"
                placeholder="https://wa.me/242..."
                value={settings.socialWhatsapp}
                onChange={(e) => setSettings((s) => ({ ...s, socialWhatsapp: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="setInstagram">Instagram (optionnel)</label>
              <input
                id="setInstagram"
                type="url"
                placeholder="https://instagram.com/..."
                value={settings.socialInstagram}
                onChange={(e) => setSettings((s) => ({ ...s, socialInstagram: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-actions" style={{ textAlign: "left" }}>
            <button type="submit" className="btn-sala-primary" disabled={savingContact}>
              {savingContact ? "Enregistrement..." : "Enregistrer les coordonnées"}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-panel">
        <h2><i className="fas fa-eye me-2"></i>Sections visibles sur le site</h2>
        <p className="admin-page-subtitle" style={{ marginBottom: 16 }}>
          Décochez une section pour masquer son lien dans les menus (Offres d&apos;emploi et Créer un CV restent toujours visibles).
        </p>
        <form onSubmit={handleVisibilitySubmit}>
          <div className="d-flex flex-column gap-2 mb-3">
            <label className="visibility-toggle">
              <input
                type="checkbox"
                checked={settings.sectionsVisible.evenements}
                onChange={(e) => setSettings((s) => ({ ...s, sectionsVisible: { ...s.sectionsVisible, evenements: e.target.checked } }))}
              />
              Événements
            </label>
            <label className="visibility-toggle">
              <input
                type="checkbox"
                checked={settings.sectionsVisible.annuaires}
                onChange={(e) => setSettings((s) => ({ ...s, sectionsVisible: { ...s.sectionsVisible, annuaires: e.target.checked } }))}
              />
              Annuaires
            </label>
            <label className="visibility-toggle">
              <input
                type="checkbox"
                checked={settings.sectionsVisible.entretiens}
                onChange={(e) => setSettings((s) => ({ ...s, sectionsVisible: { ...s.sectionsVisible, entretiens: e.target.checked } }))}
              />
              Entretiens
            </label>
            <label className="visibility-toggle">
              <input
                type="checkbox"
                checked={settings.sectionsVisible.legislation}
                onChange={(e) => setSettings((s) => ({ ...s, sectionsVisible: { ...s.sectionsVisible, legislation: e.target.checked } }))}
              />
              Législation / Droit du Travail
            </label>
          </div>
          <div className="form-actions" style={{ textAlign: "left" }}>
            <button type="submit" className="btn-sala-primary" disabled={savingVisibility}>
              {savingVisibility ? "Enregistrement..." : "Enregistrer la visibilité"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
