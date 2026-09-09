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
import { Pagination } from "@/components/admin/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { useActiveJobs } from "@/hooks/useJobs";
import { useCompanyLogos } from "@/hooks/useCompanyLogos";
import { formatRelativeTime } from "@/lib/job-helpers";
import type { Job } from "@/types/job";

export default function OffresPage() {
  const { jobs, loading, error, lastUpdated, offline, refreshing, refresh } = useActiveJobs();
  // Force un nouveau rendu régulier pour garder "il y a X min" à jour.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return jobs;
    return jobs.filter(
      (job) =>
        job.title?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.city?.toLowerCase().includes(term) ||
        job.contract?.toLowerCase().includes(term)
    );
  }, [jobs, searchTerm]);

  const { pageItems, page, totalPages, setPage } = usePagination(filtered, searchTerm.trim().toLowerCase());

  // Sélection automatique de la première offre sur bureau, une seule fois.
  useEffect(() => {
    if (!hasAutoSelected && filtered.length > 0) {
      setSelectedJob(filtered[0]);
      setHasAutoSelected(true);
    }
  }, [filtered, hasAutoSelected]);

  const logos = useCompanyLogos(pageItems.map((j) => j.company));

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

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <span className="small text-muted">
                {offline ? (
                  <>
                    <i className="fas fa-exclamation-triangle text-warning me-1"></i> Hors-ligne — dernières offres enregistrées
                  </>
                ) : lastUpdated ? (
                  <>
                    <i className="fas fa-check-circle text-success me-1"></i> Mise à jour {formatRelativeTime(lastUpdated)}
                  </>
                ) : null}
              </span>
              <button type="button" className="btn btn-sm btn-light border" onClick={refresh} disabled={refreshing}>
                <i className={`fas fa-sync-alt me-1${refreshing ? " fa-spin" : ""}`}></i> Actualiser
              </button>
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
                  <p className="text-muted mb-3">Essayez d&apos;ajuster vos mots-clés de recherche.</p>
                  <button className="btn-sala-outline btn-sm" onClick={() => setSearchTerm("")}>
                    Réinitialiser la recherche
                  </button>
                </div>
              )}

              {!loading &&
                !error &&
                pageItems.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    interactive
                    active={selectedJob?.id === job.id}
                    onSelect={setSelectedJob}
                    logoUrl={job.company ? logos[job.company] : null}
                  />
                ))}

              {!loading && !error && filtered.length > 0 && (
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              )}
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
