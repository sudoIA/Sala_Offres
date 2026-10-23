// src/hooks/useJobImports.ts
// Écoute la collection Firestore "emplois_import" (offres collectées
// automatiquement, en attente de validation) et expose les actions de
// l'écran admin "Imports" : lancer une collecte (ACPE, Afriqueemplois...),
// finaliser une publication (après relecture/édition dans JobFormModal),
// rejeter, marquer comme doublon.
//
// Ces écritures utilisent le SDK client Firebase depuis le navigateur de
// l'admin déjà connecté (comme le reste du back-office) : la route API ne
// fait que collecter/parser le HTML externe (nécessaire à cause de CORS),
// c'est le navigateur admin qui écrit dans Firestore, donc les règles de
// sécurité standard (isAdmin()) s'appliquent normalement.

"use client";

import { useCallback, useEffect, useState } from "react";
import { addDoc, collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { buildImportDocId, findDuplicatePublishedJob, stripUndefined } from "@/lib/job-import-helpers";
import { IMPORT_SOURCES, type ImportSourceKey } from "@/lib/import-sources";
import type { ImportedJob } from "@/types/job-import";
import type { Job } from "@/types/job";
import type { CustomSource } from "@/lib/custom-sources";
import { logAdminAction } from "@/lib/admin-log";

export interface ImportedJobRecord extends ImportedJob {
  id: string;
}

export { IMPORT_SOURCES, type ImportSourceKey };

export function useJobImports() {
  const [imports, setImports] = useState<ImportedJobRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "emplois_import"),
      (snapshot) => {
        const list: ImportedJobRecord[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as ImportedJob) }));
        list.sort((a, b) => (b.importedAt || "").localeCompare(a.importedAt || ""));
        setImports(list);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur chargement des imports :", err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  /**
   * Lance une collecte (source + page) puis écrit le résultat dans
   * "emplois_import". Idempotent : rejouer la même page ne fait que mettre à
   * jour `lastCheckedAt` sur les imports déjà connus, sans jamais écraser une
   * décision déjà prise (approuvée/rejetée/doublon) par un admin.
   */
  const runCollection = useCallback(async (source: ImportSourceKey | string, page: number, publishedJobs: Job[], custom?: CustomSource) => {
    // La route vérifie ce jeton côté serveur (voir src/lib/admin-auth.ts).
    const idToken = await auth.currentUser?.getIdToken();
    // Source personnalisée : collecteur générique, avec sa configuration.
    const res = custom
      ? await fetch("/api/jobs/import/custom", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken || ""}` },
          body: JSON.stringify({ source, url: custom.url, selector: custom.selector, keyword: custom.keyword }),
        })
      : await fetch(`/api/jobs/import/${source}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken || ""}` },
          body: JSON.stringify({ page, withDetails: true }),
        });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Échec de la collecte.");

    const collectedJobs = data.jobs as ImportedJob[];
    let created = 0;
    let updated = 0;

    for (const job of collectedJobs) {
      const id = buildImportDocId(job.source, job.sourceId);
      const ref = doc(db, "emplois_import", id);
      const existing = await getDoc(ref);

      if (existing.exists()) {
        await updateDoc(ref, { lastCheckedAt: new Date().toISOString() });
        updated++;
      } else {
        const duplicate = findDuplicatePublishedJob(job, publishedJobs);
        await setDoc(
          ref,
          stripUndefined({
            ...job,
            status: duplicate ? "duplicate" : "pending",
            duplicateOf: duplicate?.id,
            lastCheckedAt: job.importedAt,
          })
        );
        created++;
      }
    }

    return { created, updated, total: collectedJobs.length };
  }, []);

  /**
   * Termine l'approbation d'un import : `jobData` vient de JobFormModal, donc
   * potentiellement corrigé/complété par l'admin après relecture — jamais
   * l'offre importée écrite telle quelle sans passer par cet écran.
   */
  async function finalizeImportApproval(importId: string, jobData: Record<string, unknown>) {
    const ref = await addDoc(collection(db, "emplois"), stripUndefined(jobData));
    await updateDoc(doc(db, "emplois_import", importId), { status: "approved", publishedJobId: ref.id });
  }

  function importLabel(id: string): string {
    const record = imports.find((r) => r.id === id);
    return record ? `${record.title} — ${record.company || record.source}` : id;
  }

  async function rejectImport(id: string) {
    await updateDoc(doc(db, "emplois_import", id), { status: "rejected" });
    await logAdminAction("reject", "emplois_import", importLabel(id), id);
  }

  async function markDuplicate(id: string) {
    await updateDoc(doc(db, "emplois_import", id), { status: "duplicate" });
    await logAdminAction("reject", "emplois_import", `${importLabel(id)} (doublon)`, id);
  }

  return { imports, loading, runCollection, finalizeImportApproval, rejectImport, markDuplicate };
}
