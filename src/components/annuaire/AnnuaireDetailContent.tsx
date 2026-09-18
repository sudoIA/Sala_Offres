// src/components/annuaire/AnnuaireDetailContent.tsx
// Contenu de la fiche détaillée d'un annuaire (coordonnées, présentation,
// filières/activités, carte de localisation) — utilisé à l'identique sur le
// site public et dans l'aperçu admin, pour que les deux ne divergent jamais.

"use client";

import type { ReactNode } from "react";
import { AnnuaireLogo } from "@/components/annuaire/AnnuaireLogo";
import { useAnnuaireImages } from "@/hooks/useAnnuaireImages";
import {
  annuaireAddress,
  annuaireBadgeLabel,
  annuaireCategoryClass,
  annuaireDescription,
  annuaireDetailChips,
  annuaireDirectionsUrl,
  annuaireEmails,
  annuaireFullName,
  annuaireHours,
  annuaireMapEmbedUrl,
  annuairePhones,
  annuairePresentationTitle,
  annuaireWebsite,
} from "@/lib/annuaire-helpers";
import type { AnnuaireCategory, AnnuaireItem } from "@/types/annuaire";

interface AnnuaireDetailContentProps {
  category: AnnuaireCategory;
  item: AnnuaireItem;
  /** Boutons additionnels affichés avec Appeler / Email / Site web (ex: Modifier / Supprimer en admin). */
  extraActions?: ReactNode;
}

export function AnnuaireDetailContent({ category, item, extraActions }: AnnuaireDetailContentProps) {
  const cat = annuaireCategoryClass(category);
  const chips = annuaireDetailChips(category, item);
  const mapUrl = annuaireMapEmbedUrl(item);
  const directionsUrl = annuaireDirectionsUrl(item);
  const address = annuaireAddress(item);
  const hours = annuaireHours(item);
  const description = annuaireDescription(item);
  const website = annuaireWebsite(item);
  const phones = annuairePhones(item);
  const emails = annuaireEmails(item);
  const { logoUrl, photoUrl } = useAnnuaireImages(category, item);

  return (
    <>
      <div className={`annuaire-detail-header annuaire-detail-header-${cat}`}>
        <AnnuaireLogo category={category} name={item.name} logoUrl={logoUrl} large />
        <div style={{ minWidth: 0 }}>
          <h5 className={`fw-bold mb-1 annuaire-title-${cat}`}>{annuaireFullName(item)}</h5>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className={`annuaire-badge annuaire-badge-${cat}`}>{annuaireBadgeLabel(category, item)}</span>
            {item.verified && (
              <span className="annuaire-badge" style={{ background: "var(--sala-green-light)", color: "var(--sala-green-dark)" }}>
                <i className="fas fa-check-circle"></i> Partenaire vérifié
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="annuaire-detail-section-title"><i className="fas fa-address-card"></i> Coordonnées</div>
      <div className="annuaire-coord-card mb-3">
        {item.city && (
          <div className="annuaire-coord-row">
            <i className="fas fa-city"></i>
            <span>{item.city}</span>
          </div>
        )}
        {item.district && (
          <div className="annuaire-coord-row">
            <i className="fas fa-map"></i>
            <span>{item.district}</span>
          </div>
        )}
        {item.building && (
          <div className="annuaire-coord-row">
            <i className="fas fa-door-open"></i>
            <span>{item.building}</span>
          </div>
        )}
        {address && (
          <div className="annuaire-coord-row">
            <i className="fas fa-map-marker-alt"></i>
            <span>{address}</span>
          </div>
        )}
        {hours && (
          <div className="annuaire-coord-row">
            <i className="far fa-clock"></i>
            <span>{hours}</span>
          </div>
        )}
        {phones.map((p) => (
          <div className="annuaire-coord-row" key={p}>
            <i className="fas fa-phone-alt"></i>
            <span>{p}</span>
          </div>
        ))}
        {emails.map((e) => (
          <div className="annuaire-coord-row" key={e}>
            <i className="fas fa-envelope"></i>
            <span>{e}</span>
          </div>
        ))}
      </div>

      {description && (
        <>
          <div className="annuaire-detail-section-title"><i className="fas fa-info-circle"></i> {annuairePresentationTitle(category)}</div>
          <p className="text-secondary small mb-3" style={{ lineHeight: 1.6 }}>{description}</p>
        </>
      )}

      {photoUrl && (
        <>
          <div className="annuaire-detail-section-title"><i className="fas fa-image"></i> Image</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt={item.name || "Photo"} className="annuaire-detail-photo mb-3" />
        </>
      )}

      {chips.items.length > 0 && (
        <div className="mb-3">
          <div className="annuaire-detail-section-title"><i className="fas fa-list-ul"></i> {chips.label}</div>
          <div className="d-flex flex-wrap gap-1">
            {chips.items.map((chip, i) => (
              <span className="badge bg-light text-dark border" style={{ fontSize: "0.75rem" }} key={i}>{chip}</span>
            ))}
          </div>
        </div>
      )}

      {category === "clubs" && (item.schedule || item.fee) && (
        <div className="mb-3 d-flex flex-wrap gap-2">
          {item.schedule && (
            <span className="badge bg-light text-dark border p-2" style={{ fontSize: "0.8rem" }}>
              <i className="far fa-clock me-1 text-danger"></i> {item.schedule}
            </span>
          )}
          {item.fee && (
            <span className="badge bg-warning-subtle text-dark border p-2" style={{ fontSize: "0.8rem" }}>
              <i className="fas fa-tag me-1"></i> {item.fee}
            </span>
          )}
        </div>
      )}

      {mapUrl && (
        <div className="mb-2">
          <div className="annuaire-detail-section-title"><i className="fas fa-map-marked-alt"></i> Où nous trouver</div>
          <div className="annuaire-map-frame mb-2">
            <iframe src={mapUrl} title={`Localisation - ${item.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
          </div>
          {directionsUrl && (
            <a href={directionsUrl} target="_blank" rel="noopener" className="btn btn-sm btn-outline-secondary rounded-pill">
              <i className="fas fa-diamond-turn-right me-1"></i> Itinéraire
            </a>
          )}
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 pt-3 mt-2 border-top">
        {phones[0] && (
          <a href={`tel:${phones[0]}`} className="btn btn-sm btn-outline-success rounded-pill">
            <i className="fas fa-phone-alt me-1"></i> Appeler
          </a>
        )}
        {emails[0] && (
          <a href={`mailto:${emails[0]}`} className="btn btn-sm btn-outline-primary rounded-pill">
            <i className="fas fa-envelope me-1"></i> {category === "companies" ? "Contact RH" : "Email"}
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener" className="btn btn-sm btn-sala-primary rounded-pill">
            <i className="fas fa-globe me-1"></i> Site Web
          </a>
        )}
        {category === "clubs" && item.coordinator && (
          <span className="btn btn-sm btn-light rounded-pill disabled">
            <i className="fas fa-user me-1"></i> {item.coordinator}
          </span>
        )}
        {extraActions}
      </div>
    </>
  );
}
