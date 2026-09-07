// src/components/LegislationCard.tsx
// Fiche thématique Droit du Travail : contenu riche (bodyHtml) sanitizé, avec
// accordéon FAQ optionnel.

"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import type { LegislationFiche } from "@/types/legislation";

export function LegislationCard({ fiche }: { fiche: LegislationFiche }) {
  const [faqOpen, setFaqOpen] = useState(false);
  const safeBody = DOMPurify.sanitize(fiche.bodyHtml || "", { ADD_ATTR: ["style"] });

  return (
    <div className="law-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="badge-article"><i className="fas fa-gavel me-1"></i> {fiche.articleRef || ""}</span>
        <span className="badge bg-light text-secondary border">{fiche.topicLabel || ""}</span>
      </div>
      <h4 className="fw-bold mb-2">{fiche.title || ""}</h4>
      <p className="text-secondary small">{fiche.intro || ""}</p>
      <div dangerouslySetInnerHTML={{ __html: safeBody }} />

      {fiche.faqQuestion && (
        <div className="mt-3">
          <div className="faq-q" onClick={() => setFaqOpen((v) => !v)}>
            <span>{fiche.faqQuestion}</span>
            <i className={`fas fa-chevron-${faqOpen ? "up" : "down"} text-muted`}></i>
          </div>
          {faqOpen && <div className="faq-a">{fiche.faqAnswer || ""}</div>}
        </div>
      )}
    </div>
  );
}
