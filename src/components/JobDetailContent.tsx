// src/components/JobDetailContent.tsx
// Corps détaillé d'une offre : identité, compte à rebours, onglets
// (description / compétences / entreprise), bouton de candidature.
// Réutilisé à l'identique dans le panneau bureau (/offres) et la page
// mobile dédiée (/offres/[id]).

"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { CompanyTile } from "@/components/CompanyTile";
import { CountdownGrid } from "@/components/CountdownGrid";
import { useCompanyLogos } from "@/hooks/useCompanyLogos";
import type { Job } from "@/types/job";

type TabKey = "description" | "competences" | "entreprise";

export function JobDetailContent({ job }: { job: Job }) {
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const logos = useCompanyLogos([job.company]);
  const logoUrl = job.company ? logos[job.company] : null;

  const safeTitle = DOMPurify.sanitize(job.title || "Offre d'emploi");
  const safeCompany = DOMPurify.sanitize(job.company || "Entreprise au Congo");
  const safeCity = DOMPurify.sanitize(job.city || "Congo");
  const safeContract = DOMPurify.sanitize(job.contract || "Contrat");
  const safeBody = DOMPurify.sanitize(job.body || "Pas de description disponible pour cette offre.");
  const safeLanguages = job.languages ? DOMPurify.sanitize(job.languages) : null;
  const email = job.email || null;
  const mailtoLink = email
    ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Candidature - " + (job.title || "Offre Sala"))}`
    : null;
  const publishedDate = job.timestamp?.toDate ? job.timestamp.toDate() : null;

  return (
    <>
      <div className="d-flex gap-3 mb-3">
        <CompanyTile company={job.company} large logoUrl={logoUrl} />
        <div>
          <h2 className="h5 fw-bold mb-1" dangerouslySetInnerHTML={{ __html: safeTitle }} />
          <div className="fw-bold" style={{ color: "var(--sala-green-dark)", fontSize: "0.9rem", textTransform: "uppercase" }} dangerouslySetInnerHTML={{ __html: safeCompany }} />
          <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
            <span className="small text-muted">
              <i className="fas fa-map-marker-alt me-1"></i>
              <span dangerouslySetInnerHTML={{ __html: safeCity }} />
            </span>
            <span className="badge-sala-contract" dangerouslySetInnerHTML={{ __html: safeContract }} />
          </div>
        </div>
      </div>

      <CountdownGrid deadlineDate={job.deadlineDate} />

      <div className="sala-detail-tabs">
        <button
          className={`sala-detail-tab${activeTab === "description" ? " active" : ""}`}
          onClick={() => setActiveTab("description")}
        >
          Description
        </button>
        <button
          className={`sala-detail-tab${activeTab === "competences" ? " active" : ""}`}
          onClick={() => setActiveTab("competences")}
        >
          Compétences
        </button>
        <button
          className={`sala-detail-tab${activeTab === "entreprise" ? " active" : ""}`}
          onClick={() => setActiveTab("entreprise")}
        >
          Entreprise
        </button>
      </div>

      {activeTab === "description" && (
        <div className="tab-pane">
          {safeLanguages && (
            <div className="mb-3">
              <div className="sala-detail-field-label">Exigences linguistiques</div>
              <div className="sala-detail-field-value" dangerouslySetInnerHTML={{ __html: safeLanguages }} />
            </div>
          )}
          <div className="mb-2" style={{ fontFamily: "var(--sala-font-display)", fontWeight: 700, fontSize: "0.92rem" }}>
            Description du poste
          </div>
          <div
            style={{ color: "var(--sala-text-secondary)", lineHeight: 1.6, fontSize: "0.88rem" }}
            dangerouslySetInnerHTML={{ __html: safeBody }}
          />
          {publishedDate && (
            <p className="text-muted small mt-3 mb-0">
              Publiée le {publishedDate.toLocaleDateString("fr-FR")}
              {job.deadlineDate ? ` — Date limite : ${job.deadlineDate.toLocaleDateString("fr-FR")}` : ""}
            </p>
          )}
        </div>
      )}

      {activeTab === "competences" && (
        <div className="tab-pane">
          {job.competences && job.competences.length > 0 ? (
            job.competences.map((c, i) => (
              <span className="skill-chip" key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c) }} />
            ))
          ) : (
            <p className="text-muted small mb-0">Compétences non renseignées par le recruteur pour cette offre.</p>
          )}
        </div>
      )}

      {activeTab === "entreprise" && (
        <div className="tab-pane">
          <div className="fw-bold mb-2" style={{ textTransform: "uppercase" }} dangerouslySetInnerHTML={{ __html: safeCompany }} />
          {job.city && (
            <div className="mb-2">
              <i className="fas fa-map-marker-alt text-success me-2"></i>
              <span dangerouslySetInnerHTML={{ __html: safeCity }} />
            </div>
          )}
          {job.site && (
            <div className="mb-2">
              <i className="fas fa-globe text-success me-2"></i>
              <a href={job.site} target="_blank" rel="noopener">
                {job.site}
              </a>
            </div>
          )}
          {job.tel && (
            <div className="mb-2">
              <i className="fas fa-phone-alt text-success me-2"></i>
              {job.tel}
            </div>
          )}
          {email && (
            <div className="mb-0">
              <i className="fas fa-envelope text-success me-2"></i>
              {email}
            </div>
          )}
          {!job.city && !job.site && !job.tel && !email && (
            <p className="text-muted small mb-0">Aucune coordonnée supplémentaire renseignée.</p>
          )}
        </div>
      )}

      <div className="mt-4">
        {mailtoLink ? (
          <a href={mailtoLink} className="btn-sala-primary w-100 py-3 fw-bold">
            <i className="fas fa-paper-plane me-2"></i>Postuler en 1 clic
          </a>
        ) : (
          <button className="btn-sala-primary w-100 py-3 fw-bold" disabled>
            <i className="fas fa-paper-plane me-2"></i>Contact recruteur indisponible
          </button>
        )}
      </div>
    </>
  );
}
