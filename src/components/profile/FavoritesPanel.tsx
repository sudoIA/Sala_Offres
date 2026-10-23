// src/components/profile/FavoritesPanel.tsx
// Onglet "Favoris" du profil : les offres mises en favori sur cet appareil
// (bouton favori des cartes d'offres, stocké localement). L'onglet affichait
// auparavant toujours "aucun favori".

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { JobCard } from "@/components/JobCard";
import { readFavoris, toggleFavori } from "@/lib/job-helpers";
import type { Job, JobDoc } from "@/types/job";

const MAX_FAVORITES = 50;

export function FavoritesPanel() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    const ids = readFavoris().slice(-MAX_FAVORITES).reverse(); // plus récents d'abord
    Promise.all(
      ids.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, "emplois", id));
          if (!snap.exists()) return { id, job: null };
          const data = snap.data() as JobDoc;
          return { id, job: { id, ...data, deadlineDate: data.deadline?.toDate ? data.deadline.toDate() : null } as Job };
        } catch {
          return { id, job: null };
        }
      })
    ).then((results) => {
      setJobs(results.flatMap((r) => (r.job && r.job.visibility !== false ? [r.job] : [])));
      setMissing(results.filter((r) => !r.job || r.job.visibility === false).map((r) => r.id));
    });
  }, []);

  function remove(jobId: string) {
    toggleFavori(jobId);
    setJobs((list) => (list || []).filter((j) => j.id !== jobId));
  }

  function forgetMissing() {
    missing.forEach((id) => toggleFavori(id));
    setMissing([]);
  }

  const now = new Date();

  return (
    <div>
      <h5 className="fw-bold mb-1">Offres sauvegardées</h5>
      <p className="text-muted small mb-3">Les favoris sont enregistrés sur cet appareil (téléphone ou ordinateur).</p>

      {jobs === null && (
        <div className="text-center py-4">
          <div className="spinner-border text-success"></div>
        </div>
      )}

      {jobs?.length === 0 && (
        <div className="text-center py-4 text-muted">
          <i className="fas fa-bookmark fa-3x text-muted mb-3" style={{ opacity: 0.5 }}></i>
          <p className="mb-2">Vous n&apos;avez pas encore d&apos;offres en favoris.</p>
          <p className="small mb-2">Touchez l&apos;icône signet d&apos;une offre pour la retrouver ici.</p>
          <Link href="/offres" className="btn-sala-outline btn-sm mt-1">Découvrir les offres</Link>
        </div>
      )}

      {jobs?.map((job) => {
        const expired = !!job.deadlineDate && job.deadlineDate <= now;
        return (
          <div key={job.id} className="mb-2">
            <JobCard job={job} />
            <div className="d-flex justify-content-between align-items-center px-1 mt-n1 mb-2">
              <span className="small text-danger">{expired ? "Date limite dépassée" : ""}</span>
              <button type="button" className="btn btn-link btn-sm text-muted p-0" onClick={() => remove(job.id)}>
                <i className="fas fa-times me-1"></i>Retirer des favoris
              </button>
            </div>
          </div>
        );
      })}

      {missing.length > 0 && (
        <p className="small text-muted mt-2 mb-0">
          {missing.length} offre(s) en favori ne sont plus disponibles (retirées par le recruteur).{" "}
          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={forgetMissing}>
            Les retirer de la liste
          </button>
        </p>
      )}
    </div>
  );
}
