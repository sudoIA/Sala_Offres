// src/components/admin/AutoPublishPanel.tsx
// Choix des sources "de confiance" dont les nouvelles offres sont publiées
// automatiquement par la collecte quotidienne (settings/imports), sans
// passer par la relecture manuelle de l'écran Imports. Les doublons détectés
// ne sont jamais publiés automatiquement.

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { IMPORT_SOURCES } from "@/lib/import-sources";
import { logAdminAction } from "@/lib/admin-log";
import { notify } from "@/lib/notify";

export function AutoPublishPanel() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "imports"))
      .then((snap) => {
        const sources = snap.data()?.autoPublishSources;
        if (Array.isArray(sources)) setSelected(new Set(sources));
      })
      .catch((err) => console.error("Lecture des réglages d'import impossible :", err));
  }, []);

  function toggle(key: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const autoPublishSources = [...selected];
      await setDoc(doc(db, "settings", "imports"), { autoPublishSources }, { merge: true });
      await logAdminAction("settings", "settings", `Publication automatique : ${autoPublishSources.join(", ") || "aucune source"}`);
      notify("Réglage enregistré.");
    } catch (err) {
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel">
      <h2><i className="fas fa-robot me-2"></i>Publication automatique des offres importées</h2>
      <p className="admin-page-subtitle" style={{ marginBottom: 16 }}>
        Les nouvelles offres des sources cochées sont publiées directement par la collecte quotidienne (6 h), sans
        relecture. Les autres restent dans l&apos;écran Imports en attente de validation. Les doublons ne sont jamais
        publiés automatiquement.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="d-flex flex-column gap-2 mb-3">
          {IMPORT_SOURCES.map((s) => (
            <label className="visibility-toggle" key={s.key}>
              <input type="checkbox" checked={selected.has(s.key)} onChange={(e) => toggle(s.key, e.target.checked)} />
              {s.label}
            </label>
          ))}
        </div>
        <div className="form-actions" style={{ textAlign: "left" }}>
          <button type="submit" className="btn-sala-primary" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
