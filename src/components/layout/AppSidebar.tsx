// src/components/layout/AppSidebar.tsx
// Sidebar bureau de l'"app shell" (masquée sous 992px par sala-theme.css),
// utilisée par les pages de type application (offres, événements, etc.).

"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { shareLink } from "@/lib/share";
import { isOfflineModeEnabled, setOfflineModeEnabled } from "@/lib/offline-cache";

const ANNUAIRE_SUBLINKS: { cat: string; icon: string; label: string }[] = [
  { cat: "universities", icon: "fas fa-graduation-cap", label: "Universités" },
  { cat: "companies", icon: "fas fa-building", label: "Entreprises" },
  { cat: "clubs", icon: "fas fa-comments", label: "Clubs d'Anglais" },
];

/** Isolé dans son propre composant : useSearchParams() exige une limite Suspense. */
function AnnuaireSublinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeAnnuaireCat = pathname === "/annuaires" ? searchParams.get("cat") || "universities" : null;

  return (
    <>
      {ANNUAIRE_SUBLINKS.map((link) => (
        <Link
          key={link.cat}
          href={`/annuaires?cat=${link.cat}`}
          className={`sala-nav-item${activeAnnuaireCat === link.cat ? " active" : ""}`}
        >
          <i className={link.icon}></i> {link.label}
        </Link>
      ))}
    </>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const settings = useSiteSettings();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");
  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Connexion";

  // Lu après le montage (localStorage n'existe pas côté serveur) pour éviter
  // un écart d'hydratation ; la valeur par défaut (actif) est la même des
  // deux côtés tant que l'utilisateur n'a rien changé.
  const [offlineMode, setOfflineMode] = useState(true);
  useEffect(() => {
    setOfflineMode(isOfflineModeEnabled());
  }, []);

  function handleToggleOffline() {
    const next = !offlineMode;
    setOfflineMode(next);
    setOfflineModeEnabled(next);
  }

  function handleShare() {
    shareLink(
      "Sala — Emplois & Opportunités au Congo",
      "Découvre Sala, la plateforme d'aide à l'emploi pour les jeunes en République du Congo.",
      typeof window !== "undefined" ? window.location.origin : "https://ongsala.com"
    );
  }

  return (
    <aside className="sala-sidebar">
      <div className="sala-sidebar-header">
        <Link href="/" className="d-flex align-items-center text-decoration-none gap-2">
          <Image src="/img/logo_transparent.png" alt="Logo Sala" height={36} width={100} style={{ height: 36, width: "auto" }} />
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--sala-green-dark)" }}>SALA</span>
        </Link>
      </div>
      <div className="sala-sidebar-nav">
        <div className="sala-nav-section-title">Navigation</div>
        <Link href="/" className={`sala-nav-item${isActive("/") && pathname === "/" ? " active" : ""}`}>
          <i className="fas fa-home"></i> Accueil
        </Link>
        <Link href="/offres" className={`sala-nav-item${isActive("/offres") ? " active" : ""}`}>
          <i className="fas fa-briefcase"></i> Emplois
        </Link>
        <Link href="/cv-builder" className={`sala-nav-item${isActive("/cv-builder") ? " active" : ""}`}>
          <i className="fas fa-file-invoice"></i> Faire un CV
        </Link>
        {settings.sectionsVisible.evenements && (
          <Link href="/evenements" className={`sala-nav-item${isActive("/evenements") ? " active" : ""}`}>
            <i className="fas fa-calendar-alt"></i> Événements
          </Link>
        )}

        {settings.sectionsVisible.annuaires && (
          <>
            <div className="sala-nav-section-title">Annuaires</div>
            <Suspense fallback={null}>
              <AnnuaireSublinks />
            </Suspense>
          </>
        )}

        {(settings.sectionsVisible.entretiens || settings.sectionsVisible.legislation) && (
          <>
            <div className="sala-nav-section-title">Ressources</div>
            {settings.sectionsVisible.entretiens && (
              <Link href="/entretiens" className={`sala-nav-item${isActive("/entretiens") ? " active" : ""}`}>
                <i className="fas fa-user-tie"></i> Entretiens
              </Link>
            )}
            {settings.sectionsVisible.legislation && (
              <Link href="/legislation" className={`sala-nav-item${isActive("/legislation") ? " active" : ""}`}>
                <i className="fas fa-balance-scale"></i> Législation
              </Link>
            )}
          </>
        )}

        <div className="sala-nav-section-title">Plus</div>
        <button type="button" className="sala-nav-item sala-nav-item-btn" onClick={handleShare}>
          <i className="fas fa-share-alt"></i> Partager
        </button>
        <Link href="/onboarding" className={`sala-nav-item${isActive("/onboarding") ? " active" : ""}`}>
          <i className="fas fa-compass"></i> Présentation
        </Link>
        <Link href={user ? "/profile" : "/auth"} className="sala-nav-item">
          <i className={user ? "fas fa-user-circle" : "fas fa-user"}></i> {firstName}
        </Link>
      </div>

      <div className="sala-sidebar-footer-card">
        <div className="sala-sidebar-footer-card-title">
          <i className="fas fa-wifi"></i> Restez informé
        </div>
        <p className="sala-sidebar-footer-card-text mb-0">
          Les offres sont enregistrées sur cet appareil pour rester consultables même hors connexion.
        </p>
        <div className="sala-offline-toggle-row">
          <span className="sala-offline-toggle-label">
            Mode hors-ligne
            <span className="status">{offlineMode ? "Actif" : "Inactif"}</span>
          </span>
          <label className="admin-switch" title="Activer/désactiver la sauvegarde hors-ligne">
            <input type="checkbox" checked={offlineMode} onChange={handleToggleOffline} />
            <span></span>
          </label>
        </div>
      </div>
    </aside>
  );
}
