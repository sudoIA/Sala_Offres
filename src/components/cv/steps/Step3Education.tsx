// src/components/cv/steps/Step3Education.tsx
// Étape 3 : formations & diplômes (liste dynamique).

import type { CvEducation } from "@/types/cv";

interface Step3Props {
  education: CvEducation[];
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<CvEducation>) => void;
  onRemove: (index: number) => void;
}

export function Step3Education({ education, onAdd, onUpdate, onRemove }: Step3Props) {
  return (
    <div className="step-pane cv-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="h4 fw-bold mb-1 text-dark">Formations &amp; Diplômes</h3>
          <p className="text-muted small mb-0">Vos diplômes d&apos;études secondaires, universitaires ou attestations professionnelles.</p>
        </div>
        <button type="button" className="btn-sala-outline btn-sm" onClick={onAdd}>
          <i className="fas fa-plus me-1"></i> Ajouter un diplôme
        </button>
      </div>

      {education.length === 0 ? (
        <div className="text-center py-4 text-muted bg-light rounded-3">
          <p className="mb-2">Aucune formation enregistrée.</p>
          <button type="button" className="btn btn-sm btn-outline-success" onClick={onAdd}>+ Ajouter un diplôme</button>
        </div>
      ) : (
        education.map((edu, idx) => (
          <div className="dynamic-entry-item" key={idx}>
            <button type="button" className="btn-remove-entry" title="Supprimer" onClick={() => onRemove(idx)}>
              <i className="fas fa-trash"></i>
            </button>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Diplôme obtenu ou en cours</label>
                <input type="text" className="form-control" value={edu.degree} placeholder="Ex: Licence en Gestion, Baccalauréat C..." onChange={(e) => onUpdate(idx, { degree: e.target.value })} />
              </div>
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Établissement / Université</label>
                <input type="text" className="form-control" value={edu.school} placeholder="Ex: Université Marien Ngouabi, Lycée Chaminade..." onChange={(e) => onUpdate(idx, { school: e.target.value })} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Ville</label>
                <input type="text" className="form-control" value={edu.city} placeholder="Brazzaville, Pointe-Noire..." onChange={(e) => onUpdate(idx, { city: e.target.value })} />
              </div>
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Année d&apos;obtention</label>
                <input type="text" className="form-control" value={edu.year} placeholder="Ex: 2022 ou 2020 - 2023" onChange={(e) => onUpdate(idx, { year: e.target.value })} />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
