// src/components/cv/steps/Step2Experiences.tsx
// Étape 2 : expériences professionnelles (liste dynamique).

import type { CvExperience } from "@/types/cv";

interface Step2Props {
  experiences: CvExperience[];
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<CvExperience>) => void;
  onRemove: (index: number) => void;
}

export function Step2Experiences({ experiences, onAdd, onUpdate, onRemove }: Step2Props) {
  return (
    <div className="step-pane cv-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="h4 fw-bold mb-1 text-dark">Expériences professionnelles</h3>
          <p className="text-muted small mb-0">Stages, emplois, missions bénévoles ou alternances.</p>
        </div>
        <button type="button" className="btn-sala-outline btn-sm" onClick={onAdd}>
          <i className="fas fa-plus me-1"></i> Ajouter un poste
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="text-center py-4 text-muted bg-light rounded-3">
          <p className="mb-2">Aucune expérience ajoutée pour l&apos;instant.</p>
          <button type="button" className="btn btn-sm btn-outline-success" onClick={onAdd}>+ Ajouter ma première expérience</button>
        </div>
      ) : (
        experiences.map((exp, idx) => (
          <div className="dynamic-entry-item" key={idx}>
            <button type="button" className="btn-remove-entry" title="Supprimer" onClick={() => onRemove(idx)}>
              <i className="fas fa-trash"></i>
            </button>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Poste / Fonction</label>
                <input type="text" className="form-control" value={exp.title} placeholder="Ex: Assistant Commercial" onChange={(e) => onUpdate(idx, { title: e.target.value })} />
              </div>
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Entreprise / Organisation</label>
                <input type="text" className="form-control" value={exp.company} placeholder="Ex: TotalEnergies Congo, MTN, Boutique..." onChange={(e) => onUpdate(idx, { company: e.target.value })} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Ville</label>
                <input type="text" className="form-control" value={exp.city} placeholder="Brazzaville, Pointe-Noire..." onChange={(e) => onUpdate(idx, { city: e.target.value })} />
              </div>
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Période</label>
                <input type="text" className="form-control" value={exp.period} placeholder="Ex: Mars 2023 - Présent" onChange={(e) => onUpdate(idx, { period: e.target.value })} />
              </div>
            </div>
            <div className="mb-1">
              <label className="form-label small fw-bold">Principales réalisations &amp; missions</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder={"Une tâche ou réalisation par ligne, ex :\nGestion de la caisse et des encaissements quotidiens\nSupervision d'une équipe de 3 vendeurs\nRéduction des délais de livraison de 20%"}
                value={exp.description}
                onChange={(e) => onUpdate(idx, { description: e.target.value })}
              />
              <small className="text-muted">Astuce : une tâche par ligne (touche Entrée) pour un rendu en liste à puces sur le CV.</small>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
