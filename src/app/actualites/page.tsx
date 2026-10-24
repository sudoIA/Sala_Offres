// src/app/actualites/page.tsx
// Page publique "Actualités" (News Sala) : articles publiés par l'équipe
// depuis Admin > Actualités, du plus récent au plus ancien ; un clic ouvre
// l'article complet dans une fenêtre.

"use client";

import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FabCv } from "@/components/layout/FabCv";
import { Modal } from "@/components/Modal";
import { useNews } from "@/hooks/useNews";
import { formatJobBody } from "@/lib/job-body";
import { safeExternalUrl } from "@/lib/safe-url";
import type { NewsArticle } from "@/types/news";

function formatDate(date: Date | null): string {
  return date ? date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
}

export default function ActualitesPage() {
  const { articles, loading, error } = useNews();
  const [open, setOpen] = useState<NewsArticle | null>(null);

  return (
    <div className="sala-layout-wrapper">
      <AppSidebar />
      <div className="sala-main-content">
        <AppTopbar />

        <div style={{ backgroundColor: "var(--sala-bg)", flex: 1 }}>
          <section className="py-4 py-md-5 text-white" style={{ background: "linear-gradient(135deg, #1e6b31 0%, #3b9452 100%)" }}>
            <div className="container text-center">
              <span className="badge bg-white text-dark fw-bold mb-3 px-3 py-2 rounded-pill shadow-sm">
                <i className="fas fa-newspaper text-success me-1"></i> News Sala
              </span>
              <h1 className="display-6 fw-bold mb-2">Actualités de Sala</h1>
              <p className="lead mx-auto mb-0" style={{ maxWidth: 650, fontSize: "1.05rem", opacity: 0.95 }}>
                Les nouvelles de l&apos;ONG, nos actions et nos annonces pour la jeunesse congolaise.
              </p>
            </div>
          </section>

          <main className="container my-4">
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-success"></div>
              </div>
            )}
            {!loading && error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && articles.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="fas fa-newspaper fa-3x mb-3" style={{ opacity: 0.5 }}></i>
                <p className="mb-0">Aucune actualité publiée pour le moment. Revenez bientôt !</p>
              </div>
            )}

            <div className="row g-4">
              {articles.map((article) => {
                const image = safeExternalUrl(article.image);
                return (
                  <div className="col-md-6 col-lg-4" key={article.id}>
                    <button type="button" className="news-card" onClick={() => setOpen(article)}>
                      {image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="news-card-image" loading="lazy" />
                      )}
                      <div className="news-card-body">
                        <div className="news-card-date">{formatDate(article.publishedDate)}</div>
                        <h2 className="news-card-title">{article.title}</h2>
                        <p className="news-card-summary">{article.summary}</p>
                        <span className="news-card-more">
                          Lire la suite <i className="fas fa-arrow-right ms-1"></i>
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title || ""}>
        {open && (
          <article>
            <div className="news-card-date mb-3">{formatDate(open.publishedDate)}</div>
            {safeExternalUrl(open.image) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={safeExternalUrl(open.image) as string} alt="" className="news-article-image" />
            )}
            <div className="sala-job-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatJobBody(open.body || "")) }} />
          </article>
        )}
      </Modal>

      <FabCv />
      <BottomNav />
    </div>
  );
}
