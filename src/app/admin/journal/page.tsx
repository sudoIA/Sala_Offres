// src/app/admin/journal/page.tsx
// Journal du back-office : historique des actions de l'équipe (admin_logs,
// voir src/lib/admin-log.ts) et erreurs JavaScript rencontrées par les
// visiteurs du site (client_errors, voir src/app/api/client-errors).

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Tab = "actions" | "errors";

interface LogEntry {
  id: string;
  action: string;
  target: string;
  label: string;
  email: string;
  at: Date | null;
}

interface ErrorEntry {
  id: string;
  message: string;
  stack: string;
  page: string;
  userAgent: string;
  at: Date | null;
}

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  create: { label: "Création", className: "text-bg-success" },
  publish: { label: "Publication", className: "text-bg-success" },
  update: { label: "Modification", className: "text-bg-primary" },
  delete: { label: "Suppression", className: "text-bg-danger" },
  reject: { label: "Rejet", className: "text-bg-secondary" },
  promote: { label: "Droits admin donnés", className: "text-bg-warning" },
  demote: { label: "Droits admin retirés", className: "text-bg-warning" },
  settings: { label: "Réglages", className: "text-bg-info" },
};

const TARGET_LABELS: Record<string, string> = {
  emplois: "Offre",
  emplois_import: "Import",
  events: "Événement",
  inscriptions_evenements: "Inscriptions",
  legislation: "Droit du travail",
  quiz: "Quiz",
  universites: "Université",
  entreprises: "Entreprise",
  clubs_anglais: "Club d'anglais",
  news: "Actualité",
  roles: "Utilisateur",
  settings: "Paramètres",
};

const PAGE_SIZE = 200;

function toDate(value: unknown): Date | null {
  return (value as Timestamp | undefined)?.toDate ? (value as Timestamp).toDate() : null;
}

export default function AdminJournalPage() {
  const [tab, setTab] = useState<Tab>("actions");
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [errors, setErrors] = useState<ErrorEntry[] | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    const collectionName = tab === "actions" ? "admin_logs" : "client_errors";
    getDocs(query(collection(db, collectionName), orderBy("at", "desc"), limit(PAGE_SIZE)))
      .then((snap) => {
        setFailure(null);
        if (tab === "actions") {
          setLogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LogEntry, "id" | "at">), at: toDate(d.data().at) })));
        } else {
          setErrors(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ErrorEntry, "id" | "at">), at: toDate(d.data().at) })));
        }
      })
      .catch((err) => {
        console.error("Lecture du journal impossible :", err);
        setFailure("Lecture impossible : vérifiez que les dernières règles Firestore ont bien été publiées.");
      });
  }, [tab]);

  const rows = tab === "actions" ? logs : errors;

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Journal</h1>
          <p className="admin-page-subtitle">
            Les {PAGE_SIZE} derniers évènements. Les actions sont enregistrées automatiquement et ne peuvent être ni
            modifiées ni supprimées.
          </p>
        </div>
      </div>

      <div className="sala-detail-tabs mb-3">
        <button className={`sala-detail-tab${tab === "actions" ? " active" : ""}`} onClick={() => setTab("actions")}>
          Actions de l&apos;équipe
        </button>
        <button className={`sala-detail-tab${tab === "errors" ? " active" : ""}`} onClick={() => setTab("errors")}>
          Erreurs du site
        </button>
      </div>

      {failure && <div className="alert alert-warning">{failure}</div>}
      {!failure && rows === null && (
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
        </div>
      )}
      {!failure && rows?.length === 0 && (
        <div className="admin-empty py-4 text-center text-muted">
          {tab === "actions" ? "Aucune action enregistrée pour le moment." : "Aucune erreur signalée. 🎉"}
        </div>
      )}

      {tab === "actions" && logs && logs.length > 0 && (
        <div className="admin-panel p-0" style={{ overflowX: "auto" }}>
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Administrateur</th>
                <th>Action</th>
                <th>Élément</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const action = ACTION_LABELS[log.action] || { label: log.action, className: "text-bg-light" };
                return (
                  <tr key={log.id}>
                    <td className="text-nowrap small">{log.at ? log.at.toLocaleString("fr-FR") : "-"}</td>
                    <td className="small">{log.email}</td>
                    <td>
                      <span className={`badge ${action.className}`}>{action.label}</span>
                    </td>
                    <td className="small">
                      <span className="text-muted">{TARGET_LABELS[log.target] || log.target} · </span>
                      {log.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "errors" && errors && errors.length > 0 && (
        <div className="d-flex flex-column gap-2">
          {errors.map((e) => (
            <details className="admin-panel mb-0" key={e.id}>
              <summary style={{ cursor: "pointer" }}>
                <span className="small text-muted me-2">{e.at ? e.at.toLocaleString("fr-FR") : "-"}</span>
                <code>{e.page}</code> - {e.message}
              </summary>
              <pre className="small mt-2 mb-1" style={{ whiteSpace: "pre-wrap" }}>{e.stack || "(pas de détail technique)"}</pre>
              <div className="small text-muted">{e.userAgent}</div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
