// src/components/cv/steps/Step7Preview.tsx
// Étape 7 : choix du modèle, indicateur de complétude, aperçu temps réel du
// CV et actions (télécharger le PDF / sauvegarder en ligne).

"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
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
  const scaleWrapRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewHeight, setPreviewHeight] = useState<number>();

  // La feuille de CV a une largeur physique fixe (format A4, requis pour
  // l'export PDF). Sur mobile, cette largeur dépasse celle de l'écran : on la
  // réduit visuellement (transform: scale) sans toucher à sa taille réelle,
  // et on ajuste la hauteur du conteneur en conséquence pour ne pas laisser
  // de vide ni couper l'aperçu.
  useEffect(() => {
    const wrap = scaleWrapRef.current;
    const renderEl = renderRef.current;
    if (!wrap || !renderEl) return;

    function update() {
      if (!wrap || !renderEl) return;
      const available = wrap.clientWidth;
      const natural = renderEl.offsetWidth;
      if (!available || !natural) return;
      const nextScale = available < natural ? available / natural : 1;
      setPreviewScale(nextScale);
      setPreviewHeight(renderEl.offsetHeight * nextScale);
    }

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    ro.observe(renderEl);
    return () => ro.disconnect();
  }, [renderRef]);

  async function handleDownload() {
    setDownloading(true);
    // Le PDF doit être capturé à la taille réelle, sans la réduction visuelle
    // appliquée pour l'aperçu mobile.
    scaleWrapRef.current?.classList.add("pdf-exporting-wrap");
    try {
      await onDownloadPdf();
    } finally {
      scaleWrapRef.current?.classList.remove("pdf-exporting-wrap");
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

      <div className="cv-preview-scale-wrap" ref={scaleWrapRef} style={{ height: previewHeight }}>
        <div className="cv-preview-scale-inner" style={{ transform: `scale(${previewScale})` }}>
          <CvRenderRoot data={cv} ref={renderRef} />
        </div>
      </div>
    </div>
  );
}
