// src/app/admin/offres/page.tsx
// Grille de cartes pour gérer les offres d'emploi (collection "emplois").

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ADMIN_RECENT_DAYS, useAdminJobs } from "@/hooks/useAdminJobs";
import { usePagination } from "@/hooks/usePagination";
import { CompanyTile } from "@/components/CompanyTile";
import { JobFormModal } from "@/components/admin/JobFormModal";
import { Pagination } from "@/components/admin/Pagination";
import { confirmDelete, notify } from "@/lib/notify";
import type { Job } from "@/types/job";
import { logAdminAction } from "@/lib/admin-log";

export default function AdminJobsPage() {
  const [fullHistory, setFullHistory] = useState(false);
  const { jobs, loading } = useAdminJobs(fullHistory);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingJob(null);
      setModalOpen(true);
      router.replace("/admin/offres");
    }
  }, [searchParams, router]);

  const term = search.trim().toLowerCase();
  const filtered = jobs.filter(
    (job) => !term || [job.title, job.company, job.city].some((v) => (v || "").toLowerCase().includes(term))
  );
  const { pageItems, page, totalPages, setPage } = usePagination(filtered, term);

  async function toggleVisibility(job: Job, visible: boolean) {
    try {
      await updateDoc(doc(db, "emplois", job.id), { visibility: visible });
      await logAdminAction("update", "emplois", `${job.title || "Offre"} — ${visible ? "rendue visible" : "masquée"}`, job.id);
    } catch (err) {
      console.error("Erreur mise à jour visibilité :", err);
      notify("Impossible de mettre à jour la visibilité.", "error");
    }
  }

  async function handleDelete(job: Job) {
    if (await confirmDelete(job.title || "cette offre")) {
      try {
        await deleteDoc(doc(db, "emplois", job.id));
        await logAdminAction("delete", "emplois", job.title || "Offre", job.id);
        notify("Offre supprimée.");
      } catch (err) {
        console.error("Erreur suppression offre :", err);
        notify("Erreur lors de la suppression.", "error");
      }
    }
  }

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Offres d&apos;emploi</h1>
          <p className="admin-page-subtitle">
            Publiez, modifiez ou masquez les offres visibles sur le site.{" "}
            {fullHistory ? (
              <>Tout l&apos;historique est affiché.</>
            ) : (
              <>
                Offres publiées ces {Math.round(ADMIN_RECENT_DAYS / 30)} derniers mois.{" "}
                <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => setFullHistory(true)}>
                  Afficher tout l&apos;historique (plus lent)
                </button>
              </>
            )}
          </p>
        </div>
        <button
          className="btn-sala-primary"
          onClick={() => {
            setEditingJob(null);
            setModalOpen(true);
          }}
        >
          <i className="fas fa-plus me-1"></i> Nouvelle offre
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Rechercher par titre, entreprise, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card-grid">
        {loading && (
          <div className="admin-card-empty admin-empty">
            <div className="spinner-border text-success"></div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="admin-card-empty admin-empty">
            {jobs.length === 0 ? "Aucune offre publiée pour le moment." : "Aucune offre ne correspond à votre recherche."}
          </div>
        )}

        {!loading &&
          pageItems.map((job) => {
            const deadline = job.deadlineDate ? job.deadlineDate.toLocaleDateString("fr-FR") : "Sans échéance";
            // Une offre dont la date limite est passée disparaît d'elle-même du
            // site public (voir useActiveJobs) : on le signale ici.
            const expired = !!job.deadlineDate && job.deadlineDate <= new Date();
            return (
              <div className="admin-card" key={job.id}>
                <div className="admin-card-top">
                  <div className="admin-row-identity">
                    <CompanyTile company={job.company} />
                    <div>
                      <div className="title">{job.title || "Offre sans titre"}</div>
                      <div className="subtitle">{job.company || "Entreprise non précisée"}</div>
                    </div>
                  </div>
                  <label className="admin-switch" title="Visible publiquement">
                    <input
                      type="checkbox"
                      checked={!!job.visibility}
                      onChange={(e) => toggleVisibility(job, e.target.checked)}
                    />
                    <span></span>
                  </label>
                </div>
                <div className="admin-card-meta">
                  <span><i className="fas fa-map-marker-alt"></i>{job.city || "—"}</span>
                  <span className="admin-badge">{job.contract || "—"}</span>
                  <span><i className="far fa-clock"></i>{deadline}</span>
                </div>
                <div className="admin-card-footer">
                  <span className="text-muted small">
                    {expired ? (
                      <span className="text-danger"><i className="fas fa-hourglass-end me-1"></i>Expirée (retirée du site)</span>
                    ) : job.visibility ? (
                      "Publiée"
                    ) : (
                      "Masquée"
                    )}
                  </span>
                  <div className="admin-actions">
                    <button
                      className="btn-icon btn-icon-edit"
                      title="Modifier"
                      onClick={() => {
                        setEditingJob(job);
                        setModalOpen(true);
                      }}
                    >
                      <i className="fas fa-pen"></i>
                    </button>
                    <button className="btn-icon btn-icon-delete" title="Supprimer" onClick={() => handleDelete(job)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <JobFormModal open={modalOpen} job={editingJob} onClose={() => setModalOpen(false)} />
    </section>
  );
}
