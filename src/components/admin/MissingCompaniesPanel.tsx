// src/components/admin/MissingCompaniesPanel.tsx
// Admin > Annuaires > Entreprises : entreprises qui ont des offres en cours
// mais aucune fiche dans l'annuaire (rapprochement par nom, voir
// company-match.ts). Sans fiche, leurs offres n'ont ni logo ni page
// entreprise ; un clic ouvre une nouvelle fiche pré-remplie depuis l'offre.

"use client";

import { useMemo } from "react";
import { useAdminJobs } from "@/hooks/useAdminJobs";
import { matchesCompanyItem } from "@/lib/company-match";
import type { AnnuaireItem } from "@/types/annuaire";
import type { Job } from "@/types/job";

export interface MissingCompany {
  name: string;
  jobs: Job[];
}

interface MissingCompaniesPanelProps {
  companies: AnnuaireItem[];
  onCreate: (company: MissingCompany) => void;
}

export function MissingCompaniesPanel({ companies, onCreate }: MissingCompaniesPanelProps) {
  const { jobs, loading } = useAdminJobs();

  const missing = useMemo(() => {
    const now = new Date();
    const groups = new Map<string, MissingCompany>();
    for (const job of jobs) {
      const name = (job.company || "").trim();
      if (!name || job.visibility === false || (job.deadlineDate && job.deadlineDate <= now)) continue;
      if (companies.some((c) => matchesCompanyItem(name, c))) continue;
      const key = name.toLocaleLowerCase("fr");
      const group = groups.get(key) || { name, jobs: [] };
      group.jobs.push(job);
      groups.set(key, group);
    }
    return [...groups.values()].sort((a, b) => b.jobs.length - a.jobs.length || a.name.localeCompare(b.name, "fr"));
  }, [jobs, companies]);

  if (loading || missing.length === 0) return null;

  return (
    <div className="admin-panel">
      <h2><i className="fas fa-building me-2"></i>Recruteurs sans fiche ({missing.length})</h2>
      <p className="admin-page-subtitle mb-3">
        Ces entreprises ont des offres en cours mais pas de fiche : leurs offres s&apos;affichent sans logo ni page entreprise. Créez la fiche, ou
        ajoutez ce nom dans les « Autres noms » d&apos;une fiche existante si c&apos;est la même entreprise (ex : Congolaise de Microfinance pour COMIFI).
      </p>
      <ul className="list-unstyled mb-0 d-grid gap-2">
        {missing.map((m) => (
          <li key={m.name} className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
            <span>
              <strong>{m.name}</strong> <span className="text-muted small">- {m.jobs.length} offre{m.jobs.length > 1 ? "s" : ""} en cours</span>
            </span>
            <button className="btn btn-sm btn-sala-outline rounded-pill" onClick={() => onCreate(m)}>
              <i className="fas fa-plus me-1"></i> Créer la fiche
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
