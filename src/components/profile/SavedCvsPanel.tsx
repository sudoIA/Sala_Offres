// src/components/profile/SavedCvsPanel.tsx
// Onglet "CV enregistrés" du profil : liste les CV sauvegardés en ligne
// depuis le générateur (users/{uid}/cvs), avec reprise dans le générateur et
// suppression. L'onglet affichait auparavant toujours "aucun CV".

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, deleteDoc, doc, getDocs, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CV_SESSION_KEY } from "@/hooks/useCvBuilder";
import { confirmDelete, notify } from "@/lib/notify";
import { DEFAULT_CV_STATE, type CvState } from "@/types/cv";

interface SavedCv {
  id: string;
  cv: CvState;
  updatedAt: Date | null;
}

const TEMPLATE_LABELS: Record<string, string> = { classic: "Classique", marine: "Marine", moderne: "Moderne" };

export function SavedCvsPanel({ uid }: { uid: string }) {
  const router = useRouter();
  const [cvs, setCvs] = useState<SavedCv[] | null>(null);

  const load = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "users", uid, "cvs"));
      const list = snap.docs.map((d) => {
        const data = d.data() as Partial<CvState> & { updatedAt?: Timestamp };
        // Seuls les champs du générateur sont repris (pas userId / updatedAt).
        const cv: CvState = {
          template: data.template || DEFAULT_CV_STATE.template,
          personal: { ...DEFAULT_CV_STATE.personal, ...(data.personal || {}) },
          experiences: data.experiences || [],
          education: data.education || [],
          projects: data.projects || [],
          skills: data.skills || [],
          hobbies: data.hobbies || [],
          languages: data.languages || [],
        };
        return { id: d.id, cv, updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null };
      });
      list.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
      setCvs(list);
    } catch (err) {
      console.error("Lecture des CV enregistrés impossible :", err);
      setCvs([]);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  function openInBuilder(saved: SavedCv) {
    try {
      sessionStorage.setItem(CV_SESSION_KEY, JSON.stringify(saved.cv));
    } catch {
      notify("Impossible d'ouvrir ce CV sur cet appareil (stockage indisponible).", "error");
      return;
    }
    router.push("/cv-builder");
  }

  async function handleDelete(saved: SavedCv) {
    if (!(await confirmDelete(saved.cv.personal.jobTitle || saved.cv.personal.fullName || "ce CV"))) return;
    try {
      await deleteDoc(doc(db, "users", uid, "cvs", saved.id));
      setCvs((list) => (list || []).filter((c) => c.id !== saved.id));
      notify("CV supprimé.");
    } catch (err) {
      notify("Erreur : " + (err as Error).message, "error");
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">Mes CVs professionnels</h5>
        <Link href="/cv-builder" className="btn-sala-accent btn-sm">
          <i className="fas fa-plus me-1"></i> Nouveau CV
        </Link>
      </div>

      {cvs === null && (
        <div className="text-center py-4">
          <div className="spinner-border text-success"></div>
        </div>
      )}

      {cvs?.length === 0 && (
        <div className="text-center py-4 text-muted">
          <i className="fas fa-file-invoice fa-3x text-muted mb-3" style={{ opacity: 0.5 }}></i>
          <p className="mb-2">Vous n&apos;avez pas encore enregistré de CV en ligne.</p>
          <p className="small mb-2">Dans le générateur, cliquez sur « Sauvegarder » à la dernière étape (Aperçu &amp; PDF) pour le retrouver ici.</p>
          <Link href="/cv-builder" className="btn-sala-primary btn-sm mt-1">Lancer le Générateur de CV</Link>
        </div>
      )}

      {cvs && cvs.length > 0 && (
        <div className="d-flex flex-column gap-2">
          {cvs.map((saved) => (
            <div
              key={saved.id}
              className="d-flex align-items-center justify-content-between gap-3 p-3 rounded-3 flex-wrap"
              style={{ backgroundColor: "var(--sala-bg)", border: "1px solid var(--sala-border)" }}
            >
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: 44, height: 44, background: "#fee2e2", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fas fa-file-pdf text-danger fa-lg"></i>
                </div>
                <div>
                  <div className="fw-bold">{saved.cv.personal.jobTitle || saved.cv.personal.fullName || "CV sans titre"}</div>
                  <small className="text-muted">
                    Modèle {TEMPLATE_LABELS[saved.cv.template] || saved.cv.template}
                    {saved.updatedAt ? ` · enregistré le ${saved.updatedAt.toLocaleDateString("fr-FR")}` : ""}
                  </small>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn-sala-primary btn-sm" onClick={() => openInBuilder(saved)}>
                  <i className="fas fa-pen me-1"></i> Ouvrir
                </button>
                <button type="button" className="btn btn-outline-danger btn-sm rounded-pill" title="Supprimer" onClick={() => handleDelete(saved)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
