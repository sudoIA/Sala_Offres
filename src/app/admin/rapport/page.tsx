// src/app/admin/rapport/page.tsx
// Rapport mensuel d'activité, à partager avec les partenaires de l'ONG :
// offres publiées, candidats inscrits, audience du site, collecte
// automatique, événements et News. Imprimable (ou enregistrable en PDF) et
// téléchargeable en CSV (Excel).

"use client";

import { useMemo, useState } from "react";
import { useMonthlyReport, type MonthlyReport } from "@/hooks/useMonthlyReport";
import { delta, lastMonths, monthLabel, monthShortLabel, toCsv, type RankedItem } from "@/lib/monthly-report";
import { monthKey } from "@/lib/site-stats";

const MONTH_CHOICES = 12;

function Kpi({ icon, color, value, label, previous }: { icon: string; color: { bg: string; fg: string }; value: number | null; label: string; previous: number | null }) {
  const d = delta(value, previous);
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color.bg, color: color.fg }}>
        <i className={icon}></i>
      </div>
      <div>
        <div className="stat-value">{value ?? "-"}</div>
        <div className="stat-label">{label}</div>
        {d && (
          <div className={`report-delta report-delta-${d.trend}`}>
            <i className={`fas ${d.trend === "up" ? "fa-arrow-up" : d.trend === "down" ? "fa-arrow-down" : "fa-equals"} me-1`} aria-hidden="true"></i>
            {d.text} <span className="text-muted">vs mois précédent ({previous})</span>
          </div>
        )}
        {value === null && <div className="report-delta text-muted">Pas encore mesuré ce mois-ci</div>}
      </div>
    </div>
  );
}

function MonthBars({ title, unit, points }: { title: string; unit: string; points: { month: string; value: number | null }[] }) {
  const max = Math.max(1, ...points.map((p) => p.value || 0));
  return (
    <div className="col-md-6">
      <h3 className="h6 fw-bold mb-3">{title}</h3>
      <div className="insight-bars" role="img" aria-label={`${title} : ${points.map((p) => `${monthLabel(p.month)} ${p.value ?? "non mesuré"}`).join(", ")}`}>
        {points.map((p) => (
          <div className="insight-bar-col" key={p.month} tabIndex={0} data-tip={`${monthLabel(p.month)} : ${p.value === null ? "non mesuré" : `${p.value} ${unit}`}`}>
            <div className="insight-bar-track">
              {p.value !== null && <div className="insight-bar" style={{ height: `${(p.value / max) * 100}%` }}></div>}
            </div>
            <span className="insight-bar-label">{monthShortLabel(p.month)}</span>
          </div>
        ))}
      </div>
      <details className="mt-2 small">
        <summary className="text-muted" style={{ cursor: "pointer" }}>Voir les chiffres</summary>
        <table className="table table-sm mt-2 mb-0">
          <tbody>
            {points.map((p) => (
              <tr key={p.month}>
                <td>{monthLabel(p.month)}</td>
                <td className="text-end">{p.value ?? "non mesuré"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function Ranking({ title, items }: { title: string; items: RankedItem[] }) {
  return (
    <div className="col-md-4">
      <h3 className="h6 fw-bold mb-2">{title}</h3>
      {items.length === 0 ? (
        <p className="small text-muted mb-0">Aucune donnée.</p>
      ) : (
        <ol className="insight-ranking mb-0">
          {items.map((it) => (
            <li key={it.label}>
              <span className="insight-ranking-title">{it.label}</span>
              <span className="insight-ranking-value">{it.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function csvFor(r: MonthlyReport): string {
  return toCsv([
    ["Offres publiées", r.jobs.published, r.jobs.previous],
    ["Nouveaux candidats inscrits", r.candidates.current, r.candidates.previous],
    ["Visites du site", r.traffic.visits, r.previousTraffic.visits],
    ["Consultations d'offres", r.traffic.jobViews, r.previousTraffic.jobViews],
    ["Quiz terminés", r.traffic.quizzes, r.previousTraffic.quizzes],
    ["Offres collectées automatiquement", r.imports.collected, null],
    ["dont publiées", r.imports.published, null],
    ["dont en attente de relecture", r.imports.pending, null],
    ["Collectes automatiques lancées", r.runs.total, null],
    ["dont avec une erreur", r.runs.withErrors, null],
    ["Événements du mois", r.events.length, null],
    ["Articles News publiés", r.news, null],
    ...r.jobs.companies.map((c): [string, number, null] => [`Entreprise : ${c.label}`, c.count, null]),
  ]);
}

export default function AdminReportPage() {
  const currentMonth = monthKey();
  const [month, setMonth] = useState(currentMonth);
  const { report, error } = useMonthlyReport(month);
  const choices = useMemo(() => lastMonths(currentMonth, MONTH_CHOICES).reverse(), [currentMonth]);
  const generatedAt = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  function downloadCsv() {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([csvFor(report)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sala-rapport-${report.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="report-page">
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Rapport d&apos;activité - {monthLabel(month)}</h1>
          <p className="admin-page-subtitle">
            Plateforme Sala (ongsala.com) - édité le {generatedAt}{month === currentMonth ? " (mois en cours, chiffres provisoires)" : ""}.
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap no-print">
          <select className="form-select form-select-sm" style={{ width: "auto" }} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Mois du rapport">
            {choices.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
          <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={downloadCsv} disabled={!report}>
            <i className="fas fa-file-excel me-1"></i> Excel (CSV)
          </button>
          <button className="btn-sala-primary btn-sm" onClick={() => window.print()} disabled={!report}>
            <i className="fas fa-print me-1"></i> Imprimer / PDF
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {!report && !error && (
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="text-muted mt-2">Calcul du rapport...</p>
        </div>
      )}

      {report && (
        <>
          <div className="stat-grid">
            <Kpi icon="fas fa-briefcase" color={{ bg: "var(--sala-green-light)", fg: "var(--sala-green-dark)" }} value={report.jobs.published} previous={report.jobs.previous} label="Offres publiées" />
            <Kpi icon="fas fa-user-plus" color={{ bg: "#fefce8", fg: "#b45309" }} value={report.candidates.current} previous={report.candidates.previous} label="Nouveaux candidats inscrits" />
            <Kpi icon="fas fa-globe-africa" color={{ bg: "#e0f2fe", fg: "#0284c7" }} value={report.traffic.visits} previous={report.previousTraffic.visits} label="Visites du site" />
            <Kpi icon="fas fa-eye" color={{ bg: "#f3e8ff", fg: "#7e22ce" }} value={report.traffic.jobViews} previous={report.previousTraffic.jobViews} label="Consultations d'offres" />
            <Kpi icon="fas fa-award" color={{ bg: "#ffe4e6", fg: "#be123c" }} value={report.traffic.quizzes} previous={report.previousTraffic.quizzes} label="Quiz terminés" />
          </div>

          <div className="admin-panel">
            <h2>Évolution sur 6 mois</h2>
            <div className="row g-4">
              <MonthBars title="Offres publiées" unit="offre(s)" points={report.trend.map((t) => ({ month: t.month, value: t.jobs }))} />
              <MonthBars title="Visites du site" unit="visite(s)" points={report.trend.map((t) => ({ month: t.month, value: t.visits }))} />
            </div>
            <p className="small text-muted mt-3 mb-0">
              Visites, consultations et quiz : comptage anonyme (une visite par session, robots exclus), en place depuis le 24 octobre 2026.
            </p>
          </div>

          <div className="admin-panel">
            <h2>Offres publiées ce mois-ci</h2>
            <div className="row g-4">
              <Ranking title="Entreprises qui recrutent" items={report.jobs.companies} />
              <Ranking title="Villes" items={report.jobs.cities} />
              <Ranking title="Types de contrat" items={report.jobs.contracts} />
            </div>
          </div>

          <div className="admin-panel">
            <h2>Collecte automatique des offres</h2>
            <table className="table table-sm align-middle mb-0">
              <tbody>
                <tr><td>Offres trouvées sur les sites partenaires</td><td className="text-end fw-bold">{report.imports.collected}</td></tr>
                <tr><td>dont publiées sur Sala</td><td className="text-end">{report.imports.published}</td></tr>
                <tr><td>dont en attente de relecture</td><td className="text-end">{report.imports.pending}</td></tr>
                <tr><td>dont écartées (doublons, expirées, refusées)</td><td className="text-end">{report.imports.discarded}</td></tr>
                <tr><td>Collectes quotidiennes lancées</td><td className="text-end">{report.runs.total}</td></tr>
                <tr>
                  <td>dont avec au moins une erreur</td>
                  <td className={`text-end${report.runs.withErrors ? " text-danger fw-bold" : ""}`}>{report.runs.withErrors}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="admin-panel">
            <h2>Événements et News</h2>
            {report.events.length === 0 ? (
              <p className="small text-muted">Aucun événement ce mois-ci.</p>
            ) : (
              <ul className="small mb-3">
                {report.events.map((e, i) => (
                  <li key={i}>
                    <strong>{e.title}</strong>
                    {e.date ? ` - ${e.date.toLocaleDateString("fr-FR")}` : ""}
                    {e.city ? ` (${e.city})` : ""}
                  </li>
                ))}
              </ul>
            )}
            <p className="small mb-0">Articles News Sala publiés : <strong>{report.news}</strong></p>
          </div>
        </>
      )}
    </section>
  );
}
