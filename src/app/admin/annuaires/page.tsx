// src/app/admin/annuaires/page.tsx
// Grille de cartes pour gérer les 3 annuaires Sala (sous-onglets). Les cartes
// et la fiche d'aperçu reprennent exactement le même habillage que le site
// public (voir components/annuaire/) pour que l'admin voie ce que voient les
// visiteurs avant de modifier ou supprimer une fiche.

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAnnuaire } from "@/hooks/useAnnuaire";
import { usePagination } from "@/hooks/usePagination";
import { AnnuaireCard, AnnuaireCardSkeleton } from "@/components/annuaire/AnnuaireCard";
import { AnnuaireDetailContent } from "@/components/annuaire/AnnuaireDetailContent";
import { AnnuaireFormModal } from "@/components/admin/AnnuaireFormModal";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/admin/Pagination";
import { confirmDelete, notify } from "@/lib/notify";
import { annuaireModalTitle } from "@/lib/annuaire-helpers";
import { ANNUAIRE_COLLECTIONS, type AnnuaireCategory, type AnnuaireItem } from "@/types/annuaire";

const SUBTABS: { category: AnnuaireCategory; icon: string; label: string }[] = [
  { category: "universities", icon: "fas fa-graduation-cap", label: "Universités & Écoles" },
  { category: "companies", icon: "fas fa-building", label: "Entreprises" },
  { category: "clubs", icon: "fas fa-comments", label: "Clubs d'Anglais" },
];

export default function AdminAnnuairesPage() {
  const [category, setCategory] = useState<AnnuaireCategory>("universities");
  const { items, loading } = useAnnuaire(category);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnuaireItem | null>(null);
  const [previewItem, setPreviewItem] = useState<AnnuaireItem | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingItem(null);
      setModalOpen(true);
      router.replace("/admin/annuaires");
    }
  }, [searchParams, router]);

  const term = search.trim().toLowerCase();
  const filtered = items.filter((item) => !term || [item.name, item.city].some((v) => (v || "").toLowerCase().includes(term)));
  const { pageItems, page, totalPages, setPage } = usePagination(filtered, `${category}|${term}`);

  async function handleDelete(item: AnnuaireItem) {
    if (await confirmDelete(item.name || "cette fiche")) {
      try {
        await deleteDoc(doc(db, ANNUAIRE_COLLECTIONS[category], item.id));
        notify("Fiche supprimée.");
        setPreviewItem((current) => (current?.id === item.id ? null : current));
      } catch (err) {
        console.error("Erreur suppression fiche :", err);
        notify("Erreur lors de la suppression.", "error");
      }
    }
  }

  function handleEdit(item: AnnuaireItem) {
    setPreviewItem(null);
    setEditingItem(item);
    setModalOpen(true);
  }

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Annuaires Sala</h1>
          <p className="admin-page-subtitle">Universités, entreprises partenaires et clubs d&apos;anglais.</p>
        </div>
        <button
          className="btn-sala-primary"
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
        >
          <i className="fas fa-plus me-1"></i> Ajouter une fiche
        </button>
      </div>

      <div className="annuaire-subtabs">
        {SUBTABS.map((tab) => (
          <button
            key={tab.category}
            className={`annuaire-subtab${category === tab.category ? " active" : ""}`}
            onClick={() => {
              setCategory(tab.category);
              setSearch("");
            }}
          >
            <i className={tab.icon}></i> {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Rechercher par nom, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="row g-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div className="col-md-6 col-lg-4" key={i}>
              <AnnuaireCardSkeleton />
            </div>
          ))}

        {!loading && filtered.length === 0 && (
          <div className="col-12">
            <div className="admin-card-empty admin-empty">
              {items.length === 0 ? "Aucune fiche enregistrée dans cet annuaire." : "Aucune fiche ne correspond à votre recherche."}
            </div>
          </div>
        )}

        {!loading &&
          pageItems.map((item, i) => (
            <div className="col-md-6 col-lg-4" key={item.id}>
              <AnnuaireCard
                category={category}
                item={item}
                index={i}
                ctaLabel="Aperçu"
                onOpen={() => setPreviewItem(item)}
                headerActions={
                  <>
                    <button className="annuaire-card-icon-btn" title="Modifier" onClick={() => handleEdit(item)}>
                      <i className="fas fa-pen"></i>
                    </button>
                    <button className="annuaire-card-icon-btn danger" title="Supprimer" onClick={() => handleDelete(item)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </>
                }
              />
            </div>
          ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!previewItem} onClose={() => setPreviewItem(null)} title={annuaireModalTitle(category)} size="md">
        {previewItem && (
          <AnnuaireDetailContent
            category={category}
            item={previewItem}
            extraActions={
              <>
                <button className="btn btn-sm btn-sala-outline rounded-pill" onClick={() => handleEdit(previewItem)}>
                  <i className="fas fa-pen me-1"></i> Modifier
                </button>
                <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleDelete(previewItem)}>
                  <i className="fas fa-trash me-1"></i> Supprimer
                </button>
              </>
            }
          />
        )}
      </Modal>

      <AnnuaireFormModal open={modalOpen} category={category} item={editingItem} onClose={() => setModalOpen(false)} />
    </section>
  );
}
