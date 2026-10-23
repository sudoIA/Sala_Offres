// src/hooks/useCustomSources.ts
// Sources de collecte ajoutées par l'équipe (collection "import_sources",
// réservée aux admins) : liste temps réel, ajout, modification, suppression,
// et test d'une adresse avant ajout (voir src/app/api/jobs/import/custom).

"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { logAdminAction } from "@/lib/admin-log";
import { customSourceKey, type CustomSource, type CustomSourceConfig } from "@/lib/custom-sources";
import type { ImportedJob } from "@/types/job-import";

export interface SourceTestResult {
  method: "rss" | "liens" | "selecteur";
  jobs: ImportedJob[];
}

/** Interroge une adresse avec le collecteur générique, sans rien enregistrer. */
export async function testCustomSource(
  config: Pick<CustomSourceConfig, "url" | "selector" | "keyword" | "defaultCompany">
): Promise<SourceTestResult> {
  const idToken = await auth.currentUser?.getIdToken();
  const res = await fetch("/api/jobs/import/custom", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken || ""}` },
    body: JSON.stringify(config),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Le test a échoué.");
  return { method: data.method, jobs: data.jobs };
}

export function useCustomSources() {
  const [sources, setSources] = useState<CustomSource[]>([]);

  useEffect(() => {
    return onSnapshot(
      collection(db, "import_sources"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CustomSourceConfig) }));
        list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
        setSources(list);
      },
      (err) => console.error("Lecture des sources personnalisées impossible :", err)
    );
  }, []);

  async function addSource(config: CustomSourceConfig) {
    const ref = await addDoc(collection(db, "import_sources"), { ...config, createdAt: new Date().toISOString() });
    await logAdminAction("create", "import_sources", `${config.name} (${config.url})`, ref.id);
  }

  async function updateSource(source: CustomSource, patch: Partial<CustomSourceConfig & Pick<CustomSource, "lastRunAt" | "lastCount" | "lastError">>) {
    await updateDoc(doc(db, "import_sources", source.id), patch);
    if ("enabled" in patch) {
      await logAdminAction("update", "import_sources", `${source.name} — collecte quotidienne ${patch.enabled ? "activée" : "désactivée"}`, source.id);
    }
  }

  /**
   * Change l'entreprise par défaut d'une source et la reporte sur ses offres
   * encore en attente de relecture qui n'ont pas d'entreprise. Renvoie le
   * nombre d'offres complétées.
   */
  async function setDefaultCompany(source: CustomSource, defaultCompany: string): Promise<number> {
    await updateDoc(doc(db, "import_sources", source.id), { defaultCompany });
    await logAdminAction("update", "import_sources", `${source.name} — entreprise par défaut : ${defaultCompany || "aucune"}`, source.id);
    if (!defaultCompany) return 0;
    const pending = await getDocs(
      query(collection(db, "emplois_import"), where("source", "==", customSourceKey(source.id)), where("status", "==", "pending"))
    );
    const toFill = pending.docs.filter((d) => !d.data().company);
    await Promise.all(toFill.map((d) => updateDoc(d.ref, { company: defaultCompany })));
    return toFill.length;
  }

  async function removeSource(source: CustomSource) {
    await deleteDoc(doc(db, "import_sources", source.id));
    await logAdminAction("delete", "import_sources", source.name, source.id);
  }

  return { sources, addSource, updateSource, setDefaultCompany, removeSource };
}
