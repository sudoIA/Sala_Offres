// src/app/admin/annuaires/page.tsx
// Grille de cartes pour gérer les 3 annuaires Sala (sous-onglets).

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAnnuaire } from "@/hooks/useAnnuaire";
import { CompanyTile } from "@/components/CompanyTile";
import { AnnuaireFormModal } from "@/components/admin/AnnuaireFormModal";
import { confirmDelete, notify } from "@/lib/notify";
import { ANNUAIRE_COLLECTIONS, type AnnuaireCategory, type AnnuaireItem } from "@/types/annuaire";

const SUBTABS: { category: AnnuaireCategory; icon: string; label: string }[] = [
  { category: "universities", icon: "fas fa-graduation-cap", label: "Universités & Écoles" },
  { category: "companies", icon: "fas fa-building", label: "Entreprises" },
  { category: "clubs", icon: "fas fa-comments", label: "Clubs d'Anglais" },
];

function cardMeta(category: AnnuaireCategory, item: AnnuaireItem) {
  if (category === "universities") {
    return (
      <>
        <span className="admin-badge">{item.type || "—"}</span>
        <span><i className="fas fa-map-marker-alt"></i>{item.city || "—"}</span>
      </>
    );
  }
  if (category === "companies") {
    return (
      <>
        <span className="admin-badge">{item.sector || "—"}</span>
        <span><i className="fas fa-map-marker-alt"></i>{item.city || "—"}</span>
      </>
    );
  }
  return (
    <>
      <span><i className="fas fa-map-marker-alt"></i>{item.city || "—"}</span>
      <span><i className="far fa-clock"></i>{item.schedule || "—"}</span>
    </>
  );
}

function cardFooter(category: AnnuaireCategory, item: AnnuaireItem) {
  if (category === "universities") return item.phone || item.email || "";
  if (category === "companies") return item.email || item.phone || "";
  return item.coordinator || "";
}

export default function AdminAnnuairesPage() {
  const [category, setCategory] = useState<AnnuaireCategory>("universities");
  const { items, loading } = useAnnuaire(category);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnuaireItem | null>(null);
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

  async function handleDelete(item: AnnuaireItem) {
    if (await confirmDelete(item.name || "cette fiche")) {
      try {
        await deleteDoc(doc(db, ANNUAIRE_COLLECTIONS[category], item.id));
        notify("Fiche supprimée.");
      } catch (err) {
        console.error("Erreur suppression fiche :", err);
        notify("Erreur lors de la suppression.", "error");
      }
    }
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

      <div className="admin-card-grid">
        {loading && (
          <div className="admin-card-empty admin-empty">
            <div className="spinner-border text-success"></div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="admin-card-empty admin-empty">
            {items.length === 0 ? "Aucune fiche enregistrée dans cet annuaire." : "Aucune fiche ne correspond à votre recherche."}
          </div>
        )}

        {!loading &&
          filtered.map((item) => (
            <div className="admin-card" key={item.id}>
              <div className="admin-card-top">
                <div className="admin-row-identity">
                  <CompanyTile company={item.name} />
                  <div className="title">{item.name || "Sans nom"}</div>
                </div>
              </div>
              <div className="admin-card-meta">{cardMeta(category, item)}</div>
              <div className="admin-card-footer">
                <span className="text-muted small">{cardFooter(category, item)}</span>
                <div className="admin-actions">
                  <button
                    className="btn-icon btn-icon-edit"
                    title="Modifier"
                    onClick={() => {
                      setEditingItem(item);
                      setModalOpen(true);
                    }}
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                  <button className="btn-icon btn-icon-delete" title="Supprimer" onClick={() => handleDelete(item)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      <AnnuaireFormModal open={modalOpen} category={category} item={editingItem} onClose={() => setModalOpen(false)} />
    </section>
  );
}
