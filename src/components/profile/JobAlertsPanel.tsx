// src/components/profile/JobAlertsPanel.tsx
// Réglage des alertes emploi du candidat : chaque matin, la tâche planifiée
// lui envoie par email les nouvelles offres correspondant à ces critères
// (voir src/lib/job-alerts.ts et src/app/api/cron/collect-jobs).

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ALERT_CONTRACTS, EMPTY_JOB_ALERTS, MAX_ALERT_KEYWORDS, parseKeywords, type JobAlertPrefs } from "@/lib/job-alerts";
import { notify } from "@/lib/notify";

const CITIES = ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Oyo", "Ouesso"];

interface JobAlertsPanelProps {
  email: string;
  alerts: JobAlertPrefs | undefined;
  onSave: (alerts: JobAlertPrefs) => Promise<void>;
}

export function JobAlertsPanel({ email, alerts, onSave }: JobAlertsPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [city, setCity] = useState("");
  const [contract, setContract] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = alerts || EMPTY_JOB_ALERTS;
    setEnabled(current.enabled);
    setKeywords(current.keywords.join(", "));
    setCity(current.city);
    setContract(current.contract);
  }, [alerts]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ enabled, keywords: parseKeywords(keywords), city, contract });
      notify(enabled ? "Alertes activées !" : "Alertes désactivées.");
    } catch (err) {
      console.error("Erreur enregistrement des alertes :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h5 className="fw-bold mb-2">Alertes emploi</h5>
      <p className="text-muted small mb-3">
        Recevez chaque matin à <strong>{email}</strong> les nouvelles offres qui correspondent à vos critères. Laissez un
        critère vide pour ne pas filtrer dessus.
      </p>

      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="alertsEnabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <label className="form-check-label fw-semibold" htmlFor="alertsEnabled">
          Recevoir les alertes par email
        </label>
      </div>

      <fieldset disabled={!enabled}>
        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="alertKeywords">
            Mots-clés (séparés par des virgules, {MAX_ALERT_KEYWORDS} maximum)
          </label>
          <input
            id="alertKeywords"
            className="form-control"
            placeholder="Ex : comptable, logistique, développeur"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>
        <div className="row g-3 mb-3">
          <div className="col-sm-6">
            <label className="form-label small fw-semibold" htmlFor="alertCity">Ville</label>
            <select id="alertCity" className="form-select" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-sm-6">
            <label className="form-label small fw-semibold" htmlFor="alertContract">Type de contrat</label>
            <select id="alertContract" className="form-select" value={contract} onChange={(e) => setContract(e.target.value)}>
              <option value="">Tous les contrats</option>
              {ALERT_CONTRACTS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <button type="submit" className="btn-sala-primary btn-sm" disabled={saving}>
        {saving ? "Enregistrement..." : "Enregistrer mes alertes"}
      </button>
    </form>
  );
}
