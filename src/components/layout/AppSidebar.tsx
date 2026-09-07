// src/components/layout/AppSidebar.tsx
// Sidebar bureau de l'"app shell" (masquée sous 992px par sala-theme.css),
// utilisée par les pages de type application (offres, événements, etc.).

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const settings = useSiteSettings();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");
  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Connexion";

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
        {settings.sectionsVisible.evenements && (
          <Link href="/evenements" className={`sala-nav-item${isActive("/evenements") ? " active" : ""}`}>
            <i className="fas fa-calendar-alt"></i> Événements
          </Link>
        )}
        {settings.sectionsVisible.annuaires && (
          <Link href="/annuaires" className={`sala-nav-item${isActive("/annuaires") ? " active" : ""}`}>
            <i className="fas fa-address-book"></i> Annuaires
          </Link>
        )}
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

        <div className="sala-nav-section-title">Candidat</div>
        <Link href="/cv-builder" className={`sala-nav-item${isActive("/cv-builder") ? " active" : ""}`}>
          <i className="fas fa-file-invoice"></i> Faire un CV
        </Link>
        <Link href={user ? "/profile" : "/auth"} className="sala-nav-item">
          <i className={user ? "fas fa-user-circle" : "fas fa-user"}></i> {firstName}
        </Link>
      </div>
    </aside>
  );
}
