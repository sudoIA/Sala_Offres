// src/app/offres/page.tsx
// Liste des offres d'emploi avec recherche, filtres rapides, et panneau de
// détail maître-détail sur bureau (page dédiée /offres/[id] sur mobile).

"use client";

import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FabCv } from "@/components/layout/FabCv";
import { JobCard } from "@/components/JobCard";
import { JobDetailContent } from "@/components/JobDetailContent";
import { FavShareButtons } from "@/components/FavShareButtons";
import { useActiveJobs } from "@/hooks/useJobs";
import { useCompanyLogos } from "@/hooks/useCompanyLogos";
import type { Job } from "@/types/job";

type FilterType = "all" | "city" | "contract";

const CHIPS: { label: string; type: FilterType; value?: string }[] = [
  { label: "Toutes", type: "all" },
  { label: "📍 Brazzaville", type: "city", value: "Brazzaville" },
  { label: "📍 Pointe-Noire", type: "city", value: "Pointe-Noire" },
  { label: "💼 CDI", type: "contract", value: "CDI" },
  { label: "📄 CDD", type: "contract", value: "CDD" },
  { label: "🎓 Stage", type: "contract", value: "Stage" },
];

export default function OffresPage() {
  const { jobs, loading, error } = useActiveJobs();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterValue, setFilterValue] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchText =
        !term ||
        job.title?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.city?.toLowerCase().includes(term) ||
        job.contract?.toLowerCase().includes(term);

      if (!matchText) return false;

      if (filterType === "city") return !!job.city?.toLowerCase().includes(filterValue.toLowerCase());
      if (filterType === "contract") return !!job.contract?.toLowerCase().includes(filterValue.toLowerCase());
      return true;
    });
  }, [jobs, searchTerm, filterType, filterValue]);

  // Sélection automatique de la première offre sur bureau, une seule fois.
  useEffect(() => {
    if (!hasAutoSelected && filtered.length > 0) {
      setSelectedJob(filtered[0]);
      setHasAutoSelected(true);
    }
  }, [filtered, hasAutoSelected]);

  const logos = useCompanyLogos(filtered.map((j) => j.company));

  function resetFilters() {
    setSearchTerm("");
    setFilterType("all");
    setFilterValue("");
  }

  const shareUrl = selectedJob && typeof window !== "undefined" ? `${window.location.origin}/offres/${selectedJob.id}` : "";

  return (
    <div className="sala-layout-wrapper">
      <AppSidebar />

      <div className="sala-main-content">
        <AppTopbar />

        <div className="sala-master-detail-row">
          <div className="sala-master-list-col">
            <div className="sala-page-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h1 className="h3 mb-1 text-white fw-bold">Offres d&apos;emploi &amp; Stages</h1>
                  <p className="mb-0 text-white-50" style={{ fontSize: "0.95rem" }}>
                    Votre avenir professionnel commence ici en République du Congo
                  </p>
                </div>
                <span className="badge bg-white text-dark px-3 py-2 rounded-pill fw-bold">
                  <i className="fas fa-briefcase text-success me-1"></i>
                  {loading ? "Chargement..." : `${filtered.length} offre${filtered.length > 1 ? "s" : ""}`}
                </span>
              </div>

              <div className="sala-search-bar">
                <i className="fas fa-search text-muted ms-2"></i>
                <input
                  type="text"
                  placeholder="Rechercher par poste, entreprise, ville (ex: Total, Brazzaville)..."
                  aria-label="Rechercher"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="btn btn-sm text-muted" aria-label="Effacer" onClick={() => setSearchTerm("")}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="d-flex gap-2 overflow-auto pb-2 mb-3">
              {CHIPS.map((chip) => {
                const active = filterType === "all" ? chip.type === "all" : chip.value === filterValue;
                return (
                  <span
                    key={chip.label}
                    className={`filter-chip${active ? " active" : ""}`}
                    onClick={() => {
                      setFilterType(chip.type);
                      setFilterValue(chip.value || "");
                    }}
                  >
                    {chip.label}
                  </span>
                );
              })}
            </div>

            <div style={{ maxWidth: 860, margin: "0 auto" }}>
              {loading &&
                [60, 55, 70].map((w, i) => (
                  <div className="skeleton-card" key={i}>
                    <div className="skeleton-line" style={{ width: `${w}%`, height: 20 }}></div>
                    <div className="skeleton-line" style={{ width: `${w - 20}%` }}></div>
                    <div className="skeleton-line" style={{ width: `${w + 10}%` }}></div>
                  </div>
                ))}

              {!loading && error && (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i> {error}
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-5 bg-white rounded-3 p-4 shadow-sm">
                  <i className="fas fa-search fa-3x text-muted mb-3"></i>
                  <h5 className="fw-bold text-dark">Aucune offre ne correspond à votre recherche</h5>
                  <p className="text-muted mb-3">Essayez d&apos;ajuster vos mots-clés ou réinitialisez les filtres.</p>
                  <button className="btn-sala-outline btn-sm" onClick={resetFilters}>
                    Réinitialiser les filtres
                  </button>
                </div>
              )}

              {!loading &&
                !error &&
                filtered.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    interactive
                    active={selectedJob?.id === job.id}
                    onSelect={setSelectedJob}
                    logoUrl={job.company ? logos[job.company] : null}
                  />
                ))}
            </div>
          </div>

          <div className="sala-detail-pane-col">
            {selectedJob ? (
              <>
                <FavShareButtons job={selectedJob} shareUrl={shareUrl} />
                <JobDetailContent job={selectedJob} />
              </>
            ) : (
              <div className="detail-empty-state">
                {loading ? (
                  <>
                    <div className="spinner-border text-success mb-3" role="status"></div>
                    <p className="mb-0">Chargement des offres...</p>
                  </>
                ) : (
                  <>
                    <i className="fas fa-briefcase fa-2x mb-3"></i>
                    <p className="mb-0">
                      {jobs.length === 0 ? "Aucune offre disponible actuellement." : "Sélectionnez une offre pour voir le détail."}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <FabCv />
      <BottomNav />
    </div>
  );
}
