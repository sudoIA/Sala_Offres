// src/app/admin/actualites/page.tsx
// Gestion des articles News Sala (page publique /actualites).

"use client";

import { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNews } from "@/hooks/useNews";
import { CompanyTile } from "@/components/CompanyTile";
import { NewsFormModal } from "@/components/admin/NewsFormModal";
import { confirmDelete, notify } from "@/lib/notify";
import { logAdminAction } from "@/lib/admin-log";
import type { NewsArticle } from "@/types/news";

export default function AdminNewsPage() {
  const { articles, loading } = useNews(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);

  const term = search.trim().toLowerCase();
  const filtered = articles.filter((a) => !term || [a.title, a.summary].some((v) => (v || "").toLowerCase().includes(term)));

  function openEditor(article: NewsArticle | null) {
    setEditing(article);
    setModalOpen(true);
  }

  async function toggleVisibility(article: NewsArticle) {
    const visible = article.visibility === false;
    try {
      await updateDoc(doc(db, "news", article.id), { visibility: visible });
      await logAdminAction("update", "news", `${article.title || "Article"} — ${visible ? "rendu visible" : "masqué"}`, article.id);
    } catch (err) {
      notify("Erreur : " + (err as Error).message, "error");
    }
  }

  async function handleDelete(article: NewsArticle) {
    if (!(await confirmDelete(article.title || "cet article"))) return;
    try {
      await deleteDoc(doc(db, "news", article.id));
      await logAdminAction("delete", "news", article.title || "Article", article.id);
      notify("Article supprimé.");
    } catch (err) {
      notify("Erreur lors de la suppression.", "error");
      console.error("Erreur suppression article :", err);
    }
  }

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">News Sala</h1>
          <p className="admin-page-subtitle">Actualités de l&apos;ONG affichées sur la page publique « Actualités ».</p>
        </div>
        <button className="btn-sala-primary" onClick={() => openEditor(null)}>
          <i className="fas fa-plus me-1"></i> Nouvel article
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Rechercher un article..."
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
        {!loading && articles.length === 0 && (
          <div className="admin-card-empty admin-empty">Aucun article pour le moment. Publiez la première actualité de Sala !</div>
        )}
        {!loading && articles.length > 0 && filtered.length === 0 && (
          <div className="admin-card-empty admin-empty">Aucun article ne correspond à votre recherche.</div>
        )}
        {!loading &&
          filtered.map((article) => (
            <div className="admin-card" key={article.id}>
              <div className="admin-card-top">
                <div className="admin-row-identity">
                  <CompanyTile company={article.title} />
                  <div>
                    <div className="title">{article.title || "Sans titre"}</div>
                    <div className="subtitle">{article.summary || ""}</div>
                  </div>
                </div>
              </div>
              <div className="admin-card-meta">
                <span>
                  <i className="far fa-calendar"></i>
                  {article.publishedDate ? article.publishedDate.toLocaleDateString("fr-FR") : "—"}
                </span>
                <span className="admin-badge">{article.visibility === false ? "Masqué" : "Visible"}</span>
              </div>
              <div className="admin-card-footer">
                <button className="btn btn-sm btn-light border" onClick={() => toggleVisibility(article)}>
                  <i className={`fas ${article.visibility === false ? "fa-eye" : "fa-eye-slash"} me-1`}></i>
                  {article.visibility === false ? "Afficher" : "Masquer"}
                </button>
                <div className="admin-actions">
                  <button className="btn-icon btn-icon-edit" title="Modifier" onClick={() => openEditor(article)}>
                    <i className="fas fa-pen"></i>
                  </button>
                  <button className="btn-icon btn-icon-delete" title="Supprimer" onClick={() => handleDelete(article)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      <NewsFormModal open={modalOpen} article={editing} onClose={() => setModalOpen(false)} />
    </section>
  );
}
