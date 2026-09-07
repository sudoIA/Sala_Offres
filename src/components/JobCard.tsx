// src/components/JobCard.tsx
// Carte d'offre pour les listes (accueil et /offres). Sur bureau, cliquer une
// carte sélectionne l'offre dans le panneau de détail (onSelect) ; sur
// mobile, elle navigue vers la page de détail dédiée.

"use client";

import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { CompanyTile } from "@/components/CompanyTile";
import { formatExpiry, isFavori, shareJob, toggleFavori } from "@/lib/job-helpers";
import { useEffect, useState } from "react";
import type { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
  active?: boolean;
  /** Affiche les actions favori/partage et gère la sélection bureau (page /offres). */
  interactive?: boolean;
  onSelect?: (job: Job) => void;
}

export function JobCard({ job, active = false, interactive = false, onSelect }: JobCardProps) {
  const [fav, setFav] = useState(false);
  useEffect(() => {
    if (interactive) setFav(isFavori(job.id));
  }, [interactive, job.id]);

  const safeTitle = DOMPurify.sanitize(job.title || "Offre sans titre");
  const safeCompany = DOMPurify.sanitize(job.company || "Entreprise non précisée");
  const safeCity = DOMPurify.sanitize(job.city || "Congo");
  const safeContract = DOMPurify.sanitize(job.contract || "Contrat");
  const expiry = formatExpiry(job.deadlineDate);
  const href = `/offres/${encodeURIComponent(job.id)}`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${href}` : href;

  function handleClick(e: React.MouseEvent) {
    if (!interactive || !onSelect) return;
    const isDesktop = window.matchMedia("(min-width: 992px)").matches;
    if (isDesktop) {
      e.preventDefault();
      onSelect(job);
    }
  }

  return (
    <div
      className={`sala-job-card${expiry?.urgent ? " is-urgent" : ""}${active ? " active" : ""}`}
      data-job-id={job.id}
    >
      <div className="d-flex justify-content-between align-items-start gap-2">
        <Link href={href} className="d-flex gap-2 flex-grow-1 sala-card-link" onClick={handleClick}>
          <CompanyTile company={job.company} />
          <div>
            <div className="sala-job-card-title" dangerouslySetInnerHTML={{ __html: safeTitle }} />
            <div className="sala-job-card-company mb-1" dangerouslySetInnerHTML={{ __html: safeCompany }} />
          </div>
        </Link>

        {interactive && (
          <div className="d-flex align-items-center gap-1">
            <button
              className={`job-action-btn fav-btn${fav ? " text-success" : ""}`}
              title="Ajouter aux favoris"
              aria-label="Favori"
              onClick={(e) => {
                e.stopPropagation();
                setFav(toggleFavori(job.id));
              }}
            >
              <i className="fas fa-bookmark"></i>
            </button>
            <button
              className="job-action-btn share-btn"
              title="Partager cette offre"
              aria-label="Partager"
              onClick={(e) => {
                e.stopPropagation();
                shareJob(job, shareUrl);
              }}
            >
              <i className="fas fa-share-alt"></i>
            </button>
          </div>
        )}
      </div>

      <div className="sala-job-card-meta">
        <span>
          <i className="fas fa-map-marker-alt"></i> <span dangerouslySetInnerHTML={{ __html: safeCity }} />
        </span>
        <span className="badge-sala-contract" dangerouslySetInnerHTML={{ __html: safeContract }} />
        {expiry && (
          <span className={`sala-job-card-expiry ${expiry.urgent ? "text-danger fw-bold" : "text-muted"}`}>
            <i className="far fa-clock"></i> {expiry.text}
          </span>
        )}
      </div>
    </div>
  );
}
