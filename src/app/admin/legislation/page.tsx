// src/app/admin/legislation/page.tsx
// Grille de cartes pour gérer les fiches Droit du Travail.

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLegislationAdmin } from "@/hooks/useLegislationAdmin";
import { CompanyTile } from "@/components/CompanyTile";
import { LegislationFormModal } from "@/components/admin/LegislationFormModal";
import { confirmDelete, notify } from "@/lib/notify";
import { TOPIC_LABELS, type LegislationFiche } from "@/types/legislation";

export default function AdminLegislationPage() {
  const { fiches, loading } = useLegislationAdmin();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFiche, setEditingFiche] = useState<LegislationFiche | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingFiche(null);
      setModalOpen(true);
      router.replace("/admin/legislation");
    }
  }, [searchParams, router]);

  const term = search.trim().toLowerCase();
  const filtered = fiches.filter((f) => !term || [f.title, f.topicLabel].some((v) => (v || "").toLowerCase().includes(term)));

  async function handleDelete(fiche: LegislationFiche) {
    if (await confirmDelete(fiche.title || "cette fiche")) {
      try {
        await deleteDoc(doc(db, "legislation", fiche.id));
        notify("Fiche supprimée.");
      } catch (err) {
        console.error("Erreur suppression fiche législation :", err);
        notify("Erreur lors de la suppression.", "error");
      }
    }
  }

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Droit du Travail</h1>
          <p className="admin-page-subtitle">Fiches thématiques affichées sur la page Législation (legislation.html).</p>
        </div>
        <button
          className="btn-sala-primary"
          onClick={() => {
            setEditingFiche(null);
            setModalOpen(true);
          }}
        >
          <i className="fas fa-plus me-1"></i> Ajouter une fiche
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Rechercher par titre, thème..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card-grid">
        {loading && (
          <div className="admin-card-empty admin-empty">
            <div className="spinner-border text-success"></div>
          </div>
        )}

        {!loading && fiches.length === 0 && (
          <div className="admin-card-empty admin-empty">
            Aucune fiche personnalisée pour le moment — la page Législation affiche actuellement le guide intégré par défaut.
            Ajoutez une fiche ici pour commencer à le personnaliser.
          </div>
        )}

        {!loading && fiches.length > 0 && filtered.length === 0 && (
          <div className="admin-card-empty admin-empty">Aucune fiche ne correspond à votre recherche.</div>
        )}

        {!loading &&
          filtered.map((fiche) => (
            <div className="admin-card" key={fiche.id}>
              <div className="admin-card-top">
                <div className="admin-row-identity">
                  <CompanyTile company={fiche.title} />
                  <div>
                    <div className="title">{fiche.title || "Sans titre"}</div>
                    <div className="subtitle">{fiche.articleRef || ""}</div>
                  </div>
                </div>
              </div>
              <div className="admin-card-meta">
                <span className="admin-badge">
                  {fiche.topicLabel || (fiche.topic && TOPIC_LABELS[fiche.topic]) || fiche.topic || "—"}
                </span>
                {fiche.faqQuestion && (
                  <span><i className="fas fa-question-circle"></i>FAQ incluse</span>
                )}
              </div>
              <div className="admin-card-footer">
                <span className="text-muted small">Ordre : {fiche.order ?? "—"}</span>
                <div className="admin-actions">
                  <button
                    className="btn-icon btn-icon-edit"
                    title="Modifier"
                    onClick={() => {
                      setEditingFiche(fiche);
                      setModalOpen(true);
                    }}
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                  <button className="btn-icon btn-icon-delete" title="Supprimer" onClick={() => handleDelete(fiche)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      <LegislationFormModal
        open={modalOpen}
        fiche={editingFiche}
        nextOrder={fiches.length + 1}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
