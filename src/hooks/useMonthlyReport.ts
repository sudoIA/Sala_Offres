// src/hooks/useMonthlyReport.ts
// Chiffres du rapport mensuel d'activité (Admin > Rapport mensuel), lus
// dans Firestore pour un mois donné et comparés au mois précédent.
// Requêtes simples sur un seul champ de date : aucun index à créer.

"use client";

import { useEffect, useState } from "react";
import { collection, doc, getCountFromServer, getDoc, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { lastMonths, monthRange, shiftMonth, topCounts, type RankedItem } from "@/lib/monthly-report";

export interface MonthTraffic {
  visits: number | null;
  jobViews: number | null;
  quizzes: number | null;
}

export interface MonthlyReport {
  month: string;
  jobs: { published: number; previous: number; companies: RankedItem[]; cities: RankedItem[]; contracts: RankedItem[] };
  imports: { collected: number; published: number; pending: number; discarded: number };
  runs: { total: number; withErrors: number };
  candidates: { current: number; previous: number };
  traffic: MonthTraffic;
  previousTraffic: MonthTraffic;
  events: { title: string; date: Date | null; city: string }[];
  news: number;
  /** 6 derniers mois, du plus ancien au plus récent. */
  trend: { month: string; jobs: number; visits: number | null }[];
}

function between(field: string, key: string) {
  const { start, end } = monthRange(key);
  return [where(field, ">=", Timestamp.fromDate(start)), where(field, "<", Timestamp.fromDate(end))];
}

async function countBetween(col: string, field: string, key: string): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, col), ...between(field, key)));
  return snap.data().count;
}

/** Compteurs anonymes du mois (stats_monthly, voir site-stats.ts) ; null si rien n'a été compté. */
async function readTraffic(key: string): Promise<MonthTraffic> {
  const snap = await getDoc(doc(db, "stats_monthly", key));
  const data = snap.exists() ? snap.data() : null;
  const num = (v: unknown) => (data ? Number(v) || 0 : null);
  return { visits: num(data?.visits), jobViews: num(data?.jobViews), quizzes: num(data?.quizzes) };
}

export async function loadMonthlyReport(month: string): Promise<MonthlyReport> {
  const previous = shiftMonth(month, -1);
  const { start, end } = monthRange(month);
  const trendMonths = lastMonths(month, 6);

  const [jobsSnap, prevJobs, importsSnap, runsSnap, candidates, prevCandidates, traffic, previousTraffic, eventsSnap, newsSnap, trendJobs, trendTraffic] =
    await Promise.all([
      getDocs(query(collection(db, "emplois"), ...between("timestamp", month))),
      countBetween("emplois", "timestamp", previous),
      // importedAt est une date ISO (texte) : la comparaison de textes suit l'ordre chronologique.
      getDocs(query(collection(db, "emplois_import"), where("importedAt", ">=", start.toISOString()), where("importedAt", "<", end.toISOString()))),
      getDocs(query(collection(db, "import_runs"), ...between("ranAt", month))),
      countBetween("users", "createdAt", month),
      countBetween("users", "createdAt", previous),
      readTraffic(month),
      readTraffic(previous),
      getDocs(query(collection(db, "events"), ...between("deadline", month))),
      getDocs(query(collection(db, "news"), ...between("publishedAt", month))),
      Promise.all(trendMonths.map((m) => countBetween("emplois", "timestamp", m))),
      Promise.all(trendMonths.map(readTraffic)),
    ]);

  const jobs = jobsSnap.docs.map((d) => d.data());
  const imports = importsSnap.docs.map((d) => String(d.data().status || ""));

  return {
    month,
    jobs: {
      published: jobs.length,
      previous: prevJobs,
      companies: topCounts(jobs.map((j) => j.company)),
      cities: topCounts(jobs.map((j) => j.city)),
      contracts: topCounts(jobs.map((j) => j.contract)),
    },
    imports: {
      collected: imports.length,
      published: imports.filter((s) => s === "approved").length,
      pending: imports.filter((s) => s === "pending").length,
      discarded: imports.filter((s) => s !== "approved" && s !== "pending").length,
    },
    runs: {
      total: runsSnap.size,
      withErrors: runsSnap.docs.filter((d) => ((d.data().results as { error?: string | null }[]) || []).some((r) => r.error)).length,
    },
    candidates: { current: candidates, previous: prevCandidates },
    traffic,
    previousTraffic,
    events: eventsSnap.docs
      .map((d) => {
        const data = d.data();
        return { title: String(data.title || "Événement"), date: data.deadline?.toDate ? data.deadline.toDate() : null, city: String(data.city || "") };
      })
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0)),
    news: newsSnap.docs.filter((d) => d.data().visibility === true).length,
    trend: trendMonths.map((m, i) => ({ month: m, jobs: trendJobs[i], visits: trendTraffic[i].visits })),
  };
}

export function useMonthlyReport(month: string) {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setError(null);
    loadMonthlyReport(month)
      .then((r) => {
        if (!cancelled) setReport(r);
      })
      .catch((err) => {
        console.error("Erreur rapport mensuel :", err);
        if (!cancelled) setError("Impossible de calculer le rapport pour le moment.");
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  return { report, error };
}
