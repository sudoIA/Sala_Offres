// src/components/admin/AdminInsights.tsx
// Indicateurs d'activité du tableau de bord admin : offres publiées par
// semaine, offres les plus consultées (job_views), bilan des imports par
// source et nouveaux candidats.

"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { IMPORT_SOURCES } from "@/lib/import-sources";
import { customSourceKey } from "@/lib/custom-sources";
import type { Job } from "@/types/job";

const WEEKS = 8;
const DAY_MS = 24 * 3600 * 1000;

interface ImportStats {
  source: string;
  pending: number;
  approved: number;
  auto: number;
  rejected: number;
}

/** Lundi 00:00 de la semaine de `date`. */
function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function AdminInsights({ jobs }: { jobs: Job[] }) {
  const [topViewed, setTopViewed] = useState<{ id: string; count: number }[] | null>(null);
  const [importStats, setImportStats] = useState<ImportStats[] | null>(null);
  const [newCandidates, setNewCandidates] = useState<number | null>(null);

  useEffect(() => {
    getDocs(query(collection(db, "job_views"), orderBy("count", "desc"), limit(10)))
      .then((snap) => setTopViewed(snap.docs.map((d) => ({ id: d.id, count: Number(d.data().count) || 0 }))))
      .catch(() => setTopViewed([]));

    Promise.all([getDocs(collection(db, "emplois_import")), getDocs(collection(db, "import_sources"))])
      .then(([snap, customSnap]) => {
        const bySource = new Map<string, ImportStats>(
          IMPORT_SOURCES.map((s) => [s.key, { source: s.label, pending: 0, approved: 0, auto: 0, rejected: 0 }])
        );
        // Sources personnalisées ajoutées par l'équipe (Admin > Imports).
        customSnap.docs.forEach((d) =>
          bySource.set(customSourceKey(d.id), { source: String(d.data().name || "Source personnalisée"), pending: 0, approved: 0, auto: 0, rejected: 0 })
        );
        snap.docs.forEach((d) => {
          const data = d.data();
          const stats = bySource.get(data.source);
          if (!stats) return;
          if (data.status === "pending") stats.pending++;
          else if (data.status === "approved" && data.autoPublished) stats.auto++;
          else if (data.status === "approved") stats.approved++;
          else stats.rejected++; // rejetées, doublons, expirées
        });
        setImportStats([...bySource.values()]);
      })
      .catch(() => setImportStats([]));

    const since = Timestamp.fromMillis(Date.now() - 30 * DAY_MS);
    getCountFromServer(query(collection(db, "users"), where("createdAt", ">", since)))
      .then((snap) => setNewCandidates(snap.data().count))
      .catch(() => setNewCandidates(null));
  }, []);

  // Offres publiées par semaine, sur les WEEKS dernières semaines.
  const weekly = useMemo(() => {
    const thisWeek = startOfWeek(new Date());
    const buckets = Array.from({ length: WEEKS }, (_, i) => ({
      start: new Date(thisWeek.getTime() - (WEEKS - 1 - i) * 7 * DAY_MS),
      count: 0,
    }));
    const first = buckets[0].start.getTime();
    for (const job of jobs) {
      const t = job.timestamp?.toMillis?.();
      if (!t || t < first) continue;
      const index = Math.min(WEEKS - 1, Math.floor((t - first) / (7 * DAY_MS)));
      buckets[index].count++;
    }
    return buckets;
  }, [jobs]);
  const maxWeekly = Math.max(1, ...weekly.map((w) => w.count));
  const totalWeekly = weekly.reduce((s, w) => s + w.count, 0);

  const recentTitles = useMemo(() => new Map(jobs.map((j) => [j.id, `${j.title || "Offre"} — ${j.company || ""}`])), [jobs]);
  // Titres des offres plus anciennes que la fenêtre chargée (useAdminJobs).
  const [olderTitles, setOlderTitles] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    const missing = (topViewed || []).map((v) => v.id).filter((id) => !recentTitles.has(id));
    if (missing.length === 0) return;
    Promise.all(
      missing.map(async (id) => {
        const snap = await getDoc(doc(db, "emplois", id)).catch(() => null);
        const data = snap?.exists() ? snap.data() : null;
        return [id, data ? `${data.title || "Offre"} — ${data.company || ""}` : "Offre supprimée"] as const;
      })
    ).then((entries) => setOlderTitles(new Map(entries)));
  }, [topViewed, recentTitles]);
  const titles = useMemo(() => new Map([...olderTitles, ...recentTitles]), [olderTitles, recentTitles]);

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fefce8", color: "#b45309" }}>
            <i className="fas fa-user-plus"></i>
          </div>
          <div>
            <div className="stat-value">{newCandidates ?? "—"}</div>
            <div className="stat-label">Nouveaux candidats (30 derniers jours)</div>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <h2>Offres publiées par semaine</h2>
        <p className="admin-page-subtitle mb-3">
          {totalWeekly} offre{totalWeekly > 1 ? "s" : ""} publiée{totalWeekly > 1 ? "s" : ""} sur les {WEEKS} dernières semaines.
        </p>
        <div className="insight-bars" role="img" aria-label={`Offres publiées par semaine : ${weekly.map((w) => w.count).join(", ")}`}>
          {weekly.map((w) => {
            const label = `Semaine du ${w.start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
            return (
              <div className="insight-bar-col" key={w.start.getTime()} tabIndex={0} data-tip={`${label} : ${w.count} offre${w.count > 1 ? "s" : ""}`}>
                <div className="insight-bar-track">
                  <div className="insight-bar" style={{ height: `${(w.count / maxWeekly) * 100}%` }}></div>
                </div>
                <span className="insight-bar-label">{w.start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              </div>
            );
          })}
        </div>
        <details className="mt-2 small">
          <summary className="text-muted" style={{ cursor: "pointer" }}>Voir les chiffres</summary>
          <table className="table table-sm mt-2 mb-0">
            <tbody>
              {weekly.map((w) => (
                <tr key={w.start.getTime()}>
                  <td>Semaine du {w.start.toLocaleDateString("fr-FR")}</td>
                  <td className="text-end">{w.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>

      <div className="admin-panel">
        <h2>Offres les plus consultées</h2>
        {topViewed === null && <div className="spinner-border spinner-border-sm text-success"></div>}
        {topViewed?.length === 0 && <p className="text-muted small mb-0">Pas encore de consultation enregistrée.</p>}
        {topViewed && topViewed.length > 0 && (
          <ol className="insight-ranking mb-0">
            {topViewed.map((v) => (
              <li key={v.id}>
                <span className="insight-ranking-title">{titles.get(v.id) || "Offre supprimée"}</span>
                <span className="insight-ranking-value">{v.count} vue{v.count > 1 ? "s" : ""}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="admin-panel">
        <h2>Imports par source</h2>
        {importStats === null && <div className="spinner-border spinner-border-sm text-success"></div>}
        {importStats && (
          <div style={{ overflowX: "auto" }}>
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Source</th>
                  <th className="text-end">En attente</th>
                  <th className="text-end">Publiées (relues)</th>
                  <th className="text-end">Publiées (auto)</th>
                  <th className="text-end">Rejetées / doublons</th>
                </tr>
              </thead>
              <tbody>
                {importStats.map((s) => (
                  <tr key={s.source}>
                    <td>{s.source}</td>
                    <td className="text-end">{s.pending}</td>
                    <td className="text-end">{s.approved}</td>
                    <td className="text-end">{s.auto}</td>
                    <td className="text-end">{s.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
