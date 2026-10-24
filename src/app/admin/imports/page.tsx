// src/app/admin/imports/page.tsx
// Écran de validation des offres collectées automatiquement (ACPE...) avant
// publication sur le site. Chaque offre importée reste en "pending" tant
// qu'un admin ne l'a pas explicitement approuvée, rejetée ou marquée doublon.

"use client";

import { useState } from "react";
import { fetchRecentJobsOnce } from "@/hooks/useAdminJobs";
import { IMPORT_SOURCES, useJobImports, type ImportedJobRecord, type ImportSourceKey } from "@/hooks/useJobImports";
import { useImportRuns } from "@/hooks/useImportRuns";
import { useAuth } from "@/context/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { CompanyTile } from "@/components/CompanyTile";
import { CustomSourcesPanel } from "@/components/admin/CustomSourcesPanel";
import { useCustomSources } from "@/hooks/useCustomSources";
import { customSourceKey } from "@/lib/custom-sources";
import { JobFormModal } from "@/components/admin/JobFormModal";
import { Pagination } from "@/components/admin/Pagination";
import { notify } from "@/lib/notify";
import { safeExternalUrl } from "@/lib/safe-url";

type Tab = "pending" | "duplicate" | "rejected" | "expired";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "pending", label: "Nouvelles", icon: "fas fa-inbox" },
  { key: "duplicate", label: "Doublons", icon: "fas fa-clone" },
  { key: "rejected", label: "Rejetées", icon: "fas fa-ban" },
  { key: "expired", label: "Expirées", icon: "fas fa-hourglass-end" },
];

function isExpired(record: ImportedJobRecord): boolean {
  if (record.status === "expired") return true;
  return record.status === "pending" && !!record.deadline && new Date(record.deadline) < new Date();
}

function matchesTab(record: ImportedJobRecord, tab: Tab): boolean {
  if (tab === "expired") return isExpired(record);
  if (tab === "pending") return record.status === "pending" && !isExpired(record);
  return record.status === tab;
}

export default function AdminImportsPage() {
  const { imports, loading, runCollection, finalizeImportApproval, rejectImport, markDuplicate } = useJobImports();
  const { runs: importRuns } = useImportRuns();
  const [tab, setTab] = useState<Tab>("pending");
  const { sources: customSources, updateSource } = useCustomSources();
  // Les sources personnalisées se configurent par un administrateur ; un modérateur les utilise.
  const { isAdmin } = useAuth();
  const [source, setSource] = useState<ImportSourceKey | string>("acpe");
  const selectedCustom = customSources.find((s) => customSourceKey(s.id) === source);

  /** Libellé lisible d'une source (intégrée ou ajoutée par l'équipe). */
  function sourceLabel(key: string): string {
    return (
      IMPORT_SOURCES.find((s) => s.key === key)?.label ||
      customSources.find((s) => customSourceKey(s.id) === key)?.name ||
      key
    );
  }
  const [sourcePage, setSourcePage] = useState(1);
  const [collecting, setCollecting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewRecord, setReviewRecord] = useState<ImportedJobRecord | null>(null);

  const filtered = imports.filter((record) => matchesTab(record, tab));
  const { pageItems, page, totalPages, setPage } = usePagination(filtered, tab);

  async function handleCollect() {
    setCollecting(true);
    try {
      const publishedJobs = await fetchRecentJobsOnce();
      const result = await runCollection(source, sourcePage, publishedJobs, selectedCustom);
      if (selectedCustom) {
        await updateSource(selectedCustom, { lastRunAt: new Date().toISOString(), lastCount: result.total, lastError: null });
      }
      notify(`${result.created} nouvelle(s) offre(s), ${result.updated} déjà connue(s) mise(s) à jour.`);
    } catch (err) {
      console.error("Erreur collecte :", err);
      if (selectedCustom) {
        await updateSource(selectedCustom, { lastRunAt: new Date().toISOString(), lastError: (err as Error).message }).catch(() => {});
      }
      notify("La collecte a échoué. Réessayez plus tard.", "error");
    } finally {
      setCollecting(false);
    }
  }

  async function handleReject(record: ImportedJobRecord) {
    setBusyId(record.id);
    try {
      await rejectImport(record.id);
      notify("Offre rejetée.");
    } catch (err) {
      console.error("Erreur rejet import :", err);
      notify("Erreur lors du rejet.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkDuplicate(record: ImportedJobRecord) {
    setBusyId(record.id);
    try {
      await markDuplicate(record.id);
      notify("Marquée comme doublon.");
    } catch (err) {
      console.error("Erreur marquage doublon :", err);
      notify("Erreur.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Imports d&apos;offres</h1>
          <p className="admin-page-subtitle">
            Offres collectées automatiquement depuis des sites externes (ACPE, Afriqueemplois.com...). Rien n&apos;est publié sans votre validation.
          </p>
        </div>
      </div>

      {importRuns.length > 0 && (
        <div className="mb-4">
          <h6 className="text-muted mb-2">
            <i className="fas fa-history me-1"></i> Historique des collectes automatiques (tâche planifiée quotidienne)
          </h6>
          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 260 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Nouvelles</th>
                  <th>Mises à jour</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {importRuns.flatMap((run) =>
                  run.results.map((r) => (
                    <tr key={`${run.id}_${r.source}`}>
                      <td>{run.ranAt ? run.ranAt.toLocaleString("fr-FR") : "-"}</td>
                      <td>{sourceLabel(r.source)}</td>
                      <td>{r.created}</td>
                      <td>{r.updated}</td>
                      <td>
                        {r.error ? (
                          <span className="text-danger" title={r.error}>
                            <i className="fas fa-exclamation-triangle me-1"></i>Échec
                          </span>
                        ) : (
                          <span className="text-success">
                            <i className="fas fa-check me-1"></i>OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdmin && <CustomSourcesPanel />}

      <div className="admin-toolbar">
        <label className="d-flex align-items-center gap-2 mb-0">
          <span className="small text-muted">Source</span>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="admin-search-input"
            style={{ width: 200 }}
          >
            {IMPORT_SOURCES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
            {customSources.length > 0 && (
              <optgroup label="Sources personnalisées">
                {customSources.map((s) => (
                  <option key={s.id} value={customSourceKey(s.id)}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        {/* Les sources personnalisées n'ont pas de pagination : seule la page indiquée est lue. */}
        <label className={`d-flex align-items-center gap-2 mb-0${selectedCustom ? " d-none" : ""}`}>
          <span className="small text-muted">Page</span>
          <input
            type="number"
            min={1}
            value={sourcePage}
            onChange={(e) => setSourcePage(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 70 }}
            className="admin-search-input"
          />
        </label>
        <button className="btn-sala-primary" onClick={handleCollect} disabled={collecting}>
          {collecting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>Collecte en cours...
            </>
          ) : (
            <>
              <i className="fas fa-cloud-download-alt me-1"></i> Lancer une collecte
            </>
          )}
        </button>
      </div>

      <div className="admin-subtabs">
        {TABS.map((t) => {
          const count = imports.filter((record) => matchesTab(record, t.key)).length;
          return (
            <button
              key={t.key}
              type="button"
              className={`admin-subtab${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <i className={t.icon}></i> {t.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="admin-card-grid">
        {loading && (
          <div className="admin-card-empty admin-empty">
            <div className="spinner-border text-success"></div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="admin-card-empty admin-empty">Aucune offre dans cette catégorie pour le moment.</div>
        )}

        {!loading &&
          pageItems.map((record) => {
            const deadline = record.deadline ? new Date(record.deadline).toLocaleDateString("fr-FR") : "Sans échéance";
            const isBusy = busyId === record.id;
            return (
              <div className="admin-card" key={record.id}>
                <div className="admin-card-top">
                  <div className="admin-row-identity">
                    <CompanyTile company={record.company} logoUrl={record.logo} />
                    <div>
                      <div className="title">{record.title}</div>
                      <div className="subtitle">{record.company || "Entreprise non précisée"}</div>
                    </div>
                  </div>
                  <span className="admin-badge">{sourceLabel(record.source).toUpperCase()}</span>
                </div>
                <div className="admin-card-meta">
                  <span><i className="fas fa-map-marker-alt"></i>{record.city || "-"}</span>
                  <span className="admin-badge">{record.contract || "-"}</span>
                  <span><i className="far fa-clock"></i>{deadline}</span>
                  {record.salary && <span><i className="fas fa-money-bill-wave"></i>{record.salary}</span>}
                </div>
                <div className="admin-card-footer">
                  <a href={safeExternalUrl(record.sourceUrl) ?? undefined} target="_blank" rel="noopener" className="text-muted small">
                    <i className="fas fa-external-link-alt me-1"></i>Voir la source
                  </a>
                  {tab === "pending" && (
                    <div className="admin-actions">
                      <button className="btn-icon btn-icon-edit" title="Voir / Modifier / Publier" disabled={isBusy} onClick={() => setReviewRecord(record)}>
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="btn-icon" title="Marquer doublon" disabled={isBusy} onClick={() => handleMarkDuplicate(record)}>
                        <i className="fas fa-clone"></i>
                      </button>
                      <button className="btn-icon btn-icon-delete" title="Rejeter" disabled={isBusy} onClick={() => handleReject(record)}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                  {tab !== "pending" && record.status !== "approved" && (
                    <div className="admin-actions">
                      <button className="btn-icon btn-icon-edit" title="Voir / Modifier / Publier quand même" disabled={isBusy} onClick={() => setReviewRecord(record)}>
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <JobFormModal
        open={!!reviewRecord}
        job={null}
        importRecord={reviewRecord}
        onApproveImport={async (jobData) => {
          if (reviewRecord) await finalizeImportApproval(reviewRecord.id, jobData);
        }}
        onClose={() => setReviewRecord(null)}
      />
    </section>
  );
}
