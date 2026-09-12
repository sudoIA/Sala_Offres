// src/components/cv/steps/Step6Languages.tsx
// Étape 6 : langues maîtrisées (liste dynamique).

import type { CvLanguage } from "@/types/cv";

const LEVELS = ["Langue maternelle", "Courant", "Intermédiaire", "Notions de base"];

interface Step6Props {
  languages: CvLanguage[];
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<CvLanguage>) => void;
  onRemove: (index: number) => void;
}

export function Step6Languages({ languages, onAdd, onUpdate, onRemove }: Step6Props) {
  return (
    <div className="step-pane cv-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="h4 fw-bold mb-1">Langues maîtrisées</h3>
          <p className="text-muted small mb-0">Langues nationales et internationales avec votre niveau de maîtrise.</p>
        </div>
        <button type="button" className="btn-sala-outline btn-sm" onClick={onAdd}>
          <i className="fas fa-plus me-1"></i> Ajouter une langue
        </button>
      </div>

      {languages.map((lang, idx) => (
        <div className="dynamic-entry-item" key={idx}>
          <button type="button" className="btn-remove-entry" title="Supprimer" onClick={() => onRemove(idx)}>
            <i className="fas fa-trash"></i>
          </button>
          <div className="row">
            <div className="col-md-6 mb-2">
              <label className="form-label small fw-bold">Langue</label>
              <input
                type="text"
                className="form-control"
                value={lang.name}
                placeholder="Ex: Français, Anglais, Lingala, Kituba..."
                onChange={(e) => onUpdate(idx, { name: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-2">
              <label className="form-label small fw-bold">Niveau</label>
              <select className="form-select" value={lang.level} onChange={(e) => onUpdate(idx, { level: e.target.value })}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l === "Courant" ? "Courant / Professionnel" : l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
