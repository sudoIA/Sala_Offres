// src/components/JobDetailContent.tsx
// Corps détaillé d'une offre : identité, compte à rebours, onglets
// (description / compétences / entreprise), bouton de candidature.
// Réutilisé à l'identique dans le panneau bureau (/offres) et la page
// mobile dédiée (/offres/[id]).

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { CompanyTile } from "@/components/CompanyTile";
import { CountdownGrid } from "@/components/CountdownGrid";
import { useCompanyLogos } from "@/hooks/useCompanyLogos";
import { useCompanyFor } from "@/hooks/useCompanyDirectory";
import { formatJobBody } from "@/lib/job-body";
import { recordJobView } from "@/lib/job-views";
import type { Job } from "@/types/job";
import { safeExternalUrl } from "@/lib/safe-url";

type TabKey = "description" | "competences" | "entreprise";

export function JobDetailContent({ job }: { job: Job }) {
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  useEffect(() => {
    recordJobView(job.id);
  }, [job.id]);
  const logos = useCompanyLogos([job.company]);
  const logoUrl = job.company ? logos[job.company] : null;
  // Fiche de l'annuaire correspondante, s'il y en a une (page entreprise).
  const directoryCompany = useCompanyFor(job.company);

  const safeTitle = sanitizeHtml(job.title || "Offre d'emploi");
  const safeCompany = sanitizeHtml(job.company || "Entreprise au Congo");
  const safeCity = sanitizeHtml(job.city || "Congo");
  const safeContract = sanitizeHtml(job.contract || "Contrat");
  const safeBody = sanitizeHtml(formatJobBody(job.body || "") || "Pas de description disponible pour cette offre.");
  const safeLanguages = job.languages ? sanitizeHtml(job.languages) : null;
  const email = job.email || null;
  const site = safeExternalUrl(job.site);
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
          <div className="sala-job-body" dangerouslySetInnerHTML={{ __html: safeBody }} />
          {publishedDate && (
            <p className="text-muted small mt-3 mb-0">
              Publiée le {publishedDate.toLocaleDateString("fr-FR")}
              {job.deadlineDate ? ` - Date limite : ${job.deadlineDate.toLocaleDateString("fr-FR")}` : ""}
            </p>
          )}
          <div className="mt-3" style={{ color: "var(--sala-red)", fontSize: "0.85rem", lineHeight: 1.6 }}>
            <strong>ATTENTION :</strong>
            <br />
            <br />
            <strong>Sala</strong> vous conseille de bien vous renseigner sur les offres avant de postuler et de ne{" "}
            <strong>jamais</strong> verser de l&apos;argent pendant le processus de recrutement.
          </div>
        </div>
      )}

      {activeTab === "competences" && (
        <div className="tab-pane">
          {job.competences && job.competences.length > 0 ? (
            job.competences.map((c, i) => (
              <span className="skill-chip" key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(c) }} />
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
          {site && (
            <div className="mb-2">
              <i className="fas fa-globe text-success me-2"></i>
              <a href={site} target="_blank" rel="noopener">
                {site}
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
          {!job.city && !site && !job.tel && !email && (
            <p className="text-muted small mb-0">Aucune coordonnée supplémentaire renseignée.</p>
          )}
          {directoryCompany && (
            <Link href={`/entreprises/${encodeURIComponent(directoryCompany.id)}`} className="btn btn-sm btn-outline-success rounded-pill mt-3">
              <i className="fas fa-building me-1"></i> Fiche de l&apos;entreprise et toutes ses offres
            </Link>
          )}
        </div>
      )}

      <div className="mt-4">
        {mailtoLink ? (
          <a href={mailtoLink} className="btn-sala-primary w-100 py-3 fw-bold">
            <i className="fas fa-paper-plane me-2"></i>Postuler en 1 clic
          </a>
        ) : site ? (
          // Pas d'e-mail : la candidature se fait sur le site du recruteur.
          <a href={site} target="_blank" rel="noopener" className="btn-sala-primary w-100 py-3 fw-bold">
            <i className="fas fa-external-link-alt me-2"></i>Postuler sur le site du recruteur
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
