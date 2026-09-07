// src/components/cv/steps/Step7Preview.tsx
// Étape 7 : choix du modèle, indicateur de complétude, aperçu temps réel du
// CV et actions (télécharger le PDF / sauvegarder en ligne).

"use client";

import { type RefObject, useState } from "react";
import type { CvState, CvTemplate } from "@/types/cv";
import { CvCompletenessBox } from "@/components/cv/CvCompletenessBox";
import { CvRenderRoot } from "@/components/cv/CvRenderRoot";

const TEMPLATES: { key: CvTemplate; label: string }[] = [
  { key: "classic", label: "Classique Sala" },
  { key: "marine", label: "Sidebar Marine" },
  { key: "moderne", label: "Moderne 2 colonnes" },
];

interface Step7Props {
  cv: CvState;
  onTemplateChange: (template: CvTemplate) => void;
  renderRef: RefObject<HTMLDivElement | null>;
  onDownloadPdf: () => Promise<void>;
  onSaveOnline: () => Promise<void>;
}

export function Step7Preview({ cv, onTemplateChange, renderRef, onDownloadPdf, onSaveOnline }: Step7Props) {
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await onDownloadPdf();
    } finally {
      setDownloading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveOnline();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="step-pane">
      <h3 className="h5 fw-bold mb-1 text-dark">Choisissez votre modèle</h3>
      <p className="text-muted small mb-3">Le modèle sélectionné détermine la mise en page de votre CV téléchargé en PDF.</p>
      <div className="template-picker">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.key}
            className={`template-option${cv.template === tpl.key ? " active" : ""}`}
            onClick={() => onTemplateChange(tpl.key)}
          >
            <div className={`template-thumb template-thumb-${tpl.key === "classic" ? "classic" : tpl.key}`}>
              {tpl.key === "classic" && (
                <>
                  <div className="t-band"></div>
                  <div className="t-body">
                    <div className="t-line w80"></div>
                    <div className="t-line w60"></div>
                    <div className="t-line w60"></div>
                  </div>
                </>
              )}
              {tpl.key === "marine" && (
                <>
                  <div className="t-side"></div>
                  <div className="t-main">
                    <div className="t-line w70"></div>
                    <div className="t-line w70"></div>
                    <div className="t-line w70"></div>
                  </div>
                </>
              )}
              {tpl.key === "moderne" && (
                <>
                  <div className="t-band">
                    <div className="t-dot"></div>
                    <div className="t-line w70"></div>
                  </div>
                  <div className="t-body">
                    <div className="t-col1"><div className="t-line"></div><div className="t-line"></div></div>
                    <div className="t-col2"><div className="t-line"></div><div className="t-line"></div></div>
                  </div>
                </>
              )}
            </div>
            <div className="template-option-label">{tpl.label}</div>
          </div>
        ))}
      </div>

      <CvCompletenessBox cv={cv} />

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 p-3 bg-white rounded-3 border shadow-sm">
        <div>
          <h4 className="h5 fw-bold mb-0 text-success"><i className="fas fa-check-circle me-1"></i> Votre CV est prêt !</h4>
          <small className="text-muted">Vérifiez la mise en page avant de télécharger le document officiel.</small>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn-sala-primary fw-bold" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <><i className="fas fa-spinner fa-spin me-1"></i> Génération du PDF...</>
            ) : (
              <><i className="fas fa-file-pdf me-1"></i> Télécharger mon CV (PDF)</>
            )}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><i className="fas fa-spinner fa-spin me-1"></i> Sauvegarde...</>
            ) : (
              <><i className="fas fa-cloud-upload-alt me-1"></i> Sauvegarder</>
            )}
          </button>
        </div>
      </div>

      <CvRenderRoot data={cv} ref={renderRef} />
    </div>
  );
}
