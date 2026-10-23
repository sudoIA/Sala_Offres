// src/app/api/cron/collect-jobs/route.ts
// Déclenché automatiquement chaque jour par Vercel Cron (voir vercel.json à
// la racine). Contrairement à l'écran admin "Imports" (src/app/admin/imports)
// qui écrit dans Firestore depuis le navigateur d'un admin déjà connecté,
// personne n'est connecté quand cette tâche s'exécute : elle utilise donc le
// SDK Admin (@/lib/firebase-admin), qui n'est jamais soumis aux règles de
// sécurité Firestore. Chaque exécution est journalisée dans "import_runs"
// pour rester visible dans l'écran admin (suivi des erreurs).
//
// Deux étapes s'ajoutent à la collecte :
// - publication automatique des offres des sources "de confiance" cochées
//   dans Admin > Paramètres (settings/imports.autoPublishSources) — les
//   autres restent en attente de relecture manuelle comme avant ;
// - collecte des sources personnalisées ajoutées par l'équipe et cochées
//   « collecte quotidienne » (collection "import_sources", collecteur
//   générique) — jamais publiées automatiquement ;
// - envoi des alertes emploi aux candidats abonnés (voir alert-emails.ts).
//
// Sécurité : seul Vercel Cron doit pouvoir déclencher cette route. Vercel
// ajoute automatiquement l'en-tête "Authorization: Bearer <CRON_SECRET>"
// quand la variable d'environnement CRON_SECRET est définie sur le projet —
// toute autre requête est refusée, pour ne pas exposer une route publique
// qui interroge des sites tiers à la demande de n'importe qui.

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { collectAcpePage, enrichAcpeJob } from "@/lib/collectors/acpe";
import { collectAfriqueemploisPage } from "@/lib/collectors/afriqueemplois";
import { collectLesOpportunitesPage } from "@/lib/collectors/lesopportunites";
import { collectGenericSource } from "@/lib/collectors/generic";
import { customSourceKey, type CustomSourceConfig } from "@/lib/custom-sources";
import { sleep } from "@/lib/collectors/shared";
import { sendJobAlertDigests, type AlertRunResult } from "@/lib/alert-emails";
import { DEDUPE_WINDOW_DAYS, buildImportDocId, findDuplicatePublishedJob, importToJobData, stripUndefined } from "@/lib/job-import-helpers";
import { IMPORT_SOURCES, type ImportSourceKey } from "@/lib/import-sources";
import type { ImportedJob } from "@/types/job-import";
import type { Job } from "@/types/job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SourceRunResult {
  /** Clé intégrée (ImportSourceKey) ou "custom_<id>" pour une source personnalisée. */
  source: string;
  created: number;
  updated: number;
  autoPublished: number;
  total: number;
  error: string | null;
}

async function collectSource(source: ImportSourceKey): Promise<ImportedJob[]> {
  if (source === "acpe") {
    const { jobs } = await collectAcpePage(1);
    const enriched: ImportedJob[] = [];
    for (const job of jobs) {
      enriched.push(await enrichAcpeJob(job));
      await sleep(300);
    }
    return enriched;
  }
  if (source === "afriqueemplois") {
    return (await collectAfriqueemploisPage(1)).jobs;
  }
  return (await collectLesOpportunitesPage(1)).jobs;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }

  let db;
  try {
    db = getAdminDb();
  } catch (err) {
    console.error("Firebase Admin mal configuré :", err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }

  // Offres publiées récemment seulement (voir DEDUPE_WINDOW_DAYS).
  const since = new Date(Date.now() - DEDUPE_WINDOW_DAYS * 24 * 3600 * 1000);
  const publishedSnap = await db.collection("emplois").where("timestamp", ">", since).get();
  const published: Job[] = publishedSnap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, company: data.company, title: data.title, city: data.city, deadlineDate: null };
  });

  const results: SourceRunResult[] = [];

  const importSettings = (await db.collection("settings").doc("imports").get()).data();
  const autoPublishSources = new Set<string>(
    Array.isArray(importSettings?.autoPublishSources) ? importSettings.autoPublishSources : []
  );

  // Sources intégrées, puis sources personnalisées actives.
  const tasks: { source: string; customId?: string; collect: () => Promise<ImportedJob[]> }[] = IMPORT_SOURCES.map(({ key }) => ({
    source: key,
    collect: () => collectSource(key),
  }));
  const customSnap = await db.collection("import_sources").where("enabled", "==", true).get();
  for (const d of customSnap.docs) {
    const cfg = d.data() as CustomSourceConfig;
    const key = customSourceKey(d.id);
    tasks.push({ source: key, customId: d.id, collect: async () => (await collectGenericSource(key, cfg)).jobs });
  }

  for (const { source, customId, collect } of tasks) {
    let created = 0;
    let updated = 0;
    let autoPublished = 0;
    let total = 0;
    let error: string | null = null;
    try {
      const jobs = await collect();
      total = jobs.length;
      for (const job of jobs) {
        const id = buildImportDocId(job.source, job.sourceId);
        const ref = db.collection("emplois_import").doc(id);
        const existing = await ref.get();
        if (existing.exists) {
          await ref.update({ lastCheckedAt: new Date().toISOString() });
          updated++;
        } else {
          const duplicate = findDuplicatePublishedJob(job, published);
          let publishedJobId: string | undefined;
          if (!duplicate && autoPublishSources.has(source)) {
            const jobRef = await db.collection("emplois").add(importToJobData(job, new Date()));
            publishedJobId = jobRef.id;
            autoPublished++;
          }
          await ref.set(
            stripUndefined({
              ...job,
              status: duplicate ? "duplicate" : publishedJobId ? "approved" : "pending",
              duplicateOf: duplicate?.id,
              publishedJobId,
              autoPublished: publishedJobId ? true : undefined,
              lastCheckedAt: job.importedAt,
            })
          );
          created++;
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      console.error(`Collecte automatique "${source}" en échec :`, err);
    }
    results.push({ source, created, updated, autoPublished, total, error });
    if (customId) {
      await db
        .collection("import_sources")
        .doc(customId)
        .update({ lastRunAt: new Date().toISOString(), lastCount: total, lastError: error })
        .catch((err) => console.warn("Suivi de la source personnalisée non mis à jour :", err));
    }
  }

  let alerts: AlertRunResult | { error: string };
  try {
    alerts = await sendJobAlertDigests(db);
  } catch (err) {
    console.error("Envoi des alertes emploi en échec :", err);
    alerts = { error: err instanceof Error ? err.message : String(err) };
  }

  await db.collection("import_runs").add({
    ranAt: FieldValue.serverTimestamp(),
    results,
    alerts,
  });

  const hasError = results.some((r) => r.error);
  return NextResponse.json({ ok: !hasError, results, alerts });
}
