// src/app/offres/[id]/JobDetailPageClient.tsx
// Contenu interactif de la page de détail (accès direct/mobile) : chargement
// temps réel de l'offre, favoris/partage, onglets. Sur bureau, la sélection
// depuis /offres ouvre plutôt le panneau de détail sans changer de page ;
// cette route reste la destination de secours et des liens partagés.
// Séparé de page.tsx pour que ce dernier reste un composant serveur (voir
// generateMetadata dans page.tsx).

"use client";

import Link from "next/link";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FabCv } from "@/components/layout/FabCv";
import { JobDetailContent } from "@/components/JobDetailContent";
import { FavShareButtons } from "@/components/FavShareButtons";
import { useJob } from "@/hooks/useJobs";

export function JobDetailPageClient({ id }: { id: string }) {
  const { job, loading, notFound } = useJob(id);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div style={{ backgroundColor: "var(--sala-bg)", paddingBottom: 85 }}>
      <AppTopbar backHref="/offres" backLabel="Retour aux offres" />

      <div>
        {loading && (
          <div className="detail-card text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="text-muted mt-3 mb-0">Chargement de l&apos;offre...</p>
          </div>
        )}

        {!loading && (notFound || !job) && (
          <div className="detail-card text-center py-5">
            <i className="fas fa-briefcase fa-2x text-muted mb-3"></i>
            <h5 className="fw-bold">Offre introuvable</h5>
            <p className="text-muted mb-3">Cette offre n&apos;existe plus ou a été retirée.</p>
            <Link href="/offres" className="btn-sala-primary py-2 px-4 rounded-pill">
              Voir toutes les offres
            </Link>
          </div>
        )}

        {!loading && job && (
          <div className="detail-card">
            <div className="detail-topline">
              <Link href="/offres">
                <i className="fas fa-arrow-left"></i> Retour à la liste
              </Link>
              <FavShareButtons job={job} shareUrl={shareUrl} />
            </div>
            <JobDetailContent job={job} />
          </div>
        )}
      </div>

      <FabCv />
      <BottomNav />
    </div>
  );
}
