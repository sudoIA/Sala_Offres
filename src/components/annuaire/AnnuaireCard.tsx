// src/components/annuaire/AnnuaireCard.tsx
// Carte compacte partagée par l'annuaire public et sa gestion en admin : même
// bandeau coloré, gros logo, badge et ville des deux côtés, pour qu'ils ne
// puissent jamais diverger visuellement.

"use client";

import type { ReactNode } from "react";
import { AnnuaireLogo } from "@/components/annuaire/AnnuaireLogo";
import { useAnnuaireImages } from "@/hooks/useAnnuaireImages";
import { annuaireBadgeLabel, annuaireCardSummary, annuaireCategoryClass } from "@/lib/annuaire-helpers";
import type { AnnuaireCategory, AnnuaireItem } from "@/types/annuaire";

interface AnnuaireCardProps {
  category: AnnuaireCategory;
  item: AnnuaireItem;
  index?: number;
  onOpen: () => void;
  ctaLabel?: string;
  /** Boutons superposés au bandeau (ex: modifier/supprimer en admin). */
  headerActions?: ReactNode;
}

export function AnnuaireCard({ category, item, index = 0, onOpen, ctaLabel = "Voir la fiche", headerActions }: AnnuaireCardProps) {
  const cat = annuaireCategoryClass(category);
  const badge = annuaireBadgeLabel(category, item);
  const summary = annuaireCardSummary(item);
  const { logoUrl } = useAnnuaireImages(category, item);

  return (
    <div
      className="annuaire-card annuaire-card-clickable annuaire-fade-in"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
    >
      <div className={`annuaire-card-banner annuaire-card-banner-${cat}`}>
        {(item.verified || headerActions) && (
          <div className="annuaire-card-banner-topright">
            {item.verified && (
              <span className="annuaire-verified-badge" title="Partenaire vérifié Sala">
                <i className="fas fa-check"></i>
              </span>
            )}
            {headerActions && (
              <div className="annuaire-card-header-actions" onClick={(e) => e.stopPropagation()}>
                {headerActions}
              </div>
            )}
          </div>
        )}
        <div className="annuaire-card-header-row">
          <div className="annuaire-card-logo-wrap">
            <AnnuaireLogo category={category} name={item.name} logoUrl={logoUrl} large />
          </div>
          <div className="annuaire-card-header-text">
            <h5 className={`annuaire-card-name annuaire-title-${cat}`}>{item.name || item.full_name || "Sans nom"}</h5>
            <span className={`annuaire-badge annuaire-badge-${cat}`}>{badge}</span>
          </div>
        </div>
      </div>
      <div className="annuaire-card-body">
        <div className="text-muted small mb-2">
          <i className="fas fa-map-marker-alt text-success me-1"></i> {item.city || "—"}
        </div>
        {summary && <p className="text-secondary small mb-0 annuaire-card-summary">{summary}</p>}
      </div>
      <div className={`annuaire-card-cta cta-${cat}`}>
        {ctaLabel} <i className="fas fa-arrow-right ms-1"></i>
      </div>
    </div>
  );
}

export function AnnuaireCardSkeleton() {
  return (
    <div className="annuaire-card">
      <div className="annuaire-card-banner annuaire-skeleton-block"></div>
      <div className="annuaire-card-body">
        <div className="annuaire-skeleton-logo"></div>
        <div className="annuaire-skeleton-line" style={{ width: "45%" }}></div>
        <div className="annuaire-skeleton-line" style={{ width: "75%", height: 16 }}></div>
        <div className="annuaire-skeleton-line" style={{ width: "55%" }}></div>
        <div className="annuaire-skeleton-line" style={{ width: "95%" }}></div>
        <div className="annuaire-skeleton-line" style={{ width: "85%" }}></div>
      </div>
    </div>
  );
}
