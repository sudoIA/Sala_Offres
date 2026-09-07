// src/components/layout/Footer.tsx
// Pied de page de la page d'accueil.

"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function Footer() {
  const settings = useSiteSettings();

  return (
    <footer className="sala-footer">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Image src="/img/logo_transparent.png" alt="Logo Sala" height={34} width={100} style={{ height: 34, width: "auto" }} />
              <span style={{ fontFamily: "var(--sala-font-display)", fontWeight: 800, fontSize: "1.15rem", color: "#ffffff" }}>SALA</span>
            </div>
            <p style={{ color: "#a9bcb0", fontSize: "0.9rem", maxWidth: 320 }}>
              ONG Sala — présenter les opportunités d&apos;emploi aux jeunes de la République du Congo et leur donner les moyens de les saisir.
            </p>
          </div>
          <div className="col-lg-2 col-md-6 col-6">
            <h6>Plateforme</h6>
            <Link href="/offres">Offres d&apos;emploi</Link>
            {settings.sectionsVisible.evenements && <Link href="/evenements">Événements</Link>}
            {settings.sectionsVisible.annuaires && <Link href="/annuaires">Annuaires</Link>}
            <Link href="/cv-builder">Générateur de CV</Link>
          </div>
          <div className="col-lg-2 col-md-6 col-6">
            <h6>Ressources</h6>
            {settings.sectionsVisible.entretiens && <Link href="/entretiens">Préparation entretiens</Link>}
            {settings.sectionsVisible.legislation && <Link href="/legislation">Droit du travail</Link>}
            <Link href="/onboarding">Découvrir Sala</Link>
          </div>
          <div className="col-lg-4 col-md-6">
            <h6>Contact</h6>
            <a href={`mailto:${settings.contactEmail}`}>
              <i className="fas fa-envelope me-2"></i>
              {settings.contactEmail}
            </a>
            <div className="mb-0" style={{ color: "#b7c7bd", fontSize: "0.9rem" }}>
              <i className="fas fa-map-marker-alt me-2"></i>
              {settings.contactCities}
            </div>
          </div>
        </div>
        <div className="footer-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>&copy; 2026 ONG Sala. Tous droits réservés.</span>
          <div className="d-flex align-items-center gap-3">
            <Link href="/privacy-policy" style={{ color: "#8fa398", display: "inline" }}>Politique de confidentialité</Link>
            <Link href="/connexion" className="d-none d-lg-inline-block" title="Administration" style={{ color: "#8fa398" }}>
              <i className="fas fa-lock"></i>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
