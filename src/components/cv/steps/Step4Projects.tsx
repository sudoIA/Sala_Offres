// src/components/cv/steps/Step4Projects.tsx
// Étape 4 : projets & réalisations (liste dynamique, facultative).

import type { CvProject } from "@/types/cv";

interface Step4Props {
  projects: CvProject[];
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<CvProject>) => void;
  onRemove: (index: number) => void;
}

export function Step4Projects({ projects, onAdd, onUpdate, onRemove }: Step4Props) {
  return (
    <div className="step-pane cv-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="h4 fw-bold mb-1 text-dark">Projets &amp; Réalisations (Facultatif)</h3>
          <p className="text-muted small mb-0">Projets académiques, initiatives personnelles ou associatives marquantes.</p>
        </div>
        <button type="button" className="btn-sala-outline btn-sm" onClick={onAdd}>
          <i className="fas fa-plus me-1"></i> Ajouter un projet
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-4 text-muted bg-light rounded-3">
          <p className="mb-2">Aucun projet ajouté (cette section est facultative).</p>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onAdd}>+ Ajouter un projet</button>
        </div>
      ) : (
        projects.map((proj, idx) => (
          <div className="dynamic-entry-item" key={idx}>
            <button type="button" className="btn-remove-entry" title="Supprimer" onClick={() => onRemove(idx)}>
              <i className="fas fa-trash"></i>
            </button>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Nom du projet</label>
                <input
                  type="text"
                  className="form-control"
                  value={proj.name}
                  placeholder="Ex: Création d'une application mobile, Campagne de reboisement..."
                  onChange={(e) => onUpdate(idx, { name: e.target.value })}
                />
              </div>
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Rôle dans le projet</label>
                <input
                  type="text"
                  className="form-control"
                  value={proj.role}
                  placeholder="Ex: Chef de projet, Développeur, Bénévole..."
                  onChange={(e) => onUpdate(idx, { role: e.target.value })}
                />
              </div>
            </div>
            <div className="mb-1">
              <label className="form-label small fw-bold">Description / Impact</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder={"Un point par ligne, ex :\nDéveloppement d'une application de suivi des stocks\nFormation de 5 bénévoles à son utilisation"}
                value={proj.description}
                onChange={(e) => onUpdate(idx, { description: e.target.value })}
              />
              <small className="text-muted">Astuce : un point par ligne (touche Entrée) pour un rendu en liste à puces sur le CV.</small>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
